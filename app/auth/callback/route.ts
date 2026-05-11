// Magic link callback handler.
// Supabase redirects here with ?code=... after the user clicks the email link.
// We exchange the code for a session, then redirect to the dashboard.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Failed exchange or missing code — back to login with error indicator
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
