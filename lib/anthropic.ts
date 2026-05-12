// ⚠️ TIER-1 TEST VARIANT — callAnthropic retries once on HTTP 429 after a
// 60-second sleep, then surfaces a clean user-facing error message.
// Production branch (claude/create-claude-md-R5fhF) has no retry; restore to
// the production version after Tier 2 upgrade if you want stricter failure.
//
// Server-only Anthropic helper. Direct fetch to /v1/messages — no SDK dependency.
// callAnthropic(messages, options) returns the raw content blocks array.
// extractText(content) concatenates every text block into one string.

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-5'

export type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; [k: string]: unknown }>
}

export type AnthropicTool = {
  type: string
  name: string
  [k: string]: unknown
}

export type CallOptions = {
  systemPrompt?: string
  maxTokens?: number
  model?: string
  tools?: AnthropicTool[]
  temperature?: number
}

export type ContentBlock = {
  type: string
  text?: string
  [k: string]: unknown
}

// Calls Anthropic /v1/messages. Throws on missing key or non-2xx response.
// TIER-1: on 429, sleeps 60s and retries once before surfacing a friendly error.
export async function callAnthropic(
  messages: AnthropicMessage[],
  options: CallOptions = {},
  retried = false
): Promise<ContentBlock[]> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY missing on server')
  }

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 2000,
    messages,
  }
  if (options.systemPrompt) body.system = options.systemPrompt
  if (options.tools && options.tools.length > 0) body.tools = options.tools
  if (typeof options.temperature === 'number') body.temperature = options.temperature

  const res = await fetch(ANTHROPIC_BASE, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  // TIER-1 TEST: one polite retry after 60s on 429, then surface a clean error.
  if (res.status === 429) {
    if (!retried) {
      await new Promise((r) => setTimeout(r, 60000))
      return callAnthropic(messages, options, true)
    }
    throw new Error('AI quota is busy. Try again in about a minute, or upgrade your Anthropic tier.')
  }

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errBody.slice(0, 500)}`)
  }

  const json = await res.json() as { content?: ContentBlock[] }
  return json.content ?? []
}

// Extracts and joins every text block. Skips tool_use / web_search / other types.
export function extractText(content: ContentBlock[]): string {
  return content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim()
}

// Strict JSON parse with markdown-fence cleanup. Throws on bad JSON.
export function parseJsonLoose<T = unknown>(text: string): T {
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned) as T
}
