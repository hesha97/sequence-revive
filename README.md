# Sequence Revive

Compliance-aware outbound platform, MENA-native, built for operators who run their own conversations.

## Status

Phase 5a — free-tier foundation deployed.

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                   # opens http://localhost:3000
```

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (auth + database)
- Vercel (hosting, auto-deploy from main)

## Deployment

Push to `main` → Vercel auto-deploys to production. Environment variables are managed in Vercel project settings.
