'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-earth-deep last:border-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">{label}</p>
      <p className="text-fg-primary text-sm">{value}</p>
    </div>
  )
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
  const [error, setError] = useState<string | null>(null)

  async function reset() {
    setResetting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Reset failed')
      }
      router.push('/today')
    } catch (e) {
      setError((e as Error).message)
      setResetting(false)
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
          {error && <p className="text-signal-hot text-xs mt-3 font-mono">{error}</p>}
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
