// Per-org Anthropic budget check. Phase A: env-var ceiling. Phase H will
// replace the ceiling with a tier-driven plan column on organizations.
//
// Reads organizations.ai_spend_usd_this_month and compares it against
// DEFAULT_AI_BUDGET_USD. Returns ok/err so call sites can short-circuit.

import { createAdminClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/types/result'

const DEFAULT_BUDGET_USD = Number(process.env.DEFAULT_AI_BUDGET_USD ?? '5')

export type BudgetExceededError = {
  kind: 'budget_exceeded'
  spentUsd: number
  ceilingUsd: number
}

// Returns ok with current spend if under ceiling, err otherwise.
// Soft-fails open on read errors — we'd rather call than block on infra hiccups.
export async function checkOrgBudget(
  organizationId: string
): Promise<Result<{ spentUsd: number; ceilingUsd: number }, BudgetExceededError>> {
  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('organizations')
    .select('ai_spend_usd_this_month')
    .eq('id', organizationId)
    .single()

  if (dbError || !data) {
    // Soft-fail open. Log via the audit row that gets written after the call.
    return ok({ spentUsd: 0, ceilingUsd: DEFAULT_BUDGET_USD })
  }

  const spentUsd = Number(data.ai_spend_usd_this_month) || 0
  if (spentUsd >= DEFAULT_BUDGET_USD) {
    return err({ kind: 'budget_exceeded', spentUsd, ceilingUsd: DEFAULT_BUDGET_USD })
  }
  return ok({ spentUsd, ceilingUsd: DEFAULT_BUDGET_USD })
}

// Atomically increment the org's monthly AI spend by costUsd.
// Called from the Anthropic safety layer after every successful call.
export async function incrementOrgAiSpend(
  organizationId: string,
  costUsd: number
): Promise<void> {
  if (!organizationId || costUsd <= 0) return
  const admin = createAdminClient()
  await admin.rpc('increment_ai_spend' as never, {
    org_id: organizationId,
    delta_usd: costUsd,
  } as never).then(async ({ error }: { error: unknown }) => {
    // RPC may not exist yet — fall back to read-modify-write. Race-tolerant
    // enough for Phase A; Phase H replaces with a proper atomic SQL function.
    if (!error) return
    const { data } = await admin
      .from('organizations')
      .select('ai_spend_usd_this_month')
      .eq('id', organizationId)
      .single()
    const current = Number(data?.ai_spend_usd_this_month) || 0
    await admin
      .from('organizations')
      .update({ ai_spend_usd_this_month: current + costUsd })
      .eq('id', organizationId)
  })
}
