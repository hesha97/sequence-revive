// Shared shapes for API routes and clients.
// verdict + score + archetype + lemlist_meta + intel all live inside
// prospects.research jsonb to avoid schema migrations.

export type IntelSignal = 'hot' | 'warm' | 'cold'
export type Verdict = 'skip' | 'like' | 'strong'
export type IntelStatus = 'pending' | 'researching' | 'ready' | 'failed'
export type GenerationStatus = 'pending' | 'generating' | 'ready' | 'failed'

export type ProspectIntel = {
  about_them?: string
  about_company?: string
  hook?: string
  signal?: IntelSignal
  recent_signals?: string[]
  researched_at?: string
}

export type LemlistMeta = {
  country?: string | null
  department?: string | null
  company_size?: string | null
  company_industry?: string | null
  company_domain?: string | null
  headline?: string | null
}

export type ProspectResearch = {
  score?: number
  score_reason?: string
  archetype?: string
  verdict?: Verdict
  intel?: ProspectIntel
  lemlist_meta?: LemlistMeta
}

export type ProspectRow = {
  id: string
  source_id: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  job_title: string | null
  linkedin_url: string | null
  email: string | null
  research: ProspectResearch | null
  intel_status: IntelStatus | string | null
  source: string | null
}

export type SearchFilters = {
  seniorities?: string[]
  company_sizes?: string[]
  industries?: string[]
  departments?: string[]
  countries?: string[] | string
}

export type Brain = {
  company_summary?: string
  voice_essence?: string
  ideal_buyer_summary?: string
  buyer_daily_pain?: string
  common_objection?: string
  winning_argument?: string
  buying_signals?: string[]
  key_value_props?: string[]
  named_proof?: string
  market_context?: string
  search_filters?: SearchFilters
  raw_answers?: Record<string, unknown>
  compiled_at?: string
  market_intel_error?: string
}

export type Sequence = {
  step1_visit?: { type: 'linkedin_visit'; day: 0 }
  step2_invite?: { type: 'linkedin_invite'; day: 1; note: string }
  step3_email1?: { type: 'email'; day: 3; subject: string; body: string }
  step4_email2?: { type: 'email'; day: 7; subject: string; body: string }
  step5_conditional?: {
    if_accepted: { type: 'linkedin_message'; day: 10; body: string }
    if_not: { type: 'email'; day: 10; subject: string; body: string }
  }
  step6_breakup?: { type: 'email'; day: 14; subject: string; body: string }
}
