'use client'

// Approve client. Per-prospect 6-touch preview with inline editing on email
// subject/body and LinkedIn note/DM. All sub-components at module level.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Sequence } from '@/lib/types'

export type ApproveItem = {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  companyName: string
  status: 'pending' | 'generating' | 'ready' | 'failed'
  sequence: Sequence | null
}

// Editable email block
function EmailBlock({
  label,
  day,
  subject,
  body,
  onChange,
}: {
  label: string
  day: number
  subject: string
  body: string
  onChange: (next: { subject: string; body: string }) => void
}) {
  return (
    <div className="border border-earth-border bg-earth-surface rounded-md p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          {label}
        </p>
        <p className="font-mono text-[10px] text-fg-tertiary">Day {day}</p>
      </div>
      <input
        type="text"
        value={subject}
        onChange={(e) => onChange({ subject: e.target.value, body })}
        className="w-full bg-transparent border-b border-earth-border focus:border-earth-borderActive
                   text-fg-primary text-sm font-sans py-2 mb-2 outline-none"
        placeholder="Subject"
      />
      <textarea
        value={body}
        onChange={(e) => onChange({ subject, body: e.target.value })}
        rows={6}
        className="w-full bg-transparent text-fg-primary text-sm font-sans
                   outline-none resize-none leading-relaxed"
        placeholder="Body"
      />
    </div>
  )
}

// Editable LinkedIn note/DM
function LinkedInBlock({
  label,
  day,
  text,
  onChange,
  max,
}: {
  label: string
  day: number
  text: string
  onChange: (s: string) => void
  max?: number
}) {
  return (
    <div className="border border-earth-border bg-earth-surface rounded-md p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          {label}
        </p>
        <p className="font-mono text-[10px] text-fg-tertiary">
          Day {day}
          {max ? ` · ${text.length}/${max}` : ''}
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-transparent text-fg-primary text-sm font-sans
                   outline-none resize-none leading-relaxed"
      />
    </div>
  )
}

// One prospect's full sequence editor
function ProspectSequence({
  item,
  onSave,
}: {
  item: ApproveItem
  onSave: (id: string, seq: Sequence) => void
}) {
  const seq = item.sequence
  if (!seq) {
    return (
      <div className="border border-earth-border bg-earth-surface rounded-md p-5 mb-6">
        <p className="font-serif text-lg text-fg-primary mb-1">
          {item.firstName} {item.lastName}
        </p>
        <p className="text-signal-hot text-sm font-mono">
          Not generated yet. Go back and run generation first.
        </p>
      </div>
    )
  }

  function patch(partial: Partial<Sequence>) {
    const next: Sequence = { ...seq, ...partial } as Sequence
    onSave(item.id, next)
  }

  return (
    <div className="border-t border-earth-deep py-8">
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-1">
          Writing to
        </p>
        <h2 className="font-serif text-2xl text-fg-primary">
          {item.firstName} {item.lastName}
        </h2>
        <p className="text-fg-secondary text-sm">
          {item.jobTitle} {item.companyName ? `· ${item.companyName}` : ''}
        </p>
      </div>

      {seq.step2_invite && (
        <LinkedInBlock
          label="LinkedIn invite note"
          day={seq.step2_invite.day}
          text={seq.step2_invite.note}
          max={198}
          onChange={(s) =>
            patch({ step2_invite: { ...seq.step2_invite!, note: s } })
          }
        />
      )}

      {seq.step3_email1 && (
        <EmailBlock
          label="Email #1"
          day={seq.step3_email1.day}
          subject={seq.step3_email1.subject}
          body={seq.step3_email1.body}
          onChange={(v) =>
            patch({ step3_email1: { ...seq.step3_email1!, ...v } })
          }
        />
      )}

      {seq.step4_email2 && (
        <EmailBlock
          label="Email #2"
          day={seq.step4_email2.day}
          subject={seq.step4_email2.subject}
          body={seq.step4_email2.body}
          onChange={(v) =>
            patch({ step4_email2: { ...seq.step4_email2!, ...v } })
          }
        />
      )}

      {seq.step5_conditional && (
        <>
          <LinkedInBlock
            label="If invite accepted: LinkedIn DM"
            day={seq.step5_conditional.if_accepted.day}
            text={seq.step5_conditional.if_accepted.body}
            onChange={(s) =>
              patch({
                step5_conditional: {
                  ...seq.step5_conditional!,
                  if_accepted: { ...seq.step5_conditional!.if_accepted, body: s },
                },
              })
            }
          />
          <EmailBlock
            label="If not accepted: Email #3"
            day={seq.step5_conditional.if_not.day}
            subject={seq.step5_conditional.if_not.subject}
            body={seq.step5_conditional.if_not.body}
            onChange={(v) =>
              patch({
                step5_conditional: {
                  ...seq.step5_conditional!,
                  if_not: { ...seq.step5_conditional!.if_not, ...v },
                },
              })
            }
          />
        </>
      )}

      {seq.step6_breakup && (
        <EmailBlock
          label="Breakup"
          day={seq.step6_breakup.day}
          subject={seq.step6_breakup.subject}
          body={seq.step6_breakup.body}
          onChange={(v) =>
            patch({ step6_breakup: { ...seq.step6_breakup!, ...v } })
          }
        />
      )}
    </div>
  )
}

export function ApproveClient({
  campaignId,
  items: initialItems,
}: {
  campaignId: string
  items: ApproveItem[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<ApproveItem[]>(initialItems)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  // Block activate until every prospect is ready AND no edit has an unresolved save error.
  const noSaveErrors = Object.keys(saveErrors).length === 0
  const allReady =
    items.length > 0 &&
    items.every((i) => i.status === 'ready' && i.sequence !== null) &&
    noSaveErrors

  async function updateSequence(id: string, seq: Sequence) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, sequence: seq } : i)))
    try {
      const res = await fetch('/api/sequences/save-edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaignProspectId: id, sequence: seq }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? err.error ?? `save_failed_${res.status}`)
      }
      setSaveErrors((prev) => {
        if (!prev[id]) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (e) {
      setSaveErrors((prev) => ({ ...prev, [id]: (e as Error).message }))
    }
  }

  async function activate() {
    setActivating(true)
    setError(null)
    try {
      const res = await fetch('/api/sequences/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? err.error ?? 'Activate failed')
      }
      router.push('/sequences/activate')
    } catch (e) {
      setError((e as Error).message)
      setActivating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 pt-10 pb-6 border-b border-earth-deep sticky top-0 bg-soul z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
              The wave
            </p>
            <h1 className="font-serif text-2xl text-fg-primary">
              <span className="italic">Read it. Adjust anything. Send it when it sounds like you.</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={activate}
            disabled={!allReady || activating}
            className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                       px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest
                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {activating ? 'Saving…' : 'Approve all & save'}
          </button>
        </div>
        {error && (
          <p className="text-signal-hot font-mono text-xs mt-3 max-w-3xl mx-auto">
            Couldn&apos;t save your sequences — {error}. Try again?
          </p>
        )}
      </header>

      <div className="flex-1 px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {items.map((item) => (
            <div key={item.id}>
              <ProspectSequence item={item} onSave={updateSequence} />
              {saveErrors[item.id] && (
                <p className="text-signal-hot font-mono text-xs px-1 -mt-4 mb-4">
                  Edit didn&apos;t save: {saveErrors[item.id]}. Retry by typing again.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
