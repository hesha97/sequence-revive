# CLAUDE.md — Sequence Revive: The Complete Project Brain

> **Claude Code reads this file automatically at the start of every session.**
> **This is the ONLY file you need.** Everything — the vision, the architecture, the engineering standards, the v4 audit findings, every prompt template, every API shape, every Notion page ID, every locked decision — is embedded here.
> **Do not search for other files unless explicitly told to.**

---

# PART A — THE PROJECT AND THE PERSON

## A1. THE ONE SENTENCE THAT MATTERS MOST

Ahmed is building something that needs to feel inevitable when it lands. The research is the iceberg — only the tip shows. He thinks 100× bigger than the current scope. Match him or get out of the way. **Be precise, not smart.**

## A2. WHO AHMED IS

**Ahmed Hesham**, founder of Sequence Revive, VP-level operator, non-technical, runs everything through the Claude ecosystem. He directs; you execute. His expectations:

- Initiative without permission-seeking
- Precision over cleverness
- Honest progress reports (never fake progress)
- Recommendations with trade-offs, not menus
- Confirmation only for catastrophic actions (real sends, deletions, account changes)
- Everything else: just do it and report

**Operator Rhythm:**
- "Continue" = use judgment, not mechanical continuation
- ALL CAPS = pushing through fog. Stay calm and deliver cleanly.
- "Got it?" = moving on, not asking a question
- "Uhmmm" = thinking noise. Wait for the real message.
- Frustration = Lost Compass. STOP, verify state, ask 2-3 grounding questions, re-establish thread.

## A3. NORTH STAR

**Ship Sequence Revive as the first compliance-aware AI-native BDaaS product in MENA, prove it live on Revive Agency, then turn the methodology into a reusable archetype for any AI company.**

## A4. WHAT SEQUENCE REVIVE IS

**A BDaaS company (Business Development as a Service) in three stages:**

1. **Service** — real outreach run by Ahmed for real clients. Today.
2. **Platform** — tools that let Ahmed run more outreach faster. Building now.
3. **Product** — a self-serve app that lets other operators do what Ahmed does. Phase 5 deploys this.

**The product's core promise:** operator describes their company, who they want to reach, the conversation they want to start. The product finds the right people, writes personalized hellos in the operator's voice, sends them, manages replies, keeps the operator focused on conversations that matter.

**Three sacred rules:**
1. **The Iceberg Rule** — research shapes the email. Research never appears verbatim.
2. **The Invisible Intelligence Architecture** — Lemlist, Apollo, Instantly, MCP, API, Claude — invisible. Surface outcomes, not machinery.
3. **The Friend Voice** — vendor-speak banned. Outreach/prospects/campaign/sequence/pipeline/ICP/B2B/lead/target = forbidden. Use: hellos/people/wave/conversation/who you reach.

## A5. THE KNOT DOCTRINE (above every other operating principle)

**No challenge is "impossible," "blocker," or "bottleneck." Every challenge is a KNOT — and every knot has a way to be released artfully.**

1. **Name it as a knot.** Out loud.
2. **Stay in creative mood.** Knots loosen with calm patience.
3. **Find the workaround.** There is always at least one.
4. **Loosen it artfully.** Workarounds must not violate other principles.

Knots already loosened: Lemlist 1-account-1-person → demoted to prospecting-only. PostgREST embedded joins fail → Pattern 20 admin client. GitHub MCP read-only → Cowork parallel lane. v4 empty campaign shells → deferred to proper engineering. 3-week warmup blocks users → parallel warmup-while-sending doctrine.

## A6. THE THREE LINEAGES

- **Lineage A — Product.** Building the SaaS. Architecture, engineering, deployment.
- **Lineage B — Operations.** Running real outreach for real clients.
- **Lineage C — Archetype.** Universal patterns extracted from A and B.

**This execution is Lineage A.**

---

# PART B — THE VISION: WHAT 10/10 LOOKS LIKE

## B1. What the product replaces (for the user)

- Lemlist → prospecting + sequences + sending
- Apollo → contact database + enrichment
- LinkedIn Sales Navigator → research + connections
- Google Sheets → pipeline tracking
- HubSpot/CRM → deal management
- Calendly → meeting scheduling
- A human sales assistant → daily briefing + reply management

**One app. All of it. Gone.**

## B2. The full cycle at 10/10 (Phase 5 ships steps 1-11)

1. **Onboard** — 3-5 min MCQ-heavy, extracts complete BD profile
2. **Find** — AI searches 450M+ contacts, pre-loads company research, scores by fit + engagement
3. **Pick** — 20+ prospects with full dossiers
4. **Enrich** — only selected get enriched (credits on demand)
5. **Email** — AI writes personalized multichannel sequences
6. **Approve** — user reviews each message before send
7. **Send** — email via connected account, LinkedIn via automation
8. **Track** — real-time: opened, clicked, replied, bounced
9. **Reply** — AI classifies, recommends action, drafts response
10. **Respond** — user approves and sends
11. **Pipeline** — deal stages, tracking, forecasting

**Future phases (not in scope now):** Meeting scheduling, video integration, recording, AI meeting summary, full CRM, A/B testing, industry benchmarks, self-improving sequences.

## B3. Pricing (locked)

- Free trial: 5 emails + 3 phones, 7 days
- Starter: EGP 1,500/mo (50 emails + 10 phones)
- Growth: EGP 2,500/mo (100 emails + 30 phones)
- Pro: EGP 5,000/mo (200 emails + 100 phones + basic LinkedIn)
- Max: EGP 9,000/mo (500 emails + 250 phones + full LinkedIn)
- Team: EGP 3,000/seat
- Enterprise: EGP 25,000+

---

# PART C — CURRENT PRODUCTION STATE (May 11, 2026)

## C1. Infrastructure

| Asset | Value |
|---|---|
| **Live URL** | https://sequence-revive.vercel.app |
| **GitHub repo** | github.com/hesha97/sequence-revive (auto-deploys main → Vercel) |
| **Vercel project ID** | `prj_tjTG6ts3sPKcWPBYVOIIVarcueDf` |
| **Vercel team ID** | `team_M2OMFCYXWV9baC4xPfhdlTtZ` |
| **Supabase project** | `mjvvgblfriivgnztotgk` (Free tier, eu-central-1) |
| **First user** | ahmed.hesha97@gmail.com (org: "ahmed.hesha97's workspace", plan: free, role: owner) |
| **Schema** | 8 tables, 25 RLS policies, signup trigger validated |
| **Push 1** | Files written but lint errors block build — must fix first |

## C2. Env vars in Vercel (all 5 set — DO NOT change)

- `NEXT_PUBLIC_SUPABASE_URL` — browser-safe
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser-safe, RLS-enforced
- `SUPABASE_SERVICE_ROLE_KEY` — SERVER ONLY (`createAdminClient()`)
- `ANTHROPIC_API_KEY` — SERVER ONLY (`/api/ai/*` routes)
- `LEMLIST_API_KEY` — SERVER ONLY (`/api/prospects/*` routes)

## C3. MCPs you have access to

- **GitHub MCP** — read/write repo, commit, push, read issues
- **Notion MCP** — read/write Constitution + Constellation + Phase 5 page
- **Supabase MCP** — run SQL, read schema, get logs
- **Vercel MCP** — list deployments, get build logs, get runtime logs

## C4. Notion pages

- **Constitution** — `34a43d4610a981b5a28bc34e44062f9d`
- **Constellation** — `34a43d4610a9811bb3c8de9baf1a4172`
- **Phase 5 append** — `35843d4610a981e0b052fdc3c5f1d5c3`

## C5. Lemlist credentials (used by server proxies)

- Team ID: `tea_XwNCS4YPMGC3mDPFe`
- User ID: `usr_cuKeRRqvDPsYmz6TQ`
- Auth: HTTP Basic, empty username, key as password: `"Basic " + Buffer.from(":" + key).toString("base64")`
- 5 sender mailboxes connected (Sahmoud Group domains)

## C6. Push 1 lint errors (fix FIRST before anything else)

```
intake-steps.ts line 24: (v: any) → change to (v: unknown)

onboarding-flow.tsx lines 93,100,546,590,615: unescaped ' in JSX → use &apos;
  Let's → Let&apos;s
  What's → What&apos;s
  Here's → Here&apos;s
  you're → you&apos;re
  We'll → We&apos;ll
  you'll → you&apos;ll
  you'd → you&apos;d
  let's → let&apos;s

today-client.tsx lines 65,68,69,96: same apostrophe fix
```

After fixing: `npm run build` MUST pass. Then commit + push.

---

# PART D — ARCHITECTURE (Path C — Fortress Model)

## D1. The stack

- **Lemlist** ($79/mo) — prospecting/enrichment ONLY. Never sends.
- **Instantly Hypergrowth** ($97/mo) — primary email sending (DEFERRED to Sending Stage)
- **Dripify** ($39/user) — LinkedIn automation (Phase 2, premium only)
- **Claude API** — AI brain. Model: `claude-sonnet-4-5`
- **Supabase** ($25/mo) — Postgres, Auth, RLS
- **Vercel** ($20/mo) — hosting
- **Paymob** — payments (future)

## D2. The 7 Fortress Rules

1. Never depend on one vendor — every layer has primary/standby/emergency
2. Price at 2.5× worst-case cost
3. Hard plan limits prevent abuse
4. Users connect their own email + LinkedIn
5. LinkedIn always premium feature
6. Own your data (Supabase = open-source Postgres)
7. Build toward Phase 4: owning all infrastructure

## D3. Server-side proxy pattern (NON-NEGOTIABLE)

Every third-party API call routes through Next.js `/api/*` routes. Browser bundle NEVER sees API keys.

```typescript
// EXAMPLE: /api/prospects/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // 2. Read body
  const body = await req.json();

  // 3. Server-side API call with secret key
  const apiKey = process.env.LEMLIST_API_KEY;
  const auth = "Basic " + Buffer.from(":" + apiKey!).toString("base64");
  const res = await fetch("https://api.lemlist.com/api/leads/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(body),
  });

  // 4. Return
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Upstream ${res.status}: ${err.slice(0,200)}` }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}
```

---

# PART E — SUPABASE SCHEMA (8 tables, all with RLS)

```sql
organizations (id uuid PK, name text, slug text UNIQUE, plan text DEFAULT 'free', created_at, updated_at)

organization_members (id uuid PK, organization_id uuid FK, user_id uuid FK→auth.users, role DEFAULT 'member', UNIQUE(org,user))

clients (id uuid PK, organization_id uuid FK, name text, brain jsonb, voice_modes jsonb, icp jsonb, created_at, updated_at)

prospects (id uuid PK, organization_id uuid FK, client_id uuid FK, first_name, last_name, email, company_name, job_title, linkedin_url, research jsonb, intel_status text, source DEFAULT 'lemlist', lemlist_lead_id text, created_at, updated_at)

campaigns (id uuid PK, organization_id uuid FK, client_id uuid FK, name text, status DEFAULT 'draft', architecture jsonb, lemlist_campaign_id text, instantly_campaign_id text, created_at, updated_at)

campaign_prospects (id uuid PK, campaign_id uuid FK, prospect_id uuid FK, generated_emails jsonb, generation_status DEFAULT 'pending', current_step int DEFAULT 0, outcome text, verdict text, created_at, updated_at)

replies (id uuid PK, campaign_prospect_id uuid FK, body text, classification text, is_hot_lead boolean DEFAULT false, confidence numeric, received_at)

usage_events (id uuid PK, organization_id uuid FK, event_type text, cost_credits numeric, cost_usd numeric, metadata jsonb, created_at)
```

Helper: `user_org_ids()` SECURITY DEFINER returns org IDs for current auth user.
Signup trigger: auto-creates org + membership on auth.users INSERT.

---

# PART F — THE 10 CATASTROPHIC MISTAKE PATTERNS (never repeat)

1. **Inheriting numbers without re-verifying.** Every inherited number is unverified.
2. **Building instead of directing builders.** Strategy chats direct; Claude Code builds.
3. **Treating frustration as tone.** Apologies make it worse. Slow down, verify, ask.
4. **Cherry-picking project knowledge.** Read files in sequence, slowly.
5. **Users seeing vendor names.** Lemlist/Apollo/Instantly/MCP/API/Claude = invisible.
6. **Demo data when real connectors exist.** Always use real first.
7. **Moderating Ahmed's ambition.** When the founder thinks bigger, the founder is right.
8. **Optimistic margins.** Include trial users, phone enrichment, marketing spend.
9. **Inheriting file inventory claims without verifying.** Check every claim.
10. **Trust Theater.** Celebration screen ≠ evidence the celebrated thing happened. Trace data end-to-end.

---

# PART G — THE 6 ENGINEERING PATTERNS (non-negotiable)

## Pattern 20 — Admin client for bootstrap reads
Server components reading "the current user's own record" (org, first client) use `createAdminClient()` + manual `user.id` filter. Session client is for user-scoped reads only.

## Pattern 21 — No PostgREST embedded joins on RLS tables
`.select('foo, bar(*)')` silently returns null when both have RLS. Use two queries or admin client.

## Pattern 14 — API Vocabulary Exactness
Lemlist filter values must be EXACT API strings. See intake-steps.ts canonical vocabulary.

## Pattern 22 — Infrastructure ≠ Product
Vercel says "Ready" ≠ feature works. Verify the actual flow with real interactions.

## Pattern 24 — No nested React components
NEVER define a component inside another component body. Causes focus loss on re-render. All at module level.

## Pattern 26 — Honest Demo Posture
When a feature needs server infra that doesn't exist yet, build the UI but make the demo state EXPLICIT.

---

# PART H — ENGINEERING STANDARDS

1. `return <Component` — always with space before `<`
2. 2-space indentation
3. Comments on every major section
4. No code-logic lines over 120 chars
5. No minification
6. `npm run build` MUST pass before every push
7. User never sees vendor names
8. JSX apostrophes: `&apos;` (ESLint)
9. No `any` type — use `unknown` and narrow (ESLint)
10. Commit messages: `feat(push-N): description` or `fix: description`
11. Push to `main` only
12. After each push, verify Vercel READY
13. If build fails, read build logs via Vercel MCP, fix, push again
14. Always validate auth in API routes

---

# PART I — DESIGN SYSTEM (SOUL)

```
SOUL.canvas = "#141413"
SOUL.earth.sand = "#E8E0D4"     (primary text, headlines)
SOUL.earth.stone = "#C4B8A8"    (secondary text)
SOUL.earth.clay = "#A89888"     (tertiary, faded)
SOUL.earth.deep = "#2A2927"     (raised surface)
SOUL.earth.surface = "#1E1E1C"  (card/panel)
SOUL.earth.surfaceHover = "#252523"
SOUL.earth.border = "rgba(232,224,212,0.08)"
SOUL.earth.borderActive = "rgba(232,224,212,0.15)"
SOUL.earth.borderStrong = "rgba(232,224,212,0.3)"
SOUL.ocean.teal = "#1D9E75"     (brand, success)
SOUL.ocean.tealMuted = "rgba(29,158,117,0.15)"
SOUL.ocean.blue = "#4A6B8A"     (cold signal)
SOUL.gold = "#C4A265"           (accent)
SOUL.goldMuted = "rgba(196,162,101,0.2)"
SOUL.text.primary = "#E8E0D4"
SOUL.text.secondary = "#A89888"
SOUL.text.tertiary = "#7A7068"
SOUL.text.inverse = "#141413"
SOUL.signal.hot = "#DC6855"
SOUL.signal.warm = "#D97706"
SOUL.signal.cold = "#4A6B8A"
SOUL.signal.booked = "#1D9E75"
SOUL.signal.success = "#059669"

TYPOGRAPHY.serif = "Georgia, 'Times New Roman', serif"
TYPOGRAPHY.sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
TYPOGRAPHY.mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"

SPACING = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48, hero:96 }

TRANSITION.fast = "150ms ease-out"
TRANSITION.normal = "250ms ease-out"
TRANSITION.reveal = "600ms cubic-bezier(0.16,1,0.3,1)"
```

Dark canvas primary. Serif italic for emotive headlines. Mono uppercase eyebrows in gold. No atmospheric effects (no radial gradients, no glow). Flat Linear-dark-mode aesthetic.

---

# PART J — FRIEND VOICE COPY RULES

**BANNED in user-visible text:** outreach, prospects, campaign, sequence, pipeline, enrichment, activate, launch, ICP, B2B, lead, target, account, vendor, API, MCP, AI, Claude, Lemlist, Apollo, Anthropic, integration, sync, automation, workflow

**USE INSTEAD:** "saying hi" / "people" / "the wave" / "the conversation" / "what's brewing" / "getting their details" / "let's go" / "kick it off" / "who you want to reach"

Tone: serif italics for emotive lines, mono uppercase for eyebrows, short sentences, no jargon. Read like a thoughtful friend.

---

# PART K — THE v4 AUDIT: 24 BUGS AND WHAT THEY MEAN FOR YOU

The v4 audit found **17 P0 (breaking) + 6 P1 (lying) + 1 P2 (fragile)** bugs across 9 aspects. The 5 critical ones that shape how you build:

### K1. Campaign activation creates empty Lemlist shells (P0 #16, #17)
The v4 code calls `createCampaign` with ONLY a name. No sequence steps, no Liquid templates, no email content. Lemlist creates an empty shell. Leads get added with custom variables but no sequence references them. Campaign starts and sends NOTHING.

**Your fix:** Real sending is DEFERRED to the Sending Stage. When operator hits activate in the current build, create a `campaigns` row in Supabase with `status='ready_to_send'` and `lemlist_campaign_id=NULL`. Honest celebration copy. No Lemlist API calls.

### K2. Per-prospect intel returns garbage (P0 #1, #2)
The `extractSection` regex breaks on natural-language Claude responses with citations, bullets, markdown. Web_search results get thin AI summaries instead of search content.

**Your fix:** Use JSON-mode responses. Prompt Claude to return `{ "about_them": "...", "hook": "...", "signal": "hot|warm|cold" }` directly. Parse JSON, not regex.

### K3. Voice/Brain editor unusable (P0 #22, #23, #24)
`Field` component defined INSIDE `VoiceScreen` → remounts on every keystroke → focus loss. Brain edits don't propagate to App state.

**Your fix:** All components at module level. Brain stored in Supabase, read/written via server — no stale-state issue.

### K4. Sequence generation "got stuck" (P0 #5)
One big JSON with 6 emails → any syntax slip (apostrophe in a name, stray character) → JSON.parse fails → whole prospect fails.

**Your fix:** For now, wrap in try/catch with a JSON-cleaning step. Longer-term (deferred): split into 6 separate calls.

### K5. Lookalike + Strong conflation (P0 #10)
Three verdict buttons on one screen overwhelm the operator.

**Your fix:** Two-phase prospect review. Phase 1: Skip / ★ Like-this (refine). AI re-ranks. Phase 2: Skip / Strong (select). Separate screens or clearly separated sections.

---

# PART L — THE COMPLETE ROUTE MAP

## L1. Exists (Push 1 — needs lint fix + push)
- `/auth/login`, `/auth/callback`, `/auth/signout`
- `/dashboard` → redirects to `/today`
- `/onboarding` → Welcome → 17 questions → compile → brain preview
- `/today` → empty state with CTA
- `/api/health` → Lemlist key validation
- `/api/ai/compile-brain` → Anthropic proxy

## L2. Push 2 — Prospects (find + review + research)
- `/prospects` — Find People + Review
- `/api/prospects/search` — Lemlist proxy
- `/api/prospects/enrich/[id]` — Lemlist lead detail
- `/api/ai/score-prospects` — Anthropic scoring
- `/api/ai/research-prospect` — Anthropic web_search intel

## L3. Push 3 — Sequences (write + approve + save)
- `/sequences` — generation progress
- `/sequences/approve` — review + edit
- `/sequences/activate` — confirmation + celebration (Supabase only, no Lemlist)
- `/api/ai/generate-sequence` — Anthropic sequence writer

## L4. Push 4 — Dashboard
- `/conversations` — honest empty state
- `/pipeline` — board by outcome
- `/people` — full list + manual add
- `/voice` — brain editor (module-level fields!)
- `/settings` — org info, reset, signout
- `/api/ai/draft-reply` — reply drafter
- Update sidebar: all tabs `live: true`, active-tab highlighting

---

# PART M — ALL 6 PROMPT TEMPLATES (use verbatim)

## M1. Brain Compile

System: `"You are a precise data synthesizer. Output ONLY valid JSON. No prose, no markdown fences."`
Max tokens: 2500. Model: claude-sonnet-4-5.

User prompt:
```
You are building the "Brain" for a B2B sales product. The operator answered intake questions about their company and ideal buyer. Synthesize a complete brain from these answers.

INTAKE ANSWERS:
{{intake_summary}}

Return a single JSON object with these fields ONLY (no preamble, no markdown):
{
  "company_summary": "2-3 sentence summary",
  "voice_essence": "1 sentence tone/register",
  "ideal_buyer_summary": "1-2 sentence vivid ideal buyer",
  "buyer_daily_pain": "1 sentence daily pain",
  "common_objection": "1 sentence likely pushback",
  "winning_argument": "1 sentence closing argument",
  "buying_signals": ["5-7 specific signals"],
  "key_value_props": ["3-4 short value props"],
  "named_proof": "proof points summarized",
  "market_context": "1-2 sentences industry context",
  "search_filters": {
    "seniorities": ["exact Lemlist API values"],
    "company_sizes": ["exact Lemlist API values"],
    "industries": ["operator-provided"],
    "departments": ["operator-provided"],
    "countries": ["expanded country list"]
  }
}
```

## M2. Prospect Scoring

System: `"You are a precise scorer. Output ONLY valid JSON array."`
Max tokens: 3000.

User prompt:
```
You are scoring B2B prospects against this brain.

BRAIN:
- Company: {{brain.company_summary}}
- Ideal buyer: {{brain.ideal_buyer_summary}}
- Daily pain solved: {{brain.buyer_daily_pain}}
{{learned_exclusions_block_if_3+_skips}}

PROSPECTS:
1. firstName lastName, title at companyName
...

Return ONLY a JSON array of {index, score: 0-100, reason: "1 sentence", archetype: "1-3 word label"} sorted by score descending.
```

## M3. Lookalike Refinement

System: `"Output ONLY valid JSON array."`
Max tokens: 3000.

```
The operator marked these as the EXACT type they want:
{{seed_summary}}

Re-rank remaining by match to seed pattern. Return JSON array of {index, score: 0-100, reason} sorted descending.

REMAINING:
1. firstName lastName, title at companyName
...
```

## M4. Per-Prospect Intel (JSON mode — v4 regex bug fix)

Max tokens: 1500. Tools: `[{ type: "web_search_20250305", name: "web_search" }]`

**Person search:**
```
Research this person for B2B outreach context: {{name}}, {{title}} at {{company}}.

Search the web. Then return ONLY a JSON object (no markdown, no prose):
{
  "about_them": "3 sentences about their recent role, posts, signals, priorities",
  "conversation_hook": "1-2 sentences: specific opening angle referencing a real recent thing",
  "signal_strength": "hot" or "warm" or "cold"
}
```

**Company search:**
```
Research this company: {{company}}. Recent news, hiring, funding, RFPs, leadership changes (last 6 months).

Return ONLY JSON:
{
  "about_company": "3 sentences max — recent moves, hiring, news",
  "recent_signals": ["list of 2-3 specific recent events"]
}
```

## M5. Sequence Generation (per prospect)

System: `"You are an expert B2B copywriter who writes in the operator's exact voice. Output ONLY valid JSON. Never include markdown fences or prose outside the JSON."`
Max tokens: 4000.

```
You are writing a 6-touch outreach sequence for ONE specific person.

PERSON:
- Name: {{firstName}} {{lastName}}
- Title: {{title}}
- Company: {{company}}
- Country: {{country}}

BRAIN:
- Company summary: {{brain.company_summary}}
- Voice essence: {{brain.voice_essence}}
- Value props: {{brain.key_value_props.join(", ")}}
- Proof: {{brain.named_proof}}

BUYER PSYCHOLOGY:
- Daily pain: {{brain.buyer_daily_pain}}
- Common objection: {{brain.common_objection}} — preempt in email #2
- Winning argument: {{brain.winning_argument}} — lead with this
- Signals: {{brain.buying_signals.join(", ")}}
- Market: {{brain.market_context}}

{{intel_block_if_exists}}

THE 6-TOUCH SEQUENCE:
1. Day 0 — LinkedIn visit (no message)
2. Day 1 — LinkedIn invite (max 198 chars)
3. Day 3 — Email #1 (~140 words, 3 paragraphs: intro+proof / pain+value / reply CTA)
4. Day 7 — Email #2 (~80 words, new angle, preempt objection, Re: thread)
5. Day 10 — CONDITIONAL: LinkedIn accepted → DM (~60 words) / Not → Email #3 (~50 words)
6. Day 14 — Breakup email (~40 words, warm exit, Re: thread)

EMAIL #1 RULES:
- Para 1: greeting + sender intro + 1-2 proof points + intel hook woven in (Iceberg Rule)
- Para 2: department angle, touch pain INDIRECTLY, lead with winning argument shape
- Para 3: reply CTA — "reply yes → credentials pack" (AVL-aware for MENA corporate)
- Forward-survivable: sender clear by line 2, no attachments
- Intel shapes tone, NEVER appears as stated facts

EMAIL #2: ~80 words, new angle, proof not in #1, preempt objection, Re: thread
EMAIL #3: ~50 words, acknowledge inbox noise, last value prop, Re: thread
EMAIL #4: ~40 words, warm exit, season-aware (Summer in MENA), Re: thread
LINKEDIN INVITE: under 198 chars, one line why, no pitch
LINKEDIN DM: ~60 words, conversational, same CTA

OUTPUT — ONLY JSON:
{
  "step1_visit": { "type": "linkedin_visit", "day": 0 },
  "step2_invite": { "type": "linkedin_invite", "day": 1, "note": "..." },
  "step3_email1": { "type": "email", "day": 3, "subject": "...", "body": "..." },
  "step4_email2": { "type": "email", "day": 7, "subject": "Re: ...", "body": "..." },
  "step5_conditional": {
    "if_accepted": { "type": "linkedin_message", "day": 10, "body": "..." },
    "if_not": { "type": "email", "day": 10, "subject": "Re: ...", "body": "..." }
  },
  "step6_breakup": { "type": "email", "day": 14, "subject": "Re: ...", "body": "..." }
}
```

## M6. Reply Drafting

System: `"You are an expert reply writer who matches the operator's voice."`
Max tokens: 500.

```
Someone replied to your outreach. Draft a warm, concise reply.

THEY SAID: "{{reply_text}}"

CONTEXT: {{brain.company_summary}}

PERSON: {{firstName}} {{lastName}} at {{company}}

Rules:
- 3 sentences max
- Warm, professional, not salesy
- Interested → propose next step (call, credentials pack)
- Declining → graceful exit, door open
- Question → answer directly, then propose next step
- Match their formality

Output ONLY the reply body. No subject line.
```

---

# PART N — LEMLIST API REFERENCE

**Auth:** `"Basic " + Buffer.from(":" + process.env.LEMLIST_API_KEY).toString("base64")`

**Search:** POST `https://api.lemlist.com/api/leads/search`
```json
{ "mode": "people", "limit": 30, "filters": { ... } }
```
`mode` MUST be `"people"`. Max 50 results. Returns `{ results: [{ _id, firstName, lastName, title, companyName, country, ... }] }`.

**Enrich:** GET `https://api.lemlist.com/api/leads/{leadId}`

**Campaign (DEFERRED):** POST `/api/campaigns`, POST `/api/campaigns/{id}/leads`, POST `/api/campaigns/{id}/start`, GET `/api/campaigns/{id}/messages`

---

# PART O — ANTHROPIC API REFERENCE

Use `lib/anthropic.ts` already in repo. `callAnthropic(messages, options)` → content blocks. `extractText(content)` → joined text.

Model: `claude-sonnet-4-5`. For web search: `tools: [{ type: "web_search_20250305", name: "web_search" }]`.

JSON parsing: `text.replace(/```json|```/g, "").trim()` then `JSON.parse()`.

---

# PART P — VERIFICATION GATES (after every push)

1. **Vercel READY** — `Vercel:list_deployments({ projectId: "prj_tjTG6ts3sPKcWPBYVOIIVarcueDf", teamId: "team_M2OMFCYXWV9baC4xPfhdlTtZ" })` → confirm `state: "READY"`
2. **Route renders** — fetch live URL of new route. Protected routes: expect 307 to /auth/login (correct).
3. **Build logs clean** — `Vercel:get_deployment_build_logs({ idOrUrl, teamId })`
4. **Update Notion** — append to Phase 5 page (`35843d4610a981e0b052fdc3c5f1d5c3`):

```
### Push N — Claude Code (date)
**Commit:** <sha>
**What shipped:** <paragraph>
**Verification:** Vercel READY ✓ | Routes render ✓ | Build clean ✓
**Open issues:** <any, or none>
```

---

# PART Q — THE SENDING STAGE DOCTRINE (deferred but pre-engineered)

Real sending is its own focused stage. NOT in scope of current execution. The app stops at `status='ready_to_send'` in Supabase.

When built:
- Users connect ~5 business emails via Sending Mailboxes page
- First testing: Lemlist with Ahmed's 5 connected Sahmoud mailboxes
- Warmup runs PARALLEL with real sending on data-driven pacing
- Transparent: "5 today, 5 tomorrow, 10/day in 2 weeks, 30/day in 4 weeks"
- Full detailed doctrine locked in Constitution (Phase 5 append page)

For current execution: NO real Lemlist campaign creation. Activate = Supabase save + honest celebration.

---

# PART R — THE EXECUTION CONTRACT

## Two moves:

### MOVE 1 — PLAN MODE (read-only)
Read this file. Read the repo via GitHub MCP. Read Notion Constitution + Phase 5 append. Present a complete plan for: lint fix → Push 2 → Push 3 → Push 4 → verification. File-by-file. Ahmed approves.

### MOVE 2 — BUILD MODE (execute)
Execute end-to-end. Fix lint. Build all routes and proxies. Push after each major piece. Verify Vercel deploys. Update Notion as you go. Report back when done.

**During execution:**
- `npm run build` before every push
- Vercel READY before moving on
- If Knot: name it, propose loosens, ask Ahmed
- No Trust Theater: verify outcomes, not surfaces

**Report at end:**
- Final commit SHAs
- Verification results (all green?)
- End-user test path Ahmed can walk
- Confirmation Sending Stage is properly deferred
- Notion updated with full status
