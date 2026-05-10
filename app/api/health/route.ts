// Health check + Lemlist auth verification route.
// Calls GET /api/team on Lemlist's REST API using HTTP Basic auth.
// Proves: (1) server-side proxy works, (2) Lemlist key is valid,
// (3) no secrets reach the browser.
import { NextResponse } from 'next/server'

const LEMLIST_BASE = 'https://api.lemlist.com/api'

export async function GET() {
  // Check: Lemlist key exists on server
  const key = process.env.LEMLIST_API_KEY
  if (!key) {
    return NextResponse.json(
      { ok: false, error: 'LEMLIST_API_KEY not configured on server' },
      { status: 500 }
    )
  }

  // Lemlist REST API uses HTTP Basic: empty username, API key as password
  const token = Buffer.from(`:${key}`).toString('base64')

  let upstream: Response
  try {
    upstream = await fetch(`${LEMLIST_BASE}/team`, {
      headers: {
        'Authorization': `Basic ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'lemlist_unreachable', message: (err as Error).message },
      { status: 502 }
    )
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: 'lemlist_auth_failed', status: upstream.status },
      { status: upstream.status }
    )
  }

  const team = await upstream.json()

  // Return team name + ID. Never return the API key or any secret.
  return NextResponse.json({
    ok: true,
    team_name: team.name ?? null,
    team_id: team._id ?? null,
  })
}
