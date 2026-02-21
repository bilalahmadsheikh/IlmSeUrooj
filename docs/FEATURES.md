# IlmSeUrooj - Features Guide

A comprehensive guide to all features of the IlmSeUrooj platform, explaining what each feature does, why it's useful for students, and where it's implemented in the codebase.

---

## Table of Contents
1. [Swipe-Based University Discovery](#1-swipe-based-university-discovery)
2. [Smart Filtering System](#2-smart-filtering-system)
3. [Saved Universities Panel](#3-saved-universities-panel)
4. [Admission Chance Predictor](#4-admission-chance-predictor)
5. [University Comparison Tool](#5-university-comparison-tool)
6. [Admission Deadlines Tracker](#6-admission-deadlines-tracker)
7. [Expandable University List](#7-expandable-university-list)
8. [Campus-Specific Data](#8-campus-specific-data)
9. [Theme System](#9-theme-system)
10. [Automated Data Pipeline](#10-automated-data-pipeline)
11. [Deadline Verification & Auto-Updates](#11-deadline-verification--auto-updates)
12. [Entry Tests Guide](#12-entry-tests-guide)
13. [Scholarships & Financial Aid](#13-scholarships--financial-aid)
14. [Top Picks Recommendations](#14-top-picks-recommendations)
15. [Similar Universities Suggestions](#15-similar-universities-suggestions)
16. [Toast Notifications](#16-toast-notifications)
17. [Scroll to Top](#17-scroll-to-top)
18. [SVG Icon System](#18-svg-icon-system)

---

## 1. Swipe-Based University Discovery

### What It Does
A Tinder-style card interface where students can browse universities one-by-one, swiping right to save or left to skip.

### Why It's Useful
- **Reduces Overwhelm**: Instead of seeing 28 universities at once, students focus on one at a time
- **Quick Decision Making**: Swipe gesture is intuitive and fast
- **Gamified Experience**: Makes university research feel less tedious
- **Mobile-Friendly**: Swipe gestures work naturally on touch devices
- **Visual Feedback**: Color overlays confirm the user's action

### How It Works
1. Universities are sorted based on filter selections
2. Card shows key info: name, city, type, match percentage
3. User swipes right (or clicks 💚) to save
4. User swipes left (or clicks ✕) to skip
5. Card flips to show details on tap
6. Next card automatically appears

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/SwipeCard/SwipeCard.js` | Main swipe logic and UI |
| `src/components/SwipeCard/SwipeCard.module.css` | Card styling, flip animation |
| `src/app/page.js` | Card state management, saved list |

### Key Code Features
- Touch event handlers for drag gesture
- CSS transforms for smooth animations
- Match percentage calculation from filters

---

## 2. Smart Filtering System

### What It Does
Six dropdown filters that narrow down universities based on student preferences, with intelligent defaults.

### Why It's Useful
- **Personalized Results**: Shows only relevant universities
- **Field-Specific Rankings**: See which uni is #1 in YOUR field
- **Location Preferences**: Filter by city for commute considerations
- **Hostel Needs**: Important for students from other cities
- **Campus Culture**: Match student personality to campus type

### Filter Options

| Filter | Options | Use Case |
|--------|---------|----------|
| **Field** | Pre-Engineering, CS, Business, Medical, Others | "I want to study CS" |
| **Degree Level** | Any, Undergraduate, Associate | "I'm looking for BS programs" |
| **Program** | Dynamic (e.g., Mechanical Eng, Data Science) | "Specifically Software Engineering" |
| **Hostel** | On-Campus with Hostel, without, Hybrid | "I need hostel accommodation" |
| **City** | Islamabad, Lahore, Karachi, + 10 more | "I can only study in Lahore" |
| **Campus Type** | Research-Oriented, Industry-Focused, Strong Campus Life | "I want research opportunities" |

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/FilterSection/FilterSection.js` | Filter dropdowns container |
| `src/components/SearchableSelect/SearchableSelect.js` | Reusable dropdown component |
| `src/data/universities.js` | Filter options configuration |
| `src/app/page.js` | Filter state and ranking logic |

---

## 3. Saved Universities Panel

### What It Does
A sidebar panel that stores all universities the student has swiped right on, persistent across browser sessions.

### Why It's Useful
- **Shortlist Management**: Keep track of favorites
- **Persistent Storage**: Data saved even after closing browser
- **Quick Access**: View all saved universities in one place
- **Remove Option**: Change your mind? Remove from list easily
- **Collapse/Expand**: Minimize when not needed

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/SavedList/SavedList.js` | Saved panel UI and logic |
| `src/components/SavedList/SavedList.module.css` | Panel styling |
| `src/app/page.js` | localStorage read/write logic |

### Data Persistence
```javascript
// Saves to browser localStorage
localStorage.setItem('savedUniversities', JSON.stringify(savedList));
```

---

## 4. Admission Chance Predictor

### What It Does
A merit calculator that shows students their chances at different universities based on their academic scores.

### Why It's Useful
- **Realistic Expectations**: Know your chances BEFORE applying
- **Campus Comparison**: See which FAST campus you can get into
- **Formula Transparency**: Understand how merit is calculated
- **Historical Data**: See last 2 years' cutoffs
- **Education Status Support**: Works for FSc, A-Level, complete or incomplete

### Input Fields
| Field | Range | Purpose |
|-------|-------|---------|
| FSc/A-Level Marks | 0-100% | Your intermediate percentage |
| Matric/O-Level Marks | 0-100% | Your secondary school percentage |
| Expected Test Score | 0-100% | Estimated entry test score |
| Education Status | Dropdown | FSc Complete, FSc Part-1 Only, A-Level, etc. |
| University | Dropdown | Select specific university/campus |
| Field | Dropdown | Your intended field of study |

### Campus-Specific Data Included
Each supported university has:
- **Merit Formula**: How aggregate is calculated (e.g., "NET 75% + FSc 15% + Matric 10%")
- **Formula Breakdown**: Visual weight display
- **Minimum Requirements**: Min FSc to apply
- **Competitive Score**: Approximate cutoff for admission
- **Merit History**: Last 2 years' closing merits
- **Tips**: Campus-specific advice

### Universities with Full Data (22)
NUST, LUMS, FAST (5 campuses), COMSATS (7 campuses), IBA, UET (2 campuses), GIKI, PIEAS, NED, Bahria (3 campuses)

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/AdmissionPredictor/AdmissionPredictor.js` | Calculator UI and logic |
| Lines 9-350 | `admissionCriteria` object with all campus data |
| `calculateUserAggregate()` function | Merit calculation logic |

---

## 5. University Comparison Tool

### What It Does
Compare up to 3 universities side-by-side with department-specific metrics.

### Why It's Useful
- **Direct Comparison**: See differences at a glance
- **Department-Specific**: Compare CS programs, not just overall
- **Multiple Criteria**: Compare what matters to you
- **Best Badges**: Instantly see which uni is best in each metric
- **Informed Decision**: Make data-driven choices

### Comparison Criteria Modes
| Mode | What It Compares |
|------|------------------|
| **Overall Performance** | Rankings, ratings, general reputation |
| **Industry & Placements** | Placement rate, starting salary, recruiters |
| **Career Opportunities** | Graduate outcomes, industry partners |
| **Research & Faculty** | PhD %, research papers, faculty quality |
| **Facilities & Resources** | Labs, equipment, campus resources |

### Metrics Available
- Department ranking (within field)
- Faculty strength (1-5 rating)
- Research output
- Placement rate (%)
- Average starting salary (PKR)
- Key facilities and labs
- Top recruiters

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/UniversityComparison/UniversityComparison.js` | Comparison UI |
| `src/data/departmentData.js` | Department-specific metrics |

---

## 6. Admission Deadlines Tracker

### What It Does
Shows upcoming (and elapsed) admission deadlines with countdown timers, urgency indicators, and direct apply links.

### Why It's Useful
- **Never Miss Deadlines**: Clear countdown shows days remaining
- **Urgency Alerts**: Red/orange badges for approaching deadlines
- **Filter by Field**: See only relevant deadlines
- **Direct Apply Links**: One click to application portal
- **Test Information**: Know which test and when
- **Upcoming/Elapsed Toggle**: See past deadlines for reference

### Deadline Information Shown
- University name and logo
- Program/campus information
- Application deadline date
- Days remaining (or days ago)
- Entry test name
- Test date
- Session (e.g., "Fall 2026")
- Apply Now button

### Urgency Color Coding
| Days Remaining | Color | Meaning |
|----------------|-------|---------|
| < 3 days | 🔴 Red | Critical - apply NOW |
| < 7 days | 🟠 Orange | Urgent - apply soon |
| < 14 days | 🟡 Yellow | Warning - prepare docs |
| > 14 days | 🟢 Green | Safe - still time |

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/AdmissionsDeadlines/AdmissionsDeadlines.js` | Deadline UI and logic |
| `src/data/universities.js` | `upcomingDeadlines` array (23 entries) |

---

## 7. Expandable University List

### What It Does
A scrollable list of all universities with expandable cards showing full details.

### Why It's Useful
- **Complete Overview**: See all 28 universities at once
- **Quick Scanning**: Key info visible without expanding
- **Detailed View**: Expand for programs, facilities, fees
- **Field Rankings**: See "#1 in CS" badges
- **Progressive Loading**: 5 → 10 → 15 → All universities

### Card Information
**Collapsed View:**
- University name, logo, city
- Type (Public/Private)
- Field ranking badge
- Highlights (3 key features)

**Expanded View:**
- Full description
- All offered programs by field
- Facilities and campus type
- Average fee range
- Admission deadline info
- Website link

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/UniversityList/UniversityList.js` | List UI and expand logic |
| `src/components/UniversityList/UniversityList.module.css` | Card styling |

---

## 8. Campus-Specific Data

### What It Does
Treats each university campus as a separate entity with its own cutoffs, rankings, and admission info.

### Why It's Useful
- **Accurate Cutoffs**: FAST Islamabad (73%) ≠ FAST Peshawar (53%)
- **Realistic Options**: Know which campus you CAN get into
- **Strategic Planning**: Apply to easier campus as backup
- **City-Specific**: Filter by where you want to live
- **Complete Information**: Each campus has full details

### Campus Data Example
```
FAST-NUCES splits into:
├── FAST Islamabad (CS: 73%, most competitive)
├── FAST Lahore (CS: 70%)
├── FAST Karachi (CS: 69%)
├── FAST Peshawar (CS: ~53%, easiest)
└── FAST Chiniot (CS: ~54%)
```

### Multi-Campus Universities
| University | # of Campuses | Cutoff Range |
|------------|---------------|--------------|
| FAST-NUCES | 5 | 73% → 53% |
| COMSATS | 7 | 87.5% → 58% |
| Bahria | 3 | >80% → 68% |
| UET | 2 | 81.6% → 75% |

### Where Implemented
| File | Purpose |
|------|---------|
| `src/data/universities.js` | 28 university entries |
| `src/components/AdmissionPredictor/AdmissionPredictor.js` | Campus-specific criteria |

---

## 9. Theme System

### What It Does
Three visual themes with seamless switching via toggle button.

### Why It's Useful
- **Eye Comfort**: Dark mode for low-light environments
- **Accessibility**: Choose what's easier to read
- **Unique Experience**: Treasure map theme for fun
- **Persistent**: Remembers your choice

### Available Themes

#### Dark Mode (Default)
- Background: Deep forest green (#0a0f0a)
- Accent: Forest green (#2d5a3d)
- Text: Light green tint (#e8f5e9)
- Best for: Night browsing, OLED screens

#### Light Mode
- Background: Warm cream (#f8f5e9)
- Accent: Forest green (#2d5a3d)
- Text: Dark green (#1a2f1a)
- Best for: Bright environments

#### Treasure Map Mode
- Background: Parchment texture
- Decorations: Compass, books, graduation cap
- Style: Vintage/adventure feel
- Best for: Thematic experience

### Where Implemented
| File | Purpose |
|------|---------|
| `src/context/ThemeContext.js` | Theme state management |
| `src/components/ThemeToggle/ThemeToggle.js` | Toggle button UI |
| `src/app/globals.css` | CSS variables for each theme |
| `src/components/Background/DecorativeImages.js` | Theme-aware decorations |

---

---

## 10. Automated Data Pipeline

### What It Does
A CI/CD system that automatically scrapes university websites, validates changes, and creates pull requests — keeping admission data fresh without manual effort.

### Why It's Useful
- **Always Current**: Deadlines and test dates auto-update every 20 days
- **No Manual Work**: Scraper runs on GitHub Actions — zero human intervention
- **Safe Updates**: Changes go through validation + AI review before merging
- **Transparent**: Change reports show exactly what was modified and why
- **Graceful Failures**: One university failing doesn't block others

### Tiered Schedule

| Tier | Frequency | Fields Updated | Cron |
|------|-----------|----------------|------|
| **Critical** | Every 20 days | Deadlines, test dates, test names | `0 2 */20 * *` |
| **General** | Bimonthly | Fees, websites, descriptions | `0 2 1 */2 *` |

### Pipeline Flow
```
Scrape → Parse → Merge → Validate → PR → Review → Merge
```

1. **Scrape**: Cheerio-based scraper fetches admission pages (28 universities, 16 configs)
2. **Parse**: Extract dates, fees, and URLs using regex patterns
3. **Merge**: Compare scraped data with `universities.js`, update only changed fields
4. **Validate**: Run 5 validators (schema, integrity, diff, target map, auto-review)
5. **PR**: Create GitHub PR with tier label, change table, and AI review comment
6. **Report**: Generate `scrape-results.json` and `change-report.json` artifacts

### Where Implemented
| File | Purpose |
|------|---------|
| `scripts/scrapers/university-scraper.js` | Core scraper engine (Cheerio + regex) |
| `scripts/fetch-university-data.js` | Pipeline orchestrator |
| `.github/workflows/update-university-data.yml` | Tiered CI/CD workflow |
| `scripts/validators/schema-validator.js` | Data type & format validation |
| `scripts/validators/compare-data.js` | Diff against baseline |
| `scripts/validators/data-integrity.js` | Cross-field checks |
| `scripts/validators/auto-review.js` | AI-style PR review |

### Additional Workflows
| Workflow | File | Schedule |
|----------|------|----------|
| Semester Refresh | `semester-data-update.yml` | March 1 & Sep 1 |
| Annual Merit | `annual-merit-update.yml` | November 1 |
| URL Health Check | `website-health-check.yml` | Every Monday |

---

## 11. Deadline Verification & Auto-Updates

### What It Does
A specialized system that ensures university admission deadlines are always accurate and up-to-date without manual intervention.

### Why It's Useful
- **Trust**: Students can rely on dates being current (verified every 20 days)
- **Urgency**: Automatically sorts universities by the *closest* deadline first
- **Consistency**: "Last Verified" timestamps show data freshness
- **Zero Maintenance**: System auto-commits updates so the site runs itself

### How It Works
1. **Verification**: A dedicated scraper checks official admission pages for all universities
2. **Session Intelligence**: Distinguishes between "Spring" and "Fall" dates to avoid overwriting valid future deadlines with near-term irrelevant ones
3. **Sorting**: Automatically re-sorts the entire database by closest deadline
4. **Auto-Commit**: If changes are confirmed safe, the system pushes them directly to the codebase

### Where Implemented
| File | Purpose |
|------|---------|
| `scripts/scrapers/deadline-scraper.js` | Verification & sorting logic |
| `.github/workflows/deadline-verification.yml` | Automation workflow |

---

## 12. Entry Tests Guide

### What It Does
Displays expandable info cards for major Pakistani university entry tests with details on format, subjects, accepted universities, and official links.

### Why It's Useful
- **Centralized Info**: Students no longer need to visit each test's website separately
- **University Mapping**: See which universities accept which test at a glance
- **Test Periods**: Know when each test is typically held
- **Official Links**: Direct access to registration portals

### Tests Covered
| Test | Conductor | Universities |
|------|-----------|-------------|
| NET | NUST | NUST |
| SAT | College Board | LUMS, IBA, NUST (Business), Habib, Bahria, FAST |
| FAST NU Test | FAST-NUCES | All FAST campuses |
| ECAT | UET | UET Lahore, UET Taxila |
| GIKI Test | GIKI | GIKI |
| IBA Aptitude Test | IBA Karachi | IBA |
| PIEAS Test | PIEAS | PIEAS |
| NED Entry Test | NED University | NED |
| Air University Test | Air University | Air University |

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/EntryTests/EntryTests.js` | Entry test cards UI |
| `src/data/entryTestsData.js` | Test data (also imported inline) |

---

## 13. Scholarships & Financial Aid

### What It Does
A searchable scholarship database with two display modes: an inline section and a full overlay panel, targeting underprivileged students with need-based aid, government schemes, and university-specific support.

### Why It's Useful
- **Financial Aid Access**: Aggregates scholarship info from multiple sources
- **Filterable**: Filter by type (need-based, merit-based, government, university)
- **Sortable**: Sort by coverage, provider, or default order
- **Actionable**: Direct links to application portals
- **Focus on Need**: Highlights scholarships for underprivileged students

### Components
| Component | Purpose |
|-----------|---------|
| `ScholarshipsSection` | Inline scholarships listing with type filter |
| `ScholarshipsPanel` | Full overlay panel with sorting, quick links |

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/ScholarshipsSection/ScholarshipsSection.js` | Section UI |
| `src/components/ScholarshipsPanel/ScholarshipsPanel.js` | Overlay panel UI |
| `src/data/scholarships.js` | Scholarship data, categories, and quick links |

---

## 14. Top Picks Recommendations

### What It Does
Shows the top 5 university recommendations based on current filter selections, with match percentages, match reasons, and expandable details.

### Why It's Useful
- **Instant Results**: No swiping needed — see top matches immediately
- **Explainable**: Shows *why* each university is recommended (match reasons)
- **Actionable**: Save to list directly from recommendations
- **Bridges to Swiping**: CTA button to swipe through all matches

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/RecommendationsSection/RecommendationsSection.js` | Recommendations UI |
| `src/utils/ranking.js` | `getMatchPercentage()`, `getMatchReasons()`, `getFieldRank()` |

---

## 15. Similar Universities Suggestions

### What It Does
Suggests up to 5 unsaved universities similar to the user's saved list, prioritizing universities in the same cities.

### Why It's Useful
- **Discovery**: Helps students find universities they might have missed
- **Context-Aware**: Uses saved list cities and filter matches
- **Frictionless**: One-click save functionality

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/SimilarUniversities/SimilarUniversities.js` | Suggestions UI |
| `getSimilarCandidates()` function | Similarity algorithm |

---

## 16. Toast Notifications

### What It Does
Auto-dismissing toast notifications that confirm user actions like saving or removing a university.

### Why It's Useful
- **Feedback**: Confirms actions without interrupting flow
- **Accessible**: Uses `role="alert"` for screen readers
- **Non-intrusive**: Auto-dismisses after 3 seconds

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/Toast/Toast.js` | Toast notification component |

---

## 17. Scroll to Top

### What It Does
A floating button that appears after scrolling 400px, allowing users to smoothly scroll back to the top of the page.

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/ScrollToTop/ScrollToTop.js` | Button component |

---

## 18. SVG Icon System

### What It Does
A shared SVG icon library replacing emoji icons for better accessibility and visual consistency across themes.

### Icons Available
`IconBookmark`, `IconClose`, `IconCheck`, `IconArrowRight`, `IconArrowLeft`, `IconChevronUp`, `IconChevronDown`, `IconNote`, `IconCelebrate`, `IconScholarship`

### Where Implemented
| File | Purpose |
|------|---------|
| `src/components/Icons/Icons.js` | 10 SVG icon components |

---

## Feature Location Quick Reference

| Feature | Main Component | Data Source |
|---------|----------------|-------------|
| Swipe Cards | `SwipeCard/` | `universities.js` |
| Filters | `FilterSection/` | `universities.js` (filterOptions) |
| Saved List | `SavedList/` | `savedStorage.js` (versioned localStorage) |
| Predictor | `AdmissionPredictor/` | Internal `admissionCriteria` |
| Comparison | `UniversityComparison/` | `departmentData.js` |
| Deadlines | `AdmissionsDeadlines/` | `universities.js` (upcomingDeadlines) |
| Uni List | `UniversityList/` | `universities.js` |
| Themes | `ThemeToggle/`, `ThemeContext` | localStorage |
| Data Pipeline | `scripts/scrapers/` | University websites (scraped) |
| Entry Tests | `EntryTests/` | `entryTestsData.js` |
| Scholarships | `ScholarshipsSection/`, `ScholarshipsPanel/` | `scholarships.js` |
| Recommendations | `RecommendationsSection/` | `universities.js` + `ranking.js` |
| Similar Unis | `SimilarUniversities/` | `universities.js` + `ranking.js` |
| Toast | `Toast/` | Internal state |
| Scroll to Top | `ScrollToTop/` | Internal state |
| Icons | `Icons/` | SVG definitions |

---

## Data Accuracy & Sources

### Official Sources
- University admission portals (2024 data)
- HEC Pakistan rankings
- Official merit lists (when available)

### Automated Sources (Scraper)
- University admission pages (scraped via university-scraper.js)
- Community merit sites (learnospot.com, paklearningspot.com)

### Community Sources
- Reddit r/pakistan admission threads
- Maqsad.io merit list compilations
- YouTube admission result videos

### Data Notes
- Cutoffs marked with `~` are estimated (e.g., ~53%)
- Cutoffs without `~` are from official sources
- GIKI uses merit positions, not percentages
- LUMS uses holistic admissions (no fixed cutoffs)
- IBA publishes test score cutoffs, not aggregates
- Scraped data is validated against 5 automated checks before merging

