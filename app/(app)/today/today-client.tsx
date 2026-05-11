'use client'

import Link from 'next/link'

export function TodayClient({ hasBrain }: { hasBrain: boolean }) {
  if (!hasBrain) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
          One step first
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-fg-primary mb-6 max-w-2xl leading-tight">
          <span className="italic">Let&apos;s build the way we speak for you.</span>
        </h1>
        <p className="text-fg-secondary text-base max-w-lg mb-10 leading-relaxed">
          Seventeen short questions. Then everything else opens up.
        </p>
        <Link
          href="/onboarding"
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                     px-8 py-4 rounded-md font-mono text-sm transition-colors
                     uppercase tracking-widest"
        >
          Start
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Today
      </p>
      <h1 className="font-serif text-4xl md:text-5xl text-fg-primary mb-6 max-w-2xl leading-tight">
        <span className="italic">Quiet for now. Here&apos;s what&apos;s next.</span>
      </h1>
      <p className="text-fg-secondary text-base max-w-lg mb-10 leading-relaxed">
        Your brain is ready. Pick the people you want to say hi to,
        and we&apos;ll write the conversation.
      </p>
      <Link
        href="/prospects"
        className="bg-earth-sand text-fg-inverse hover:bg-earth-stone
                   px-8 py-4 rounded-md font-mono text-sm transition-colors
                   uppercase tracking-widest"
      >
        Find people
      </Link>
    </div>
  )
}
