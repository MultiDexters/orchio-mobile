// Orchio `plan` edge function — generate / reshuffle an energy-aware day plan.
// Input:  { date?: "YYYY-MM-DD", reshuffle?: boolean }
// Output: { plan }
import { preflight, json } from '../_shared/cors.ts';
import { userClient, getUser } from '../_shared/client.ts';
import { chatCompletion, safeJsonParse } from '../_shared/openai.ts';
import { gatherContext } from '../_shared/context.ts';

interface PlanBlock {
  start: string;
  end: string;
  title: string;
  task_id?: string | null;
  energy_cost?: 'low' | 'moderate' | 'high';
  kind?: 'focus' | 'break' | 'admin' | 'buffer';
}

const SYSTEM = (ctx: Awaited<ReturnType<typeof gatherContext>>, reshuffle: boolean) => `
You are Orchio, an energy-aware day planner. Build a realistic, calming plan for
${ctx.name ?? 'the user'} within their work hours (${ctx.work_hours}). Schedule
demanding ("high" energy_cost) tasks when energy is likely highest (usually
mid-morning), lighter/admin tasks when energy dips, and include short breaks and
buffers. Respect estimated_minutes. ${reshuffle ? 'This is a RESHUFFLE — vary the order and pacing from a typical plan.' : ''}

Recent energy levels (newest first): ${ctx.recentEnergy.map((e) => e.energy_level).join(', ') || 'unknown'}.
Tasks (title | energy_cost | importance | est mins | id):
${ctx.activeTasks.map((t) => `- ${t.title} | ${t.energy_cost} | ${t.importance} | ${t.estimated_minutes} | ${t.id}`).join('\n') || '- (no tasks yet)'}

Write a SHORT spoken-style morning_brief (2-4 sentences, no markdown, no emoji)
that sets the tone and names the 1-2 most important things.

energy_cost must be one of: deep_focus, moderate, light, admin.

Respond ONLY with JSON:
{
  "morning_brief": "string",
  "blocks": [
    { "start": "09:00", "end": "10:30", "title": "Deep work: <task>", "task_id": "<id or null>", "energy_cost": "deep_focus", "kind": "focus" }
  ]
}
`;

const todayISODate = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { date, reshuffle } = await req.json().catch(() => ({}));
    const planDate = typeof date === 'string' ? date : todayISODate();

    const db = userClient(req);
    const user = await getUser(db);
    const ctx = await gatherContext(db, user.id);

    const raw = await chatCompletion({
      system: SYSTEM(ctx, Boolean(reshuffle)),
      messages: [
        {
          role: 'user',
          content: reshuffle
            ? 'Reshuffle my day into a fresh, energy-aware plan.'
            : 'Plan my day.',
        },
      ],
      jsonMode: true,
      temperature: reshuffle ? 0.85 : 0.5,
    });

    const parsed = safeJsonParse<{ morning_brief: string; blocks: PlanBlock[] }>(
      raw,
      { morning_brief: 'Let’s keep today simple and focused.', blocks: [] },
    );

    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    const morning_brief = (parsed.morning_brief ?? '').trim();

    // plans has UNIQUE(user_id, plan_date) — upsert so reshuffle replaces.
    const { data: plan, error } = await db
      .from('plans')
      .upsert(
        {
          user_id: user.id,
          plan_date: planDate,
          morning_brief,
          blocks,
          is_active: true,
        },
        { onConflict: 'user_id,plan_date' },
      )
      .select('*')
      .single();

    if (error) throw error;

    return json({ plan });
  } catch (err) {
    return json({ error: (err as Error).message ?? 'plan failed' }, 500);
  }
});
