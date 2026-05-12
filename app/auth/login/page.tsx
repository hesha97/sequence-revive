import { LoginForm } from './login-form'

export default function LoginPage() {
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
          Enter your email. We&apos;ll send you a 6-digit code.
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
