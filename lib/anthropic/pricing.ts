// Anthropic per-model pricing (USD per 1M tokens) as of the model cutoff.
// Updated when new models ship. Used by the safety layer to compute per-call
// cost from token usage returned by the Messages API.

type ModelPricing = {
  inputPer1m: number
  outputPer1m: number
  cacheReadPer1m: number
  cacheWritePer1m: number
}

const PRICING: Record<string, ModelPricing> = {
  // Claude Sonnet 4.5
  'claude-sonnet-4-5': {
    inputPer1m: 3,
    outputPer1m: 15,
    cacheReadPer1m: 0.3,
    cacheWritePer1m: 3.75,
  },
  // Claude Haiku 4.5
  'claude-haiku-4-5': {
    inputPer1m: 1,
    outputPer1m: 5,
    cacheReadPer1m: 0.1,
    cacheWritePer1m: 1.25,
  },
  // Claude Opus 4.x — placeholder; refined when we use it
  'claude-opus-4-5': {
    inputPer1m: 15,
    outputPer1m: 75,
    cacheReadPer1m: 1.5,
    cacheWritePer1m: 18.75,
  },
}

const FALLBACK: ModelPricing = PRICING['claude-sonnet-4-5']

export function computeCostUsd(args: {
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
}): number {
  const p = PRICING[args.model] ?? FALLBACK
  const inUsd = (args.inputTokens / 1_000_000) * p.inputPer1m
  const outUsd = (args.outputTokens / 1_000_000) * p.outputPer1m
  const cacheReadUsd = ((args.cacheReadTokens ?? 0) / 1_000_000) * p.cacheReadPer1m
  const cacheWriteUsd = ((args.cacheCreationTokens ?? 0) / 1_000_000) * p.cacheWritePer1m
  return Number((inUsd + outUsd + cacheReadUsd + cacheWriteUsd).toFixed(6))
}
