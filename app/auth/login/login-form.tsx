'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the sign-in link.',
      })
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@company.com"
        disabled={loading}
        className="w-full bg-earth-surface border border-earth-deep
                   text-fg-primary placeholder:text-fg-tertiary
                   px-4 py-3 rounded-md font-mono text-sm
                   focus:outline-none focus:border-earth-clay
                   disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-earth-sand text-fg-inverse
                   hover:bg-earth-stone
                   px-4 py-3 rounded-md font-mono text-sm
                   transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : 'Send sign-in link'}
      </button>
      {message && (
        <div
          className={`p-3 rounded-md font-mono text-xs ${
            message.type === 'success'
              ? 'bg-ocean-teal/15 text-ocean-teal border border-ocean-teal/30'
              : 'bg-signal-hot/15 text-signal-hot border border-signal-hot/30'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
