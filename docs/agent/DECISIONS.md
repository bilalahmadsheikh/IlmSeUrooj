# UniMatch — Technical Decisions Log

## Decision 1: Direct Supabase Client (No ORM)
**Date:** Feb 21, 2026 | **Phase:** 1
**Choice:** Use `@supabase/supabase-js` directly, no Prisma/Drizzle.
**Rationale:** Supabase client handles RLS, auth, and real-time natively. An ORM would add unnecessary abstraction for a student profile app.

## Decision 2: RLS with auth.uid() = id
**Date:** Feb 21, 2026 | **Phase:** 1
**Choice:** Profiles table uses auth user UUID as the primary key (`id = auth.uid()`).
**Rationale:** Direct 1:1 mapping between auth users and profiles. No separate user_id column needed.

## Decision 3: Content Script on <all_urls>
**Date:** Feb 21, 2026 | **Phase:** 2
**Choice:** Content script matches all URLs, with domain check in JS.
**Rationale:** Chrome MV3 host_permissions don't control content script injection as expected. JS-side check is more reliable and allows graceful degradation.

## Decision 4: React-Compatible Input Filling
**Date:** Feb 21, 2026 | **Phase:** 3
**Choice:** Use `Object.getOwnPropertyDescriptor` to get native setter, then dispatch input/change/blur events.
**Rationale:** React/Vue intercept `.value =` assignments. Native setter + event dispatch is the only reliable way to trigger their state updates.

## Decision 5: Field Map Caching in Supabase
**Date:** Feb 21, 2026 | **Phase:** 3
**Choice:** Cache AI-generated field maps in `field_maps` table by domain.
**Rationale:** Avoid calling Ollama on every page load. Domain-based caching works because portal forms rarely change structure.

## Decision 6: Local Ollama Instead of Anthropic API
**Date:** Feb 21, 2026 | **Phase:** 5-7
**Choice:** Use local Ollama with llama3 model instead of Anthropic Claude API.
**Rationale:** No API keys needed, no cost, runs entirely on user's machine. Llama3 is sufficient for field mapping (JSON extraction) and SOP drafting.

## Decision 7: 20-Character Edit Requirement for SOP
**Date:** Feb 21, 2026 | **Phase:** 5
**Choice:** Require at least 20 character edits before allowing AI-drafted SOP insertion.
**Rationale:** Prevents students from submitting pure AI-generated essays. Forces personalization.

## Decision 8: Consistent Password Across Portals
**Date:** Feb 21, 2026 | **Phase:** 7
**Choice:** Generate ONE strong password, store in chrome.storage, reuse across all university portals.
**Rationale:** Students apply to 5-15+ universities. Having one memorable, strong password (14+ chars, uppercase, lowercase, number, special char) is more practical than unique passwords per portal. Stored locally in extension, not in Supabase.

## Decision 9: Heuristic Field Detection as Fallback
**Date:** Feb 21, 2026 | **Phase:** 7
**Choice:** Use heuristic pattern matching (name/id/label/type analysis) as a fallback after AI field mapping.
**Rationale:** AI mapping requires sending form HTML to the backend and waiting for Ollama. Heuristics catch common fields (email, phone, CNIC, name) instantly without any API call. AI mapping then handles university-specific fields.

## Decision 10: Page Type Detection for Smart Suggestions
**Date:** Feb 21, 2026 | **Phase:** 7
**Choice:** Detect login/register/application pages using URL, title, heading, and form structure analysis.
**Rationale:** University portals often have separate login and registration pages. Showing "Register first" on login pages saves students from confusion.
