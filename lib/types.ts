// Shared shapes used by API routes and clients.
// The Supabase schema reserves the `research` jsonb column on `prospects` for
// AI-derived data. We pack verdict + score + archetype into it as well to avoid
// a schema migration; intel_status enum on the same row tracks research status.

export type Verdict = 'skip' | 'like' | 'strong'

export type ProspectIntel = {
  about_them?: string
  about_company?: string
  hook?: string
  signal?: 'hot' | 'warm' | 'cold'
  recent_signals?: string[]
  researched_at?: string
}

export type ProspectResearch = {
  intel?: ProspectIntel
  verdict?: Verdict
  archetype?: string
  score?: number
  score_reason?: string
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
  search_filters?: {
    seniorities?: string[]
    company_sizes?: string[]
    industries?: string[]
    departments?: string[]
    countries?: string[]
  }
  raw_answers?: Record<string, unknown>
  compiled_at?: string
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
  intel_status: string | null
  source: string | null
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
