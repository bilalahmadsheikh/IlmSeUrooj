# UniMatch (IlmSeUrooj) — University Discovery Platform for Pakistan 🎓

A UCAS-like platform that makes finding the right university in Pakistan fun and engaging through a Tinder-style swiping interface, merit calculators, and automated data updates.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── Background/      # Animated & decorative backgrounds
│   ├── ThemeToggle/     # Dark/Light/Treasure theme switcher
│   ├── SwipeCard/       # Tinder-style university cards
│   ├── AdmissionPredictor/  # Merit calculator
│   ├── UniversityComparison/  # Side-by-side comparison tool
│   └── ...
├── context/            # React Context (Theme management)
├── data/               # University & department data
└── utils/              # Utility functions (ranking, etc.)

scripts/
├── scrapers/           # University website scrapers
│   ├── university-scraper.js   # Core scraper engine (Cheerio)
│   ├── merit-scraper.js        # Merit cutoff scraper
│   └── semester-scrapers.js    # Semester data scrapers
├── validators/         # Data validation scripts
│   ├── schema-validator.js     # Data type & format checks
│   ├── compare-data.js         # Diff against baseline
│   ├── data-integrity.js       # Cross-field validation
│   └── auto-review.js          # AI-style PR review
├── utils/              # Utility scripts
└── fetch-university-data.js    # Pipeline orchestrator

.github/workflows/      # CI/CD automation
├── update-university-data.yml  # Tiered auto-update (every 20 days / bimonthly)
├── semester-data-update.yml    # Semester cycle refresh
├── annual-merit-update.yml     # Yearly merit cutoff update
└── website-health-check.yml    # Weekly URL health check

docs/                    # Project documentation
```

## Features

### Core Features
- 🎯 Smart filter system with 6 dropdowns
- 👆 Tinder-style swipe cards for universities
- 📊 Intelligent ranking based on preferences
- 💾 Save universities for later (localStorage)
- 📅 Real admission deadlines with countdown timers

### University Comparison Tool
- ⚖️ Compare up to 3 universities side-by-side
- 🎓 Filter by department (CS, Engineering, Business, Medical)
- 📋 5 comparison criteria modes
- 💼 Industry connections & placement data
- 🏢 Top recruiters for each university
- 🔬 Research output & faculty metrics

### Admission Chance Predictor
- 🧮 Campus-specific merit calculator (22 campuses)
- 📈 Aggregate calculation using official formulas
- 📉 Historical cutoff data (2023–2024)
- 🎯 Personalized tips per campus

### Theme System
- 🌙 **Dark Mode** — Forest green theme (default)
- ☀️ **Light Mode** — Warm streetlight yellow/cream
- 🗺️ **Treasure Map Mode** — Vintage parchment with map backgrounds

### Automated Data Pipeline (CI/CD)
- 🔄 **Tiered scraping** — Critical data (deadlines) every 20 days, general data bimonthly
- 🕷️ **University website scraper** — Cheerio-based, 28 university configs
- ✅ **Validation** — Schema, integrity, and diff checks on every update
- 📬 **Auto PRs** — AI-reviewed pull requests with change reports
- 🩺 **Weekly health checks** — Broken URL detection with GitHub issue alerts

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Vanilla CSS (Design System)
- **State**: React Hooks & Context
- **Scraping**: Cheerio (HTML parsing)
- **CI/CD**: GitHub Actions (4 workflows)
- **Validation**: Custom Node.js scripts

## University Coverage

28 universities (campus-specific entries):
- **Single campus**: NUST, LUMS, IBA, GIKI, PIEAS, NED, Habib, AKU, Air University, SZABIST, ITU
- **FAST-NUCES**: 5 campuses (Islamabad, Lahore, Karachi, Peshawar, Chiniot)
- **COMSATS**: 7 campuses (Islamabad, Lahore, Wah, Abbottabad, Sahiwal, Attock, Vehari)
- **Bahria**: 3 campuses (Islamabad, Lahore, Karachi)
- **UET**: 2 campuses (Lahore, Taxila)

## Documentation

See the [`/docs`](./docs/) folder:

| Document | Description |
|----------|-------------|
| [README](docs/README.md) | Project overview & quick stats |
| [FEATURES](docs/FEATURES.md) | Detailed feature documentation |
| [CHANGELOG](docs/CHANGELOG.md) | Complete development history (Iterations 1–5) |
| [Architecture](docs/architecture.md) | Component structure & data flow |
| [FILES](docs/FILES.md) | File-by-file reference |
| [DATA-SOURCES](docs/DATA-SOURCES.md) | All data sources with links |
| [WORKFLOWS](docs/WORKFLOWS.md) | GitHub Actions CI/CD documentation |
| [SHORTFALLS](docs/SHORTFALLS.md) | Known issues & things to fix |
| [ENHANCEMENTS](docs/ENHANCEMENTS.md) | Future improvement roadmap |

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check

# Data pipeline (local)
DATA_TIER=critical DRY_RUN=true node scripts/fetch-university-data.js

# Validators
node scripts/validators/schema-validator.js
node scripts/validators/compare-data.js

# URL health check
node scripts/utils/url-checker.js
```
