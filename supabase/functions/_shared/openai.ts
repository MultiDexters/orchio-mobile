interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionArgs {
  system: string;
  messages: ChatMsg[];
  /** Force a JSON object response (OpenAI json mode). */
  jsonMode?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Thin wrapper over the OpenAI Chat Completions API (GPT-4o). */
export async function chatCompletion({
  system,
  messages,
  jsonMode = false,
  model = 'gpt-4o',
  temperature = 0.6,
  maxTokens = 900,
}: CompletionArgs): Promise<string> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY is not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/** Safely parse a JSON object the model returned (tolerates fenced blocks). */
export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    return fallback;
  }
}
