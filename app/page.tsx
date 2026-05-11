'use client'

import Link from 'next/link'
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
    <main className="min-h-screen bg-soul flex flex-col items-center justify-center px-6 py-24 relative">
      {/* Top-right corner sign-in link */}
      <div className="absolute top-6 right-6">
        <Link
          href="/auth/login"
          className="font-mono text-xs text-fg-secondary hover:text-fg-primary
                     transition-colors uppercase tracking-widest"
        >
          Sign in &rarr;
        </Link>
      </div>

      <div className="max-w-2xl text-center">
        <p className="text-fg-secondary text-sm tracking-widest uppercase mb-6 font-mono">
          Sequence Revive
        </p>

        <h1 className="font-serif text-5xl md:text-7xl text-fg-primary mb-8 leading-tight">
          The arrow has been at full draw long enough.
        </h1>

        <p className="text-fg-secondary text-lg leading-relaxed mb-10">
          Compliance-aware outbound, MENA-native, built for operators
          who run their own conversations.
        </p>

        <Link
          href="/auth/login"
          className="inline-block bg-earth-sand text-fg-inverse hover:bg-earth-stone
                     px-8 py-4 rounded-md font-mono text-sm transition-colors
                     uppercase tracking-widest"
        >
          Sign in to your workspace
        </Link>
      </div>

      {/* Dev-only verification harness */}
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
