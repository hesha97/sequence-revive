'use client'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
}

interface DashboardClientProps {
  userEmail: string
  org: Organization | null
  role: string | null
}

export function DashboardClient({ userEmail, org, role }: DashboardClientProps) {
  async function handleSignOut() {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  return (
    <main className="min-h-screen bg-soul">
      {/* Top bar */}
      <header className="border-b border-earth-deep">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="font-mono text-fg-secondary text-xs tracking-widest uppercase">
            Sequence Revive
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-fg-tertiary text-xs">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="font-mono text-xs text-fg-secondary hover:text-fg-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-fg-primary mb-2">
          Welcome to your workspace.
        </h1>
        <p className="text-fg-secondary text-sm mb-12 font-mono">
          {org
            ? `${org.name} \u00B7 ${org.plan} plan \u00B7 role: ${role}`
            : 'Setting up your workspace\u2026'}
        </p>

        <div className="border border-earth-deep rounded-lg p-12 bg-earth-surface">
          <p className="font-mono text-fg-tertiary text-xs uppercase tracking-widest mb-4">
            {org ? 'Dashboard' : 'Empty state'}
          </p>
          <h2 className="font-serif text-2xl text-fg-primary mb-3">
            Your workspace is ready.
          </h2>
          <p className="text-fg-secondary text-sm leading-relaxed mb-8 max-w-xl">
            Next step: onboarding. You&apos;ll add a client, ingest their materials,
            and the system will extract their voice + define their ICP. Coming
            in the next build.
          </p>
          <p className="text-ocean-teal text-xs font-mono">
            Phase 5a Step 2 complete &middot; auth + multi-tenant schema live
          </p>
        </div>
      </div>
    </main>
  )
}
