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
│   ├── base-scraper.js         # Base scraper class with common utilities
│   ├── recruiter-scraper.js    # Top recruiters scraper
│   ├── salary-scraper.js       # Salary data scraper
│   ├── facilities-scraper.js   # Facilities information scraper
│   ├── merit-scraper.js        # Merit cutoff scraper (Cheerio + Puppeteer)
│   └── semester-scrapers.js    # Semester data scrapers wrapper
├── validators/         # Data validation scripts
│   ├── schema-validator.js           # Data type & format checks
│   ├── data-integrity.js             # Cross-field validation
│   ├── semester-data-validator.js    # Semester data validation
│   └── auto-review.js                # AI-style PR review
├── utils/              # Utility scripts
│   ├── http-client.js         # HTTP client with retry logic
│   ├── ast-manipulator.js     # AST parsing and file updates
│   ├── rate-limiter.js        # Rate limiting utilities
│   └── url-checker.js         # URL validation (now functional)
├── test-scrapers.js           # Test all scrapers
├── test-file-updates.js       # Test AST manipulation
└── fetch-university-data.js   # Pipeline orchestrator

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
- 🔄 **Functional scraping** — Actually fetches data from university websites
- 🕷️ **Multi-tool scraping** — Cheerio for static sites, Puppeteer for JavaScript-heavy sites
- 📝 **AST-based updates** — Safely updates universities.js while preserving formatting
- 📅 **Real-time data** — Scrapes deadlines, fees, test dates from official sources
- ✅ **Validation** — Schema, integrity, and diff checks on every update
- 🔁 **Retry logic** — Automatic retries with exponential backoff
- ⏱️ **Rate limiting** — Prevents server overload and IP bans
- 📬 **Auto PRs** — Creates pull requests with actual data changes
- 🩺 **URL health checks** — Validates all URLs with actual HTTP requests
- 📊 **Semester updates** — Scrapes recruiters, salaries, and facilities data

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Vanilla CSS (Design System)
- **State**: React Hooks & Context
- **Scraping**: Cheerio (HTML parsing) + Puppeteer (JavaScript-heavy sites)
- **HTTP Client**: Axios with retry logic
- **AST Manipulation**: Babel parser + Recast (for file updates)
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
| [CHANGELOG](docs/CHANGELOG.md) | Complete development history (Iterations 1–6) |
| [Architecture](docs/architecture.md) | Component structure & data flow |
| [FILES](docs/FILES.md) | File-by-file reference |
| [DATA-SOURCES](docs/DATA-SOURCES.md) | All data sources with links |
| [WORKFLOWS](docs/WORKFLOWS.md) | GitHub Actions CI/CD documentation |
| [SCRAPERS](docs/SCRAPERS.md) | Scraper implementations and usage guide |
| [SHORTFALLS](docs/SHORTFALLS.md) | Known issues & things to fix |
| [ENHANCEMENTS](docs/ENHANCEMENTS.md) | Future improvement roadmap |

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check

# Testing
npm run test-scrapers    # Test all scraper implementations
npm run test-file-updates # Test AST file manipulation

# Data pipeline (local)
DATA_TYPE=all node scripts/fetch-university-data.js

# Individual scrapers
node scripts/scrapers/recruiter-scraper.js
node scripts/scrapers/salary-scraper.js
node scripts/scrapers/facilities-scraper.js
node scripts/scrapers/merit-scraper.js

# Validators
node scripts/validators/schema-validator.js
node scripts/validators/data-integrity.js
node scripts/validators/semester-data-validator.js

# URL health check
node scripts/utils/url-checker.js
```
