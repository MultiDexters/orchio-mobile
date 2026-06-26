// Orchio `chat` edge function — conversational assistant + brain-dump extraction.
// Input:  { message: string }
// Output: { reply, parsed_items, saved, user_message, assistant_message }
import { preflight, json } from '../_shared/cors.ts';
import { userClient, getUser } from '../_shared/client.ts';
import { chatCompletion, safeJsonParse } from '../_shared/openai.ts';
import { gatherContext } from '../_shared/context.ts';

interface ParsedItems {
  tasks: {
    title: string;
    energy_cost: 'low' | 'moderate' | 'high';
    importance: number;
    deadline: string | null;
    estimated_minutes: number;
  }[];
  notes: { content: string; tags: string[] }[];
  goals: { title: string; description: string }[];
  feelings: { mood: string; note: string }[];
}

const EMPTY: ParsedItems = { tasks: [], notes: [], goals: [], feelings: [] };

// AI emits low/moderate/high; the DB enum is deep_focus/moderate/light/admin.
const DB_COSTS = ['deep_focus', 'moderate', 'light', 'admin'];
function toEnergyCost(value: string): string {
  if (DB_COSTS.includes(value)) return value;
  if (value === 'low') return 'light';
  if (value === 'high') return 'deep_focus';
  return 'moderate';
}

const FEELING_ENERGY: Record<string, number> = {
  exhausted: 1, drained: 1, dead: 1, depleted: 1,
  tired: 2, low: 2, sluggish: 2, groggy: 2, foggy: 2,
  okay: 3, fine: 3, neutral: 3, meh: 3,
  good: 4, energized: 4, productive: 4, motivated: 4,
  great: 5, peak: 5, amazing: 5, unstoppable: 5,
};

function feelingToEnergy(mood: string): number {
  const m = mood.toLowerCase();
  for (const [k, v] of Object.entries(FEELING_ENERGY)) {
    if (m.includes(k)) return v;
  }
  return 3;
}

const SYSTEM = (ctx: Awaited<ReturnType<typeof gatherContext>>) => `
You are Orchio, a warm, concise, energy-aware productivity assistant. You talk
like a thoughtful friend — natural, encouraging, never robotic. Keep replies
short (1–4 sentences) unless asked for detail. Your replies are spoken aloud,
so write clean prose: NO markdown, NO bullet symbols, NO emoji spam.

User: ${ctx.name ?? 'the user'}. Work hours: ${ctx.work_hours}. Typical energy: ${ctx.default_energy}/5.
Active tasks: ${ctx.activeTasks.map((t) => t.title).join('; ') || 'none'}.
Recent energy: ${ctx.recentEnergy.map((e) => e.energy_level).join(', ') || 'none'}.
Goals: ${ctx.goals.map((g) => g.title).join('; ') || 'none'}.

When the user dumps thoughts, EXTRACT structured items. Only extract things the
user clearly stated; do not invent. Map energy_cost to low/moderate/high and
importance to 1-5.

Respond ONLY with a JSON object of this exact shape:
{
  "reply": "your spoken-style reply here",
  "parsed_items": {
    "tasks":   [{ "title": "", "energy_cost": "moderate", "importance": 3, "deadline": null, "estimated_minutes": 30 }],
    "notes":   [{ "content": "", "tags": [] }],
    "goals":   [{ "title": "", "description": "" }],
    "feelings":[{ "mood": "", "note": "" }]
  }
}
Use empty arrays when nothing applies. "reply" must never contain JSON or markdown.
`;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return json({ error: 'message is required' }, 400);
    }

    const db = userClient(req);
    const user = await getUser(db);
    const ctx = await gatherContext(db, user.id);

    const history = ctx.recentMessages.map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

    const raw = await chatCompletion({
      system: SYSTEM(ctx),
      messages: [...history, { role: 'user', content: message }],
      jsonMode: true,
      temperature: 0.6,
    });

    const parsed = safeJsonParse<{ reply: string; parsed_items: ParsedItems }>(
      raw,
      { reply: "I'm here. Could you say that again?", parsed_items: EMPTY },
    );
    const reply = (parsed.reply ?? '').trim() || 'Okay.';
    const items: ParsedItems = { ...EMPTY, ...(parsed.parsed_items ?? EMPTY) };

    // ── persist extracted items ──────────────────────────────────────────────
    const saved = { tasks: 0, notes: 0, goals: 0, feelings: 0 };

    if (items.tasks?.length) {
      const rows = items.tasks.map((t) => ({
        user_id: user.id,
        title: t.title,
        energy_cost: toEnergyCost(t.energy_cost),
        importance: Math.min(5, Math.max(1, Number(t.importance) || 3)),
        deadline: t.deadline ?? null,
        estimated_minutes: Number(t.estimated_minutes) || 30,
        source: 'brain_dump',
      }));
      const { error, count } = await db
        .from('tasks')
        .insert(rows, { count: 'exact' });
      if (!error) saved.tasks = count ?? rows.length;
    }

    if (items.notes?.length) {
      const rows = items.notes.map((n) => ({
        user_id: user.id,
        content: n.content,
        tags: Array.isArray(n.tags) ? n.tags : [],
      }));
      const { error, count } = await db
        .from('notes')
        .insert(rows, { count: 'exact' });
      if (!error) saved.notes = count ?? rows.length;
    }

    if (items.goals?.length) {
      const rows = items.goals.map((g) => ({
        user_id: user.id,
        title: g.title,
        description: g.description ?? null,
      }));
      const { error, count } = await db
        .from('goals')
        .insert(rows, { count: 'exact' });
      if (!error) saved.goals = count ?? rows.length;
    }

    if (items.feelings?.length) {
      const rows = items.feelings.map((f) => ({
        user_id: user.id,
        energy_level: feelingToEnergy(f.mood),
        mood: f.mood,
        note: f.note ?? null,
      }));
      const { error, count } = await db
        .from('energy_logs')
        .insert(rows, { count: 'exact' });
      if (!error) saved.feelings = count ?? rows.length;
    }

    // ── persist the conversation (ordered) ───────────────────────────────────
    const now = Date.now();
    const { data: userMsg } = await db
      .from('chat_messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message,
        created_at: new Date(now).toISOString(),
      })
      .select('*')
      .single();

    const { data: asstMsg } = await db
      .from('chat_messages')
      .insert({
        user_id: user.id,
        role: 'assistant',
        content: reply,
        metadata: { parsed_items: items },
        created_at: new Date(now + 50).toISOString(),
      })
      .select('*')
      .single();

    return json({
      reply,
      parsed_items: items,
      saved,
      user_message: userMsg,
      assistant_message: asstMsg,
    });
  } catch (err) {
    return json({ error: (err as Error).message ?? 'chat failed' }, 500);
  }
});
