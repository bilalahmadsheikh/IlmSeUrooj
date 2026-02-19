# IlmSeUrooj — GitHub Actions Workflows

Complete documentation of all CI/CD workflows that automate university data management.

---

## Workflow Overview

| Workflow | File | Schedule | Purpose |
|----------|------|----------|---------|
| [Update University Data](#1-update-university-data) | `update-university-data.yml` | Every 20 days + bimonthly | Scrape & update deadlines, fees, test dates |
| [Semester Data Update](#2-semester-data-update) | `semester-data-update.yml` | March 1 & Sep 1 | Semester-cycle refresh of all data |
| [Annual Merit Update](#3-annual-merit-update) | `annual-merit-update.yml` | Nov 1 yearly | Scrape new merit cutoffs after results |
| [Website Health Check](#4-website-health-check) | `website-health-check.yml` | Weekly (Mondays) | Verify all university URLs are alive |

---

## 1. Update University Data

**File**: `.github/workflows/update-university-data.yml`
**Trigger**: Scheduled (two-tier) + Manual dispatch

### Tiered Schedule

| Tier | Cron | Frequency | Fields Updated |
|------|------|-----------|----------------|
| **Critical** | `0 2 */20 * *` | Every 20 days | `admissions.deadline`, `admissions.testDate`, `admissions.testName` |
| **General** | `0 2 1 */2 *` | 1st of every other month | `avgFee`, `website`, `admissions.applyUrl`, `description` |

### How It Works

```
1. Determine Tier (from cron or manual input)
      ↓
2. Scrape university websites (university-scraper.js)
      ↓
3. Parse current universities.js
      ↓
4. Merge only changed fields
      ↓
5. Validate (schema-validator + compare-data)
      ↓
6. Create PR with AI review comment
      ↓
7. Notify on success/failure
```

### Jobs

| Job | Purpose | Condition |
|-----|---------|-----------|
| `fetch-and-validate` | Scrape data, run validators, check for changes | Always |
| `create-pr` | Create PR with tier-labeled title + AI review | Only if changes detected |
| `notify-on-failure` | Email notification on failure | On failure |
| `notify-on-success` | Email notification with PR link | On success with changes |

### Manual Trigger
Go to **Actions** → **Update University Data** → **Run workflow** → Choose tier:
- `critical` — Deadlines and test dates only
- `general` — Fees, websites, descriptions
- `all` — Everything

### Environment Variables
| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_VERSION` | `20` | Node.js runtime |
| `NOTIFICATION_EMAIL` | `ba8516127@gmail.com` | Alert recipient |
| `DATA_TIER` | `critical`/`general`/`all` | Which fields to scrape |

---

## 2. Semester Data Update

**File**: `.github/workflows/semester-data-update.yml`
**Trigger**: March 1 & September 1 (start of each admission cycle)

### Purpose
Full refresh of all university data at the start of each semester cycle. Runs all validators, regenerates baseline, and sends a comprehensive report.

### Jobs
| Job | Purpose |
|-----|---------|
| `full-data-refresh` | Fetch all tiers, validate, compare against baseline |
| `create-pr` | Create PR with full semester update |
| `notify` | Email summary of changes |

---

## 3. Annual Merit Update

**File**: `.github/workflows/annual-merit-update.yml`
**Trigger**: November 1 yearly (after merit lists are published)

### Purpose
Scrape new merit cutoffs after the annual admission cycle completes. Updates:
- Closing merit aggregates/positions
- Merit history data
- Competitive score thresholds

### Data Sources
| University | Merit Source |
|------------|-------------|
| FAST | learnospot.com, nu.edu.pk |
| COMSATS | paklearningspot.com |
| NUST | paklearningspot.com |
| UET | paklearningspot.com |
| GIKI | paklearningspot.com |

---

## 4. Website Health Check

**File**: `.github/workflows/website-health-check.yml`
**Trigger**: Every Monday at 3 AM UTC

### Purpose
Verify that all university website URLs and admission portal links are still valid. Reports broken links via GitHub issue.

### What It Checks
- Official university websites (28 URLs)
- Admission portal URLs
- Apply URLs from `admissions.applyUrl`
- Fee structure pages

### Output
- Creates GitHub issue if any URLs are broken
- Attaches report as artifact
---

## 5. Deadline Verification

**File**: `.github/workflows/deadline-verification.yml`
**Trigger**: Every 20 days (`0 3 */20 * *`) or Manual dispatch

### Purpose
Dedicated workflow for ensuring admission deadlines are always accurate. It uses a specialized scraper to check official university dates and automatically updates the system if changes are verified.

### Key Features
- **Auto-Update**: Commits confirmed changes directly to the repository (no manual PR needed)
- **Fail-Safe**: If a university site is down, it keeps existing data and only updates the `lastVerified` timestamp
- **Sorted Data**: Always maintains the correct date order in `universities.js`
- **Session-Aware**: Intelligently rejects "Spring" semester dates when looking for "Fall" deadlines

### Output
- Updates `universities.js` with new dates and timestamps
- Uploads verification report artifact (`reports/deadline-verification-report.md`)
- Sends email notification only on failure

---

## Validation Scripts (Used by All Workflows)

| Script | Path | Purpose |
|--------|------|---------|
| `schema-validator.js` | `scripts/validators/` | Validates data types, required fields, allowed values |
| `compare-data.js` | `scripts/validators/` | Diffs current data against baseline snapshot |
| `data-integrity.js` | `scripts/validators/` | Cross-checks relationships between fields |
| `data-target-map.js` | `scripts/validators/` | Maps which fields each workflow targets |
| `auto-review.js` | `scripts/validators/` | AI-style review of changes for PR comments |

## Scraper Scripts

| Script | Path | Purpose |
|--------|------|---------|
| `university-scraper.js` | `scripts/scrapers/` | Cheerio-based scraper with per-university configs |
| `merit-scraper.js` | `scripts/scrapers/` | Scrapes merit cutoff data from community sources |
| `semester-scrapers.js` | `scripts/scrapers/` | Semester-specific data scrapers |

## Utility Scripts

| Script | Path | Purpose |
|--------|------|---------|
| `fetch-university-data.js` | `scripts/` | Pipeline orchestrator (scrape → parse → merge → write) |
| `generate-baseline.js` | `scripts/` | Generates baseline snapshot for comparison |
| `generate-merit-report.js` | `scripts/` | Generates merit analysis reports |
| `parse-universities.js` | `scripts/utils/` | Parses universities.js into structured data |
| `url-checker.js` | `scripts/utils/` | Validates URL reachability |

---

## Secrets Required

| Secret | Used By | Purpose |
|--------|---------|---------|
| `GITHUB_TOKEN` | All workflows | Create PRs, issues, comments |
| `SMTP_USERNAME` | semester-data-update | Email notifications |
| `SMTP_PASSWORD` | semester-data-update | Email notifications |

---

## Running Locally

```bash
# Run the scraper (dry run)
DATA_TIER=critical DRY_RUN=true node scripts/fetch-university-data.js

# Run validators
node scripts/validators/schema-validator.js
node scripts/validators/compare-data.js

# Regenerate baseline
node scripts/generate-baseline.js

# Check URLs
node scripts/utils/url-checker.js
```
