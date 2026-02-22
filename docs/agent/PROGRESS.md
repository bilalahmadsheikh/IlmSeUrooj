# UniMatch — Build Progress
Last updated: 2026-02-22
Built with: Google Antigravity + Claude Opus 4.6

## Current Stage
Core system complete — website features fully functional, extension autofill engine built with 17 university configs. All selector configs are mapped but marked `verified: false` pending active admissions cycle for live testing.

## Phase Completion
- [x] Phase 1 — Supabase tables + RLS + Storage bucket
- [x] Phase 2 — Chrome extension shell (MV3, content script, sidebar, popup)
- [x] Phase 3 — AI field mapping engine (3-tier: deterministic → Ollama → heuristic)
- [x] Phase 4 — Pre-submit review + submission tracking
- [x] Phase 5 — Manual fields + SOP helper + answer memory
- [x] Phase 6 — All universities + polish (17 universities)
- [x] Phase 7 — Password vault + context guard + skip Tier 2 for known unis
- [x] Phase 8 — Data scrapers + validators + GitHub Actions CI/CD
- [x] Phase 9 — University config fixes + name splitting + extension context guard
- [x] Phase 10 — Profile schema expansion (78 columns) + profile page rebuild (9 sections)
- [x] Phase 11 — UI improvements (Header, FloatingPanel, Extension page, Applications kanban, Sidebar states, Popup redesign)
- [x] Phase 12 — Full documentation rewrite (7 files)

## What Is Fully Working

### Website
- Swipe-based university discovery with touch/keyboard/mouse
- Smart filter system (6 dimensions)
- Saved universities list with tags, notes, reorder, compare
- Admission chance predictor with merit formulas
- University comparison tool (up to 4)
- Admissions deadlines tracker
- Entry tests info with cutoffs
- Scholarships panel
- Recommendations + Similar universities
- Dark/light theme system
- Profile page with 9 sections (Pakistani + Cambridge systems)
- Profile completion ring in header
- Auth-aware header with dropdown
- Floating action panel (FAB)
- Application dashboard with kanban board + real-time
- Extension landing page

### Chrome Extension
- 3-tier autofill engine (deterministic → AI → heuristic)
- 17 university configs with CSS selectors
- Education-system-aware mark filling
- 7+ sidebar states with warnings
- Popup with ProfileRing + portal detection
- Password vault
- Pre-submit validator
- Submission detection + confirmation capture
- Answer memory
- SOP/essay AI draft helper
- Page type detection
- Auth token handoff (website → extension)

### Data Pipeline
- Scrapers for university data
- Merit report generator
- Deadline verifier
- URL health checks
- GitHub Actions automated runs

## What Is Partial
- **University selector verification** — all 17 configs have CSS selectors but are marked `verified: false`. Verification requires active admissions season.
- **Personalized homepage** — social proof line works, dashboard strip was removed (too cluttered).

## What Is Not Built
- Mobile app (no plans — the extension is Chrome-specific by design)
- University comparison API (comparison is client-side only)
- Push notifications for deadline reminders

## University Autofill Status

| # | University | File | Selectors Mapped | verified | Notes |
|---|-----------|------|-----------------|----------|-------|
| 1 | NUST | nust.js + index.js | ✅ | false | Portal returns 403, login-first |
| 2 | FAST-NUCES | fast.js + index.js | ✅ | false | — |
| 3 | COMSATS | comsats.js + index.js | ✅ | false | — |
| 4 | LUMS | lums.js + index.js | ✅ | false | — |
| 5 | IBA Karachi | iba.js + index.js | ✅ | false | — |
| 6 | GIKI | giki.js + index.js | ✅ | false | — |
| 7 | NED | ned.js + index.js | ✅ | false | — |
| 8 | PIEAS | pieas.js + index.js | ✅ | false | — |
| 9 | Habib | habib.js + index.js | ✅ | false | — |
| 10 | Aga Khan | aku.js + index.js | ✅ | false | — |
| 11 | SZABIST Karachi | szabist-khi.js + index.js | ✅ | false | — |
| 12 | SZABIST Islamabad | szabist-isb.js + index.js | ✅ | false | — |
| 13 | Air University | airuni.js + index.js | ✅ | false | — |
| 14 | ITU Lahore | itu.js + index.js | ✅ | false | — |
| 15 | Bahria | bahria.js + index.js | ✅ | false | — |
| 16 | UET Lahore | uet-lahore.js + index.js | ✅ | false | — |
| 17 | UET Taxila | uet-taxila.js + index.js | ✅ | false | — |

## Database Tables

| Table | Exists | RLS Enabled | Column Count |
|-------|--------|-------------|-------------|
| profiles | ✅ | ✅ | 78 |
| applications | ✅ | ✅ | 16 |
| field_maps | ✅ | ❌ (shared) | 7 |
| remembered_answers | ✅ | ✅ | 5 |

## Profile Fields Supported

**Pakistani system:**
fsc_marks, fsc_total, fsc_percentage, fsc_stream, fsc_year, fsc_board, fsc_roll_no, fsc_school, fsc_part1_marks, fsc_part1_total, fsc_part1_percentage, fsc_projected_marks, fsc_projected_percentage, matric_marks, matric_total, matric_percentage, matric_year, matric_board, matric_roll_no, matric_school, board_name, passing_year, school_name

**Cambridge system:**
alevel_board, alevel_subjects (JSONB), alevel_predicted, olevel_board, olevel_subjects (JSONB), ibcc_equivalent_inter, ibcc_equivalent_matric, ibcc_certificate_url

**Entry tests:**
net_score, net_year, sat_score, sat_subject_score, ecat_score, mdcat_score, nmdcat_score, lcat_score, gat_score

**Academic status values:**
not_started | part1_only | appearing | result_awaited | complete

## Next Actions (in priority order)
1. Verify extension selectors on live portals during next admissions cycle
2. Deploy website to Vercel for production testing
3. Publish extension to Chrome Web Store
