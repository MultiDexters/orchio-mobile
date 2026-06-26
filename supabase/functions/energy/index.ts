// Orchio `energy` edge function — insert an energy log.
// Input:  { energy_level: 1..5, mood?: string, note?: string }
// Output: { log }
import { preflight, json } from '../_shared/cors.ts';
import { userClient, getUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const body = await req.json().catch(() => ({}));
    const level = Number(body.energy_level);
    if (!Number.isFinite(level) || level < 1 || level > 5) {
      return json({ error: 'energy_level must be 1..5' }, 400);
    }

    const db = userClient(req);
    const user = await getUser(db);

    const { data, error } = await db
      .from('energy_logs')
      .insert({
        user_id: user.id,
        energy_level: Math.round(level),
        mood: body.mood ?? null,
        note: body.note ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;
    return json({ log: data });
  } catch (err) {
    return json({ error: (err as Error).message ?? 'energy failed' }, 500);
  }
});
