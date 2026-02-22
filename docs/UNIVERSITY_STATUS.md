# University Portal Status
Last checked: 2026-02-22

## How to read this table
- **File exists**: A config file exists in `extension/universities/`
- **URL confirmed**: We navigated to the URL and confirmed it loads
- **Fields mapped**: CSS selectors exist for form inputs
- **Verified working**: We loaded the extension, clicked Autofill, and confirmed fields filled (requires active admissions)
- **Portal type**: The technology/behavior of the portal

| # | University | Campus | Registration URL | File | URL OK | Fields | Verified | Portal Type | Notes |
|---|-----------|--------|-----------------|------|--------|--------|----------|-------------|-------|
| 1 | NUST | Islamabad | ugadmissions.nust.edu.pk | nust.js | ⚠️ | ✅ | ❌ | ASP.NET, login-first | Portal returns 403 outside admissions season |
| 2 | FAST-NUCES | Multi-campus | nu.edu.pk | fast.js | ⚠️ | ✅ | ❌ | Custom PHP | Seasonal portal |
| 3 | COMSATS | Multi-campus | admissions.comsats.edu.pk | comsats.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |
| 4 | LUMS | Lahore | admissions.lums.edu.pk | lums.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |
| 5 | IBA Karachi | Karachi | iba.edu.pk | iba.js | ⚠️ | ✅ | ❌ | Custom | Login-first |
| 6 | GIKI | Topi | giki.edu.pk | giki.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |
| 7 | NED | Karachi | admissions.neduet.edu.pk | ned.js | ⚠️ | ✅ | ❌ | ASP.NET | Seasonal portal |
| 8 | PIEAS | Islamabad | pieas.edu.pk | pieas.js | ⚠️ | ✅ | ❌ | Custom | Very small applicant pool |
| 9 | Habib University | Karachi | habib.edu.pk | habib.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |
| 10 | Aga Khan University | Karachi | aku.edu | aku.js | ⚠️ | ✅ | ❌ | Custom | International domain (.edu) |
| 11 | SZABIST Karachi | Karachi | szabist.edu.pk | szabist-khi.js | ⚠️ | ✅ | ❌ | Custom | — |
| 12 | SZABIST Islamabad | Islamabad | szabist-isb.edu.pk | szabist-isb.js | ⚠️ | ✅ | ❌ | Custom | — |
| 13 | Air University | Islamabad | au.edu.pk | airuni.js | ⚠️ | ✅ | ❌ | Custom | — |
| 14 | ITU Lahore | Lahore | itu.edu.pk | itu.js | ⚠️ | ✅ | ❌ | Custom | — |
| 15 | Bahria University | Multi-campus | bahria.edu.pk | bahria.js | ⚠️ | ✅ | ❌ | ASP.NET CMS | Login-first |
| 16 | UET Lahore | Lahore | uet.edu.pk | uet-lahore.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |
| 17 | UET Taxila | Taxila | admission.uettaxila.edu.pk | uet-taxila.js | ⚠️ | ✅ | ❌ | Custom | Seasonal portal |

> **⚠️ URL OK = ⚠️** means the base domain resolves but the actual application form is behind login or only available during admissions season. Manual navigation is needed to confirm the form.

## Portals Requiring Login Before Form
- **NUST** — must create account at ugadmissions.nust.edu.pk first
- **IBA Karachi** — separate login/registration before application
- **Bahria University** — CMS-based portal, login required

## Seasonal Portals
Most Pakistani university portals only go live during their admissions cycle (typically May–August for fall intake, December–January for spring). Outside these windows, portals may return 403, redirect to a static page, or show read-only information.

Seasonal: NUST, FAST, COMSATS, LUMS, GIKI, NED, PIEAS, Habib, UET Lahore, UET Taxila

## Verification Process
To verify a university (when admissions are open):
1. Load extension in Chrome (`chrome://extensions` → Load unpacked → `extension/`)
2. Create a test account on the portal using your profile email + password
3. Navigate to the application form
4. Click Autofill in the sidebar
5. Count green (filled) and amber (needs input) fields
6. For any field that doesn't fill: inspect element → copy real selector → update `extension/universities/[slug].js` → retest
7. Set `verified: true` and `lastVerified: date` in the config file
8. Update this table
