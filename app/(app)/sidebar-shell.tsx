'use client'

// Sidebar shell — 7 nav tabs. Today is live in Push 1. Other tabs come online
// in subsequent pushes; their `live` flag flips to true as they ship.
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  href: string
  label: string
  live: boolean
}

const TABS: Tab[] = [
  { href: '/today', label: 'Today', live: true },
  { href: '/prospects', label: 'People you might say hi to', live: true },
  { href: '/sequences', label: 'The wave', live: false },
  { href: '/conversations', label: 'Conversations', live: false },
  { href: '/pipeline', label: "What's brewing", live: false },
  { href: '/people', label: 'Everyone', live: false },
  { href: '/voice', label: 'Your voice', live: false },
  { href: '/settings', label: 'Settings', live: false },
]

export function SidebarShell({
  userEmail,
  orgName,
  children,
}: {
  userEmail: string
  orgName: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-soul text-fg-primary flex">
      <aside className="w-64 border-r border-earth-deep p-6 flex flex-col gap-8 sticky top-0 h-screen">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-1">
            Sequence Revive
          </p>
          <p className="font-serif text-lg text-fg-primary leading-tight">
            {orgName ?? 'Your workspace'}
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
            const base =
              'px-3 py-2 rounded-md text-sm transition-colors font-sans'
            if (!tab.live) {
              return (
                <span
                  key={tab.href}
                  className={`${base} text-fg-tertiary cursor-not-allowed flex items-center justify-between`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">
                    soon
                  </span>
                </span>
              )
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`${base} ${
                  isActive
                    ? 'bg-earth-surface text-fg-primary'
                    : 'text-fg-secondary hover:bg-earth-surfaceHover hover:text-fg-primary'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-earth-deep">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary mb-1">
            Signed in as
          </p>
          <p className="text-sm text-fg-secondary break-all mb-3">{userEmail}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary hover:text-fg-primary transition-colors"
            >
              Sign out &rarr;
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
