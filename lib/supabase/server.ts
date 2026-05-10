// Server-side Supabase client with cookie-based auth.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createBaseClient } from '@supabase/supabase-js'

// Standard server client — respects RLS via user's session cookie.
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            )
          } catch {
            // Called from Server Component — can't set cookies. Safe to ignore.
          }
        },
      },
    }
  )
}

// Admin client — bypasses RLS. ONLY use in API routes / trusted server code.
// NEVER import this from a client component or page component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — refusing to create admin client.')
  }
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
