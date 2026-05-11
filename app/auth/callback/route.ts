// Magic link callback handler.
// Supabase redirects here with ?code=... after the user clicks the email link.
// We exchange the code for a session, then redirect to the dashboard.
//
// CRITICAL: cookies set via next/headers cookies() do NOT auto-attach to
// NextResponse.redirect() in Next 14. We must use createServerClient inline
// and write cookies directly to the redirect response's cookies.set().

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/today'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  // Resolve the user-facing host. On Vercel previews, x-forwarded-host
  // gives us the alias the user actually visited so cookies land on the
  // right domain.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const redirectBase = forwardedHost ? `${protocol}://${forwardedHost}` : origin
  const redirectUrl = `${redirectBase}${next}`

  // Build the redirect response FIRST so the Supabase cookie setter has
  // something concrete to write into. This is the key fix.
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) {
          // Write each session cookie directly onto the redirect response.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback exchange failed:', error.message)
    return NextResponse.redirect(
      `${redirectBase}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return response
}
