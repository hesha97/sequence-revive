'use client'

// Two-phase prospect review — K5 fix.
// Phase 1: Skip / ★ Like-this (refines AI ranking)
// Phase 2: Skip / Strong (selects who goes into the wave)
// Intel sheet lazy-fetches research the first time a prospect is opened.
// All field/card/sheet components defined at module level (Pattern 24).

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { ProspectRow, Verdict, ProspectResearch } from '@/lib/types'

type Phase = 'refine' | 'select'

// ====== Score badge ======

function ScoreBadge({ score }: { score: number | undefined }) {
  if (typeof score !== 'number') return null
  const colorClass =
    score >= 80 ? 'text-ocean-teal' : score >= 50 ? 'text-gold' : 'text-fg-tertiary'
  return (
    <span className={`font-mono text-xs ${colorClass}`}>
      {score}
    </span>
  )
}

// ====== Signal pill ======

function SignalPill({ signal }: { signal: 'hot' | 'warm' | 'cold' | undefined }) {
  if (!signal) return null
  const colors: Record<string, string> = {
    hot: 'bg-signal-hot/15 text-signal-hot',
    warm: 'bg-signal-warm/15 text-signal-warm',
    cold: 'bg-signal-cold/15 text-signal-cold',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${colors[signal]}`}>
      {signal}
    </span>
  )
}

// ====== Prospect card ======

function ProspectCard({
  p,
  phase,
  onOpen,
  onVerdict,
}: {
  p: ProspectRow
  phase: Phase
  onOpen: (p: ProspectRow) => void
  onVerdict: (id: string, v: Verdict) => void
}) {
  const research = p.research ?? {}
  const score = research.score
  const reason = research.score_reason
  const archetype = research.archetype
  const signal = research.intel?.signal

  return (
    <div className="border border-earth-border bg-earth-surface rounded-md p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen(p)}
          className="text-left flex-1 hover:opacity-80 transition-opacity"
        >
          <p className="font-serif text-lg text-fg-primary leading-tight">
            {p.first_name} {p.last_name}
          </p>
          <p className="text-fg-secondary text-sm">
            {p.job_title} {p.company_name ? `· ${p.company_name}` : ''}
          </p>
        </button>
        <div className="flex flex-col items-end gap-1">
          <ScoreBadge score={score} />
          <SignalPill signal={signal} />
        </div>
      </div>

      {(reason || archetype) && (
        <p className="text-fg-tertiary text-xs italic">
          {archetype && <span className="font-mono uppercase tracking-widest text-fg-tertiary not-italic">{archetype}</span>}
          {archetype && reason ? ' — ' : ''}
          {reason}
        </p>
      )}

      <div className="flex gap-2 mt-1">
        {phase === 'refine' ? (
          <>
            <button
              type="button"
              onClick={() => onVerdict(p.id, 'skip')}
              className="flex-1 border border-earth-border text-fg-secondary hover:text-fg-primary hover:bg-earth-surfaceHover px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => onVerdict(p.id, 'like')}
              className="flex-1 border border-gold text-gold hover:bg-gold/10 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              &#9733; More like this
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onVerdict(p.id, 'skip')}
              className="flex-1 border border-earth-border text-fg-secondary hover:text-fg-primary hover:bg-earth-surfaceHover px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => onVerdict(p.id, 'strong')}
              className="flex-1 border border-ocean-teal text-ocean-teal hover:bg-ocean-teal/10 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Strong
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ====== Intel sheet ======

function IntelSheet({
  prospect,
  onClose,
  onRefresh,
}: {
  prospect: ProspectRow
  onClose: () => void
  onRefresh: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const intel = prospect.research?.intel

  async function fetchIntel() {
    setLoading(true)
    try {
      await fetch('/api/ai/research-prospect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prospectId: prospect.id }),
      })
      await onRefresh(prospect.id)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEnrich() {
    setLoading(true)
    try {
      await fetch(`/api/prospects/enrich/${prospect.id}`)
      await onRefresh(prospect.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50">
      <div className="bg-earth-surface border-t md:border border-earth-border rounded-t-lg md:rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-1">
              Who they are
            </p>
            <h2 className="font-serif text-2xl text-fg-primary leading-tight">
              {prospect.first_name} {prospect.last_name}
            </h2>
            <p className="text-fg-secondary text-sm">
              {prospect.job_title} {prospect.company_name ? `· ${prospect.company_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            Close &times;
          </button>
        </div>

        {!intel && (
          <div className="mb-6 p-4 border border-earth-border rounded-md text-center">
            <p className="text-fg-secondary text-sm mb-3">
              No research yet. Pull it now?
            </p>
            <button
              type="button"
              onClick={fetchIntel}
              disabled={loading}
              className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Researching…' : 'Run research'}
            </button>
          </div>
        )}

        {intel && (
          <div className="space-y-6 mb-6">
            {intel.about_them && (
              <Section title="About them">
                <p className="text-fg-primary leading-relaxed text-sm">{intel.about_them}</p>
              </Section>
            )}
            {intel.about_company && (
              <Section title="About their company">
                <p className="text-fg-primary leading-relaxed text-sm">{intel.about_company}</p>
              </Section>
            )}
            {intel.hook && (
              <Section title="The opening angle">
                <p className="text-fg-primary leading-relaxed text-sm italic">{intel.hook}</p>
              </Section>
            )}
            {intel.recent_signals && intel.recent_signals.length > 0 && (
              <Section title="Recent signals">
                <ul className="text-fg-primary text-sm leading-relaxed list-disc list-inside space-y-1">
                  {intel.recent_signals.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Section>
            )}
            <Section title="Buying signal">
              <SignalPill signal={intel.signal} />
            </Section>
          </div>
        )}

        <div className="border-t border-earth-border pt-6 space-y-3">
          <Section title="Contact details">
            <p className="text-fg-primary text-sm">
              {prospect.email ?? (
                <button
                  type="button"
                  onClick={fetchEnrich}
                  disabled={loading}
                  className="font-mono text-xs uppercase tracking-widest text-gold hover:text-fg-primary transition-colors disabled:opacity-50"
                >
                  {loading ? 'Getting their details…' : 'Get their contact info'}
                </button>
              )}
            </p>
            {prospect.linkedin_url && (
              <a
                href={prospect.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="text-fg-secondary hover:text-fg-primary text-sm transition-colors"
              >
                LinkedIn &rarr;
              </a>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

// ====== Empty state ======

function EmptyState({ onSearch, loading }: { onSearch: () => void; loading: boolean }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Find people
      </p>
      <h1 className="font-serif text-3xl md:text-4xl text-fg-primary mb-6 max-w-xl leading-tight">
        <span className="italic">Let&apos;s find people who match your brain.</span>
      </h1>
      <p className="text-fg-secondary text-base max-w-lg mb-10 leading-relaxed">
        We&apos;ll use what you told us about who you want to reach.
      </p>
      <button
        type="button"
        onClick={onSearch}
        disabled={loading}
        className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-8 py-4 rounded-md font-mono text-sm uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {loading ? 'Looking…' : 'Find people'}
      </button>
    </div>
  )
}

// ====== Phase header ======

function PhaseHeader({
  phase,
  refineCount,
  selectCount,
  onAdvance,
  onBack,
  canAdvance,
  refining,
}: {
  phase: Phase
  refineCount: number
  selectCount: number
  onAdvance: () => void
  onBack: () => void
  canAdvance: boolean
  refining: boolean
}) {
  if (phase === 'refine') {
    return (
      <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-earth-deep">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-1">
            Phase 1 · Sharpen
          </p>
          <h1 className="font-serif text-2xl text-fg-primary">
            <span className="italic">Skip who&apos;s wrong. Star who&apos;s exactly right.</span>
          </h1>
          <p className="text-fg-secondary text-sm mt-1">
            We&apos;ll re-rank around your favorites.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdvance}
          disabled={!canAdvance}
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {refining ? 'Re-ranking…' : `To selection (${refineCount} starred) →`}
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-earth-deep">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-1">
          Phase 2 · Pick the wave
        </p>
        <h1 className="font-serif text-2xl text-fg-primary">
          <span className="italic">Choose the ones you want to start with.</span>
        </h1>
        <p className="text-fg-secondary text-sm mt-1">
          {selectCount} picked. We&apos;ll write the conversation next.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="border border-earth-border text-fg-secondary hover:text-fg-primary px-4 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
        >
          ← Back to sharpen
        </button>
        <Link
          href="/sequences"
          className={`px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${
            selectCount > 0
              ? 'bg-earth-sand text-fg-inverse hover:bg-earth-stone'
              : 'bg-earth-deep text-fg-tertiary cursor-not-allowed pointer-events-none'
          }`}
        >
          Write the wave →
        </Link>
      </div>
    </div>
  )
}

// ====== Main client component ======

export function ProspectsClient({ initialProspects }: { initialProspects: ProspectRow[] }) {
  const [prospects, setProspects] = useState<ProspectRow[]>(initialProspects)
  const [phase, setPhase] = useState<Phase>('refine')
  const [searching, setSearching] = useState(false)
  const [refining, setRefining] = useState(false)
  const [openProspect, setOpenProspect] = useState<ProspectRow | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function runSearch() {
    setSearching(true)
    setError(null)
    try {
      const res = await fetch('/api/prospects/search', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Search failed')
      const found = (json.prospects ?? []) as ProspectRow[]
      setProspects(found)
      // Score the freshly-found ones
      if (found.length > 0) {
        await fetch('/api/ai/score-prospects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prospectIds: found.map((p) => p.id) }),
        })
        await refreshList()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSearching(false)
    }
  }

  async function refreshList() {
    const res = await fetch('/api/prospects/list', { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    setProspects((json.prospects ?? []) as ProspectRow[])
  }

  async function refreshOne(id: string) {
    const res = await fetch(`/api/prospects/list?id=${id}`, { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    const fresh = (json.prospects ?? [])[0] as ProspectRow | undefined
    if (!fresh) return
    setProspects((prev) => prev.map((p) => (p.id === id ? fresh : p)))
    if (openProspect?.id === id) {
      setOpenProspect(fresh)
    }
  }

  function setVerdict(id: string, v: Verdict) {
    // Optimistic local update
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const research: ProspectResearch = { ...(p.research ?? {}), verdict: v }
        return { ...p, research }
      })
    )
    startTransition(() => {
      fetch('/api/prospects/verdict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prospectId: id, verdict: v }),
      }).catch(() => {
        // Revert on failure
        refreshList()
      })
    })
  }

  async function advanceToSelection() {
    setRefining(true)
    try {
      await fetch('/api/ai/refine-prospects', { method: 'POST' })
      await refreshList()
      setPhase('select')
    } finally {
      setRefining(false)
    }
  }

  const undecided = useMemo(
    () => prospects.filter((p) => !p.research?.verdict).sort((a, b) => (b.research?.score ?? 0) - (a.research?.score ?? 0)),
    [prospects]
  )
  const liked = useMemo(() => prospects.filter((p) => p.research?.verdict === 'like'), [prospects])
  const strong = useMemo(() => prospects.filter((p) => p.research?.verdict === 'strong'), [prospects])

  if (prospects.length === 0) {
    return (
      <div>
        <EmptyState onSearch={runSearch} loading={searching} />
        {error && (
          <p className="text-signal-hot text-center font-mono text-xs px-8 pb-8">{error}</p>
        )}
      </div>
    )
  }

  const visibleInRefine = [...liked, ...undecided]
  const visibleInSelect = [...strong, ...liked, ...undecided]

  const visible = phase === 'refine' ? visibleInRefine : visibleInSelect

  return (
    <div>
      <PhaseHeader
        phase={phase}
        refineCount={liked.length}
        selectCount={strong.length}
        canAdvance={liked.length > 0}
        onAdvance={advanceToSelection}
        onBack={() => setPhase('refine')}
        refining={refining}
      />

      {error && (
        <p className="text-signal-hot font-mono text-xs px-8 pt-4">{error}</p>
      )}

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => (
          <ProspectCard
            key={p.id}
            p={p}
            phase={phase}
            onOpen={setOpenProspect}
            onVerdict={setVerdict}
          />
        ))}
      </div>

      {openProspect && (
        <IntelSheet
          prospect={openProspect}
          onClose={() => setOpenProspect(null)}
          onRefresh={refreshOne}
        />
      )}
    </div>
  )
}
