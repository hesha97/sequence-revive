'use client'

// Onboarding flow: Welcome → 17 intake questions → compile → brain preview.
// All field components defined at module level (Pattern 24).
// MCQ options carry { user, api } — the api value is what's stored on `answers`.

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { INTAKE_STEPS, IntakeStep, McqOption } from './intake-steps'

type Answers = Record<string, unknown>

// ====== Helpers ======

function isMcqOptionSelectedSingle(value: unknown, opt: McqOption): boolean {
  // Single MCQ stores opt.api as the answer. For array `api` (geography), compare by reference-stable label.
  if (Array.isArray(opt.api) && Array.isArray(value)) {
    return JSON.stringify(value) === JSON.stringify(opt.api)
  }
  return value === opt.api
}

function isMcqOptionSelectedMulti(values: unknown, opt: McqOption): boolean {
  if (!Array.isArray(values)) return false
  if (typeof opt.api === 'string') return values.includes(opt.api)
  // Multi MCQ with array api is unsupported (no current step uses it).
  return false
}

// ====== Field components (MODULE LEVEL) ======

function FieldText({
  step,
  value,
  onChange,
}: {
  step: IntakeStep
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={step.placeholder ?? ''}
      className="w-full bg-transparent border-b border-earth-borderStrong
                 focus:border-ocean-teal outline-none py-3 text-fg-primary
                 font-serif text-2xl placeholder:text-fg-tertiary transition-colors"
    />
  )
}

function FieldTextarea({
  step,
  value,
  onChange,
}: {
  step: IntakeStep
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={step.placeholder ?? ''}
      rows={4}
      className="w-full bg-earth-surface border border-earth-border
                 focus:border-earth-borderActive rounded-md p-4 text-fg-primary
                 font-sans text-base placeholder:text-fg-tertiary
                 transition-colors resize-none outline-none"
    />
  )
}

function FieldMcqSingle({
  step,
  value,
  onChange,
}: {
  step: IntakeStep
  value: unknown
  onChange: (v: string | string[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {(step.options ?? []).map((opt, i) => {
        const isSelected = isMcqOptionSelectedSingle(value, opt)
        return (
          <button
            key={`${opt.user}-${i}`}
            type="button"
            onClick={() => onChange(opt.api)}
            className={`text-left px-4 py-3 rounded-md border transition-colors text-sm
                        ${
                          isSelected
                            ? 'border-ocean-teal bg-ocean-teal/15 text-fg-primary'
                            : 'border-earth-border bg-earth-surface text-fg-secondary hover:bg-earth-surfaceHover hover:text-fg-primary'
                        }`}
          >
            {opt.user}
          </button>
        )
      })}
    </div>
  )
}

function FieldMcqMulti({
  step,
  value,
  onChange,
}: {
  step: IntakeStep
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: McqOption) {
    if (typeof opt.api !== 'string') return // unsupported
    const api = opt.api
    if (value.includes(api)) {
      onChange(value.filter((v) => v !== api))
    } else {
      onChange([...value, api])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {(step.options ?? []).map((opt, i) => {
        const isSelected = isMcqOptionSelectedMulti(value, opt)
        return (
          <button
            key={`${opt.user}-${i}`}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-2 rounded-md border transition-colors text-sm font-mono
                        ${
                          isSelected
                            ? 'border-ocean-teal bg-ocean-teal/15 text-fg-primary'
                            : 'border-earth-border bg-earth-surface text-fg-secondary hover:bg-earth-surfaceHover hover:text-fg-primary'
                        }`}
          >
            {opt.user}
          </button>
        )
      })}
    </div>
  )
}

function FieldTags({
  step,
  values,
  onChange,
}: {
  step: IntakeStep
  values: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag() {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (values.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...values, trimmed])
    setDraft('')
  }

  function removeTag(t: string) {
    onChange(values.filter((v) => v !== t))
    inputRef.current?.focus()
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                       border border-ocean-teal bg-ocean-teal/15 text-fg-primary
                       text-sm font-mono"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="text-fg-tertiary hover:text-fg-primary transition-colors"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
        }}
        onBlur={addTag}
        placeholder={step.placeholder ?? 'Type and press Enter'}
        className="w-full bg-earth-surface border border-earth-border
                   focus:border-earth-borderActive rounded-md p-3 text-fg-primary
                   text-sm font-mono placeholder:text-fg-tertiary
                   outline-none transition-colors"
      />
      <p className="text-fg-tertiary text-[10px] font-mono uppercase tracking-widest mt-1">
        Press Enter to add
      </p>
    </div>
  )
}

function StepBody({
  step,
  answers,
  setAnswer,
}: {
  step: IntakeStep
  answers: Answers
  setAnswer: (id: string, v: unknown) => void
}) {
  switch (step.kind) {
    case 'text':
      return (
        <FieldText
          step={step}
          value={(answers[step.id] as string) ?? ''}
          onChange={(v) => setAnswer(step.id, v)}
        />
      )
    case 'textarea':
      return (
        <FieldTextarea
          step={step}
          value={(answers[step.id] as string) ?? ''}
          onChange={(v) => setAnswer(step.id, v)}
        />
      )
    case 'mcq-single':
      return (
        <FieldMcqSingle
          step={step}
          value={answers[step.id]}
          onChange={(v) => setAnswer(step.id, v)}
        />
      )
    case 'mcq-multi':
      return (
        <FieldMcqMulti
          step={step}
          value={(answers[step.id] as string[]) ?? []}
          onChange={(v) => setAnswer(step.id, v)}
        />
      )
    case 'tags':
      return (
        <FieldTags
          step={step}
          values={(answers[step.id] as string[]) ?? []}
          onChange={(v) => setAnswer(step.id, v)}
        />
      )
  }
}

// ====== Brain preview (module level) ======

type Brain = {
  company_summary?: string
  voice_essence?: string
  ideal_buyer_summary?: string
  buyer_daily_pain?: string
  common_objection?: string
  winning_argument?: string
  key_value_props?: string[]
  buying_signals?: string[]
  named_proof?: string
  market_context?: string
  search_filters?: Record<string, unknown>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

function BrainPreview({ brain }: { brain: Brain }) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-4">
        Your brain
      </p>
      <h1 className="font-serif text-4xl text-fg-primary mb-2">
        <span className="italic">This is how we&apos;ll speak for you.</span>
      </h1>
      <p className="text-fg-secondary mb-12">
        Edit anything in &lsquo;Your voice&rsquo; later. For now, let&apos;s find people.
      </p>

      <Section title="Who you are">
        <p className="text-fg-primary leading-relaxed">{brain.company_summary}</p>
      </Section>
      <Section title="How you sound">
        <p className="text-fg-primary leading-relaxed">{brain.voice_essence}</p>
      </Section>
      <Section title="Who you reach">
        <p className="text-fg-primary leading-relaxed">{brain.ideal_buyer_summary}</p>
      </Section>
      <Section title="The pain they feel">
        <p className="text-fg-primary leading-relaxed">{brain.buyer_daily_pain}</p>
      </Section>
      <Section title="What closes them">
        <p className="text-fg-primary leading-relaxed">{brain.winning_argument}</p>
      </Section>
      {brain.key_value_props && brain.key_value_props.length > 0 && (
        <Section title="Value props">
          <ul className="list-disc list-inside text-fg-primary space-y-1">
            {brain.key_value_props.map((vp) => (
              <li key={vp}>{vp}</li>
            ))}
          </ul>
        </Section>
      )}
      {brain.market_context && (
        <Section title="Market context">
          <p className="text-fg-primary leading-relaxed">{brain.market_context}</p>
        </Section>
      )}
    </div>
  )
}

// ====== Welcome (module level) ======

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Welcome
      </p>
      <h1 className="font-serif text-5xl md:text-6xl text-fg-primary mb-6 max-w-3xl leading-tight">
        <span className="italic">The fun part starts.</span>
      </h1>
      <p className="text-fg-secondary text-lg max-w-xl mb-12 leading-relaxed">
        Seventeen short questions. Then we&apos;ll write the way you write,
        and find the people you want to find.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                   px-8 py-4 rounded-md font-mono text-sm transition-colors
                   uppercase tracking-widest"
      >
        Let&apos;s go
      </button>
    </div>
  )
}

// ====== Compiling state (module level) ======

function Compiling({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Building your brain
      </p>
      <h1 className="font-serif text-4xl text-fg-primary mb-6 max-w-2xl leading-tight">
        <span className="italic">Reading your answers. Studying your market. Building your brain.</span>
      </h1>
      {error ? (
        <>
          <p className="text-signal-hot font-mono text-sm mt-6 max-w-xl mb-6">
            Couldn&apos;t pull this together right now — {error}. Try again?
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                       px-6 py-3 rounded-md font-mono text-xs transition-colors
                       uppercase tracking-widest"
          >
            Try again
          </button>
        </>
      ) : (
        <p className="text-fg-secondary text-sm">A few seconds.</p>
      )}
    </div>
  )
}

// ====== Main flow (the only stateful component) ======

export function OnboardingFlow({ clientId }: { clientId: string | null }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'welcome' | 'asking' | 'compiling' | 'done'>('welcome')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [brain, setBrain] = useState<Brain | null>(null)
  const [error, setError] = useState<string | null>(null)

  const step = INTAKE_STEPS[stepIndex]
  const totalSteps = INTAKE_STEPS.length
  const value = answers[step.id]
  const isValid = step.validate(value)
  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  const canAdvance = useMemo(() => isValid, [isValid])
  const canSkip = Boolean(step.optional) && isEmpty

  function setAnswer(id: string, v: unknown) {
    setAnswers((prev) => ({ ...prev, [id]: v }))
  }

  async function compileBrain() {
    setError(null)
    setPhase('compiling')
    try {
      const res = await fetch('/api/ai/compile-brain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers, clientId }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message ?? errJson.error ?? `Compile failed (${res.status})`)
      }
      const { brain: compiledBrain } = await res.json()
      setBrain(compiledBrain)
      setPhase('done')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function next() {
    if (!canAdvance && !canSkip) return
    if (canSkip && isEmpty) {
      // Persist a sentinel so the prompt-builder skips this answer.
      setAnswer(step.id, [])
    }
    if (stepIndex === totalSteps - 1) {
      compileBrain()
    } else {
      setStepIndex(stepIndex + 1)
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  // Keyboard: Enter advances when on text/textarea (no shift) — only when can advance.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== 'asking') return
      if (e.key === 'Enter' && !e.shiftKey && (step.kind === 'text' || step.kind === 'mcq-single')) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) {
          if (canAdvance) next()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'welcome') {
    return <Welcome onStart={() => setPhase('asking')} />
  }

  if (phase === 'compiling') {
    return <Compiling error={error} onRetry={compileBrain} />
  }

  if (phase === 'done' && brain) {
    return (
      <div>
        <BrainPreview brain={brain} />
        <div className="max-w-2xl mx-auto px-8 pb-24 flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/today')}
            className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                       px-6 py-3 rounded-md font-mono text-sm transition-colors
                       uppercase tracking-widest"
          >
            Take me in
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase('asking')
              setStepIndex(0)
            }}
            className="border border-earth-border text-fg-secondary hover:text-fg-primary
                       px-6 py-3 rounded-md font-mono text-sm transition-colors
                       uppercase tracking-widest"
          >
            Adjust answers
          </button>
        </div>
      </div>
    )
  }

  // Asking phase
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 pt-8 pb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          {step.eyebrow}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">
          {stepIndex + 1} / {totalSteps}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-12">
        <div className="max-w-2xl w-full">
          <h1 className="font-serif text-3xl md:text-4xl text-fg-primary leading-tight mb-3">
            {step.question}
          </h1>
          {step.helper && (
            <p className="text-fg-secondary text-sm mb-8">{step.helper}</p>
          )}
          <div className="mt-8">
            <StepBody step={step} answers={answers} setAnswer={setAnswer} />
          </div>
        </div>
      </div>

      <footer className="px-8 pb-8 flex items-center justify-between max-w-3xl w-full mx-auto">
        <button
          type="button"
          onClick={back}
          disabled={stepIndex === 0}
          className="font-mono text-xs uppercase tracking-widest text-fg-tertiary
                     hover:text-fg-primary transition-colors disabled:opacity-30
                     disabled:cursor-not-allowed"
        >
          &larr; Back
        </button>
        <div className="flex items-center gap-3">
          {canSkip && (
            <button
              type="button"
              onClick={next}
              className="font-mono text-xs uppercase tracking-widest text-fg-tertiary
                         hover:text-fg-primary transition-colors px-4 py-3"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance && !canSkip}
            className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                       px-6 py-3 rounded-md font-mono text-sm transition-colors
                       uppercase tracking-widest disabled:opacity-30
                       disabled:cursor-not-allowed"
          >
            {stepIndex === totalSteps - 1 ? 'Build my brain' : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  )
}
