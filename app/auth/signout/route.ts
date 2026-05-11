// Sign-out handler.
// Same Next 14 cookie pattern as /auth/callback: build the redirect response
// FIRST, then create an inline Supabase client whose cookie writer mutates the
// response's cookies. Otherwise the cleared session cookies don't reach the
// browser and the user appears to stay signed in.
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookies = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf('=')
      return idx === -1
        ? { name: c, value: '' }
        : { name: c.slice(0, idx), value: decodeURIComponent(c.slice(idx + 1)) }
    })

  const forwardedHost = request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const { origin } = new URL(request.url)
  const base = forwardedHost ? `${protocol}://${forwardedHost}` : origin

  const response = NextResponse.redirect(`${base}/auth/login`, { status: 302 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}
