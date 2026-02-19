# IlmSeUrooj — Known Shortfalls & Issues to Fix

Current known issues, bugs, and areas that need improvement. This is a living document — check items off as they get resolved.

---

## 🔴 Critical Issues

### 1. Scraper URL Failures
Several university websites block automated requests or have changed URL structures.

| University | Error | Root Cause |
|------------|-------|------------|
| FAST-NUCES | 403 Forbidden | Anti-bot protection (Cloudflare) |
| IBA Karachi | 404 Not Found | Admission page moved or restructured |
| NED University | 403 Forbidden | Server blocks non-browser requests |
| Air University | 404 Not Found | URL structure changed |
| SZABIST | Fetch Failed | DNS/SSL issues or site down |
| GIKI | Fetch Failed | Admission portal blocks scraping |
| UET Lahore | 404 Not Found | Admission URL restructured |

**Impact**: 7 of 16 scrape targets fail, so these universities will never receive automated updates.

**Fix**: Either use headless browser (Puppeteer) for protected sites, or switch to manual data entry for these universities.

---

### 2. Regex Extraction Returns Empty Data
Most Pakistani university websites embed admission dates and fees in images, PDFs, or JavaScript-rendered content. The current Cheerio-based scraper parses only static HTML, so even successful page fetches often yield no extracted data.

**Impact**: Scraped data is empty for most universities, even on pages that load successfully.

**Fix Options**:
- Add Puppeteer for JS-rendered content
- Parse PDF admissions notices using `pdf-parse`
- Use OCR (Tesseract.js) for image-based date announcements
- Integrate with university APIs (if available)

---

### 3. Hardcoded Admission Deadlines
Deadline data in `universities.js` is manually entered and includes hardcoded dates like `"2026-06-15"`. If not updated, these go stale and mislead students.

**Impact**: Stale deadlines could cause students to miss or incorrectly plan for admissions.

**Fix**: Make the scraper update deadlines automatically, or add a "last verified" timestamp and display warnings for old data.

---

## 🟡 Moderate Issues

### 4. No Server-Side Rendering for SEO
The app is fully client-rendered. University data, deadlines, and comparison results are not available to search engine crawlers.

**Impact**: Poor Google discoverability. Students searching "FAST Islamabad admission 2026" won't find IlmSeUrooj.

**Fix**: Move data fetching into Next.js `page.js` server components or use `generateStaticParams()` for university pages.

---

### 5. No Individual University Pages
All 28 universities are shown on a single homepage. There's no `/university/fast-islamabad` route with dedicated SEO-optimized content.

**Impact**: Cannot rank for university-specific search queries. Users can't share links to specific universities.

**Fix**: Create dynamic routes `src/app/university/[slug]/page.js` using the university data.

---

### 6. Stale Merit Cutoff Data
Merit cutoff data is from the 2024 admission cycle. The `annual-merit-update.yml` workflow exists but the scraper hasn't been tested against community sources (learnospot, paklearningspot).

**Impact**: Students using the Admission Predictor may see outdated cutoffs.

**Fix**: Test and refine the merit scraper configs. Add "Data from: 2024 cycle" labels to the UI.

---

### 7. Missing Error Boundary Components
No React error boundaries exist. If a component crashes (e.g., bad data format), the entire page goes blank.

**Impact**: Poor user experience during edge cases.

**Fix**: Add `ErrorBoundary` components around each major section (SwipeCard, Predictor, etc.).

---

### 8. No Loading States
Components that depend on data (admissions deadlines, comparison tool) render instantly from static imports with no loading states. If data moves to a server, there are no skeleton loaders or spinners.

**Impact**: No degradation path if data fetching is moved to runtime.

**Fix**: Add Suspense boundaries and skeleton loaders.

---

### 9. localStorage Only Persistence
Saved universities are stored in `localStorage`. This means:
- Data is lost when clearing browser cache
- No cross-device sync
- No analytics on popular universities

**Impact**: Students lose their shortlists when switching devices.

**Fix**: Add optional user accounts with cloud persistence, or use hash-based shareable URLs.

---

### 10. SMTP Secrets Not Configured
The `semester-data-update.yml` workflow references `SMTP_USERNAME` and `SMTP_PASSWORD` secrets, but these may not be configured in the repository settings.

**Impact**: Email notifications from semester updates will fail silently.

**Fix**: Configure SMTP credentials in GitHub repository settings, or switch to GitHub-native notifications (issues/comments).

---

## 🟢 Minor Issues

### 11. No Accessibility Audit
No ARIA labels on swipe cards, filter dropdowns, or comparison tables. Keyboard navigation is limited to SearchableSelect.

**Impact**: Poor experience for screen reader users.

**Fix**: Add ARIA roles, labels, and live regions. Run Lighthouse accessibility audit.

---

### 12. No Automated Tests
Zero unit tests, integration tests, or E2E tests for any component.

**Impact**: Regressions go undetected. Refactoring is risky.

**Fix**: Add Jest + React Testing Library for component tests. Add Playwright for E2E flows.

---

### 13. `.gitignore` Encoding Issue (Fixed)
PowerShell's `echo` command appended UTF-16 encoded text to `.gitignore`. This has been fixed by rewriting the file with proper encoding.

**Status**: ✅ Resolved

---

### 14. No Image Optimization
University logos and background images (`map_newspaper*.png` — 600-800KB each) are not optimized. No WebP/AVIF alternatives, no `next/image` usage.

**Impact**: Slow page load on mobile networks.

**Fix**: Use `next/image` for all images. Convert treasure map backgrounds to WebP.

---

### 15. Department Data Coverage Gaps
`departmentData.js` has detailed comparison metrics for ~15 universities, but not all 28 entries have complete department data.

**Impact**: Some university comparisons show incomplete or missing data.

**Fix**: Research and add department data for remaining 13 university entries.

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Open |
| 🟡 Moderate | 7 | Open |
| 🟢 Minor | 5 | 1 Fixed, 4 Open |
| **Total** | **15** | **14 Open** |
