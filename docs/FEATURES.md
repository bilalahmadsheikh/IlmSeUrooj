# UniMatch — Feature Inventory
Last updated: 2026-02-22

---

## 1. Swipe-Based University Discovery
**Status:** ✅ Working
**What it does:** Students discover universities by swiping right (save) or left (skip), similar to Tinder-style card browsing.
**How it works:** `SwipeCard` component renders cards from `rankUniversities()` in `src/utils/ranking.js`. Touch/mouse drag + keyboard arrows supported. Cards stack with peek-ahead.
**Education system aware:** No — shows all universities regardless of system.
**Connected to:** Filter system, Saved list (swipe right adds to saved), ranking utility.

---

## 2. Smart Filter System
**Status:** ✅ Working
**What it does:** Filters universities by field of study, degree level, program, hostel availability, city, and campus type.
**How it works:** `FilterSection` component in `src/components/FilterSection/`. Applies filters to `universities.js` data before ranking.
**Education system aware:** No.
**Connected to:** University list, Swipe cards, Recommendations.

---

## 3. Saved Universities List
**Status:** ✅ Working
**What it does:** Persistent shortlist with tagging, notes, reordering, drag-and-drop, and bulk comparison.
**How it works:** `SavedList` component. Data stored in localStorage via `src/utils/savedStorage.js`. Supports tags (Reach/Match/Safety), notes, drag reorder, and compare selection.
**Education system aware:** No.
**Connected to:** Swipe cards (swipe right saves), Similar universities, Comparison tool.

---

## 4. Admission Chance Predictor
**Status:** ✅ Working
**What it does:** Calculates a student's merit aggregate per university using official merit formulas, comparing against historical cutoffs.
**How it works:** `AdmissionPredictor` component. Inputs: FSc %, Matric %, test score. Uses per-university weight formulas. Shows Good/Moderate/Low chance.
**Education system aware:** Yes — accepts IBCC equivalent % for Cambridge students; handles projected marks for Part-I only students.
**Connected to:** `useProfile()` hook (can pull marks from profile), entry test data.

---

## 5. University Comparison Tool
**Status:** ✅ Working
**What it does:** Side-by-side comparison of up to 4 universities across all metrics.
**How it works:** `UniversityComparison` component. Uses `SearchableSelect` for university picker. Compares fees, ranking, programs, facilities, etc.
**Education system aware:** No.
**Connected to:** Saved list (can compare from saved items).

---

## 6. Admissions Deadlines Tracker
**Status:** ✅ Working
**What it does:** Shows upcoming application deadlines grouped by field and month with countdown timers.
**How it works:** `AdmissionsDeadlines` component. Reads deadline data from `universities.js`. Filters by current field selection.
**Education system aware:** No.
**Connected to:** Filter system (field selection), university data.

---

## 7. Entry Tests Info
**Status:** ✅ Working
**What it does:** Displays NET, ECAT, SAT, MDCAT info with university applicability, registration dates, fees, and historical cutoff percentages.
**How it works:** `EntryTests` component. Data from `src/data/entryTestsData.js`. Grouped by test type with expandable details.
**Education system aware:** No — shows all tests applicable to the student's field.
**Connected to:** University data (which unis require which tests).

---

## 8. Scholarships Panel
**Status:** ✅ Working
**What it does:** Lists need-based and merit-based scholarships with eligibility criteria, amounts, and application links.
**How it works:** `ScholarshipsPanel` component. Data from `src/data/scholarships.js`. Filterable by type.
**Education system aware:** No.
**Connected to:** Header button trigger.

---

## 9. Recommendations Section
**Status:** ✅ Working
**What it does:** Shows personalized university suggestions based on active filters, sorted by match score.
**How it works:** `RecommendationsSection` component. Uses ranking algorithm from `src/utils/ranking.js`.
**Education system aware:** No.
**Connected to:** Filter system, university data, ranking utility.

---

## 10. Similar Universities
**Status:** ✅ Working
**What it does:** Based on saved universities, suggests similar ones the student hasn't saved yet.
**How it works:** `SimilarUniversities` component. Compares field, city, type, and ranking proximity of saved unis to find similar.
**Education system aware:** No.
**Connected to:** Saved list, university data.

---

## 11. Theme System
**Status:** ✅ Working
**What it does:** Dark/light mode toggle with persistent preference via localStorage. Applies across all pages.
**How it works:** `ThemeToggle` component + `ThemeContext` provider in `src/context/ThemeContext.js`. CSS variables switch automatically.
**Education system aware:** N/A.
**Connected to:** All components via CSS variables.

---

## 12. Profile Page
**Status:** ✅ Working
**What it does:** Comprehensive student profile with 9 sections: personal info, education system, intermediate details, matric/O-Level, A-Level subjects, entry test scores, family info, portal credentials, preferences. Debounced auto-save.
**How it works:** `src/app/profile/page.js`. Reads/writes Supabase `profiles` table. Conditional rendering based on `education_system` (Pakistani/Cambridge) and `inter_status`. Auto-calculates percentages and profile completion.
**Education system aware:** Yes — toggles between FSc/Matric fields and A-Level/O-Level/IBCC fields based on `education_system`. Shows projected marks controls when `inter_status` is `part1_only` or `appearing`.
**Connected to:** `useProfile()` hook, Supabase auth, Header ProfileRing.

---

## 13. Profile Completion Ring
**Status:** ✅ Working
**What it does:** SVG circle in the header showing profile completion percentage with optional amber warning dot for IBCC/projected issues.
**How it works:** `ProfileRing` component in `src/components/Header/ProfileRing.js`. Reads `profile_completion` from Supabase.
**Education system aware:** Yes — amber warning dot appears if Cambridge student has no IBCC equivalence, or if marks are projected.
**Connected to:** Header, profile data.

---

## 14. Floating Action Panel
**Status:** ✅ Working
**What it does:** Fixed bottom-right FAB button that expands to show quick links: Applications (with unseen badge), Profile (with completion %), Extension (with install status).
**How it works:** `FloatingPanel` component in `src/components/FloatingPanel/`. Hidden on `/profile`, `/applications`, `/extension` paths. Detects extension via DOM marker.
**Education system aware:** No.
**Connected to:** Supabase auth, profile data, extension detection.

---

## 15. Personalized Homepage Hero
**Status:** ⚠️ Partial
**What it does:** Social proof line for non-logged-in users ("Used by students applying to NUST, LUMS, FAST...").
**How it works:** Conditional rendering in `src/app/page.js` using `useProfile()` hook. Dashboard strip was removed; social proof line remains.
**Education system aware:** No.
**Connected to:** `useProfile()` hook.

---

## 16. Application Dashboard (Kanban)
**Status:** ✅ Working
**What it does:** Kanban board with 4 columns (Saved → Applying → Submitted → Decision). Slide-in detail panel with notes, confirmation number, portal links, and status actions (Mark Accepted/Rejected).
**How it works:** `src/app/applications/page.js`. Reads/writes Supabase `applications` table with real-time subscription for live updates.
**Education system aware:** No.
**Connected to:** Supabase real-time, extension (creates application records on autofill).

---

## 17. Header with Auth State
**Status:** ✅ Working
**What it does:** Two modes: guests see Sign In + Create Profile buttons; logged-in users see ProfileRing + initials avatar with dropdown menu (Profile, Applications, Extension, Sign Out).
**How it works:** `src/components/Header/Header.js`. Checks Supabase auth session. Dropdown with amber IBCC/projected warnings.
**Education system aware:** Yes — shows warnings for IBCC missing or projected marks in the ProfileRing tooltip.
**Connected to:** Supabase auth, profile data, ProfileRing.

---

## 18. Per-University Autofill (3-Tier)
**Status:** ✅ Working (selectors pending live verification)
**What it does:** Fills university application forms using student profile data. 3-tier system: Tier 1 (deterministic CSS selectors from per-university configs), Tier 2 (AI field mapping via Ollama), Tier 3 (heuristic label/name/id pattern matching).
**How it works:** `extension/content/content.js` orchestrates all 3 tiers. 17 per-university configs in `extension/universities/`. Each config has a `fieldMap` mapping profile keys to CSS selectors, plus `selectOptions` for dropdowns and `transforms` for formatting.
**Education system aware:** Yes — uses `getInterMarks()`, `getInterPercentage()`, `getMatricPercentage()` helpers from `extension/universities/index.js` to pick correct marks based on education system and inter status.
**Connected to:** Profile data (via background script), Supabase field_maps table, sidebar UI.

---

## 19. Academic Status Aware Filling
**Status:** ✅ Working
**What it does:** Handles all 5 inter_status values: not_started, part1_only, appearing, result_awaited, complete. Uses projected marks (Part-I × 2) or IBCC equivalence % as appropriate.
**How it works:** Helper functions in `extension/universities/index.js`: `getInterMarks()`, `getInterTotal()`, `getInterPercentage()`, `getMatricPercentage()`.
**Education system aware:** Yes — core function. Pakistani: fsc_marks/fsc_projected. Cambridge: ibcc_equivalent_inter.
**Connected to:** Autofill engine, sidebar ready state, profile page.

---

## 20. Extension Sidebar (7+ States)
**Status:** ✅ Working
**What it does:** Floating sidebar on university portals showing current state: unknown_portal, not_logged_in, warning_ibcc, warning_no_marks, loading, ready (with fill preview), filled (with stats), review (pre-submit check), submitted (with confirmation capture).
**How it works:** `extension/content/content.js` `renderState()` function. `extension/styles/sidebar.css` with DM Mono font.
**Education system aware:** Yes — ready state shows education-system-aware fill preview (FSc vs IBCC) with amber warnings for projected marks.
**Connected to:** Autofill engine, auth state, profile data.

---

## 21. Extension Popup
**Status:** ✅ Working
**What it does:** Shows ProfileRing SVG, detects current portal and offers autofill trigger, lists recent applications with color-coded status badges, provides Dashboard/Profile/Sign Out links.
**How it works:** `extension/popup/popup.html` + `extension/popup/popup.js`. Communicates with background script for auth and application data.
**Education system aware:** No — shows profile completion % without system-specific details.
**Connected to:** Background script, Supabase applications, active tab detection.

---

## 22. Password Vault
**Status:** ✅ Working
**What it does:** Generates one strong password (14+ chars) and reuses it across all university portals.
**How it works:** Generated in `extension/background/service-worker.js`, stored in `chrome.storage.local`. Auto-filled when portal has a password field.
**Education system aware:** No.
**Connected to:** Autofill engine, profile page portal credentials section.

---

## 23. Pre-Submit Validator
**Status:** ✅ Working
**What it does:** Scans the filled form for empty required fields, format mismatches, and inconsistencies. Shows green (verified), amber (needs input), and red (error) lists.
**How it works:** `handlePreSubmitCheck()` in `extension/content/content.js`. Checks required attributes, empty values, pattern validation.
**Education system aware:** No — validates form fields generically.
**Connected to:** Sidebar review state, autofill results.

---

## 24. Submission Detection + Confirmation Capture
**Status:** ✅ Working
**What it does:** Detects when a form is submitted on a university portal, captures confirmation numbers, and saves them to the applications table.
**How it works:** Listens for form submit events and success page patterns in `extension/content/content.js`. Saves via background script to Supabase.
**Education system aware:** No.
**Connected to:** Applications table, sidebar submitted state, popup app list.

---

## 25. Answer Memory
**Status:** ✅ Working
**What it does:** Remembers answers to university-specific questions (e.g., "How did you hear about us?") and reuses them on other portals with similar questions.
**How it works:** Stored in Supabase `remembered_answers` table by field_label/field_value. API route: `src/app/api/remembered-answers/route.ts`.
**Education system aware:** No.
**Connected to:** Autofill engine (Tier 3 heuristic), Supabase.

---

## 26. SOP/Essay AI Draft Helper
**Status:** ✅ Working (requires local Ollama)
**What it does:** Generates a draft statement of purpose when the student encounters a text area on a form. Requires at least 20 characters of manual edits before insertion.
**How it works:** API route `src/app/api/sop-draft/route.ts` calls local Ollama. Extension shows "Draft SOP" button on detected essay fields.
**Education system aware:** No.
**Connected to:** Ollama, sidebar fill-gap buttons.

---

## 27. Page Type Detection
**Status:** ✅ Working
**What it does:** Identifies whether the current page is a login, registration, application form, payment, or other page type. Shows contextual smart suggestions.
**How it works:** `detectPageType()` in `extension/content/content.js`. Analyzes URL patterns, page title, heading text, and form structure.
**Education system aware:** No.
**Connected to:** Sidebar ready state (shows different suggestions per page type).

---

## 28. Auth Flow (Website ↔ Extension)
**Status:** ✅ Working
**What it does:** Transfers Supabase auth token from website to extension. Student signs in on the website; extension receives and stores the session token.
**How it works:** `extension-auth` page on website sends token to extension via `chrome.runtime.sendMessage()` using `externally_connectable`. Background script stores session in `chrome.storage.local`.
**Education system aware:** No.
**Connected to:** All extension features (require auth), Supabase session.

---

## 29. University Data Scrapers
**Status:** ✅ Working
**What it does:** Automated scrapers for university data (programs, fees, deadlines, merit lists). Runs via GitHub Actions on schedule.
**How it works:** Node.js scripts in `scripts/scrapers/` using Puppeteer and Cheerio. `scripts/test-scrapers.js` for validation. GitHub Actions workflow for automated runs.
**Education system aware:** No.
**Connected to:** `src/data/universities.js`, deadlines, merit data.

---

## 30. Merit Scraper
**Status:** ✅ Working
**What it does:** Scrapes historical merit/cutoff data for university programs.
**How it works:** `scripts/generate-merit-report.js` + per-university scrapers. Outputs data used by Admission Predictor.
**Education system aware:** No.
**Connected to:** Admission Predictor, university data.

---

## 31. Deadline Verifier
**Status:** ✅ Working
**What it does:** Validates scraped deadline data against university websites to detect outdated information.
**How it works:** Scripts in `scripts/validators/`. Checks URL health and date freshness.
**Education system aware:** No.
**Connected to:** Admissions Deadlines component.

---

## 32. URL Health Check
**Status:** ✅ Working
**What it does:** Checks if university portal URLs are still reachable and returning expected pages.
**How it works:** Validators in `scripts/validators/`. HTTP HEAD/GET requests with status code checking.
**Education system aware:** No.
**Connected to:** University status tracking, extension configs.
