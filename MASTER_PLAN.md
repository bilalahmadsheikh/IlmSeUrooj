# UniMatch — Master Build Plan
# Reference document for all phases. Used by /phase and /continue workflows.
# The agent reads this to know exactly what to build and in what order.

---

## PHASE 1: Supabase Foundation
**Goal:** Database schema live, RLS secured, auth working, basic API routes responding.

### Tasks

**1.1 — Create Supabase Tables (via MCP)**

Table: `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  father_name TEXT,
  cnic TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT DEFAULT 'Pakistani',
  religion TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  fsc_marks INTEGER,
  fsc_total INTEGER DEFAULT 1100,
  fsc_percentage DECIMAL(5,2),
  matric_marks INTEGER,
  matric_total INTEGER DEFAULT 1050,
  matric_percentage DECIMAL(5,2),
  board_name TEXT,
  passing_year INTEGER,
  school_name TEXT,
  photo_url TEXT,
  cnic_url TEXT,
  result_card_url TEXT,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_only" ON profiles FOR ALL USING (auth.uid() = id);
```

Table: `field_maps`
```sql
CREATE TABLE field_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  university_slug TEXT NOT NULL,
  mapping JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  verified_working BOOLEAN DEFAULT TRUE
);
-- No RLS — field maps are shared/public data
```

Table: `applications`
```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  university_slug TEXT NOT NULL,
  university_name TEXT NOT NULL,
  portal_domain TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','account_created','form_filling',
    'awaiting_review','submitted','error',
    'accepted','rejected','waitlisted'
  )),
  portal_username TEXT,
  portal_password TEXT,
  confirmation_number TEXT,
  program_applied TEXT,
  remembered_answers JSONB DEFAULT '{}',
  error_message TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_applications_only" ON applications
  FOR ALL USING (auth.uid() = student_id);
```

Table: `remembered_answers`
```sql
CREATE TABLE remembered_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  field_label TEXT NOT NULL,
  field_value TEXT NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,
  UNIQUE(student_id, field_label)
);
ALTER TABLE remembered_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_answers_only" ON remembered_answers
  FOR ALL USING (auth.uid() = student_id);
```

**1.2 — Create Storage Bucket**
- Bucket name: `student-documents`
- Public: false
- RLS: user can only read/write `{user_id}/*`
- Allowed MIME: image/*, application/pdf
- Max size: 10MB

**1.3 — API Routes**

`src/app/api/profile/route.ts` — GET returns profile, PUT updates it
`src/app/api/applications/route.ts` — GET lists apps, POST creates one  
`src/app/api/applications/[id]/route.ts` — PATCH updates status/confirmation
`src/app/api/fieldmap/route.ts` — GET returns cached map, POST triggers AI mapping
`src/app/api/remembered-answers/route.ts` — GET returns answers, POST saves new one

All routes use Supabase session validation. Return proper error codes.

### Acceptance Criteria
- [ ] All 4 tables exist in Supabase with correct columns
- [ ] RLS enabled and tested on profiles, applications, remembered_answers
- [ ] Storage bucket exists
- [ ] GET /api/profile returns 200 with profile data when authenticated
- [ ] GET /api/profile returns 401 when not authenticated
- [ ] SCHEMA.md updated with all tables

---

## PHASE 2: Chrome Extension Shell
**Goal:** Extension installs in Chrome, shows sidebar on university portals, authenticates with UniMatch.

### Tasks

**2.1 — manifest.json** (MV3)
- Permissions: storage, activeTab, scripting
- Host permissions: all 28 university domains
- Content scripts: content.js + sidebar.css on all URLs
- Background: service-worker.js
- Popup: popup.html

**2.2 — Auth via Supabase**
- service-worker.js: stores Supabase access_token in chrome.storage.local
- Auth flow: popup → user clicks "Sign in" → opens /extension-auth page on UniMatch site
  → user logs in → page sends token to extension via `chrome.runtime.sendMessage`
  → extension stores token
- Token refresh: check expiry on each use, refresh if needed

**2.3 — University Detection**
content.js checks `window.location.hostname` against known university domains.
If match found → initialize sidebar, fetch field map from API.

Known domains to detect:
```javascript
const UNIVERSITY_DOMAINS = {
  'admissions.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'nu.edu.pk': { slug: 'fast', name: 'FAST-NUCES' },
  'lums.edu.pk': { slug: 'lums', name: 'LUMS' },
  'comsats.edu.pk': { slug: 'comsats', name: 'COMSATS' },
  'iba.edu.pk': { slug: 'iba', name: 'IBA' },
  'giki.edu.pk': { slug: 'giki', name: 'GIKI' },
  'ned.edu.pk': { slug: 'ned', name: 'NED' },
  'bahria.edu.pk': { slug: 'bahria', name: 'Bahria' },
  'uet.edu.pk': { slug: 'uet', name: 'UET' },
  'pieas.edu.pk': { slug: 'pieas', name: 'PIEAS' },
  'szabist.edu.pk': { slug: 'szabist', name: 'SZABIST' },
  'itu.edu.pk': { slug: 'itu', name: 'ITU' },
  'aku.edu': { slug: 'aku', name: 'Aga Khan University' },
};
```

**2.4 — Sidebar UI**
Fixed panel on right side of page (position: fixed, right: 0, top: 50%, transform: translateY(-50%)).
Width: 280px. Collapsible via toggle button.

States to show:
- `not_recognized` → "This university isn't in our list yet. Add it?"
- `not_logged_in` → "Sign in to UniMatch to autofill"
- `loading` → spinner while fetching profile + field map
- `ready` → profile loaded, show "Autofill Now" button + field counts
- `filled` → show green count + amber count + "Pre-submit Check" button
- `submitted` → green checkmark, confirmation number input

Colors: bg #0c0e0b, accent #4ade80, manual fields #fbbf24

**2.5 — Popup (popup.html)**
Shows list of current applications with status badges.
"Open Application" button per university → opens their portal.

### Acceptance Criteria
- [ ] Extension loads in Chrome without console errors
- [ ] Sidebar appears on admissions.nust.edu.pk
- [ ] Auth flow works: sign in → token stored in chrome.storage.local
- [ ] Sidebar shows correct state based on auth status
- [ ] Popup shows application list

---

## PHASE 3: AI Field Mapping Engine
**Goal:** Extension automatically detects form fields and fills them from student profile.

### Tasks

**3.1 — /api/fieldmap endpoint**
POST body: `{ domain: string, formHTML: string }`

Flow:
1. Check `field_maps` table for cached entry
2. If cached → return immediately
3. If not → call Claude Haiku with this prompt:

```
You are mapping a university registration form to a student profile schema.

PROFILE FIELDS:
full_name, father_name, cnic (format: XXXXX-XXXXXXX-X), date_of_birth,
gender, email, phone, address, city, province, fsc_marks, fsc_total,
fsc_percentage, matric_marks, matric_total, matric_percentage,
board_name, passing_year, school_name

FORM HTML: [formHTML trimmed to 6000 chars]

Return ONLY a JSON array:
[{
  "selector": "#css-selector or [name=fieldname]",
  "profileKey": "exact_profile_field",
  "label": "Human readable label",
  "required": true/false,
  "inputType": "text|select|file|radio|checkbox|textarea",
  "transform": null | "percent_to_marks_1100" | "percent_to_marks_1050" | 
               "marks_to_percent" | "date_dmy" | "date_ymd" | 
               "phone_pak" | "cnic_dashes" | "cnic_no_dashes"
}]
Only include fields you are confident about.
```

4. Store in `field_maps` table
5. Return mapping

**3.2 — Autofill engine in content.js**

```javascript
// Transform functions
const TRANSFORMS = {
  percent_to_marks_1100: (v) => Math.round(parseFloat(v) * 11),
  percent_to_marks_1050: (v) => Math.round(parseFloat(v) * 10.5),
  marks_to_percent: (v, total) => ((v/total)*100).toFixed(2),
  date_dmy: (v) => { const d=new Date(v); return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`; },
  date_ymd: (v) => v,
  phone_pak: (v) => v.startsWith('0') ? v : '0'+v,
  cnic_dashes: (v) => v.replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3'),
  cnic_no_dashes: (v) => v.replace(/-/g, ''),
};

// CRITICAL: React/Vue portals need native event simulation
async function fillInput(el, value) {
  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;
  nativeSetter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
  await new Promise(r => setTimeout(r, 50 + Math.random()*100));
}
```

Visual feedback:
- Autofilled → `el.style.outline = '2px solid #4ade80'`
- Needs manual → `el.style.outline = '2px solid #fbbf24'`

**3.3 — Answer Memory**
When student manually fills any field NOT in field_map:
- On sidebar "Save Progress" click → scan all filled inputs
- For new field labels → ask "Remember this for future applications?"
- If yes → POST to /api/remembered-answers
- Next university → check remembered_answers first before showing field as "missing"

### Acceptance Criteria
- [ ] POST /api/fieldmap returns valid JSON mapping for NUST registration page
- [ ] Second call for same domain returns instantly from cache
- [ ] autofillForm() fills ≥ 6 fields correctly on NUST portal
- [ ] React-based portals (test on nu.edu.pk) also fill correctly
- [ ] Green/amber visual feedback visible on all fields
- [ ] Sidebar shows accurate "X filled, Y need input" count

---

## PHASE 4: Pre-Submit Review + Submission Tracking
**Goal:** Student reviews form in sidebar before submitting. Confirmations captured.

### Tasks

**4.1 — Pre-submit validator in content.js**
Scan form before student submits. Check:
- All required fields (from field_map.required=true) are non-empty
- CNIC format valid: `/^\d{5}-\d{7}-\d{1}$/ or /^\d{13}$/`
- Marks don't exceed total (fsc_marks ≤ fsc_total)
- No obvious test data ("test", "asdf", "123")

Show in sidebar:
- ✅ Green list: filled fields
- ⚠️ Amber list: needs input (with "Jump to field" button)
- ❌ Red list: validation errors with description
- Big green "Looks Good — Submit When Ready!" (only when zero issues)

**4.2 — Submission detection**
Listen for form submission. Also intercept fetch/XHR for AJAX portals:
```javascript
document.addEventListener('submit', handleSubmit, true);
// intercept fetch for AJAX portals
const origFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await origFetch(...args);
  if (res.ok && isSubmissionUrl(args[0])) handleSuccess(res);
  return res;
};
```

On successful submission:
- Read confirmation number from page
- Send to background: `chrome.runtime.sendMessage({ type: 'SUBMITTED', slug, confirmationNumber })`
- Background → PATCH /api/applications/{id} with status='submitted', confirmation_number

**4.3 — Application Dashboard page**
`src/app/applications/page.tsx`
- Table of all applications: university, status badge, confirmation number, date
- Status colors: pending=grey, submitted=green, accepted=bright green, error=red
- "Open Portal" button per row → opens university portal URL

### Acceptance Criteria
- [ ] Pre-submit check catches empty required fields
- [ ] Pre-submit check catches CNIC format errors
- [ ] Form submission detected on FAST portal (test this specifically)
- [ ] Confirmation number extracted from success page and saved to Supabase
- [ ] Dashboard page shows all applications with correct status badges

---

## PHASE 5: Manual Fields + SOP Helper
**Goal:** Good UX for fields AI can't fill. AI-assisted essay drafting.

### Tasks

**5.1 — "Fill Gap" modal**
When student clicks amber (missing) field in sidebar:
- Modal with field name
- Check remembered_answers for this label → show previous answer if exists
- Text input to type new value
- "Save for future" checkbox (default: checked)
- "Fill & Close" button → fills the field in the form

**5.2 — SOP/Essay AI helper**
For textarea fields with >200 char capacity (likely essays):
- Show "✨ Draft with AI" button next to the field
- Click → modal opens with field label shown
- "Generate" → POST to /api/sop-draft with { university, program, profile }
- Stream the response back to modal textarea
- Student MUST edit before "Insert" button activates (require at least 20 char change)
- Never silently auto-insert essays

**5.3 — Password vault**
On detecting password + confirm-password field pair:
- Auto-generate: 2 words + 3 numbers + symbol (e.g. "LahoreNUST#47")
- Show in sidebar: "Password generated for NUST" with copy button
- POST to /api/applications → store encrypted in portal_password column
- Show in dashboard under application details

### Acceptance Criteria
- [ ] Fill Gap modal works and saves answers
- [ ] Remembered answers appear for same field label at different university
- [ ] SOP draft generates contextually relevant content
- [ ] Insert button requires editing (not just raw AI output)
- [ ] Password visible in dashboard under application details

---

## PHASE 6: All Universities + Polish
**Goal:** Verified working on all 28 portals. Docs complete. Ready for real students.

### Tasks

**6.1 — University config file**
`extension/universities.js` — complete config for all 28:
```javascript
export const UNIVERSITIES = {
  nust: {
    slug: 'nust', name: 'NUST',
    domain: 'admissions.nust.edu.pk',
    registrationUrl: 'https://admissions.nust.edu.pk/register',
    submissionSelectors: ['button[type=submit]', '.submit-btn'],
    confirmationSelectors: ['.confirmation-number', '#appId'],
    notes: 'Standard HTML forms',
    verified: false,  // agent updates to true after testing
  },
  // ... all 28 universities
};
```

**6.2 — Test each university portal**
For each university (use /fixuni workflow):
1. Navigate to registration page in browser
2. Run AI field mapping
3. Verify ≥ 5 fields detected and fill correctly
4. Mark `verified: true` in universities.js
5. Note any special handling needed

**6.3 — Final documentation pass**
Ensure all docs are accurate and readable:
- SCHEMA.md: complete and current
- PROGRESS.md: shows all phases complete
- DECISIONS.md: all major choices documented
- Each PHASE_LOGS/phase-N file exists

Create `docs/README.md` — human-readable project overview for anyone new to the codebase.

### Acceptance Criteria
- [ ] All 28 universities have verified=true in universities.js
- [ ] Each university has at least 5 fields autofilling correctly
- [ ] All docs are up to date and accurate
- [ ] Extension loads without errors
- [ ] Dashboard shows application status correctly
- [ ] docs/README.md exists and is comprehensive

---

## PHASE STATUS TRACKING

Update `docs/agent/PROGRESS.md` after each phase with:
- Phase number and name
- Date completed
- What was built
- Any issues encountered
- Next phase to start
