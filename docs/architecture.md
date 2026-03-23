# Component Architecture

## Overview

IlmSeUrooj follows a component-based architecture with clear separation of concerns. The application is built with Next.js 16+ using the App Router pattern, with an automated CI/CD pipeline for data updates.

---

## Directory Structure

```
ilmseurroj/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout with ThemeProvider
│   │   ├── page.js            # Main homepage
│   │   ├── globals.css        # Global styles and CSS variables
│   │   └── page.module.css    # Page-specific CSS module
│   │
│   ├── components/
│   │   ├── AdmissionPredictor/
│   │   │   ├── AdmissionPredictor.js      # Merit calculator with formulas
│   │   │   └── AdmissionPredictor.module.css
│   │   │
│   │   ├── AdmissionsDeadlines/
│   │   │   ├── AdmissionsDeadlines.js     # Deadline tracker with countdown
│   │   │   └── AdmissionsDeadlines.module.css
│   │   │
│   │   ├── Background/
│   │   │   ├── AnimatedBackground.js      # Animated background effects
│   │   │   ├── AnimatedBackground.module.css
│   │   │   ├── DecorativeImages.js        # Theme-aware decorative elements
│   │   │   ├── DecorativeImages.module.css
│   │   │   ├── SectionBackground.js       # Section-specific backgrounds
│   │   │   └── SectionBackground.module.css
│   │   │
│   │   ├── EntryTests/
│   │   │   ├── EntryTests.js              # Entry test info cards
│   │   │   └── EntryTests.module.css
│   │   │
│   │   ├── FilterSection/
│   │   │   ├── FilterSection.js           # 6 filter dropdowns container
│   │   │   └── FilterSection.module.css
│   │   │
│   │   ├── Header/
│   │   │   ├── Header.js                  # Navigation bar with logo and theme toggle
│   │   │   └── Header.module.css
│   │   │
│   │   ├── Icons/
│   │   │   └── Icons.js                   # SVG icon library (10 icons)
│   │   │
│   │   ├── RecommendationsSection/
│   │   │   ├── RecommendationsSection.js  # "Top picks" based on filters
│   │   │   └── RecommendationsSection.module.css
│   │   │
│   │   ├── SavedList/
│   │   │   ├── SavedList.js               # Saved universities sidebar panel
│   │   │   └── SavedList.module.css
│   │   │
│   │   ├── ScholarshipsPanel/
│   │   │   ├── ScholarshipsPanel.js       # Full scholarship overlay panel
│   │   │   └── ScholarshipsPanel.module.css
│   │   │
│   │   ├── ScholarshipsSection/
│   │   │   ├── ScholarshipsSection.js     # Scholarships & financial aid section
│   │   │   └── ScholarshipsSection.module.css
│   │   │
│   │   ├── ScrollToTop/
│   │   │   ├── ScrollToTop.js             # Scroll-to-top floating button
│   │   │   └── ScrollToTop.module.css
│   │   │
│   │   ├── SearchableSelect/
│   │   │   ├── SearchableSelect.js        # Reusable dropdown with search
│   │   │   └── SearchableSelect.module.css
│   │   │
│   │   ├── SimilarUniversities/
│   │   │   ├── SimilarUniversities.js     # "You might also like" suggestions
│   │   │   └── SimilarUniversities.module.css
│   │   │
│   │   ├── SwipeCard/
│   │   │   ├── SwipeCard.js               # Tinder-style swipeable card
│   │   │   └── SwipeCard.module.css       # Card flip, drag animations
│   │   │
│   │   ├── ThemeToggle/
│   │   │   ├── ThemeToggle.js             # Dark/Light mode switch
│   │   │   └── ThemeToggle.module.css
│   │   │
│   │   ├── Toast/
│   │   │   ├── Toast.js                   # Toast notification component
│   │   │   └── Toast.module.css
│   │   │
│   │   ├── UniversityComparison/
│   │   │   ├── UniversityComparison.js    # Side-by-side comparison (3 unis)
│   │   │   └── UniversityComparison.module.css
│   │   │
│   │   └── UniversityList/
│   │       ├── UniversityList.js          # Expandable university cards list
│   │       └── UniversityList.module.css
│   │
│   ├── context/
│   │   └── ThemeContext.js    # Theme state management (dark/light/treasure)
│   │
│   ├── hooks/
│   │   └── useProfile.js      # Supabase profile read/write hook
│   │
│   └── data/
│       ├── universities.js    # 28 universities with all attributes
│       ├── departmentData.js  # Department-specific comparison data
│       ├── entryTestsData.js  # Entry test details (NET, SAT, ECAT, etc.)
│       └── scholarships.js    # Scholarships & financial aid data
│
├── scripts/
│   ├── scrapers/
│   │   ├── base-scraper.js         # Base class with common scraping utilities
│   │   ├── deadline-scraper.js     # Admission deadline verification
│   │   ├── deadline_scraper.py     # Python-based deadline scraper alternative
│   │   ├── university-scraper.js   # Cheerio-based scraper engine (16 configs)
│   │   ├── merit-scraper.js        # Merit cutoff scraper
│   │   ├── recruiter-scraper.js    # Top recruiters scraper
│   │   ├── salary-scraper.js       # Salary data scraper
│   │   ├── facilities-scraper.js   # Facilities information scraper
│   │   └── semester-scrapers.js    # Semester-specific scrapers wrapper
│   ├── validators/
│   │   ├── schema-validator.js     # Data type/format validation
│   │   ├── compare-data.js         # Diff against baseline
│   │   ├── data-integrity.js       # Cross-field checks
│   │   ├── data-target-map.js      # Tier-to-field mapping
│   │   ├── semester-data-validator.js  # Semester data validation
│   │   └── auto-review.js          # AI-style PR review
│   ├── utils/
│   │   ├── http-client.js          # HTTP client with retry logic
│   │   ├── ast-manipulator.js      # AST parsing and file updates
│   │   ├── parse-universities.js   # Parse universities.js data
│   │   ├── rate-limiter.js         # Rate limiting utilities
│   │   ├── test-urls.js            # URL testing utilities
│   │   └── url-checker.js          # URL reachability checker
│   ├── fetch-university-data.js    # Pipeline orchestrator
│   ├── generate-baseline.js        # Baseline snapshot generator
│   ├── generate-merit-report.js    # Merit analysis reports
│   ├── test-scrapers.js            # Test all scrapers
│   └── test-file-updates.js        # Test AST manipulation
│
├── .github/workflows/
│   ├── update-university-data.yml  # Tiered auto-update (every 20 days + bimonthly)
│   ├── semester-data-update.yml    # Semester cycle refresh (Mar/Sep)
│   ├── annual-merit-update.yml     # Yearly merit update (Nov)
│   ├── deadline-verification.yml   # Deadline auto-verification & commit
│   ├── website-health-check.yml    # Weekly URL health check
│   └── data-update-reminder.yml    # 20-day email reminder for manual review
│
├── public/
│   └── images/              # Theme background images & decorations
│
└── docs/                      # This documentation folder
```


---

## Component Details

### Header (`components/Header/`)
- Logo and branding
- Theme toggle button (sun/moon icon)
- Mobile-responsive hamburger menu

### FilterSection (`components/FilterSection/`)
6 dropdown filters with smart defaults:
| Filter | Options | Default |
|--------|---------|---------|
| Field | Pre-Engineering, CS, Business, Medical, Others | Pre-Engineering |
| Degree Level | Any, Undergraduate, Associate | Any |
| Program | Dynamic based on field | Any |
| Hostel | Any, On-Campus with Hostel, without, Hybrid | Any |
| City | Any, Islamabad, Lahore, Karachi, + 10 more | Any |
| Campus Type | Any, Research-Oriented, Industry-Focused, Strong Campus Life | Any |

### SwipeCard (`components/SwipeCard/`)
- Drag-to-swipe gesture handling
- Card flip animation for details view
- Save (💚) and Skip (✕) buttons
- Match percentage display
- Color overlay feedback (green = save, red = skip)

### SavedList (`components/SavedList/`)
- Sidebar panel showing saved universities
- Remove functionality
- Persistent via localStorage
- Collapse/expand toggle

### SearchableSelect (`components/SearchableSelect/`)
Reusable dropdown component with:
- Search/filter functionality
- Keyboard navigation
- Click-outside-to-close
- Proper z-index stacking
- Used in: FilterSection, AdmissionPredictor, UniversityComparison

### UniversityList (`components/UniversityList/`)
- Expandable "View More" (5 → 10 → 15 → All)
- Field-specific ranking badges
- Expandable card details
- Program and facility tags

### UniversityComparison (`components/UniversityComparison/`)
- Compare up to 3 universities side-by-side
- Department filter dropdown
- 5 comparison criteria modes:
  - Overall Performance
  - Industry & Placements
  - Career Opportunities
  - Research & Faculty
  - Facilities & Resources
- "Best" badges for top performers

### AdmissionPredictor (`components/AdmissionPredictor/`)
Campus-specific merit calculator:
- Sliders for FSc, Matric, Expected Test Score
- Education status (FSc/A-Level Complete/Incomplete)
- University-specific formulas (NET, ECAT, NTS NAT, etc.)
- Historical merit data (2023-2024)
- Campus-specific tips and advice
- 22 universities with full criteria data

### AdmissionsDeadlines (`components/AdmissionsDeadlines/`)
- Upcoming/Elapsed toggle
- Field filter (CS, Engineering, Business, Medical)
- Countdown timers (days remaining)
- Urgency badges (red < 3 days, orange < 7 days)
- "View More" expansion
- Apply Now links to official portals

### Background Components (`components/Background/`)
**AnimatedBackground.js**
- Animated background effects (particles, gradients)

**DecorativeImages.js**
- Theme-aware decorative elements
- Compass, books, graduation cap images
- Position-based placement
- Lazy loading for performance

**SectionBackground.js**
- Full-page map backgrounds for treasure theme
- Section-specific gradients

### EntryTests (`components/EntryTests/`)
- Info cards for major entry tests (NET, SAT, ECAT, GIKI Test, etc.)
- Expandable cards with test details
- Shows accepted universities per test
- Test periods and official website links
- Data from `entryTestsData.js`

### Icons (`components/Icons/`)
Shared SVG icon library for accessibility and consistency:
- `IconBookmark`, `IconClose`, `IconCheck`, `IconArrowRight`, `IconArrowLeft`
- `IconChevronUp`, `IconChevronDown`, `IconNote`, `IconCelebrate`, `IconScholarship`
- All icons use `currentColor` for theme compatibility

### RecommendationsSection (`components/RecommendationsSection/`)
- Shows top 5 university picks based on current filters
- Displays match percentage and match reasons
- Field ranking badges
- Expandable details (fee, campus, focus area, highlights)
- Save-to-list functionality
- "Swipe through all matches" CTA button

### ScholarshipsSection (`components/ScholarshipsSection/`)
- Scholarships & financial aid listings for underprivileged students
- Filter by type (need-based, merit-based, government, university)
- Expandable cards with eligibility and application links
- Data from `scholarships.js`

### ScholarshipsPanel (`components/ScholarshipsPanel/`)
- Full overlay panel with detailed scholarship info
- Sorting (default, full coverage first, provider A–Z)
- Category filtering
- Quick links to HEC, Ehsaas, and university aid pages
- Keyboard accessible (Escape to close)

### ScrollToTop (`components/ScrollToTop/`)
- Floating button that appears after scrolling 400px
- Smooth scroll-to-top behavior
- Accessible with aria-label

### SimilarUniversities (`components/SimilarUniversities/`)
- "You might also like" section based on saved universities
- Prioritizes universities in same cities as saved list
- Falls back to top filter matches
- Save-to-list functionality
- Match percentage display

### Toast (`components/Toast/`)
- Auto-dismissing toast notifications (3 second default)
- Success and removed states
- Dismiss button accessible
- Uses `role="alert"` for screen readers

---

## Data Layer

### universities.js
28 university entries with attributes:
```javascript
{
  id: Number,
  name: String,           // Full university name
  shortName: String,      // Abbreviated (e.g., "FAST Isb")
  logo: String,           // Path to logo image
  city: String,           // Campus city
  established: Number,    // Year founded
  type: String,           // "Public" or "Private"
  ranking: Number,        // Overall ranking (1-28)
  fieldRankings: Object,  // Field-specific rankings
  campusType: String,     // Research/Industry/Campus Life
  hostelAvailability: String,
  fields: Array,          // Offered fields
  programs: Object,       // Programs by field
  degreeLevel: Array,     // Undergrad, Grad, PhD
  highlights: Array,      // 3 key features
  description: String,    // Short description
  website: String,        // Official URL
  avgFee: String,         // Fee range
  admissions: Object      // Deadline, test info, apply URL
}
```

### departmentData.js
Department-specific metrics for comparison:
- Rankings by department
- Faculty strength ratings
- Research output metrics
- Placement rates
- Average starting salaries
- Industry partners
- Key facilities

### entryTestsData.js
Entry test information:
- Test IDs and names (NET, SAT, ECAT, FAST NU Test, etc.)
- Conductor organizations
- Test periods and dates
- Subject coverage
- Accepted universities per test
- Official website links

### scholarships.js
Scholarship and financial aid data:
- Scholarship names, providers, and types
- Coverage amounts and eligibility criteria
- Apply URLs and deadlines
- Categories: need-based, merit-based, government, university-specific
- Quick links to HEC and Ehsaas portals

---

## Supabase Backend

### profiles table
Stores all student personal, academic, and portal information. RLS enforced (students read/write own row only).

Key column groups:
- **Identity**: `full_name`, `cnic`, `date_of_birth`, `gender`, `nationality`, `religion`
- **Contact**: `email`, `phone`, `whatsapp`, `address`, `city`, `province`, `postal_code`
- **Education**: `education_system`, `inter_type`, `inter_status`, `fsc_*`, `matric_*`, `alevel_*`, `olevel_*`, `ibcc_*`
- **Entry tests**: `net_score`, `sat_score`, `ecat_score`, `mdcat_score`, `gat_score`, etc.
- **Family** (added migration 002): `father_name`, `father_cnic`, `father_occupation`, `father_status`, `father_income`, `mother_name`, `mother_profession`, `mother_status`, `mother_income`, `guardian_phone`
- **Domicile**: `domicile_province`, `domicile_district`
- **Portal**: `portal_email`, `portal_password`, `preferred_field`, `preferred_cities`, `preferred_degree`
- **Meta**: `profile_completion`, `photo_url`, `cnic_url`, `result_card_url`, `created_at`, `updated_at`

See `docs/agent/SCHEMA.md` for the full column-by-column reference.

### Chrome Extension Autofill Architecture
`extension/content/content.js` runs a 4+ tier autofill pipeline on each university portal page:

```
Tier 1  — Deterministic CSS selectors (per-university configs)
Tier 2  — AI field mapping via local Ollama (unknown portals only)
Tier 2.5 — DOB field scan
Tier 2.6 — Phone field split
Tier 2.7 — Education radio group scan (FSc/O-Level/A-Level)
Tier 3  — Heuristic label/name/id pattern matching
Tier 4  — AJAX district/tehsil retry (800 ms delay)
```

Income-range matching: numeric profile values are matched to dropdown labels such as "Less than Rs. 30,000" or "30,001 - 50,000".

Per-university configs live in `extension/universities/` (17 files + `index.js`). The NUST config uses compound attribute selectors (e.g., `select[id*="Father"][id*="Income"]`) to handle ASP.NET form ID conventions.

---

## State Management

| State | Location | Persistence |
|-------|----------|-------------|
| Filter selections | page.js useState | None (resets on reload) |
| Saved universities | page.js useState | Versioned localStorage (`savedStorage.js`) |
| Theme mode | ThemeContext | localStorage |
| Current card index | SwipeCard useState | None |
| Toast messages | page.js useState | None |
| Expanded cards | Various components useState | None |

---

## Data Flow

```
┌─────────────────┐
│  User Input     │
│  (Filters)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Filter State   │
│  Updates        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Ranking        │
│  Algorithm      │
│  (Priority      │
│   Scoring)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Universities   │
│  Sorted         │
└────────┬────────┘
         ▼
┌─────────────────┐      ┌─────────────────┐
│  SwipeCard      │──────▶│  SavedList     │
│  Rendered       │      │  (localStorage) │
└─────────────────┘      └─────────────────┘
```

---

## Styling System

### CSS Variables (globals.css)
```css
/* Dark Theme (default) */
--bg-primary: #0a0f0a;
--bg-secondary: #1a2f1a;
--accent: #2d5a3d;
--text-primary: #e8f5e9;

/* Light Theme */
--bg-primary: #f8f5e9;
--bg-secondary: #fff8e7;
--accent: #2d5a3d;
--text-primary: #1a2f1a;
```

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
