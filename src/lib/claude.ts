import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MODEL = 'claude-sonnet-4-6';

export async function jsonCall(args: {
  system: string;
  user: string | Anthropic.MessageParam['content'];
  maxTokens?: number;
  tools?: Anthropic.Tool[];
}) {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 4096,
    system: args.system,
    messages: [{ role: 'user', content: args.user as any }],
    tools: args.tools
  });
  return resp;
}

export function extractText(resp: Anthropic.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const arrStart = raw.indexOf('[');
  const s = start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  return JSON.parse(raw.slice(s, end + 1)) as T;
}
