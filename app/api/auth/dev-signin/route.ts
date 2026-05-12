// Dev-mode sign-in stub. ENABLED ONLY when NEXT_PUBLIC_AUTH_MODE === 'dev'.
// Hard-blocks any other mode with 403 — production env keeps real magic-link.
//
// Flow:
//   1. Look up auth user by DEV_USER_EMAIL via admin.listUsers (filter)
//   2. If not found, create via admin.createUser (email_confirm=true so the
//      signup trigger fires and provisions org + organization_members)
//   3. Generate a magic-link via admin.generateLink, capturing token_hash
//   4. Build the redirect response FIRST, then wire a server client whose
//      cookie setter writes onto that response (Failure Class 13 pattern from
//      app/auth/callback/route.ts)
//   5. supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) — this is
//      the call that actually mints the session and triggers the cookie write
//   6. Return the prebuilt redirect; session cookies ride along
//
// Net effect: one click → real Supabase session → /today, no email, no PKCE.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function handle(request: NextRequest): Promise<NextResponse> {
  // Hard env gate. If anyone deploys this code with AUTH_MODE != 'dev',
  // refuse to mint a session — production must stay on real auth.
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== 'dev') {
    return badRequest('Dev sign-in is disabled in this environment.', 403)
  }

  const email = process.env.DEV_USER_EMAIL
  if (!email) {
    return badRequest('DEV_USER_EMAIL not configured on the server.', 500)
  }

  // Resolve the host the user actually visited so cookies land on the right
  // domain (Vercel previews go through x-forwarded-host).
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const redirectBase = forwardedHost ? `${protocol}://${forwardedHost}` : origin
  const redirectUrl = `${redirectBase}/today`

  const admin = createAdminClient()

  // 1. Find existing user by email. listUsers paginates by default; one page
  //    is enough for dev mode (one user). If your org ever grows past page 1
  //    in dev mode, that's a problem worth having.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listError) {
    return badRequest(`Could not list users: ${listError.message}`, 500)
  }
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  // 2. Create if missing. email_confirm=true so the signup trigger fires.
  if (!existing) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (createError) {
      return badRequest(`Could not create dev user: ${createError.message}`, 500)
    }
  }

  // 3. Mint a magiclink, but DON'T email it. We only want the token_hash.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !link?.properties?.hashed_token) {
    return badRequest(
      `Could not generate dev sign-in link: ${linkError?.message ?? 'no hashed_token'}`,
      500
    )
  }
  const tokenHash = link.properties.hashed_token

  // 4. Build the redirect response BEFORE creating the cookie-aware client.
  //    Supabase's setAll callback writes session cookies onto this response.
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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  // 5. Consume the token. This triggers setAll → cookies land on `response`.
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  })
  if (verifyError) {
    return badRequest(`Dev sign-in verify failed: ${verifyError.message}`, 500)
  }

  return response
}

// Accept both methods so the button can fire it with a plain link OR a POST.
export const GET = handle
export const POST = handle
