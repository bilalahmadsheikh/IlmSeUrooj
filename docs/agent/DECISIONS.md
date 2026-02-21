# Technical Decisions Log
# Updated by agent when significant technical choices are made.

## Decision 1: Google Antigravity + Claude Opus 4.6
**Date:** Project start
**Choice:** Google Antigravity IDE with Claude Opus 4.6 as the agent model
**Reasoning:** Antigravity's agent-first architecture with browser access, terminal access,
and MCP integration makes it ideal for autonomous multi-phase builds. Opus 4.6
provides the reasoning capability needed for complex, multi-file tasks.

## Decision 2: Chrome Extension over Bot Automation
**Date:** Project start  
**Choice:** Chrome MV3 Browser Extension  
**Rejected:** Puppeteer/Playwright server-side bots  
**Reasoning:** Student's real browser = no CAPTCHA, no bot detection, zero server cost.
Human review is built-in (they see the live form). Legally clean — student submits themselves.

## Decision 3: Claude Haiku for Field Mapping
**Date:** Project start  
**Choice:** Claude Haiku (cheapest Anthropic model)  
**Rejected:** Opus/Sonnet for field mapping  
**Reasoning:** Field mapping is simple structured extraction. Haiku handles it perfectly
at ~$0.01 per university. Results are cached forever after first run.

## Decision 4: Supabase for Everything
**Date:** Project start  
**Choice:** Supabase (Auth + PostgreSQL + Storage + RLS)  
**Rejected:** Custom JWT + separate DB + AWS S3  
**Reasoning:** One platform, one API key, built-in RLS for security, free tier
sufficient for launch. The MCP integration makes it easily accessible from Antigravity.

---
*Add new decisions as the project evolves.*
