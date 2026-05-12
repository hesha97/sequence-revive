'use client'

// Settings — workspace info + counts + debug panel (owner only) + reset.
// Debug panel pulls last 20 usage_events from /api/debug/logs on mount.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type UsageEvent = {
  event_type: string
  cost_credits: number
  cost_usd: number
  metadata: Record<string, unknown> | null
  created_at: string
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-earth-deep last:border-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">{label}</p>
      <p className="text-fg-primary text-sm">{value}</p>
    </div>
  )
}

function shortMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return ''
  const keys = Object.keys(meta).slice(0, 4)
  return keys
    .map((k) => {
      const v = meta[k]
      if (v === null || v === undefined) return `${k}=null`
      if (typeof v === 'string') return `${k}=${v.slice(0, 30)}`
      if (typeof v === 'number' || typeof v === 'boolean') return `${k}=${v}`
      return `${k}=…`
    })
    .join(' · ')
}

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function EVENT_LABEL(eventType: string): string {
  const map: Record<string, string> = {
    brain_compile: 'Brain compiled',
    prospect_search: 'Found people',
    prospect_research: 'Pulled the brief',
    sequence_generation: 'Wrote a wave',
    email_find: 'Got their email',
  }
  return map[eventType] ?? eventType
}

export function SettingsClient({
  email,
  orgName,
  orgSlug,
  plan,
  role,
  prospectCount,
  campaignCount,
}: {
  email: string
  orgName: string
  orgSlug: string
  plan: string
  role: string
  prospectCount: number
  campaignCount: number
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<UsageEvent[] | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const isOwner = role === 'owner'

  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/debug/logs', { cache: 'no-store' })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.message ?? json.error ?? `Logs failed (${res.status})`)
        }
        const json = await res.json()
        if (!cancelled) setEvents(json.events ?? [])
      } catch (e) {
        if (!cancelled) setEventsError((e as Error).message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOwner])

  async function reset() {
    setResetting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? err.error ?? 'Reset failed')
      }
      router.push('/today')
    } catch (e) {
      setError((e as Error).message)
      setResetting(false)
    }
  }

  async function rebuildBrain() {
    setRebuilding(true)
    setError(null)
    try {
      const res = await fetch('/api/voice/rebuild', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? err.error ?? 'Rebuild failed')
      }
      router.push('/onboarding')
    } catch (e) {
      setError((e as Error).message)
      setRebuilding(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-2xl mx-auto mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
          Settings
        </p>
        <h1 className="font-serif text-3xl text-fg-primary">
          <span className="italic">Your workspace.</span>
        </h1>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="border border-earth-border bg-earth-surface rounded-md p-5 mb-6">
          <InfoRow label="Email" value={email} />
          <InfoRow label="Workspace" value={orgName} />
          <InfoRow label="Slug" value={orgSlug} />
          <InfoRow label="Plan" value={plan} />
          <InfoRow label="Your role" value={role} />
          <InfoRow label="People in your workspace" value={String(prospectCount)} />
          <InfoRow label="Waves" value={String(campaignCount)} />
        </div>

        {isOwner && (
          <div className="border border-earth-border bg-earth-surface rounded-md p-5 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-3">
              Recent activity
            </p>
            {events === null && !eventsError && (
              <p className="text-fg-tertiary text-xs font-mono">Loading…</p>
            )}
            {eventsError && (
              <p className="text-signal-hot text-xs font-mono">
                Couldn&apos;t load activity — {eventsError}
              </p>
            )}
            {events && events.length === 0 && (
              <p className="text-fg-tertiary text-xs font-mono">
                No activity yet. Try Find People or compile a brain.
              </p>
            )}
            {events && events.length > 0 && (
              <ul className="space-y-2">
                {events.map((e, i) => (
                  <li
                    key={`${e.created_at}-${i}`}
                    className="flex items-start justify-between gap-3 border-b border-earth-deep last:border-0 pb-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-fg-primary text-xs font-mono">
                        {EVENT_LABEL(e.event_type)}
                      </p>
                      {e.metadata && (
                        <p className="text-fg-tertiary text-[10px] font-mono truncate">
                          {shortMeta(e.metadata)}
                        </p>
                      )}
                    </div>
                    <p className="text-fg-tertiary text-[10px] font-mono shrink-0">
                      {relativeTime(e.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="border border-earth-border bg-earth-surface rounded-md p-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
            Rebuild your brain
          </p>
          <p className="text-fg-primary text-sm mb-4">
            Re-run onboarding to refresh how we speak for you. Your people and waves stay.
          </p>
          <button
            type="button"
            onClick={rebuildBrain}
            disabled={rebuilding}
            className="border border-earth-borderActive text-fg-primary hover:bg-earth-surfaceHover px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {rebuilding ? 'Clearing…' : 'Rebuild brain'}
          </button>
        </div>

        <div className="border border-signal-hot/40 bg-earth-surface rounded-md p-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal-hot mb-2">
            Danger zone
          </p>
          <p className="text-fg-primary text-sm mb-4">
            Delete everyone, every wave, and start fresh. Your account stays.
          </p>
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="border border-signal-hot/60 text-signal-hot hover:bg-signal-hot/10 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Start fresh
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={reset}
                disabled={resetting}
                className="bg-signal-hot/20 text-signal-hot hover:bg-signal-hot/30 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Yes — delete it all'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="border border-earth-border text-fg-secondary hover:text-fg-primary px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {error && (
            <p className="text-signal-hot text-xs mt-3 font-mono">
              We hit a snag — {error}. Try again?
            </p>
          )}
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            Sign out &rarr;
          </button>
        </form>
      </div>
    </div>
  )
}
