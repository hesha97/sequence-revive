# This branch is the Tier-1 test variant

**Don't merge to main.** This branch exists so Ahmed can walk the app end-to-end on Anthropic Tier 1 (30K input tokens/min) without 429s.

## What's different from main / claude/create-claude-md-R5fhF

- `web_search` capped to `max_uses: 1` (production: default, multiple iterations)
- Brain compile market intel asks for 3 fields (DAILY_PAIN, WINNING_ARGUMENT, MARKET_CONTEXT), not 5 — drops COMMON_OBJECTION and BUYING_SIGNALS from research; synthesis still infers them from intake
- Per-prospect research drops the company search call (only person search runs)
- `callAnthropic` retries once on 429 with 60s backoff, then surfaces "AI quota is busy. Try again in about a minute, or upgrade your Anthropic tier."

## When to delete this branch

After Ahmed upgrades to Anthropic Tier 2 ($5 deposit + 7 days, or $40 paid), this branch can be deleted. The production branch (`claude/create-claude-md-R5fhF`) is already correct.
