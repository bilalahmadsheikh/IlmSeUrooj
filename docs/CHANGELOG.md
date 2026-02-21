# IlmSeUrooj - Complete Development History

All iterations of the IlmSeUrooj (UniMatch) project documented in one place.

---

## Project Timeline

| Iteration | Date | Focus Area |
|-----------|------|------------|
| 1 | 2026-01-12 | Core swipe interface, filters, 15 universities |
| 2 | 2026-01-12 | University list, rankings, deadlines |
| 3 | 2026-01-23 | Theme system, backgrounds, comparison tool |
| 4 | 2026-01-25 | Campus-specific data, 28 universities |
| 5 | 2026-02-19 | Automated CI/CD pipeline, scraper engine, validators |
| 6 | 2026-02-19 | Functional scraper implementations, AST file updates, workflow fixes |
| 7 | 2026-02-20 | Entry tests, scholarships, recommendations, UX enhancements, Supabase |
| 8 | 2026-02-21 | Chrome extension, 3-tier autofill engine, 17 university configs |
| 9 | 2026-02-22 | Apply URL corrections, name splitting, extension detection fixes |

---

## Iteration 1: Homepage with Tinder-Style Swiping
**Date**: 2026-01-12 | **Status**: ✅ Complete

### Overview
Built the core swipe-based university browsing interface with intelligent filtering and ranking.

### Features Implemented

#### Filter System (6 Filters)
| Filter | Purpose | Options |
|--------|---------|---------|
| Field/Category | Main study area | Pre-Engineering, CS, Business, Medical, Others |
| Degree Level | Academic level | Any, Undergraduate, Associate |
| Program | Specific major | Dynamic based on field selection |
| Hostel/Campus | Accommodation | On-Campus with Hostel, without, Hybrid |
| City/Location | Geographic | Islamabad, Lahore, Karachi, Topi, etc. |
| Campus Type | Culture focus | Research-Oriented, Industry-Focused, Strong Campus Life |

#### Swipe Interface
- **Drag Gestures**: Touch/mouse drag left or right
- **Buttons**: Save (💚) and Skip (✕) for click-based interaction
- **Visual Feedback**: Color overlays during swipe
- **Match Percentage**: Calculated based on filter compatibility

#### Smart Ranking Algorithm
Priority-based scoring system:
| Criterion | Points |
|-----------|--------|
| Exact Program Match | 40 pts |
| Field Category Match | 30 pts |
| Campus/Hostel Match | 15 pts |
| City Match | 10 pts |
| Campus Type Match | 5 pts |

#### Initial University Data (15 Universities)
NUST, LUMS, FAST, COMSATS, IBA, UET, GIKI, PIEAS, Habib, AKU, NED, Bahria, Air University, SZABIST, ITU

### Technical Decisions
- **Framework**: Next.js 14+ with App Router for modern React features
- **Styling**: Vanilla CSS with CSS Modules for scoped styles
- **Design**: Glass-morphism effects, mobile-first responsive
- **State**: React hooks (useState) for simplicity

---

## Iteration 2: University List & Admissions Deadlines
**Date**: 2026-01-12 | **Status**: ✅ Complete

### Overview
Added comprehensive university listing with field-specific rankings and real admission deadline data.

### Features Implemented

#### University List Section
- Complete scrollable list below swipe area
- Expandable cards with full details
- Field-specific ranking badges (#1 in Pre-Eng, etc.)
- "View Details" expand/collapse functionality
- Programs, facilities, and fee information

#### Field-Specific Rankings
Different ranking order based on selected field:

**Pre-Engineering Rankings**:
1. NUST → 2. UET → 3. GIKI → 4. PIEAS → 5. NED

**Business Rankings**:
1. LUMS → 2. IBA → 3. NUST → 4. COMSATS → 5. Bahria

**Computer Science Rankings**:
1. FAST → 2. NUST → 3. LUMS → 4. COMSATS → 5. IBA

#### Admission Deadlines
Real 2026 data from official university websites:
- **Countdown Timers**: Days remaining until deadline
- **Urgency Badges**: Red (< 3 days), Orange (< 7 days), Yellow (< 14 days)
- **Apply Now Links**: Direct links to official admission portals
- **Field Filter**: Filter deadlines by field of study
- **Test Information**: Test names and dates

### Data Sources
Official university admission portals:
- NUST: nust.edu.pk, ugadmissions.nust.edu.pk
- LUMS: lums.edu.pk, admissions.lums.edu.pk
- IBA: iba.edu.pk
- FAST: nu.edu.pk
- COMSATS: comsats.edu.pk, admissions.comsats.edu.pk

### Technical Changes
- Added `fieldRankings` object to each university entry
- Added `upcomingDeadlines` array with structured deadline data
- Created `UniversityList` component with expand/collapse
- Created `AdmissionsDeadlines` component with countdown logic

---

## Iteration 3: Theme System & Enhanced Comparison
**Date**: 2026-01-23 | **Status**: ✅ Complete

### Overview
Implemented a comprehensive multi-theme system and completely rebuilt the university comparison tool with department-specific data.

### Features Implemented

#### Multi-Theme System
Three distinct visual themes with seamless switching:

| Theme | Primary Color | Background | Use Case |
|-------|---------------|------------|----------|
| Dark Mode | Forest Green (#2d5a3d) | Deep green (#0a0f0a) | Default, eye-friendly |
| Light Mode | Forest Green (#2d5a3d) | Cream (#f8f5e9) | Bright environments |
| Treasure Map | Brown/Sepia | Parchment textures | Thematic experience |

#### Decorative Background Images
- **Position-based Decorations**: Compass, books, graduation cap
- **Full-page Map Backgrounds**: For treasure theme sections
- **Circular Patterns**: Linked-list style repeating backgrounds
- **Performance**: Lazy loading, optimized images

#### Enhanced University Comparison Tool
Major upgrade with department-specific comparison:

**New Filter Dropdowns**:
- Department Filter: CS, Pre-Engineering, Business, Medical
- Comparison Criteria: 5 modes

**Comparison Criteria Modes**:
| Mode | Metrics Compared |
|------|------------------|
| Overall Performance | Rankings, ratings, placements |
| Industry & Placements | Placement rate, salary, recruiters |
| Career Opportunities | Graduate outcomes, industry partners |
| Research & Faculty | PhD %, research papers, faculty strength |
| Facilities & Resources | Labs, equipment, resources |

**Department-Specific Data (15 Universities)**:
- Department rankings within field
- Faculty strength ratings (1-5)
- Research output metrics
- Placement rates (%)
- Average starting salaries (PKR)
- Top industry recruiters
- Key facilities and labs
- PhD faculty percentage

### Technical Changes

#### New Files Created
| File | Purpose |
|------|---------|
| `src/data/departmentData.js` | Department metrics for all universities |
| `src/components/Background/DecorativeImages.js` | Theme-aware decorations |
| `src/components/Background/DecorativeImages.module.css` | Decoration styling |
| `src/components/Background/SectionBackground.js` | Section backgrounds |
| `src/components/ThemeToggle/ThemeToggle.js` | Theme switch component |
| `src/context/ThemeContext.js` | Theme state management |

#### Modified Files
- `src/app/globals.css`: Added light mode color palette
- `src/components/UniversityComparison/`: Complete rewrite

---

## Iteration 4: Campus-Specific Data & Refinements
**Date**: 2026-01-25 | **Status**: ✅ Complete

### Overview
Split multi-campus universities into individual entries and added campus-specific admission data, expanding from 15 to 28 university entries.

### Features Implemented

#### Campus-Specific University Entries
Universities with multiple campuses now have separate entries:

**FAST-NUCES (5 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| FAST Islamabad | Islamabad | 73% | Most competitive |
| FAST Lahore | Lahore | 70% | Second highest |
| FAST Karachi | Karachi | 69% | Moderate |
| FAST Peshawar | Peshawar | ~53% | Easiest |
| FAST Chiniot | Chiniot | ~54% | New campus |

**COMSATS (7 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| COMSATS Lahore | Lahore | 87.5% | Highest (surprising!) |
| COMSATS Islamabad | Islamabad | 87.1% | Main campus |
| COMSATS Wah | Wah Cantt | ~80% | Near Islamabad |
| COMSATS Abbottabad | Abbottabad | 78.2% | Scenic location |
| COMSATS Sahiwal | Sahiwal | ~68% | Easy admission |
| COMSATS Attock | Attock | ~62% | Easy admission |
| COMSATS Vehari | Vehari | ~58% | Easiest |

**Bahria University (3 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| Bahria Islamabad | Islamabad | >80% | Most competitive |
| Bahria Lahore | Lahore | ~72% | Moderate |
| Bahria Karachi | Karachi | ~68% | Has medical programs |

**UET (2 Campuses)**:
| Campus | City | ME Cutoff | Notes |
|--------|------|-----------|-------|
| UET Lahore | Lahore | 81.65% | Flagship campus |
| UET Taxila | Taxila | ~75% | Near Islamabad |

#### GIKI Merit Position Data
Changed from total seat counts to **closing merit positions**:
- **CS**: Closed at position #326 (2024)
- **ME**: Closed at position #1400+
- **EE**: Closed at position #2000+

This means: The last student admitted to CS was ranked #326 overall.

#### Campus-Specific Admission Predictor
Each campus entry now has individual:
- Merit formula breakdown
- Campus-specific cutoff percentages
- Historical merit data (2023-2024)
- Tailored tips and advice

#### UI Refinements
- **Emoji Removal**: Removed all emojis except 💚 in save buttons
- **Deadline Toggle**: Added Upcoming/Elapsed switch
- **Facility Tags**: Improved visibility and styling

### Technical Changes

#### Modified Files
| File | Change |
|------|--------|
| `src/data/universities.js` | Expanded from 15 to 28 entries |
| `src/components/AdmissionPredictor/AdmissionPredictor.js` | 22 campus-specific criteria entries |
| `src/components/AdmissionsDeadlines/AdmissionsDeadlines.js` | Added toggle feature |
| Multiple components | Emoji removal |

### Data Sources
Campus cutoff data researched from:
- Official university merit lists (2024)
- HEC Pakistan rankings
- Student forums (Reddit r/pakistan, Maqsad.io)
- University admission portals
- YouTube admission result videos

---

## Iteration 5: Automated CI/CD Pipeline & Data Scraper
**Date**: 2026-02-19 | **Status**: ✅ Complete

### Overview
Built a complete automated data update pipeline using GitHub Actions. The system scrapes university websites on a tiered schedule, validates the data, and creates pull requests for review.

### Features Implemented

#### Tiered University Scraper Engine
New `scripts/scrapers/university-scraper.js`:
- **16 scrape configurations** covering all 28 universities
- **Cheerio** for HTML parsing (lightweight, no headless browser)
- Two-tier scraping:

| Tier | Schedule | Data Fields |
|------|----------|-------------|
| Critical | Every 20 days | Deadlines, test dates, test names |
| General | Bimonthly | Fees, websites, descriptions |

- Rate limiting (2-second delay between requests)
- Retry logic (2 retries with exponential backoff)
- Graceful failure (one university failing doesn't block others)
- Regex-based date extraction (`parseFlexibleDate`)
- Fee extraction with currency normalization

#### Pipeline Orchestrator
Rewrote `scripts/fetch-university-data.js`:
1. Accepts `DATA_TIER` environment variable
2. Calls scraper engine
3. Parses current `universities.js`
4. Merges only changed fields
5. Generates `reports/scrape-results.json`
6. Generates `reports/change-report.json`
7. Sets GitHub Actions output variables

#### GitHub Actions Workflow Updates
Updated `.github/workflows/update-university-data.yml`:
- Two-tier cron schedule (`0 2 */20 * *` + `0 2 1 */2 *`)
- Runtime tier detection based on cron trigger day
- Manual dispatch with `critical`/`general`/`all` options
- Tier-labeled PRs with descriptive body and labels
- AI review comments on PRs
- Artifact uploads (reports, updated data)

#### Validation Pipeline
5 validator scripts run on every data change:
| Validator | Purpose |
|-----------|---------|
| `schema-validator.js` | Data type and format checks |
| `compare-data.js` | Diff against baseline snapshot |
| `data-integrity.js` | Cross-field relationship checks |
| `data-target-map.js` | Maps which fields each tier targets |
| `auto-review.js` | AI-style review for PR comments |

### Technical Changes

#### New Files Created
| File | Purpose |
|------|---------|
| `scripts/scrapers/university-scraper.js` | Core scraper engine (345 lines) |
| `docs/WORKFLOWS.md` | CI/CD workflow documentation |
| `docs/SHORTFALLS.md` | Known issues and fixes needed |
| `docs/ENHANCEMENTS.md` | Future improvement roadmap |

#### Modified Files
| File | Change |
|------|--------|
| `scripts/fetch-university-data.js` | Complete rewrite as pipeline orchestrator |
| `.github/workflows/update-university-data.yml` | Two-tier schedule, tier detection, PR labels |
| `package.json` | Added `cheerio` dev dependency |
| `.gitignore` | Added `reports/` directory |
| `README.md` | Added CI/CD section, scripts, full doc links |
| All docs/*.md | Updated for Iteration 5 |

### Data Sources (Scraper)
Per-university configs target official admission pages:
- NUST: `ugadmissions.nust.edu.pk`
- LUMS: `lums.edu.pk/admissions`
- FAST: `admissions.nu.edu.pk`
- COMSATS: `admissions.comsats.edu.pk`
- And 12 more university groups

### Local Testing Results
Dry run with `DATA_TIER=critical`:
- 9/16 university sites fetched successfully
- 7 returned 403/404 (sites block bots or changed URLs)
- Infrastructure works correctly with graceful error handling

---

## Iteration 8: Chrome Extension & Deterministic Autofill Engine
**Date**: 2026-02-21 | **Status**: ✅ Complete

### Overview
Built the full Chrome extension (MV3) with Supabase backend, 3-tier autofill engine, and 17 per-university config files for deterministic form filling across Pakistani university portals.

### Features Implemented

#### Supabase Backend (Phase 1)
- 4 tables: `profiles`, `field_maps`, `applications`, `remembered_answers`
- RLS policies on all student-data tables
- 5 API routes: `profile`, `fieldmap`, `applications`, `remembered-answers`, `sop-draft`

#### Chrome Extension Shell (Phase 2)
- MV3 manifest with 32+ university host permissions
- Service worker with token management + API communication
- Content script with sidebar injection + domain detection
- Popup with auth state management

#### AI Field Mapping (Phase 3)
- Local Ollama integration (llama3 model)
- Field map caching in Supabase
- 8 transform functions (CNIC, dates, marks, phone formatting)
- React/Vue-compatible input filling via native setter

#### Pre-submit Review & Submission Tracking (Phase 4)
- Validator for CNIC format, marks ranges, test data detection
- Green/amber/red review lists with Jump to Field
- Confirmation number extraction + save

#### Manual Fields & SOP Helper (Phase 5)
- Fill Gap modal with remembered answer suggestions
- SOP/Essay AI drafting with Ollama
- Password vault with consistent password system

#### Deterministic Autofill Engine (Phase 8)
- **17 per-university config files** in `extension/universities/`
- Each config: slug, name, portalDomains, fieldMap (multi-selector CSS), selectOptions, transforms
- **3-tier autofill engine**:
  1. Deterministic per-university selectors
  2. AI-generated field maps (Ollama fallback)
  3. Heuristic fallback (name/id/label analysis)
- **Universities mapped**: NUST, FAST, COMSATS, LUMS, IBA, GIKI, PIEAS, NED, Habib, AKU, Air Uni, SZABIST Isb, SZABIST Khi, ITU, Bahria, UET Lahore, UET Taxila

### Technical Changes

#### New Files Created
| File | Purpose |
|------|---------|
| `extension/manifest.json` | Chrome MV3 manifest |
| `extension/content/content.js` | Sidebar + 3-tier autofill engine |
| `extension/background/service-worker.js` | API communication, token mgmt |
| `extension/popup/popup.html + popup.js` | Auth popup |
| `extension/styles/sidebar.css` | Sidebar styling |
| `extension/universities/index.js` | Central university config registry |
| `extension/universities/*.js` (17 files) | Per-university configs |
| `src/app/api/*/route.ts` (5 files) | Supabase API routes |
| `src/app/extension/page.js` | Extension landing page |

---

## Iteration 9: Apply URL Corrections & Autofill Intelligence Fixes
**Date**: 2026-02-22 | **Status**: ✅ Complete

### Overview
Corrected all university application form URLs, fixed extension sidebar detection for multiple portals, and improved autofill intelligence with name splitting, field exclusion, and extension context handling.

### Features Implemented

#### Corrected Application Form URLs
Updated `src/data/universities.js` (both university cards and upcoming deadlines) with verified portal links:

| University | New Apply URL |
|---|---|
| FAST (all 5 campuses) | `https://admissions.nu.edu.pk` |
| COMSATS (all 7 campuses) | `https://admissions.comsats.edu.pk` |
| IBA | `https://onlineadmission.iba.edu.pk` |
| UET Lahore | `https://admission.uet.edu.pk/Modules/EntryTest/Default.aspx` |
| UET Taxila | `https://admissions.uettaxila.edu.pk` |
| NED | `https://www.neduet.edu.pk/admission` |
| Air University | `https://portals.au.edu.pk/admissions` |
| Bahria (all 3 campuses) | `https://cms.bahria.edu.pk/Logins/candidate/Login.aspx` |
| Habib | `https://eapplication.habib.edu.pk/login.aspx` |
| SZABIST | `https://admissions.szabist.edu.pk` |
| AKU | `https://akuross.aku.edu/...` |

#### Extension Sidebar Detection Fixes
- Added 20+ missing portal subdomains to `UNIVERSITY_DOMAINS` in `content.js`
- Extension now activates on: `portals.au.edu.pk`, `cms.bahria.edu.pk`, `eapplication.habib.edu.pk`, `onlineadmission.iba.edu.pk`, `admissions.uettaxila.edu.pk`, etc.

#### Name Splitting Transforms
- Added `first_name`, `last_name`, `middle_name` virtual profile keys
- "Bilal Ahmad" → First: "Bilal", Last: "Ahmad", Middle: "" (for 2-word names)
- Forms with First/Middle/Last fields now get the correct portion

#### Field Exclusion List
- Captcha, login, verification, OTP, CSRF fields excluded from heuristic autofill
- Prevents CNIC from being written into CAPTCHA inputs

#### Extension Context Guard
- `isExtensionValid()` check before Chrome API calls
- "Please Refresh" UI when extension context is invalidated

#### Skip Tier 2 for Known Universities
- Only call Ollama AI mapping for unknown universities
- Login pages of known universities skip to Tier 3 heuristics

### Technical Changes
| File | Change |
|------|--------|
| `src/data/universities.js` | Corrected 30+ applyUrl entries |
| `extension/content/content.js` | Name splitting, exclusions, context guard, 20+ domains |
| `extension/universities/index.js` | Added portal subdomains for Air Uni, Bahria, IBA, UET, FAST |
| `docs/DATA-SOURCES.md` | Added Application Form Link column |
| `docs/agent/PROGRESS.md` | Added Phase 9 |
| `docs/agent/DECISIONS.md` | Added Decisions 11-13 |

---

## Current Project Stats

| Metric | Value |
|--------|-------|
| Total Universities | 28 (campus-specific) |
| Single Campus Unis | 11 |
| Multi-Campus Unis | 4 (17 campuses total) |
| Major Components | 19 |
| Theme Modes | 3 |
| Admission Criteria Entries | 22 |
| Data Files | 4 (universities, departments, entry tests, scholarships) |
| Data Points per Uni | 15+ |
| GitHub Actions Workflows | 6 |
| Validation Scripts | 6 |
| Scraper Configs | 16 |
| Extension University Configs | 17 |
| Lines of Code | ~20,000+ |

---

## Future Roadmap (Planned)

- [ ] AI-powered university recommender
- [ ] Individual university pages (SEO)
- [ ] Urdu language support
- [ ] PWA with offline mode & push notifications
- [x] ~~User accounts and saved preferences~~ (Implemented via Supabase in Iteration 8)
- [x] ~~Scholarship information database~~ (Implemented in Iteration 7)
- [ ] More universities (medical colleges, smaller unis)
- [ ] Interactive university map
- [x] ~~Application checklist generator~~ (Pre-submit review in Iteration 8)
- [ ] University reviews from students
- [ ] Extension auto-update when university portals change

