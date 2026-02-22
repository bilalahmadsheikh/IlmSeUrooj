# UniMatch (IlmSeUrooj)
### One profile. Apply to any university in Pakistan.

UniMatch helps Pakistani students apply to multiple universities without filling the same form over and over. Create your profile once — your name, CNIC, marks, contact info — then install the Chrome extension and autofill any supported university portal in seconds. You review the form and click Submit yourself.

---

## What Works Right Now

### Website (localhost:3000)
- **Swipe-based university discovery** — swipe right to save, left to skip (Tinder-style)
- **Smart filter system** — field, degree level, program, hostel, city, campus type
- **Saved universities list** — persistent via localStorage, with tags, notes, reordering, drag-and-drop
- **Admission chance predictor** — merit formula calculator with projected/IBCC support per university
- **University comparison tool** — side-by-side comparison of up to 4 universities
- **Admissions deadlines tracker** — grouped by field and month with countdown
- **Entry tests info** — NET, ECAT, SAT, MDCAT with historical cutoffs and personal score comparison
- **Scholarships panel** — need-based and merit-based scholarships with eligibility
- **Recommendations section** — personalized suggestions based on filters
- **Similar universities** — based on saved list similarity
- **Theme system** — dark/light mode with persistent preference
- **Profile page** — 9 sections: personal, academic, education system (Pakistani/Cambridge), entry tests, portal credentials, preferences, documents
- **Profile completion ring** — percentage-based SVG in header
- **Floating action panel** — bottom-right FAB with quick links (hidden on profile/applications/extension)
- **Application dashboard** — kanban board (Saved → Applying → Submitted → Decision) with real-time updates, detail panel, notes
- **Header** — auth-aware with Sign In/Create Profile for guests, ProfileRing + dropdown for logged-in users
- **Extension landing page** — product page with install CTA, how-it-works, university grid, comparison table

### Chrome Extension
- **Per-university autofill** with 3-tier system (deterministic selectors → AI field mapping → heuristic detection)
- **17 universities** with mapped CSS selectors (all pending live verification)
- **Academic status aware** — handles projected marks, IBCC equivalence, Cambridge/Pakistani systems
- **Sidebar** with 7 states: unknown_portal, not_logged_in, warning_ibcc, warning_no_marks, loading, ready, filled, review, submitted
- **Popup** with ProfileRing, portal detection, application list, auth controls
- **Password vault** — generates one strong password, reuses across all portals
- **Pre-submit validator** — checks for empty required fields and inconsistencies
- **Submission detection** — captures confirmation numbers
- **Answer memory** — remembers answers to unique questions across universities
- **SOP/essay AI draft helper** — uses local Ollama to generate drafts (requires 20-char edit minimum)
- **Page type detection** — identifies login, registration, application, and payment pages

### Supported Universities (17 — all mapped, pending live verification)

| # | University | Slug | Portal Domain |
|---|-----------|------|--------------|
| 1 | NUST | nust | ugadmissions.nust.edu.pk |
| 2 | FAST-NUCES | fast | nu.edu.pk |
| 3 | COMSATS | comsats | admissions.comsats.edu.pk |
| 4 | LUMS | lums | admissions.lums.edu.pk |
| 5 | IBA Karachi | iba | iba.edu.pk |
| 6 | GIKI | giki | giki.edu.pk |
| 7 | NED | ned | admissions.neduet.edu.pk |
| 8 | PIEAS | pieas | pieas.edu.pk |
| 9 | Habib University | habib | habib.edu.pk |
| 10 | Aga Khan University | aku | aku.edu |
| 11 | SZABIST Karachi | szabist-khi | szabist.edu.pk |
| 12 | SZABIST Islamabad | szabist-isb | szabist-isb.edu.pk |
| 13 | Air University | airuni | au.edu.pk |
| 14 | ITU Lahore | itu | itu.edu.pk |
| 15 | Bahria University | bahria | bahria.edu.pk |
| 16 | UET Lahore | uet-lahore | uet.edu.pk |
| 17 | UET Taxila | uet-taxila | admission.uettaxila.edu.pk |

> **Note:** All selectors are mapped but marked `verified: false` because university admissions portals are seasonal. Verification requires an active admissions cycle. See [UNIVERSITY_STATUS.md](docs/UNIVERSITY_STATUS.md).

---

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Chrome browser (for extension)

### 1. Clone and install
```bash
git clone https://github.com/bilalahmadsheikh/IlmSeUrooj.git
cd ilmseurroj
npm install
```

### 2. Environment variables
Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 3. Run the website
```bash
npm run dev
```
Open http://localhost:3000

### 4. Load the extension in Chrome
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Navigate to any supported university portal

---

## Student Education System Support

UniMatch handles both Pakistani and Cambridge education systems:

| Scenario | What's stored | How marks fill |
|----------|-------------|----------------|
| Matric + FSc complete | fsc_marks, fsc_total | Direct fill |
| Matric + FSc Part-I only | fsc_part1_marks, projected | Projected × 2 |
| Matric + Currently appearing | fsc_part1_marks, projected | Projected × 2 |
| O-Level + No A-Level yet | ibcc_equivalent_matric only | Warning shown |
| O-Level + A-Level complete | ibcc_equivalent_inter | IBCC % fills |
| O-Level + A-Level AS only | ibcc_equivalent_inter (AS) | IBCC % fills |

Cambridge students need an IBCC equivalence certificate from ibcc.edu.pk before applying to Pakistani universities.

---

## Project Structure

```
ilmseurroj/
├── src/
│   ├── app/              Next.js pages + API routes
│   │   ├── api/          6 API routes (profile, applications, fieldmap, etc.)
│   │   ├── profile/      Student profile page (9 sections)
│   │   ├── applications/ Kanban application dashboard
│   │   └── extension/    Extension landing page
│   ├── components/       20 UI components
│   ├── hooks/            useProfile() hook
│   ├── data/             Static university/scholarship/entry test data
│   └── context/          Theme context
├── extension/
│   ├── universities/     17 per-university autofill configs + index.js
│   ├── content/          Content script (autofill engine + sidebar)
│   ├── background/       Service worker (auth token management)
│   ├── popup/            Extension popup UI
│   └── styles/           Sidebar CSS
├── scripts/              Data scrapers, validators, baselines
│   ├── scrapers/         Per-university data scrapers
│   ├── validators/       Data verification scripts
│   └── utils/            Shared scraper utilities
├── docs/                 Project documentation
└── .agent/               Agent rules and workflows
```

---

## Environment Variables

| Key | Required | Description |
|-----|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `OLLAMA_BASE_URL` | Optional | Local Ollama URL for AI field mapping fallback |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: llama3) |

---

## Adding a New University
→ See [docs/HOW_TO_ADD_UNIVERSITY.md](docs/HOW_TO_ADD_UNIVERSITY.md)

## Known Limitations
- **File uploads** (photo, CNIC scan) cannot be automated — browser security prevents extensions from triggering file pickers. Student must upload files manually.
- **Seasonal portals** — portals with closed admissions cannot be end-to-end tested until admissions reopen. Selectors are mapped but marked `verified: false` until confirmed during an active cycle.
- **CAPTCHA** on some portals must be solved by the student manually.
- **Login-first portals** — some portals require login before showing the registration form. Student must create an account manually on first visit, then extension fills all fields on subsequent form pages.
- **IBCC certificate** — Cambridge/A-Level students must obtain an IBCC equivalence certificate separately — the extension cannot apply for this.

## Tech Stack
- **Runtime:** Next.js 16.1.1 (App Router) + React 19.2.3
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Extension:** Chrome Manifest V3 — vanilla JS, no build step
- **AI:** Local Ollama (llama3) for field mapping + SOP drafting
- **Styling:** CSS Modules (website) + vanilla CSS (extension)
- **Scraping:** Puppeteer + Cheerio (dev scripts)
- **Build Agent:** Google Antigravity + Claude Opus 4.6
