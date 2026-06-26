// Orchio `stt-token` edge function — mint a SHORT-LIVED Deepgram key so the
// long-lived Deepgram API key never ships in the app. Only needed if you run
// Deepgram streaming STT client-side (EXPO_PUBLIC_STT_ENGINE=deepgram).
// Output: { token } (a temporary key valid ~60s)
import { preflight, json } from '../_shared/cors.ts';
import { userClient, getUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // Require an authenticated user before minting any token.
    const db = userClient(req);
    await getUser(db);

    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    const projectId = Deno.env.get('DEEPGRAM_PROJECT_ID');
    if (!apiKey || !projectId) {
      return json(
        { error: 'Deepgram is not configured (set DEEPGRAM_API_KEY + DEEPGRAM_PROJECT_ID)' },
        501,
      );
    }

    const res = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: 'orchio-ephemeral',
          scopes: ['usage:write'],
          time_to_live_in_seconds: 60,
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return json({ error: `Deepgram key mint failed: ${text.slice(0, 200)}` }, 502);
    }
    const data = await res.json();
    return json({ token: data.key });
  } catch (err) {
    return json({ error: (err as Error).message ?? 'stt-token failed' }, 500);
  }
});
