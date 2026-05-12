'use client'

// Dev-mode sign-in button. Renders ONLY when NEXT_PUBLIC_AUTH_MODE === 'dev'.
// Posts to /api/auth/dev-signin which mints a real Supabase session and
// redirects to /today. Hard-navigates so middleware picks up cookies.

import { useState } from 'react'

export function DevSignInButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      // The route returns a 302 to /today. Following it with fetch and then
      // hard-navigating to its final URL keeps cookies attached correctly.
      const res = await fetch('/api/auth/dev-signin', {
        method: 'POST',
        redirect: 'follow',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(body.error ?? `Sign-in failed (${res.status})`)
        setLoading(false)
        return
      }
      // After fetch follows redirects, res.url is the final destination.
      window.location.href = res.url || '/today'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-fg-secondary text-xs font-mono text-center">
        DEV MODE · signed in as {email}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-earth-sand text-fg-inverse
                   hover:bg-earth-stone
                   px-4 py-3 rounded-md font-mono text-sm
                   transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in…' : `Sign in as ${email}`}
      </button>
      {error && (
        <div className="p-3 rounded-md font-mono text-xs
                        bg-signal-hot/15 text-signal-hot
                        border border-signal-hot/30">
          {error}
        </div>
      )}
    </div>
  )
}
