'use client'

// People — table-style list + ManualAddForm at top.
import { useState } from 'react'
import type { ProspectRow } from '@/lib/types'

// Manual add (module level)
function ManualAddForm({
  onAdd,
}: {
  onAdd: (row: ProspectRow) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/people/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          company_name: companyName.trim() || null,
          job_title: jobTitle.trim() || null,
          email: email.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Failed')
      onAdd(json.prospect as ProspectRow)
      setFirstName('')
      setLastName('')
      setCompanyName('')
      setJobTitle('')
      setEmail('')
      setLinkedinUrl('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border border-earth-border bg-earth-surface rounded-md p-5 mb-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-3">
        Add someone manually
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Title"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="LinkedIn URL"
          className="bg-earth-surfaceHover border border-earth-border rounded-md p-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-earth-borderActive"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={saving || !firstName || !lastName}
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-30"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
        {error && <p className="text-signal-hot text-xs">{error}</p>}
      </div>
    </form>
  )
}

// Row (module level)
function Row({ p }: { p: ProspectRow }) {
  const verdict = p.research?.verdict
  const verdictColors: Record<string, string> = {
    skip: 'text-fg-tertiary',
    like: 'text-gold',
    strong: 'text-ocean-teal',
  }
  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-earth-deep last:border-0 items-center">
      <p className="col-span-3 text-fg-primary text-sm">
        {p.first_name} {p.last_name}
      </p>
      <p className="col-span-3 text-fg-secondary text-sm">{p.job_title ?? '—'}</p>
      <p className="col-span-2 text-fg-secondary text-sm">{p.company_name ?? '—'}</p>
      <p className="col-span-2 text-fg-tertiary text-xs font-mono break-all">{p.email ?? '—'}</p>
      <p className="col-span-1 text-fg-tertiary text-[10px] font-mono uppercase tracking-widest">
        {p.source ?? '—'}
      </p>
      <p className={`col-span-1 text-[10px] font-mono uppercase tracking-widest ${verdict ? verdictColors[verdict] : 'text-fg-tertiary'}`}>
        {verdict ?? '—'}
      </p>
    </div>
  )
}

export function PeopleClient({ initialProspects }: { initialProspects: ProspectRow[] }) {
  const [rows, setRows] = useState<ProspectRow[]>(initialProspects)

  function onAdd(p: ProspectRow) {
    setRows((prev) => [p, ...prev])
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
          Everyone
        </p>
        <h1 className="font-serif text-3xl text-fg-primary">
          <span className="italic">Every person you&apos;ve looked at or said hi to.</span>
        </h1>
      </header>

      <ManualAddForm onAdd={onAdd} />

      <div className="border border-earth-border bg-earth-surface rounded-md overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-earth-deep bg-earth-surfaceHover">
          <p className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">Name</p>
          <p className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">Title</p>
          <p className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">Company</p>
          <p className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">Email</p>
          <p className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">From</p>
          <p className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">Verdict</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-fg-tertiary text-sm text-center">
            Nobody here yet. Add someone above, or run &lsquo;Find people&rsquo;.
          </p>
        ) : (
          rows.map((p) => <Row key={p.id} p={p} />)
        )}
      </div>
    </div>
  )
}
