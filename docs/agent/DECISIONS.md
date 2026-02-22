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

## Decision 11: Name Splitting via Virtual Profile Keys
**Date:** Feb 22, 2026 | **Phase:** 9
**Choice:** Add `first_name`, `last_name`, `middle_name` as virtual profile keys derived from `full_name` using transforms.
**Rationale:** Many university forms (SZABIST, LUMS) ask for first/middle/last name separately. Storing these as separate profile fields would mean students fill 4 name fields. Instead, we store one `full_name` and split on-the-fly: first word → first name, last word → last name, middle words → middle name.

## Decision 12: Extension Context Guard with Refresh UI
**Date:** Feb 22, 2026 | **Phase:** 9
**Choice:** Check `chrome.runtime.id` before every Chrome API call and show a "Refresh Page" UI when the extension context is invalidated.
**Rationale:** When the extension is reloaded in chrome://extensions, old content scripts lose their connection. Instead of showing cryptic errors, we show a friendly one-click refresh button.

## Decision 13: Skip Tier 2 AI for Known Universities
**Date:** Feb 22, 2026 | **Phase:** 9
**Choice:** Only invoke Tier 2 (Ollama AI field mapping) when no university config exists. If Tier 1 has a config but matched 0 fields, skip directly to Tier 3 heuristics.
**Rationale:** On login pages of known universities (e.g., Bahria CMS), Tier 1 finds the config but no application form fields. Calling Ollama here fails (if not running) and is wasteful. Heuristic matching (Tier 3) handles login forms well enough.

## Decision 14: Per-University JS Files Instead of Single Config Object
**Date:** Feb 22, 2026 | **Phase:** 6
**Choice:** Each university has its own JS file in `extension/universities/` rather than one monolith config.
**Rejected:** Single `university-configs.json` file.
**Reason:** Each university's portal is different enough to warrant separate files. This makes it easy to add/remove universities, test individually, and assign ownership. The index.js file re-exports all configs with domain-based lookup.

## Decision 15: IBCC Equivalence as Separate Field (Not Calculated)
**Date:** Feb 22, 2026 | **Phase:** 10
**Choice:** Store `ibcc_equivalent_inter` and `ibcc_equivalent_matric` as explicit numeric fields rather than calculating from A-Level/O-Level grades.
**Rejected:** Auto-calculation from subject grades using IBCC formula.
**Reason:** IBCC equivalence is a formal certificate issued by ibcc.edu.pk with specific marks. The conversion formula varies by year and exam board. Students know their exact IBCC marks from the certificate — storing it directly is more accurate than calculating.

## Decision 16: Five inter_status Values
**Date:** Feb 22, 2026 | **Phase:** 10
**Choice:** `inter_status` has 5 values: not_started, part1_only, appearing, result_awaited, complete.
**Rejected:** Simple boolean `results_available`.
**Reason:** Each status triggers different behavior: `not_started` shows warning, `part1_only` uses projected marks (Part-I × 2), `appearing` also uses projection, `result_awaited` keeps projection, `complete` uses actual marks. These aren't collapsible.

## Decision 17: Store Projected Marks in DB
**Date:** Feb 22, 2026 | **Phase:** 10
**Choice:** Store `fsc_projected_marks` and `fsc_projected_percentage` in the profiles table rather than calculating on-the-fly.
**Rejected:** Calculate Part-I × 2 each time.
**Reason:** The student may want to manually adjust their projected marks (e.g., they know they'll improve). Storing allows manual override. Auto-calculation (Part-I × 2) is the default but overridable.

## Decision 18: portal_email and portal_password on profiles (not per-application)
**Date:** Feb 22, 2026 | **Phase:** 10
**Choice:** Store one `portal_email` and `portal_password` on the profiles table, not per application.
**Rejected:** Separate credentials per `applications` row.
**Reason:** Students want ONE consistent login across all portals. The extension fills the same email/password everywhere. If a portal requires a different password, the applications table has its own `portal_password` column as override.

## Decision 19: useProfile() Reads Supabase Directly
**Date:** Feb 22, 2026 | **Phase:** 10
**Choice:** `useProfile()` hook calls Supabase JS client directly, not `/api/profile`.
**Rejected:** Fetch from API route.
**Reason:** Profile data is read-heavy and auth-scoped. Supabase JS client handles RLS automatically, so there's no security benefit from going through an API route. Direct reads are faster (no server round-trip) and simpler.

## Decision 20: Supabase Real-Time for Applications Page
**Date:** Feb 22, 2026 | **Phase:** 11
**Choice:** Use Supabase real-time subscriptions on the applications kanban page instead of polling.
**Rejected:** Polling every N seconds, or manual refresh.
**Reason:** The extension creates/updates application rows from any tab. Real-time subscriptions ensure the kanban board stays in sync instantly when the extension autofills a form or records a submission on another tab.

