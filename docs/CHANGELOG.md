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

## Current Project Stats

| Metric | Value |
|--------|-------|
| Total Universities | 28 (campus-specific) |
| Single Campus Unis | 11 |
| Multi-Campus Unis | 4 (17 campuses total) |
| Major Components | 12 |
| Theme Modes | 3 |
| Admission Criteria Entries | 22 |
| Data Points per Uni | 15+ |
| GitHub Actions Workflows | 4 |
| Validation Scripts | 5 |
| Scraper Configs | 16 |
| Lines of Code | ~10,000+ |

---

## Iteration 6: Deadline Verification & Auto-Updates
**Date**: 2026-02-19 | **Status**: ✅ Complete

### Overview
Implemented a robust "set and forget" system for admission deadlines. The new system automatically verifies dates against official websites, sorts them by urgency, and commits updates directly to the repository without manual intervention.

### Features Implemented

#### Automated Deadline Verification
- **Standalone Scraper**: Dedicated script just for deadlines (every 20 days)
- **Auto-Commit**: Workflow pushes changes directly if validated (no PR bottleneck)
- **Fallback Protection**: Keeps existing verified data if university sites are down
- **Session Intelligence**: Distinguishes "Spring" vs "Fall" dates to prevent overwriting

#### Sorting & display
- **Sorted Data**: `universities.js` is now physically sorted by closest deadline
- **UI Sorting**: `AdmissionsDeadlines` component explicitly sorts by closest date
- **Urgency Logic**: Upcoming deadlines shown first, elapsed shown last

### Technical Changes
- **New Workflow**: `.github/workflows/deadline-verification.yml`
- **New Script**: `scripts/scrapers/deadline-scraper.js`
- **Updated Data**: `src/data/universities.js` (added `lastVerified` + sorted)

---

## Future Roadmap (Planned)

- [ ] AI-powered university recommender
- [ ] Individual university pages (SEO)
- [ ] Urdu language support
- [ ] PWA with offline mode & push notifications
- [ ] User accounts and saved preferences
- [ ] Scholarship information database
- [ ] More universities (medical colleges, smaller unis)
- [ ] Interactive university map
- [ ] Application checklist generator
- [ ] University reviews from students

