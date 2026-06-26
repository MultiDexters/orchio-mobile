// Orchio `tasks` edge function — list tasks + server-curated top N.
// Input:  { limit?: number }
// Output: { tasks, top }
import { preflight, json } from '../_shared/cors.ts';
import { userClient, getUser } from '../_shared/client.ts';

interface TaskRow {
  id: string;
  title: string;
  energy_cost: string;
  importance: number;
  deadline: string | null;
  estimated_minutes: number;
  status: string;
  created_at: string;
}

function rankTop(tasks: TaskRow[], limit: number): TaskRow[] {
  return [
    ...tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
  ]
    .sort((a, b) => {
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return b.importance - a.importance;
    })
    .slice(0, limit);
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { limit } = await req.json().catch(() => ({ limit: 3 }));
    const n = Math.min(10, Math.max(1, Number(limit) || 3));

    const db = userClient(req);
    await getUser(db);

    const { data, error } = await db
      .from('tasks')
      .select('*')
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;

    const tasks = (data ?? []) as TaskRow[];
    return json({ tasks, top: rankTop(tasks, n) });
  } catch (err) {
    return json({ error: (err as Error).message ?? 'tasks failed' }, 500);
  }
});
