# Workflow Run Summary – What Each Workflow Successfully Updates

This report is based on running all workflow **scripts locally** (equivalent to what runs in GitHub Actions) and inspecting outputs and repo changes.

---

## 1. Website Health Check (`website-health-check.yml`)

**What it runs:** Build, lint, `data-integrity.js`, `url-checker.js`; generates `reports/health-report.md`; may create a GitHub issue and send email on failure.

**What it updates in the repo:** **Nothing.** It does not modify any source or data files.

**This run:**
- **Data integrity:** Passed (28 universities, AdmissionPredictor cross-check OK).
- **URL checker:** Exit code 1 – 9/14 URLs OK, 5 failed (403, cert, ENOTFOUND, timeout). Workflow uses `continue-on-error: true` for these steps.

**Conclusion:** This workflow only **validates** and produces a health report artifact. It does not successfully update any data.

---

## 2. Update University Data (`update-university-data.yml`)

**What it runs:** `fetch-university-data.js` → scrapes admission/fee pages; then `updateDataFiles()` writes to `src/data/universities.js` via the AST manipulator (admissions: deadline, testDate, testName, applyUrl; fees: avgFee). Then schema validator, auto-review; if there are changes under `src/data/`, it creates a PR.

**What it is designed to update:** `src/data/universities.js` – per-university `admissions` and fee-related fields.

**This run:**
- Fetcher ran for 7 universities (FAST, NUST, COMSATS, LUMS, GIKI, IBA, UET). Most admission/fee scrapes failed (403, 404, timeout, cert).
- **0 universities updated.** Reasons:
  - FAST: script looks up by shortName `"FAST-NUCES"` but `universities.js` has campus-specific shortNames (`"FAST Isb"`, `"FAST Lhr"`, etc.), so “University not found.”
  - Others: “Skipping … no data to update” (no deadline/avgFee scraped).
- Only file written: `reports/fetch-results.json`. No change to `src/data/`.

**Conclusion:** In this run it did **not** successfully update any repo data. For it to update data, scrapes must return deadline/fee and shortNames in the script must match `universities.js` (e.g. per-campus vs single “FAST-NUCES”).

---

## 3. Semester Data Update (`semester-data-update.yml`)

**What it runs:** `recruiter-scraper.js`, `salary-scraper.js`, `facilities-scraper.js`, then `semester-data-validator.js`. If `git diff src/data/` is non-empty, it creates a PR.

**What it is designed to update:** The workflow description says “Top Recruiters, Salaries, Facilities,” but the **scripts only write to `reports/`**, not to `src/data/`:
- `recruiter-scraper.js` → `reports/recruiter-data.json`
- `salary-scraper.js` → `reports/salary-data.json`
- `facilities-scraper.js` → `reports/facilities-data.json`
- `semester-data-validator.js` → `reports/semester-validation-report.json` (and reads the three JSONs above).

**This run:**
- Recruiter/facilities: all target URLs failed (403, 404, cert); JSONs still written (empty or error payloads).
- Salary: external sites failed; script used **fallback** data and wrote `reports/salary-data.json` with static values.
- Validator: passed (it only validates the report JSONs).

**Conclusion:** This workflow **does not update any repo data**. Nothing writes to `src/data/`, so `git diff src/data/` is always empty and no PR is ever created from data updates. It only produces report files under `reports/`.

---

## 4. Annual Merit List Update (`annual-merit-update.yml`)

**What it runs:** `merit-scraper.js` (writes `reports/merit-report.json`, `reports/merit-report.md`), `generate-merit-report.js` (overwrites `reports/merit-report.md`), uploads report artifact, creates a GitHub issue for manual review, optional email.

**What it updates in the repo:** **Nothing.** The workflow explicitly creates an issue and asks for **manual** updates to:
- `src/components/AdmissionPredictor/AdmissionPredictor.js`
- `src/data/universities.js`
- `docs/DATA-SOURCES.md`

**This run:**
- Merit scraper: FAST scraped successfully; COMSATS, NUST, UET, GIKI failed (e.g. Puppeteer/Chrome not available for fallback).
- Reports written: `reports/merit-report.json`, `reports/merit-report.md`.
- `generate-merit-report.js` ran and regenerated `reports/merit-report.md`.

**Conclusion:** This workflow **does not update any repo data**. It successfully produces merit reports and an issue for manual review; all actual data updates are intended to be done by a human.

---

## 5. Deadline Verification (`deadline-verification.yml`)

**What it runs:** `deadline-scraper.js` – reads `upcomingDeadlines` from `src/data/universities.js`, fetches each university’s URLs, extracts dates, updates `lastChecked` and (when appropriate) deadline dates in the same file, then writes back. Also writes `reports/deadline-verification-report.json` and `.md`. If there are changes, the workflow commits and pushes `src/data/universities.js`.

**What it is designed to update:** `src/data/universities.js` – the **`upcomingDeadlines`** array (timestamps and deadline dates).

**This run:**
- Scraper ran and hit many URLs; some 403/fetch failed, some succeeded (e.g. UET Lahore, UET Taxila had dates but were skipped as past/Spring).
- **Write to `universities.js` failed** with `EPERM: operation not permitted` (local/sandbox restriction). So in this run no file was actually updated and no deadline report files were written (script exits before that on write failure).

**Conclusion:** In CI (where the write is allowed), this workflow **can** successfully update `src/data/universities.js` (only the `upcomingDeadlines` array). In this local run it did not update anything due to the write permission error.

---

## Summary Table

| Workflow                 | Updates repo data? | What it can update              | This run result                          |
|--------------------------|--------------------|----------------------------------|-----------------------------------------|
| Website Health Check     | No                 | Nothing                          | Validates only; URL check had failures   |
| Update University Data   | Yes (when scrapes + match) | `universities.js` (admissions, fees) | 0 updates (scrape/shortName mismatch)   |
| Semester Data Update     | No                 | Nothing (only reports/)          | Reports only; no `src/data` writes       |
| Annual Merit Update      | No                 | Nothing (manual per issue)       | Reports + issue only                     |
| Deadline Verification    | Yes (in CI)        | `universities.js` (upcomingDeadlines) | No update (EPERM on write locally)      |

**Bottom line:**  
- **Actually update repo data (when conditions are right):** only **Update University Data** (admissions/fees in `universities.js`) and **Deadline Verification** (`upcomingDeadlines` in `universities.js`).  
- In this run, **no workflow successfully modified any file under `src/data/`**: update-university-data had 0 updates; deadline-verification failed on write; the others don’t write to repo data at all.
