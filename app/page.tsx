'use client'

import { useState } from 'react'

export default function Home() {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function runHealthCheck() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // Dev harness only renders in development
  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <main className="min-h-screen bg-soul flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        {/* Mono label */}
        <p className="text-fg-secondary text-sm tracking-widest uppercase mb-6 font-mono">
          Sequence Revive
        </p>

        {/* Hero headline — Georgia serif, v5 earth.sand color */}
        <h1 className="font-serif text-5xl md:text-7xl text-fg-primary mb-8 leading-tight">
          The arrow has been at full draw long enough.
        </h1>

        {/* Sub — no vendor names, no industry jargon */}
        <p className="text-fg-secondary text-lg leading-relaxed mb-16">
          Compliance-aware outbound, MENA-native, built for operators
          who run their own conversations. Quietly revealing soon.
        </p>

        {/* Pulse indicator — ocean teal */}
        <div className="inline-flex items-center gap-2 text-ocean-teal text-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-ocean-teal animate-pulse" />
          Building.
        </div>
      </div>

      {/* Dev-only verification harness — never renders in production */}
      {isDev && (
        <div className="mt-24 max-w-2xl w-full border-t border-earth-deep pt-8">
          <p className="text-fg-tertiary text-xs font-mono uppercase tracking-widest mb-4">
            Dev — verification harness
          </p>
          <button
            onClick={runHealthCheck}
            disabled={loading}
            className="border border-earth-clay text-fg-primary hover:bg-earth-deep
                       px-4 py-2 rounded-md font-mono text-sm transition-colors
                       disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Run verification ping'}
          </button>
          {result && (
            <pre className="mt-4 p-4 bg-earth-surface text-fg-secondary text-xs
                            font-mono rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </div>
      )}
    </main>
  )
}
