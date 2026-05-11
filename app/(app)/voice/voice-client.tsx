'use client'

// Voice editor — every Field component defined at module level. K3 fix
// (v4 bug: Field defined inside VoiceScreen caused focus loss every keystroke).
import { useState } from 'react'
import type { Brain } from '@/lib/types'

// Single-line text field (module level)
function FieldText({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-2">
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-earth-surface border border-earth-border focus:border-earth-borderActive
                   rounded-md p-3 text-fg-primary text-sm outline-none transition-colors"
      />
    </div>
  )
}

// Multi-line text field (module level)
function FieldLong({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-2">
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-earth-surface border border-earth-border focus:border-earth-borderActive
                   rounded-md p-3 text-fg-primary text-sm outline-none transition-colors leading-relaxed resize-none"
      />
    </div>
  )
}

// List field — newline-separated (module level)
function FieldList({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (vs: string[]) => void
}) {
  const text = values.join('\n')
  return (
    <div className="mb-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-2">
        {label}
      </p>
      <textarea
        value={text}
        onChange={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        rows={Math.max(3, values.length + 1)}
        className="w-full bg-earth-surface border border-earth-border focus:border-earth-borderActive
                   rounded-md p-3 text-fg-primary text-sm outline-none transition-colors leading-relaxed resize-none"
      />
      <p className="text-fg-tertiary text-[10px] font-mono uppercase tracking-widest mt-1">
        One per line
      </p>
    </div>
  )
}

export function VoiceClient({
  clientId,
  initialBrain,
}: {
  clientId: string
  initialBrain: Brain
}) {
  const [brain, setBrain] = useState<Brain>(initialBrain)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<'idle' | 'saved' | 'error'>('idle')

  function patch(partial: Partial<Brain>) {
    setBrain((prev) => ({ ...prev, ...partial }))
    setSaved('idle')
  }

  async function save() {
    setSaving(true)
    setSaved('idle')
    try {
      const res = await fetch('/api/voice/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId, brain }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved('saved')
    } catch {
      setSaved('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-3xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
            Your voice
          </p>
          <h1 className="font-serif text-3xl text-fg-primary">
            <span className="italic">Adjust anything. We write the way you write.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved === 'saved' && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ocean-teal">Saved</span>
          )}
          {saved === 'error' && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-signal-hot">Save failed</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-5 py-2.5 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        <FieldLong
          label="Who you are"
          value={brain.company_summary ?? ''}
          onChange={(v) => patch({ company_summary: v })}
        />
        <FieldText
          label="How you sound"
          value={brain.voice_essence ?? ''}
          onChange={(v) => patch({ voice_essence: v })}
        />
        <FieldLong
          label="Who you reach"
          value={brain.ideal_buyer_summary ?? ''}
          onChange={(v) => patch({ ideal_buyer_summary: v })}
        />
        <FieldLong
          label="The pain they feel"
          value={brain.buyer_daily_pain ?? ''}
          onChange={(v) => patch({ buyer_daily_pain: v })}
        />
        <FieldLong
          label="What they push back with"
          value={brain.common_objection ?? ''}
          onChange={(v) => patch({ common_objection: v })}
        />
        <FieldLong
          label="What closes them"
          value={brain.winning_argument ?? ''}
          onChange={(v) => patch({ winning_argument: v })}
        />
        <FieldList
          label="Buying signals"
          values={brain.buying_signals ?? []}
          onChange={(vs) => patch({ buying_signals: vs })}
        />
        <FieldList
          label="Value props"
          values={brain.key_value_props ?? []}
          onChange={(vs) => patch({ key_value_props: vs })}
        />
        <FieldLong
          label="Proof points"
          value={brain.named_proof ?? ''}
          onChange={(v) => patch({ named_proof: v })}
        />
        <FieldLong
          label="Industry context"
          value={brain.market_context ?? ''}
          onChange={(v) => patch({ market_context: v })}
        />
      </div>
    </div>
  )
}
