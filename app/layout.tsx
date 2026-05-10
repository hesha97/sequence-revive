import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sequence Revive',
  description: 'Compliance-aware outbound, MENA-native.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
