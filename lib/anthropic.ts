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
export async function callAnthropic(
  messages: AnthropicMessage[],
  options: CallOptions = {}
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
