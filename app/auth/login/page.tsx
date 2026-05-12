// Login page. Env-gated:
//   NEXT_PUBLIC_AUTH_MODE=dev → dev sign-in button (one click, no email)
//   anything else            → real magic-link / OTP code form
//
// dynamic='force-dynamic' is REQUIRED. Without it Next.js statically
// pre-renders this page at build time and bakes process.env into the HTML.
// That means: change the env var on Vercel → redeploy → the static HTML
// still shows the old branch. force-dynamic evaluates process.env per
// request, so flipping NEXT_PUBLIC_AUTH_MODE on Vercel is enough; no rebuild.
//
// Comparison is whitespace+case tolerant so a stray space in the dashboard
// value ('dev ', 'Dev', ' DEV ') doesn't silently fall through to email form.

import { LoginForm } from './login-form'
import { DevSignInButton } from './dev-signin-button'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const authMode = String(process.env.NEXT_PUBLIC_AUTH_MODE ?? '').trim().toLowerCase()
  const devMode = authMode === 'dev'
  const devEmail = (process.env.DEV_USER_EMAIL ?? 'dev@local').trim()

  return (
    <main className="min-h-screen bg-soul flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md w-full">
        <p className="text-fg-secondary text-sm tracking-widest uppercase mb-6 font-mono text-center">
          Sequence Revive
        </p>
        <h1 className="font-serif text-3xl text-fg-primary mb-2 text-center">
          Welcome back
        </h1>
        <p className="text-fg-secondary text-sm leading-relaxed mb-12 text-center">
          {devMode
            ? 'Local dev — instant sign-in, no email needed.'
            : 'Enter your email. We’ll send you a sign-in link.'}
        </p>
        {devMode ? <DevSignInButton email={devEmail} /> : <LoginForm />}
      </div>
    </main>
  )
}
