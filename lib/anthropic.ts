// Server-only Anthropic helper. Direct fetch to /v1/messages — no SDK.
// callAnthropic(messages, options) returns the raw content blocks array.
// extractText(content) concatenates every text block into one string.
//
// v6-rebuild safety layer:
//   1. Optional organizationId + callType for per-call audit + budget tracking
//   2. ai_calls row inserted on EVERY call (success or failure) via admin client
//   3. 429 retry honors Retry-After header (seconds or HTTP-date), capped to 90s
//   4. Per-call cost computed from response.usage + lib/anthropic/pricing.ts
//   5. organizations.ai_spend_usd_this_month incremented on success
//
// Existing call sites that don't pass organizationId still work — the audit row
// just has organization_id=null. Phase B will thread org context everywhere.

import { createAdminClient } from '@/lib/supabase/server'
import { computeCostUsd } from '@/lib/anthropic/pricing'
import { incrementOrgAiSpend } from '@/lib/anthropic/budget'

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-5'
const MAX_RETRY_AFTER_MS = 90_000

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
  // Pass an AbortController.signal to cap call wall-time from the caller.
  // On abort, callAnthropic throws an AbortError; the caller decides how to
  // recover (e.g. compile-brain falls back to no-market-intel synthesis).
  signal?: AbortSignal
  // v6 safety-layer hooks (optional; existing callers untouched)
  organizationId?: string | null
  userId?: string | null
  callType?: string
  metadata?: Record<string, unknown>
}

export type ContentBlock = {
  type: string
  text?: string
  [k: string]: unknown
}

type AnthropicUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

type AnthropicResponse = {
  content?: ContentBlock[]
  usage?: AnthropicUsage
  model?: string
}

// Parse Retry-After. Accepts seconds-as-integer or HTTP-date. Falls back to 30s.
// Capped at MAX_RETRY_AFTER_MS so we never hang a request indefinitely.
function parseRetryAfterMs(header: string | null): number {
  if (!header) return 30_000
  const trimmed = header.trim()
  const asInt = Number(trimmed)
  if (Number.isFinite(asInt) && asInt >= 0) {
    return Math.min(asInt * 1000, MAX_RETRY_AFTER_MS)
  }
  const asDate = Date.parse(trimmed)
  if (!Number.isNaN(asDate)) {
    const ms = asDate - Date.now()
    return Math.min(Math.max(ms, 0), MAX_RETRY_AFTER_MS)
  }
  return 30_000
}

// Best-effort audit insert. Never throws — auditing must not break the call.
async function recordAiCall(row: {
  organization_id: string | null
  user_id: string | null
  call_type: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_creation_tokens: number
  cost_usd: number
  latency_ms: number
  success: boolean
  error_message: string | null
  metadata: Record<string, unknown> | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('ai_calls').insert(row)
  } catch {
    // Audit insert failure should never break the request. Swallow.
  }
}

// Calls Anthropic /v1/messages.
// On 429: sleeps for Retry-After (or 30s default), then retries once.
// Inserts ai_calls audit row after every attempt. Throws on non-2xx after retry.
export async function callAnthropic(
  messages: AnthropicMessage[],
  options: CallOptions = {},
  retried = false
): Promise<ContentBlock[]> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY missing on server')

  const model = options.model ?? DEFAULT_MODEL
  const callType = options.callType ?? 'unknown'
  const orgId = options.organizationId ?? null
  const userId = options.userId ?? null

  const body: Record<string, unknown> = {
    model,
    max_tokens: options.maxTokens ?? 2000,
    messages,
  }
  if (options.systemPrompt) body.system = options.systemPrompt
  if (options.tools && options.tools.length > 0) body.tools = options.tools
  if (typeof options.temperature === 'number') body.temperature = options.temperature

  const startedAt = Date.now()
  let res: Response
  try {
    res = await fetch(ANTHROPIC_BASE, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: options.signal,
    })
  } catch (e) {
    const latencyMs = Date.now() - startedAt
    const aborted = (e as Error).name === 'AbortError' || options.signal?.aborted
    await recordAiCall({
      organization_id: orgId,
      user_id: userId,
      call_type: callType,
      model,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      cost_usd: 0,
      latency_ms: latencyMs,
      success: false,
      error_message: aborted
        ? `aborted by caller after ${latencyMs}ms`
        : `fetch failed: ${(e as Error).message}`,
      metadata: options.metadata ?? null,
    })
    throw e
  }
  const latencyMs = Date.now() - startedAt

  if (res.status === 429) {
    const waitMs = parseRetryAfterMs(res.headers.get('retry-after'))
    await recordAiCall({
      organization_id: orgId,
      user_id: userId,
      call_type: callType,
      model,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      cost_usd: 0,
      latency_ms: latencyMs,
      success: false,
      error_message: `429 rate-limited; retry-after=${waitMs}ms; retried=${retried}`,
      metadata: options.metadata ?? null,
    })
    if (!retried) {
      await new Promise((r) => setTimeout(r, waitMs))
      return callAnthropic(messages, options, true)
    }
    throw new Error('AI is rate-limited. Try again in a minute, or raise the Anthropic tier.')
  }

  if (!res.ok) {
    const errBody = await res.text()
    await recordAiCall({
      organization_id: orgId,
      user_id: userId,
      call_type: callType,
      model,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      cost_usd: 0,
      latency_ms: latencyMs,
      success: false,
      error_message: `Anthropic ${res.status}: ${errBody.slice(0, 500)}`,
      metadata: options.metadata ?? null,
    })
    throw new Error(`Anthropic ${res.status}: ${errBody.slice(0, 500)}`)
  }

  const json = (await res.json()) as AnthropicResponse
  const usage = json.usage ?? {}
  const inputTokens = usage.input_tokens ?? 0
  const outputTokens = usage.output_tokens ?? 0
  const cacheRead = usage.cache_read_input_tokens ?? 0
  const cacheCreation = usage.cache_creation_input_tokens ?? 0
  const costUsd = computeCostUsd({
    model: json.model ?? model,
    inputTokens,
    outputTokens,
    cacheReadTokens: cacheRead,
    cacheCreationTokens: cacheCreation,
  })

  await recordAiCall({
    organization_id: orgId,
    user_id: userId,
    call_type: callType,
    model: json.model ?? model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_tokens: cacheRead,
    cache_creation_tokens: cacheCreation,
    cost_usd: costUsd,
    latency_ms: latencyMs,
    success: true,
    error_message: null,
    metadata: options.metadata ?? null,
  })

  if (orgId && costUsd > 0) {
    // Fire-and-forget — don't block the response on the budget bump.
    void incrementOrgAiSpend(orgId, costUsd)
  }

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
