'use client'

// Two-phase OTP code login.
// Phase 1: enter email → Supabase sends a 6-digit code in the same magic-link
//   email it always sends.
// Phase 2: enter the code → verifyOtp returns a session directly (no PKCE,
//   no callback exchange, no cross-browser brittleness).
//
// The magic link is still in the email and still works — it routes through
// app/auth/callback/route.ts as before. This form just adds a parallel,
// device-agnostic path for users who'd rather type the code.

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Phase = 'email' | 'code'

export function LoginForm() {
  const [phase, setPhase] = useState<Phase>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    // signInWithOtp without emailRedirectTo still sends both a link AND the
    // 6-digit code in the default Supabase template. shouldCreateUser=true
    // ensures first-time signers can join.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    setMessage({
      type: 'success',
      text: 'Check your email for a 6-digit code.',
    })
    setPhase('code')
    setLoading(false)
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      setMessage({
        type: 'error',
        text: error.message.includes('expired')
          ? 'That code has expired. Send a new one.'
          : error.message.includes('invalid')
            ? "That code didn't match. Try again."
            : error.message,
      })
      setLoading(false)
      return
    }

    // Hard navigation so middleware picks up the new session cookies on the
    // next request (router.push would keep client-state and might miss it).
    window.location.href = '/today'
  }

  function handleStartOver() {
    setPhase('email')
    setCode('')
    setMessage(null)
  }

  if (phase === 'code') {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <p className="text-fg-secondary text-xs font-mono text-center">
          Sent to {email}
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          placeholder="000000"
          disabled={loading}
          autoFocus
          className="w-full bg-earth-surface border border-earth-deep
                     text-fg-primary placeholder:text-fg-tertiary
                     px-4 py-3 rounded-md font-mono text-2xl text-center
                     tracking-[0.5em]
                     focus:outline-none focus:border-earth-clay
                     disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-earth-sand text-fg-inverse
                     hover:bg-earth-stone
                     px-4 py-3 rounded-md font-mono text-sm
                     transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying…' : 'Sign me in'}
        </button>
        <button
          type="button"
          onClick={handleStartOver}
          disabled={loading}
          className="w-full text-fg-secondary hover:text-fg-primary
                     px-4 py-2 font-mono text-xs underline
                     disabled:opacity-50"
        >
          Use a different email
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

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
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
        {loading ? 'Sending…' : 'Send me a code'}
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
