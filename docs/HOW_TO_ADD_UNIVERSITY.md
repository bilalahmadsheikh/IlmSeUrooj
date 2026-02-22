# How to Add a New University

Step-by-step guide for adding autofill support for a new Pakistani university portal.

---

## 1. Navigate to the Application Form

Open Chrome and go to the university's **actual registration/application form** — not the admissions homepage, but the page with input fields.

> Some portals require you to create an account first. Do that manually, then navigate to the application form.

---

## 2. Discover All Form Fields

Open Chrome DevTools Console (F12 → Console) and paste this script:

```js
const map = {};
document.querySelectorAll('input, select, textarea').forEach(el => {
  const label = 
    el.labels?.[0]?.textContent?.trim() ||
    el.placeholder ||
    el.getAttribute('aria-label') ||
    (el.getAttribute('aria-labelledby') && 
      document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) ||
    el.name ||
    el.id ||
    'unknown';
  const selector = 
    el.id ? `#${el.id}` :
    el.name ? `[name="${el.name}"]` :
    el.className ? `.${el.className.trim().split(/\s+/)[0]}` : null;
  if (selector) map[label.trim()] = { 
    selector, 
    type: el.type || el.tagName.toLowerCase(),
    required: el.required 
  };
});
console.log(JSON.stringify(map, null, 2));
```

Copy the output — this is your field inventory.

---

## 3. Create the Config File

Create `extension/universities/[slug].js` using this template:

```js
/**
 * [University Full Name] — Autofill Configuration
 * Portal: [portal domain]
 * Last mapped: [YYYY-MM-DD]
 */

const [SLUG]_CONFIG = {
    slug: '[slug]',
    name: '[Short Name]',
    fullName: '[Full University Name]',
    registrationUrl: 'https://[portal-domain]',
    loginUrl: 'https://[portal-domain]/login',
    portalDomains: ['[portal-domain]'],
    formType: 'standard',  // or 'requires_login_first' or 'multistep'
    fieldMap: {
        // Profile key → CSS selector(s)
        // Use comma-separated selectors for fallbacks
        full_name: '#fullName, [name="full_name"]',
        father_name: '#fatherName, [name="father_name"]',
        cnic: '#cnic, [name="cnic"]',
        date_of_birth: '#dob, [name="dob"]',
        gender: '#gender, [name="gender"]',
        email: '#email, [type="email"]',
        phone: '#phone, [name="phone"]',
        address: '#address, [name="address"]',
        city: '#city, [name="city"]',
        province: '#province, [name="province"]',
        fsc_marks: '#fscMarks, [name="fsc_marks"]',
        fsc_total: '#fscTotal, [name="fsc_total"]',
        matric_marks: '#matricMarks, [name="matric_marks"]',
        matric_total: '#matricTotal, [name="matric_total"]',
        board_name: '#board, [name="board"]',
        passing_year: '#year, [name="passing_year"]',
    },
    selectOptions: {
        // For <select> dropdowns: map profile values to option values
        gender: { male: 'Male', female: 'Female' },
        province: {
            punjab: 'Punjab', sindh: 'Sindh',
            kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan',
            islamabad: 'Islamabad',
            gilgit_baltistan: 'Gilgit-Baltistan',
            azad_kashmir: 'Azad Jammu & Kashmir'
        }
    },
    transforms: {
        // Format transforms for specific fields
        cnic: 'cnic_dashes',        // 12345-1234567-1
        phone: 'phone_pak',         // 03XX-XXXXXXX
        date_of_birth: 'date_dmy'   // DD/MM/YYYY
    },
    verified: false,
    lastVerified: null,
    notes: ''
};
```

---

## 4. Available Profile Keys

Map each discovered field to one of these profile keys:

| Profile Key | Type | Description |
|------------|------|-------------|
| `full_name` | text | Student's full name |
| `first_name` | virtual | First word of full_name |
| `last_name` | virtual | Last word of full_name |
| `middle_name` | virtual | Middle words of full_name |
| `father_name` | text | Father's name |
| `mother_name` | text | Mother's name |
| `cnic` | text | CNIC number |
| `father_cnic` | text | Father's CNIC |
| `date_of_birth` | date | Date of birth |
| `gender` | text | Male/Female |
| `nationality` | text | Default: Pakistani |
| `religion` | text | Student's religion |
| `email` | text | Primary email |
| `phone` | text | Mobile number |
| `whatsapp` | text | WhatsApp number |
| `address` | text | Street address |
| `city` | text | City |
| `province` | text | Province |
| `postal_code` | text | Postal code |
| `domicile_province` | text | Domicile province |
| `domicile_district` | text | Domicile district |
| `blood_group` | text | Blood group |
| `father_occupation` | text | Father's occupation |
| `guardian_phone` | text | Guardian phone |
| `fsc_marks` | integer | FSc marks obtained |
| `fsc_total` | integer | FSc total marks (default 1100) |
| `fsc_percentage` | numeric | FSc percentage |
| `fsc_part1_marks` | integer | FSc Part-I marks |
| `fsc_projected_marks` | integer | Projected full FSc marks |
| `fsc_projected_percentage` | numeric | Projected FSc percentage |
| `fsc_stream` | text | FSc group (Pre-Eng, Pre-Med, etc.) |
| `fsc_year` | integer | FSc passing year |
| `fsc_board` | text | FSc board name |
| `fsc_roll_no` | text | FSc roll number |
| `fsc_school` | text | College/school name |
| `matric_marks` | integer | Matric marks |
| `matric_total` | integer | Matric total (default 1050) |
| `matric_percentage` | numeric | Matric percentage |
| `matric_year` | integer | Matric passing year |
| `matric_board` | text | Matric board |
| `matric_roll_no` | text | Matric roll number |
| `matric_school` | text | Matric school name |
| `ibcc_equivalent_inter` | numeric | IBCC intermediate equivalent % |
| `ibcc_equivalent_matric` | numeric | IBCC matric equivalent % |
| `net_score` | numeric | NET score |
| `sat_score` | integer | SAT score |
| `ecat_score` | numeric | ECAT score |
| `portal_email` | text | Email for portal accounts |
| `portal_password` | text | Password for portal accounts |

---

## 5. Handle Special Cases

### Select Dropdowns
Add `selectOptions` mapping. Keys are profile values (lowercase), values are the `<option>` text the portal expects.

### ASP.NET Portals
Use suffix selectors: `[name$="fieldName"]` — ASP.NET prepends container IDs to field names.

### React/Vue Portals
The autofill engine already handles React/Vue by using native input setters + dispatching proper events. No special handling needed.

### Multi-step Forms
Set `formType: 'multistep'` and test each step. The extension re-scans fields when the DOM changes.

---

## 6. Register in index.js

Open `extension/universities/index.js` and add your config:

```js
ALL_UNIVERSITIES.push({
    slug: '[slug]',
    name: '[Short Name]',
    fullName: '[Full Name]',
    registrationUrl: 'https://[portal-domain]',
    loginUrl: 'https://[portal-domain]/login',
    portalDomains: ['[portal-domain]'],
    formType: 'standard',
    fieldMap: { /* ... copy from step 3 ... */ },
    selectOptions: { /* ... */ },
    transforms: { /* ... */ },
    verified: false,
    lastVerified: null,
    notes: ''
});
```

Also add the domain to `manifest.json` → `host_permissions`:
```json
"*://*.example.edu.pk/*"
```

---

## 7. Test

1. Load extension: `chrome://extensions` → Load unpacked → select `extension/`
2. Navigate to the portal
3. Click Autofill in the sidebar
4. Verify green highlights on filled fields
5. Check amber highlights on fields needing manual input
6. Fix any selectors that didn't match

---

## 8. Update Config After Testing

```js
verified: true,
lastVerified: '2026-MM-DD',
notes: 'Description of any special handling'
```

---

## 9. Update Documentation

Add a row to `docs/UNIVERSITY_STATUS.md` with the new university details.
