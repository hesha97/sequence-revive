// /dashboard is the legacy URL from Phase 5a. It now redirects to /today
// so the (app) shell takes over.
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  redirect('/today')
}
