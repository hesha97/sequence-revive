'use client'

// Sequence generation progress. Concurrency limited to 5 in flight.
// Each prospect's status: pending -> generating -> ready | failed.
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type CampaignProspectLite = {
  id: string
  prospectId: string
  firstName: string
  lastName: string
  jobTitle: string
  companyName: string
  status: 'pending' | 'generating' | 'ready' | 'failed'
  hasSequence: boolean
}

// Status pill (module level)
function StatusPill({ status }: { status: CampaignProspectLite['status'] }) {
  const styles: Record<CampaignProspectLite['status'], string> = {
    pending: 'text-fg-tertiary',
    generating: 'text-gold',
    ready: 'text-ocean-teal',
    failed: 'text-signal-hot',
  }
  const labels: Record<CampaignProspectLite['status'], string> = {
    pending: 'queued',
    generating: 'writing…',
    ready: 'ready',
    failed: 'failed',
  }
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// Row (module level)
function ProspectRow({ item }: { item: CampaignProspectLite }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-earth-deep last:border-0">
      <div>
        <p className="font-serif text-base text-fg-primary leading-tight">
          {item.firstName} {item.lastName}
        </p>
        <p className="text-fg-secondary text-xs">
          {item.jobTitle} · {item.companyName}
        </p>
      </div>
      <StatusPill status={item.status} />
    </div>
  )
}

const MAX_CONCURRENT = 5

export function SequencesClient({
  items: initialItems,
}: {
  campaignId: string
  items: CampaignProspectLite[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<CampaignProspectLite[]>(initialItems)
  const [started, setStarted] = useState(false)

  const pendingCount = items.filter((i) => i.status === 'pending').length
  const generatingCount = items.filter((i) => i.status === 'generating').length
  const readyCount = items.filter((i) => i.status === 'ready').length
  const failedCount = items.filter((i) => i.status === 'failed').length
  const allDone = items.every((i) => i.status === 'ready' || i.status === 'failed')

  const generateOne = useCallback(async (cpId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cpId ? { ...i, status: 'generating' } : i))
    )
    try {
      const res = await fetch('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaignProspectId: cpId }),
      })
      const ok = res.ok
      setItems((prev) =>
        prev.map((i) =>
          i.id === cpId
            ? { ...i, status: ok ? 'ready' : 'failed', hasSequence: ok }
            : i
        )
      )
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === cpId ? { ...i, status: 'failed' } : i))
      )
    }
  }, [])

  // Concurrency control: keep at most MAX_CONCURRENT generating at once.
  useEffect(() => {
    if (!started) return
    if (generatingCount >= MAX_CONCURRENT) return
    const next = items.find((i) => i.status === 'pending')
    if (!next) return
    generateOne(next.id)
  }, [started, generatingCount, items, generateOne])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 pt-10 pb-6 border-b border-earth-deep">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
          The wave
        </p>
        <h1 className="font-serif text-3xl text-fg-primary mb-2">
          <span className="italic">Writing the conversation for each of them.</span>
        </h1>
        <p className="text-fg-secondary text-sm">
          {readyCount} of {items.length} ready · {generatingCount} writing · {pendingCount} queued
          {failedCount > 0 ? ` · ${failedCount} failed` : ''}
        </p>
      </header>

      <div className="flex-1 px-8 py-6">
        <div className="max-w-2xl mx-auto border border-earth-border rounded-md bg-earth-surface">
          {items.map((item) => (
            <ProspectRow key={item.id} item={item} />
          ))}
        </div>

        <div className="max-w-2xl mx-auto mt-8 flex items-center justify-between">
          {!started ? (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-8 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Start writing
            </button>
          ) : !allDone ? (
            <p className="text-fg-secondary text-sm">
              Hold on — we&apos;re writing {generatingCount} at a time.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/sequences/approve')}
              className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-8 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Review the wave →
            </button>
          )}
          {failedCount > 0 && started && (
            <button
              type="button"
              onClick={() => {
                setItems((prev) =>
                  prev.map((i) => (i.status === 'failed' ? { ...i, status: 'pending' } : i))
                )
              }}
              className="border border-earth-border text-fg-secondary hover:text-fg-primary px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Retry failed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
