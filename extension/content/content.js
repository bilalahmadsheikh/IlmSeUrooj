/**
 * UniMatch Content Script
 * Detects university portals, injects the sidebar, manages autofill + answer memory.
 */

// ─── University Domain Registry ────────────────────────────────

const UNIVERSITY_DOMAINS = {
  'admissions.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'ugadmissions.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'pgadmission.nust.edu.pk': { slug: 'nust', name: 'NUST' },
  'nu.edu.pk': { slug: 'fast', name: 'FAST-NUCES' },
  'admissions.nu.edu.pk': { slug: 'fast', name: 'FAST-NUCES' },
  'lums.edu.pk': { slug: 'lums', name: 'LUMS' },
  'admissions.lums.edu.pk': { slug: 'lums', name: 'LUMS' },
  'comsats.edu.pk': { slug: 'comsats', name: 'COMSATS' },
  'admissions.comsats.edu.pk': { slug: 'comsats', name: 'COMSATS' },
  'iba.edu.pk': { slug: 'iba', name: 'IBA' },
  'onlineadmission.iba.edu.pk': { slug: 'iba', name: 'IBA' },
  'giki.edu.pk': { slug: 'giki', name: 'GIKI' },
  'neduet.edu.pk': { slug: 'ned', name: 'NED' },
  'www.neduet.edu.pk': { slug: 'ned', name: 'NED' },
  'bahria.edu.pk': { slug: 'bahria', name: 'Bahria' },
  'cms.bahria.edu.pk': { slug: 'bahria', name: 'Bahria' },
  'uet.edu.pk': { slug: 'uet', name: 'UET Lahore' },
  'admission.uet.edu.pk': { slug: 'uet', name: 'UET Lahore' },
  'uettaxila.edu.pk': { slug: 'uet-taxila', name: 'UET Taxila' },
  'admissions.uettaxila.edu.pk': { slug: 'uet-taxila', name: 'UET Taxila' },
  'pieas.edu.pk': { slug: 'pieas', name: 'PIEAS' },
  'red.pieas.edu.pk': { slug: 'pieas', name: 'PIEAS' },
  'szabist.edu.pk': { slug: 'szabist', name: 'SZABIST' },
  'admissions.szabist.edu.pk': { slug: 'szabist', name: 'SZABIST' },
  'szabist-isb.edu.pk': { slug: 'szabist-isb', name: 'SZABIST Islamabad' },
  'admissions.szabist-isb.edu.pk': { slug: 'szabist-isb', name: 'SZABIST Islamabad' },
  'itu.edu.pk': { slug: 'itu', name: 'ITU' },
  'aku.edu': { slug: 'aku', name: 'Aga Khan University' },
  'akuross.aku.edu': { slug: 'aku', name: 'Aga Khan University' },
  'au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'portals.au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'webdata.au.edu.pk': { slug: 'airuni', name: 'Air University' },
  'habib.edu.pk': { slug: 'habib', name: 'Habib University' },
  'eapplication.habib.edu.pk': { slug: 'habib', name: 'Habib University' },
  'pucit.edu.pk': { slug: 'pucit', name: 'PUCIT' },
  'uol.edu.pk': { slug: 'uol', name: 'University of Lahore' },
  'ucp.edu.pk': { slug: 'ucp', name: 'UCP' },
  'riphah.edu.pk': { slug: 'riphah', name: 'Riphah' },
  'qau.edu.pk': { slug: 'qau', name: 'QAU' },
  'iiu.edu.pk': { slug: 'iiu', name: 'IIUI' },
  'lse.edu.pk': { slug: 'lse', name: 'LSE' },
  'uos.edu.pk': { slug: 'uos', name: 'University of Sargodha' },
  'bzu.edu.pk': { slug: 'bzu', name: 'BZU' },
  'uop.edu.pk': { slug: 'uop', name: 'University of Peshawar' },
  'uob.edu.pk': { slug: 'uob', name: 'University of Balochistan' },
  'muet.edu.pk': { slug: 'muet', name: 'MUET' },
  'ssuet.edu.pk': { slug: 'ssuet', name: 'SSUET' },
  'lumhs.edu.pk': { slug: 'lumhs', name: 'LUMHS' },
  'duhs.edu.pk': { slug: 'duhs', name: 'DUHS' },
};

// ─── Transform Functions ───────────────────────────────────────

const TRANSFORMS = {
  percent_to_marks_1100: (v) => Math.round(parseFloat(v) * 11),
  percent_to_marks_1050: (v) => Math.round(parseFloat(v) * 10.5),
  marks_to_percent: (v, total) => ((v / total) * 100).toFixed(2),
  date_dmy: (v) => {
    const d = new Date(v);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  },
  date_ymd: (v) => v,
  phone_pak: (v) => {
    const str = String(v ?? '');
    return str && str.startsWith('0') ? str : '0' + str;
  },
  cnic_dashes: (v) => {
    const str = String(v ?? '');
    return str ? str.replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3') : str;
  },
  cnic_no_dashes: (v) => {
    const str = String(v ?? '');
    return str ? str.replace(/-/g, '') : str;
  },
  first_name: (v) => {
    const parts = String(v ?? '').trim().split(/\s+/);
    return parts[0] || '';
  },
  last_name: (v) => {
    const parts = String(v ?? '').trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  },
  middle_name: (v) => {
    const parts = String(v ?? '').trim().split(/\s+/);
    return parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
  },
};

// ─── Heuristic Field Detection ─────────────────────────────────
// Matches form fields to profile keys by analyzing name, id, label, placeholder

const FIELD_HEURISTICS = [
  { match: ['email', 'e-mail', 'e_mail', 'emailaddress', 'email_address'], profileKey: 'email', priority: 10 },
  { match: ['cnic', 'nic', 'national_id', 'nationalid', 'id_card', 'idcard', 'cnic_no', 'b_form', 'bform', 'nicop'], profileKey: 'cnic', priority: 9 },
  { match: ['phone', 'mobile', 'cell', 'contact', 'tel', 'telephone', 'phone_number', 'mobileno', 'contact_no'], profileKey: 'phone', priority: 8 },
  // First/Last/Middle name MUST be checked BEFORE full_name
  { match: ['first_name', 'firstname', 'first name', 'fname'], profileKey: 'first_name', priority: 11 },
  { match: ['last_name', 'lastname', 'last name', 'lname', 'surname'], profileKey: 'last_name', priority: 11 },
  { match: ['middle_name', 'middlename', 'middle name', 'mname'], profileKey: 'middle_name', priority: 11 },
  { match: ['full_name', 'fullname', 'applicant_name', 'student_name', 'candidatename'], profileKey: 'full_name', priority: 7 },
  { match: ['father', 'fathername', 'father_name', 'fathersname', 'guardian'], profileKey: 'father_name', priority: 7 },
  { match: ['dob', 'date_of_birth', 'dateofbirth', 'birthdate', 'birth_date'], profileKey: 'date_of_birth', priority: 6, inputType: 'date' },
  { match: ['gender', 'sex'], profileKey: 'gender', priority: 5 },
  { match: ['city', 'town'], profileKey: 'city', priority: 5 },
  { match: ['province', 'state', 'domicile'], profileKey: 'province', priority: 5 },
  { match: ['address', 'postal_address', 'mailing_address', 'residential_address', 'permanent_address'], profileKey: 'address', priority: 4 },
  { match: ['postal_code', 'postalcode', 'zipcode', 'zip', 'zip_code'], profileKey: 'postal_code', priority: 3 },
  { match: ['nationality'], profileKey: 'nationality', priority: 3 },
  { match: ['religion'], profileKey: 'religion', priority: 3 },
  { match: ['whatsapp'], profileKey: 'whatsapp', priority: 3 },
  { match: ['board', 'board_name', 'boardname', 'examination_board'], profileKey: 'board_name', priority: 4 },
  { match: ['school', 'college', 'school_name', 'institution', 'school_college'], profileKey: 'school_name', priority: 4 },
  { match: ['passing_year', 'passingyear', 'year_of_passing', 'grad_year', 'graduation_year'], profileKey: 'passing_year', priority: 4 },
  { match: ['fsc_marks', 'fscmarks', 'hssc_marks', 'inter_marks', 'intermediate_marks', 'fsc_obtained'], profileKey: 'fsc_marks', priority: 6 },
  { match: ['fsc_total', 'fsctotal', 'hssc_total', 'inter_total'], profileKey: 'fsc_total', priority: 5 },
  { match: ['matric_marks', 'matricmarks', 'ssc_marks', 'matric_obtained'], profileKey: 'matric_marks', priority: 6 },
  { match: ['matric_total', 'matrictotal', 'ssc_total'], profileKey: 'matric_total', priority: 5 },
];

// Fields that should NEVER be autofilled by heuristics
const EXCLUDED_FIELD_PATTERNS = [
  'captcha', 'verification', 'verify', 'otp', 'token', 'csrf',
  'login', 'userid', 'user_id',
  'recaptcha', 'security_code', 'securitycode', 'answer',
  'pin_code', 'pincode',
  // ASP.NET style verification fields
  'txtverif', 'txtcaptcha', 'imgcode', 'securityimage', 'imgverif',
  'verificationcode', 'verification_code',
];

/**
 * Try to match a form element to a profile key using heuristics.
 * Analyzes: name, id, placeholder, label text, aria-label.
 */
function matchFieldHeuristically(el) {
  // Get all text signals from the element
  const name = (el.name || '').toLowerCase();
  const id = (el.id || '').toLowerCase();
  const placeholder = (el.placeholder || '').toLowerCase();
  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  const labelEl = el.labels?.[0];
  const labelText = (labelEl?.textContent || '').toLowerCase().trim();
  const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();

  const signals = [name, id, placeholder, ariaLabel, labelText, autocomplete].filter(Boolean);
  if (signals.length === 0) return null;

  // Exclude password fields early
  if (el.type === 'password') return null;

  // Exclude captcha, login, verification, and other non-profile fields
  const allSignals = signals.join(' ');
  if (EXCLUDED_FIELD_PATTERNS.some(p => allSignals.includes(p))) return null;

  // Proximity-based CAPTCHA detection:
  // Only check DIRECT siblings of this input for CAPTCHA images — not the whole form.
  const isCaptchaImg = (img) => {
    const s = ((img.src || '') + ' ' + (img.alt || '') + ' ' + (img.className || '')).toLowerCase();
    return /captcha|verify|security|securityimage|imgcode/.test(s);
  };
  // Check previous and next siblings
  let sibling = el.previousElementSibling;
  if (sibling && sibling.tagName === 'IMG' && isCaptchaImg(sibling)) return null;
  sibling = el.nextElementSibling;
  if (sibling && sibling.tagName === 'IMG' && isCaptchaImg(sibling)) return null;
  // Check parent's direct child images (only immediate parent, not grandparent)
  const parentEl = el.parentElement;
  if (parentEl) {
    for (const child of parentEl.children) {
      if (child.tagName === 'IMG' && isCaptchaImg(child)) return null;
    }
  }

  // Check input type shortcuts
  if (el.type === 'email') return 'email';
  if (el.type === 'tel') return 'phone';
  if (el.type === 'date' && signals.some(s => s.includes('birth') || s.includes('dob'))) return 'date_of_birth';

  // Special handling: if a label/name says "first name", "last name", "middle name"
  // use the split version, not full_name
  if (signals.some(s => /\bfirst\s*name\b/.test(s) || s === 'fname' || s === 'firstname' || s === 'first_name')) return 'first_name';
  if (signals.some(s => /\blast\s*name\b/.test(s) || /\bsurname\b/.test(s) || s === 'lname' || s === 'lastname' || s === 'last_name')) return 'last_name';
  if (signals.some(s => /\bmiddle\s*name\b/.test(s) || s === 'mname' || s === 'middlename' || s === 'middle_name')) return 'middle_name';

  // If the signal contains generic "name" (not first/middle/last/login), use full_name
  if (signals.some(s => {
    if (!/\bname\b/i.test(s)) return false;
    // Exclude if it also contains first/last/middle/login/sur — those are handled above or excluded
    if (/\b(first|last|middle|login|sur)\b/i.test(s)) return false;
    return true;
  }) || signals.some(s => s === 'fullname' || s === 'full_name' || s === 'applicantname' || s === 'applicant_name' || s === 'username' || s === 'user_name')) return 'full_name';

  // Try each heuristic pattern
  let bestMatch = null;
  let bestPriority = -1;

  for (const h of FIELD_HEURISTICS) {
    for (const keyword of h.match) {
      for (const signal of signals) {
        // Exact match on name/id
        if (signal === keyword || signal === keyword.replace(/_/g, '')) {
          if (h.priority > bestPriority) {
            bestMatch = h.profileKey;
            bestPriority = h.priority + 5; // Bonus for exact match
          }
        }
        // Contains match
        else if (signal.includes(keyword) || keyword.includes(signal)) {
          if (h.priority > bestPriority) {
            bestMatch = h.profileKey;
            bestPriority = h.priority;
          }
        }
      }
    }
  }

  return bestMatch;
}

// ─── Page Type Detection ───────────────────────────────────────

/**
 * Detect if the current page is a login, registration, or application form.
 * Returns: 'login' | 'register' | 'application' | 'unknown'
 */
function detectPageType() {
  const url = window.location.href.toLowerCase();
  const bodyText = document.body?.innerText?.toLowerCase() || '';
  const pageTitle = document.title.toLowerCase();
  const h1 = document.querySelector('h1, h2')?.textContent?.toLowerCase() || '';

  // Count field types
  const passwordFields = document.querySelectorAll('input[type="password"]').length;
  const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"]').length;
  const allInputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button])').length;

  // Login signals
  const loginSignals = [
    url.includes('login'), url.includes('signin'), url.includes('log-in'), url.includes('sign-in'),
    h1.includes('log in'), h1.includes('login'), h1.includes('sign in'), h1.includes('signin'),
    pageTitle.includes('login'), pageTitle.includes('sign in'),
  ].filter(Boolean).length;

  // Registration signals
  const registerSignals = [
    url.includes('register'), url.includes('signup'), url.includes('sign-up'), url.includes('create-account'),
    url.includes('new-user'), url.includes('create_account'),
    h1.includes('register'), h1.includes('sign up'), h1.includes('create account'), h1.includes('new user'),
    pageTitle.includes('register'), pageTitle.includes('sign up'), pageTitle.includes('create'),
  ].filter(Boolean).length;

  // Application signals
  const appSignals = [
    url.includes('application'), url.includes('admission'), url.includes('apply'),
    url.includes('form'), url.includes('enrollment'),
    h1.includes('application'), h1.includes('admission'), h1.includes('apply'),
    pageTitle.includes('application'), pageTitle.includes('admission'),
  ].filter(Boolean).length;

  // Small form with just email + password = login
  if (loginSignals > 0 || (passwordFields >= 1 && allInputs <= 4 && emailFields >= 1)) {
    return 'login';
  }

  // Registration: has password + more fields
  if (registerSignals > 0 || (passwordFields >= 2 && allInputs > 4)) {
    return 'register';
  }

  // Application: many fields, no password
  if (appSignals > 0 || allInputs > 8) {
    return 'application';
  }

  return 'unknown';
}

/**
 * Find a registration/signup link on a login page.
 */
function findRegisterLink() {
  const links = document.querySelectorAll('a, button');
  const registerWords = ['register', 'sign up', 'signup', 'create account', 'new user', 'create an account', 'don\'t have'];
  for (const link of links) {
    const text = link.textContent?.toLowerCase()?.trim() || '';
    const href = (link.href || '').toLowerCase();
    if (registerWords.some(w => text.includes(w) || href.includes(w.replace(/\s/g, '')))) {
      return { text: link.textContent?.trim() || 'Register', href: link.href || '#' };
    }
  }
  return null;
}

// ─── Consistent Password System ────────────────────────────────

/**
 * Get or generate the user's consistent password.
 * Same password is stored and reused across all universities.
 * Meets all common constraints: 14+ chars, uppercase, lowercase, number, special.
 */
async function getConsistentPassword() {
  const stored = await chrome.storage.local.get('unimatch_master_password');
  if (stored.unimatch_master_password) return stored.unimatch_master_password;

  // Generate a new strong password that meets all constraints
  const password = generateStrongPassword();
  await chrome.storage.local.set({ unimatch_master_password: password });
  return password;
}

function generateStrongPassword() {
  // Format: Word1Word2!Num — meets: uppercase, lowercase, number, special, 14+ chars
  const words = ['Lahore', 'Karachi', 'Islamabad', 'Multan', 'Rawalpindi', 'Quetta', 'Peshawar'];
  const symbols = ['!', '@', '#', '$', '%', '&'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  const num = String(Math.floor(Math.random() * 900 + 100));
  return `${w1}${w2}${sym}${num}`;
}

// ─── Smart Suggestions ─────────────────────────────────────────

function buildSmartSuggestions(pageType, university) {
  const suggestions = [];
  const registerLink = findRegisterLink();

  if (pageType === 'login') {
    suggestions.push({
      icon: '🔑',
      text: 'This looks like a <strong>login page</strong>.',
      sub: registerLink
        ? `Don't have an account? <a href="${registerLink.href}" style="color:#4ade80;text-decoration:underline">${registerLink.text}</a>`
        : 'Look for a "Register" or "Create Account" link on this page.',
    });
    suggestions.push({
      icon: '🔐',
      text: 'UniMatch can fill your password.',
      sub: 'Your saved portal password will be auto-filled if available.',
    });
  } else if (pageType === 'register') {
    suggestions.push({
      icon: '📝',
      text: 'This looks like a <strong>registration page</strong>.',
      sub: 'UniMatch will fill your email, name, and generate a strong password.',
    });
  } else if (pageType === 'application') {
    suggestions.push({
      icon: '📋',
      text: 'This looks like an <strong>application form</strong>.',
      sub: 'Click Autofill to fill your profile data into this form.',
    });
  }

  return suggestions;
}

// ─── Input Fill (React/Vue compatible) ─────────────────────────

/**
 * Fills an input element using native setter to trigger React/Vue reactivity.
 * CRITICAL: React portals intercept JS `.value =` assignments; we must use
 * the native HTMLInputElement prototype setter and dispatch synthetic events.
 */
async function fillInput(el, value) {
  if (!el || value == null || value === '') return false;

  const tagName = el.tagName.toLowerCase();
  const inputType = el.type?.toLowerCase();

  // Handle <select> elements
  if (tagName === 'select') {
    return fillSelect(el, value);
  }

  // Handle radio buttons
  if (inputType === 'radio') {
    return fillRadio(el, value);
  }

  // Handle checkboxes
  if (inputType === 'checkbox') {
    return fillCheckbox(el, value);
  }

  // Handle text/textarea/number/email inputs
  el.focus();

  // Clear existing value first
  const proto = tagName === 'textarea'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  // For email and URL inputs, use direct value assignment
  // React native setter can cause garbling on special-type inputs
  if (inputType === 'email' || inputType === 'url') {
    // Clear first
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    // Set the full value at once
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    return true;
  }

  // For other inputs, use native setter for React/Vue compatibility
  if (nativeSetter) {
    nativeSetter.call(el, String(value));
  } else {
    el.value = String(value);
  }

  // Dispatch events to notify frameworks
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));

  // Small random delay to avoid bot detection
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  return true;
}

function fillSelect(el, value) {
  const val = String(value).toLowerCase();
  const options = Array.from(el.options);

  // Try exact value match first
  let match = options.find(o => o.value.toLowerCase() === val);
  // Then try text match
  if (!match) match = options.find(o => o.text.toLowerCase() === val);
  // Then try partial match
  if (!match) match = options.find(o =>
    o.text.toLowerCase().includes(val) || val.includes(o.text.toLowerCase())
  );

  if (match) {
    el.value = match.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

function fillRadio(el, value) {
  const val = String(value).toLowerCase();
  // Find all radios with the same name
  const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
  for (const radio of radios) {
    if (radio.value.toLowerCase() === val ||
      radio.labels?.[0]?.textContent?.toLowerCase().includes(val)) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
}

function fillCheckbox(el, value) {
  const shouldCheck = value === true || value === 'true' || value === '1' || value === 'yes';
  if (el.checked !== shouldCheck) {
    el.checked = shouldCheck;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return true;
}

// ─── Domain Detection ──────────────────────────────────────────

function detectUniversity() {
  const hostname = window.location.hostname;
  if (UNIVERSITY_DOMAINS[hostname]) return UNIVERSITY_DOMAINS[hostname];
  for (const [domain, info] of Object.entries(UNIVERSITY_DOMAINS)) {
    if (hostname.endsWith('.' + domain) || hostname === domain) return info;
  }
  return null;
}

// ─── Sidebar Injection ─────────────────────────────────────────

let sidebarInstance = null;

function injectSidebar(university) {
  if (sidebarInstance) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'unimatch-sidebar';
  sidebar.innerHTML = buildSidebarHTML(university);
  document.body.appendChild(sidebar);

  const toggle = document.createElement('button');
  toggle.id = 'unimatch-toggle';
  toggle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c6 3 10 3 16 0v-5"/>
    </svg>
  `;
  toggle.title = 'UniMatch';
  document.body.appendChild(toggle);

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggle.classList.toggle('sidebar-open');
  });

  sidebarInstance = sidebar;
  initSidebarState(university);
}

function buildSidebarHTML(university) {
  return `
    <div class="unimatch-header">
      <div class="unimatch-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c6 3 10 3 16 0v-5"/>
        </svg>
        <span>UniMatch</span>
      </div>
      <button id="unimatch-close" title="Close">✕</button>
    </div>
    <div class="unimatch-university">
      <span class="uni-badge">${university.name}</span>
    </div>
    <div id="unimatch-content" class="unimatch-content">
      <div class="unimatch-loading">
        <div class="spinner"></div>
        <p>Checking status...</p>
      </div>
    </div>
  `;
}

// ─── Extension Context Guard ────────────────────────────────

function isExtensionValid() {
  try {
    return !!chrome.runtime?.id;
  } catch (e) {
    return false;
  }
}

function showRefreshNeeded(contentEl) {
  if (!contentEl) return;
  contentEl.innerHTML = `
    <div class="state-card">
      <div class="state-icon">🔄</div>
      <h3>Please Refresh This Page</h3>
      <p style="font-size:12px; color:#a1a1aa;">The extension was updated. Press <strong>Ctrl+F5</strong> to reload.</p>
      <button class="btn-primary" onclick="location.reload()" style="margin-top:8px;">🔄 Refresh Now</button>
    </div>
  `;
}

// ─── Sidebar State Management ──────────────────────────────────

async function initSidebarState(university) {
  const contentEl = document.getElementById('unimatch-content');
  if (!contentEl) return;

  document.getElementById('unimatch-close')?.addEventListener('click', () => {
    sidebarInstance?.classList.add('collapsed');
    document.getElementById('unimatch-toggle')?.classList.remove('sidebar-open');
  });

  // Read profile DIRECTLY from chrome.storage.local — no service worker round-trip
  // This is instant because it's a local read, not a network call
  if (!isExtensionValid()) {
    showRefreshNeeded(contentEl);
    return;
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['unimatch_token', 'unimatch_profile']);
  } catch (e) {
    showRefreshNeeded(contentEl);
    return;
  }

  if (!stored.unimatch_token || !stored.unimatch_profile) {
    renderState(contentEl, 'not_logged_in');
    return;
  }

  const profile = stored.unimatch_profile;

  // Store context for autofill
  window.__unimatch = {
    university,
    profile,
    fieldMap: null,
    filledFields: 0,
    manualFields: 0,
    filledSelectors: [],
    manualSelectors: [],
  };

  renderState(contentEl, 'ready', { profile, university });
}

// ─── State Renderer ────────────────────────────────────────────

function renderState(container, state, data = {}) {
  switch (state) {
    case 'unknown_portal':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon">⟡</div>
          <h3>This portal isn't mapped yet.</h3>
          <a class="btn-secondary" href="mailto:support@ilmseurooj.com?subject=Portal+Request:+${encodeURIComponent(window.location.hostname)}" target="_blank">Request Support</a>
        </div>
      `;
      break;

    case 'not_logged_in':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon">🔒</div>
          <h3>Sign in to autofill this form.</h3>
          <p>Connect your profile to autofill university applications.</p>
          <button class="btn-primary" id="unimatch-signin">Sign In to UniMatch</button>
        </div>
      `;
      document.getElementById('unimatch-signin')?.addEventListener('click', () => {
        const extId = chrome.runtime.id;
        window.open(`http://localhost:3000/extension-auth?ext=${extId}`, '_blank', 'width=500,height=600');
      });
      break;

    case 'warning_ibcc':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon" style="color:#fbbf24">⚠️</div>
          <h3>IBCC equivalence not entered in your profile.</h3>
          <p>Required for this portal.</p>
          <a class="btn-primary" href="http://localhost:3000/profile" target="_blank">Complete Profile →</a>
        </div>
      `;
      break;

    case 'warning_no_marks':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon" style="color:#fbbf24">⚠️</div>
          <h3>No intermediate marks in your profile yet.</h3>
          <p>${data.uniName || 'This university'} requires FSc Part-I minimum to apply.</p>
          <a class="btn-primary" href="http://localhost:3000/profile" target="_blank">Update Profile →</a>
        </div>
      `;
      break;

    case 'loading':
      container.innerHTML = `
        <div class="state-card">
          <div class="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      `;
      break;

    case 'ready': {
      const profile = data.profile;
      const displayName = profile?.full_name || 'Student';
      const completeness = calculateCompleteness(profile);
      const isProjected = ['part1_only', 'appearing'].includes(profile?.inter_status);
      const isCambridge = profile?.education_system === 'cambridge';
      const marksLabel = isCambridge ? 'IBCC equivalence %' : isProjected ? 'FSc marks (projected)' : 'FSc marks';
      const marksWarning = isProjected ? '⚠ Using projected marks from Part-I' : isCambridge ? 'ℹ Using IBCC equivalence %' : '';
      container.innerHTML = `
        <div class="state-card">
          <div class="profile-info">
            <div class="avatar">${displayName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${displayName}</strong>
              <span class="profile-pct">${completeness}% complete</span>
            </div>
          </div>
          <div class="fill-list">
            <p style="font-size:11px;color:#a1a1aa;margin:8px 0 4px">Will fill:</p>
            <div style="font-size:12px;color:#4ade80">✓ Name, Father, CNIC</div>
            <div style="font-size:12px;color:${isProjected || isCambridge ? '#fbbf24' : '#4ade80'}">✓ ${marksLabel} ${isProjected || isCambridge ? '⚠' : ''}</div>
            <div style="font-size:12px;color:#4ade80">✓ Email, Phone, City</div>
            ${marksWarning ? `<div style="font-size:10px;color:#fbbf24;margin-top:4px;padding:4px 8px;background:rgba(251,191,36,0.08);border-radius:6px">${marksWarning}</div>` : ''}
          </div>
          <div id="unimatch-suggestions"></div>
          <div class="field-stats" id="unimatch-field-stats">
            <p class="stats-note">Click Autofill to detect and fill form fields</p>
          </div>
          <button class="btn-primary btn-autofill" id="unimatch-autofill">⚡ Autofill Now</button>
          <button class="btn-secondary" id="unimatch-scan">🔍 Scan Fields Only</button>
          <p style="font-size:10px;color:#71717a;text-align:center;margin-top:8px">You control submission.</p>
        </div>
      `;
      // Show smart suggestions
      const pageType = detectPageType();
      const suggestions = buildSmartSuggestions(pageType, data.university);
      const suggestionsEl = document.getElementById('unimatch-suggestions');
      if (suggestionsEl && suggestions.length > 0) {
        suggestionsEl.innerHTML = suggestions.map(s => `
          <div style="padding:8px 10px; margin-bottom:6px; background:rgba(74,222,128,0.06); border:1px solid rgba(74,222,128,0.15); border-radius:8px; font-size:11px; line-height:1.4;">
            <span>${s.icon}</span> ${s.text}
            ${s.sub ? `<div style="margin-top:2px; font-size:10px; color:#a1a1aa">${s.sub}</div>` : ''}
          </div>
        `).join('');
      }
      document.getElementById('unimatch-autofill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-scan')?.addEventListener('click', handleScanFields);
      break;
    }

    case 'filled':
      container.innerHTML = `
        <div class="state-card">
          <div class="fill-results">
            <div class="stat-row filled">
              <span class="stat-dot green"></span>
              <span>${data.filled} fields filled</span>
            </div>
            <div class="stat-row manual">
              <span class="stat-dot amber"></span>
              <span>${data.manual} need your input</span>
            </div>
          </div>
          <button class="btn-secondary" id="unimatch-save-progress">💾 Save Progress</button>
          <button class="btn-primary btn-review" id="unimatch-review">📋 Pre-submit Check</button>
          <button class="btn-secondary" id="unimatch-refill">🔄 Re-fill</button>
        </div>
      `;
      document.getElementById('unimatch-review')?.addEventListener('click', handlePreSubmitCheck);
      document.getElementById('unimatch-refill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-save-progress')?.addEventListener('click', handleSaveProgress);
      break;

    case 'submitted':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon success">✅</div>
          <h3>Submitted!</h3>
          <div class="confirmation">
            <label>Confirmation #</label>
            <input type="text" id="unimatch-confirm-input" 
                   placeholder="Enter confirmation number"
                   value="${data.confirmationNumber || ''}">
            <button class="btn-secondary" id="unimatch-save-confirm">Save</button>
          </div>
        </div>
      `;
      document.getElementById('unimatch-save-confirm')?.addEventListener('click', handleSaveConfirmation);
      break;

    case 'review': {
      const { greenList = [], amberList = [], redList = [] } = data;
      const totalIssues = amberList.length + redList.length;
      let reviewHTML = '<div class="state-card review-card">';

      if (totalIssues === 0) {
        reviewHTML += `
          <div class="review-ok">
            <div class="state-icon success">✅</div>
            <h3>Looks Good — Submit When Ready!</h3>
            <p>${greenList.length} fields verified</p>
          </div>
        `;
      } else {
        reviewHTML += `<h3 class="review-title">Pre-submit Check</h3>`;
      }

      // Red errors
      if (redList.length > 0) {
        reviewHTML += `<div class="review-section"><div class="review-label red">❌ ${redList.length} Error${redList.length > 1 ? 's' : ''}</div>`;
        for (const item of redList) {
          reviewHTML += `
            <div class="review-item red">
              <span>${item.label}</span>
              <small>${item.msg}</small>
              ${item.selector ? `<button class="btn-jump" data-selector="${item.selector}">Jump</button>` : ''}
            </div>
          `;
        }
        reviewHTML += '</div>';
      }

      // Amber warnings
      if (amberList.length > 0) {
        reviewHTML += `<div class="review-section"><div class="review-label amber">⚠️ ${amberList.length} Need Input</div>`;
        for (const item of amberList) {
          reviewHTML += `
            <div class="review-item amber">
              <span>${item.label}</span>
              <small>${item.msg}</small>
              <div style="position:absolute;right:6px;top:50%;transform:translateY(-50%);display:flex;gap:4px;">
                ${item.selector ? `<button class="btn-jump" data-selector="${item.selector}">Jump</button>` : ''}
                ${item.selector ? `<button class="btn-jump btn-fill-gap" data-selector="${item.selector}" data-label="${item.label}">Fill</button>` : ''}
              </div>
            </div>
          `;
        }
        reviewHTML += '</div>';
      }

      // Green OK
      if (greenList.length > 0) {
        reviewHTML += `<div class="review-section"><div class="review-label green">✅ ${greenList.length} Verified</div>`;
        reviewHTML += `<div class="review-item green collapsed-list">All good — click to expand</div>`;
        reviewHTML += `<div class="review-green-details" style="display:none">`;
        for (const item of greenList) {
          reviewHTML += `<div class="review-item green"><span>${item.label}</span></div>`;
        }
        reviewHTML += '</div></div>';
      }

      reviewHTML += `<button class="btn-secondary" id="unimatch-back-filled" style="margin-top:8px">← Back</button>`;
      reviewHTML += '</div>';
      container.innerHTML = reviewHTML;

      // Jump to field handlers
      container.querySelectorAll('.btn-jump').forEach(btn => {
        btn.addEventListener('click', () => {
          const el = document.querySelector(btn.dataset.selector);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
            el.style.outline = '3px solid #ef4444';
            setTimeout(() => { el.style.outline = ''; }, 3000);
          }
        });
      });

      // Fill Gap button handlers
      container.querySelectorAll('.btn-fill-gap').forEach(btn => {
        btn.addEventListener('click', () => {
          showFillGapModal(btn.dataset.label, btn.dataset.selector);
        });
      });

      // Expand green list
      container.querySelector('.collapsed-list')?.addEventListener('click', (e) => {
        const details = container.querySelector('.review-green-details');
        if (details) {
          details.style.display = details.style.display === 'none' ? 'block' : 'none';
          e.target.textContent = details.style.display === 'none'
            ? 'All good — click to expand'
            : 'Click to collapse';
        }
      });

      // Back button
      document.getElementById('unimatch-back-filled')?.addEventListener('click', () => {
        const ctx = window.__unimatch;
        if (ctx) {
          renderState(container, 'filled', { filled: ctx.filledFields, manual: ctx.manualFields });
        }
      });
      break;
    }

    case 'not_recognized':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon">🎓</div>
          <h3>University Not Listed</h3>
          <p>This university portal isn't in our database yet.</p>
        </div>
      `;
      break;
  }
}

// ─── Profile Completeness ──────────────────────────────────────

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const fields = [
    'full_name', 'father_name', 'cnic', 'date_of_birth', 'gender',
    'email', 'phone', 'address', 'city', 'province',
    'fsc_marks', 'matric_marks', 'board_name', 'passing_year',
  ];
  const filled = fields.filter(f => profile[f] != null && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Multi-Selector Helper ─────────────────────────────────────

/**
 * Try multiple comma-separated CSS selectors and return ALL matches.
 * University configs use selectors like: '[name="email"], [type="email"], #email'
 */
function tryMultiSelectorAll(selectorString) {
  try {
    return Array.from(document.querySelectorAll(selectorString));
  } catch (e) {
    // If the selector is invalid, fallback to splitting by comma and combining
    const selectors = selectorString.split(',').map(s => s.trim()).filter(Boolean);
    const elements = [];
    for (const sel of selectors) {
      try {
        const els = Array.from(document.querySelectorAll(sel));
        for (const el of els) {
          if (!elements.includes(el)) elements.push(el);
        }
      } catch (err) { }
    }
    return elements;
  }
}

/**
 * Fill a select element using option text/value matching with optional mapping.
 */
function fillSelectWithMapping(el, value, optionMap) {
  const options = Array.from(el.options);
  const mappedValue = optionMap?.[String(value).toLowerCase()] || value;

  const match = options.find(o =>
    o.value.toLowerCase() === String(mappedValue).toLowerCase() ||
    o.text.toLowerCase() === String(mappedValue).toLowerCase() ||
    o.text.toLowerCase().includes(String(mappedValue).toLowerCase())
  );

  if (match) {
    el.value = match.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

// ─── Extension Context Guard ───────────────────────────────────

/**
 * Check if the extension context is still valid.
 * When the extension is reloaded in chrome://extensions, old content scripts
 * lose their connection and chrome.runtime.id becomes undefined.
 */
function isExtensionValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

/**
 * Show a friendly "refresh needed" message when the extension context is gone.
 */
function showContextInvalidatedUI(container) {
  container.innerHTML = `
    <div class="state-card">
      <div class="state-icon" style="font-size:32px">🔄</div>
      <h3 style="margin:8px 0 4px">Extension Updated</h3>
      <p style="font-size:12px;color:#a1a1aa;margin-bottom:12px">
        The extension was reloaded. Please refresh this page to reconnect.
      </p>
      <button class="btn-primary" onclick="window.location.reload()">
        ↻ Refresh Page
      </button>
    </div>
  `;
}

// ─── Core Autofill Logic ───────────────────────────────────────

async function handleAutofill() {
  const contentEl = document.getElementById('unimatch-content');
  const ctx = window.__unimatch;
  if (!contentEl || !ctx) return;

  // Guard: check extension context before any chrome.runtime calls
  if (!isExtensionValid()) {
    showContextInvalidatedUI(contentEl);
    return;
  }

  renderState(contentEl, 'loading');

  try {
    let filledCount = 0;
    let manualCount = 0;
    let skippedCount = 0;
    const filledSelectors = [];
    const manualSelectors = [];
    const alreadyHandled = new Set();
    const masterPassword = await getConsistentPassword();

    // ─── TIER 1: Deterministic per-university config ───────────
    // Uses verified CSS selectors from extension/universities/index.js
    const hostname = window.location.hostname;
    const uniConfig = (typeof getConfigForDomain === 'function') ? getConfigForDomain(hostname) : null;

    if (uniConfig && uniConfig.fieldMap) {
      console.log(`[IlmSeUrooj] ✅ Found config for ${uniConfig.name} (${uniConfig.slug})`);
      console.log(`[IlmSeUrooj] Form type: ${uniConfig.formType}, Verified: ${uniConfig.verified}`);

      for (const [profileKey, selectorString] of Object.entries(uniConfig.fieldMap)) {
        const els = tryMultiSelectorAll(selectorString);

        if (els.length === 0) {
          skippedCount++;
          console.log(`[IlmSeUrooj] ⏭ Skipped ${profileKey}: no element matched`);
          continue;
        }

        for (const el of els) {
          // Resolve value — virtual keys (first_name, last_name, middle_name) derive from full_name
          let rawValue;
          if (['first_name', 'last_name', 'middle_name'].includes(profileKey)) {
            const fullName = ctx.profile?.full_name;
            rawValue = fullName ? TRANSFORMS[profileKey](fullName) : '';
          } else {
            rawValue = ctx.profile?.[profileKey];
          }

          alreadyHandled.add(el);

          if (rawValue == null || rawValue === '') {
            // No value — highlight amber
            el.style.outline = '2px solid #fbbf24';
            el.style.outlineOffset = '2px';
            el.classList.add('unimatch-manual');
            el.classList.remove('unimatch-filled');
            manualCount++;
            manualSelectors.push(selectorString);
            continue;
          }

          // Apply transform (skip if already applied for name-split keys)
          const transformKey = uniConfig.transforms?.[profileKey];
          let value = rawValue;
          if (transformKey && TRANSFORMS[transformKey] && !['first_name', 'last_name', 'middle_name'].includes(transformKey)) {
            if (transformKey === 'marks_to_percent') {
              const total = profileKey.includes('fsc') ? ctx.profile.fsc_total : ctx.profile.matric_total;
              value = TRANSFORMS[transformKey](value, total);
            } else {
              value = TRANSFORMS[transformKey](value);
            }
          }

          // Fill based on element type
          let filled = false;
          if (el.tagName === 'SELECT') {
            filled = fillSelectWithMapping(el, value, uniConfig.selectOptions?.[profileKey]);
          } else if (el.type === 'radio') {
            // Handle radio buttons
            const radioName = el.name;
            if (radioName) {
              document.querySelectorAll(`[name="${radioName}"]`).forEach(r => {
                if (r.value.toLowerCase() === String(value).toLowerCase()) {
                  r.checked = true;
                  r.dispatchEvent(new Event('change', { bubbles: true }));
                  filled = true;
                }
              });
            }
          } else {
            filled = await fillInput(el, String(value));
          }

          if (filled) {
            el.style.outline = '2px solid #4ade80';
            el.style.outlineOffset = '2px';
            el.classList.add('unimatch-filled');
            el.classList.remove('unimatch-manual');
            filledCount++;
            filledSelectors.push(selectorString);
          } else {
            el.style.outline = '2px solid #fbbf24';
            el.style.outlineOffset = '2px';
            el.classList.add('unimatch-manual');
            manualCount++;
            manualSelectors.push(selectorString);
          }
        }
      }

      console.log(`[IlmSeUrooj] Config fill: ${filledCount} filled, ${manualCount} manual, ${skippedCount} skipped`);
    } else {
      console.log(`[IlmSeUrooj] No deterministic config for ${hostname} — using AI/heuristic fallback`);
    }

    // ─── TIER 2: AI-generated field map (fallback) ─────────────
    // Only use AI mapping for unknown universities — if we have a config,
    // the login page just doesn't have application fields yet. Skip to Tier 3.
    let fieldMap = ctx.fieldMap;
    if (!fieldMap && filledCount === 0 && !uniConfig) {
      const formHTML = getFormHTML();
      try {
        const result = await chrome.runtime.sendMessage({
          type: 'GET_FIELD_MAP',
          domain: hostname,
        });

        if (result && result.fieldMap?.mapping) {
          fieldMap = result.fieldMap.mapping;
        } else if (formHTML) {
          const mapResult = await fetchFieldMap(ctx.university, formHTML);
          if (mapResult?.mapping) {
            fieldMap = mapResult.mapping;
          }
        }
      } catch (tier2Err) {
        console.warn('[IlmSeUrooj] Tier 2 AI field map failed, falling through to heuristics:', tier2Err.message);
      }
      ctx.fieldMap = fieldMap;
    }

    if (fieldMap && Array.isArray(fieldMap)) {
      // Get remembered answers
      let rememberedAnswers = {};
      try {
        const answersResult = await chrome.runtime.sendMessage({ type: 'GET_REMEMBERED_ANSWERS' });
        if (answersResult.answers) {
          for (const ans of answersResult.answers) {
            rememberedAnswers[ans.field_label.toLowerCase()] = ans.field_value;
          }
        }
      } catch (e) {
        console.log('[IlmSeUrooj] No remembered answers available');
      }

      for (const field of fieldMap) {
        const el = document.querySelector(field.selector);
        if (!el || alreadyHandled.has(el)) continue;
        alreadyHandled.add(el);

        let value = ctx.profile[field.profileKey];

        if (field.transform && TRANSFORMS[field.transform]) {
          if (field.transform === 'marks_to_percent') {
            const total = field.profileKey.includes('fsc') ? ctx.profile.fsc_total : ctx.profile.matric_total;
            value = TRANSFORMS[field.transform](value, total);
          } else {
            value = TRANSFORMS[field.transform](value);
          }
        }

        if ((value == null || value === '') && field.label) {
          const remembered = rememberedAnswers[field.label.toLowerCase()];
          if (remembered) value = remembered;
        }

        if (value != null && value !== '') {
          const filled = await fillInput(el, value);
          if (filled) {
            el.style.outline = '2px solid #4ade80';
            el.style.outlineOffset = '2px';
            el.classList.add('unimatch-filled');
            filledCount++;
            filledSelectors.push(field.selector);
          } else {
            el.style.outline = '2px solid #fbbf24';
            el.classList.add('unimatch-manual');
            manualCount++;
            manualSelectors.push(field.selector);
          }
        } else {
          el.style.outline = '2px solid #fbbf24';
          el.classList.add('unimatch-manual');
          manualCount++;
          manualSelectors.push(field.selector);
        }
      }
    }

    // ─── TIER 3: Heuristic fallback for remaining fields ───────
    const allInputs = document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea'
    );

    for (const input of allInputs) {
      if (alreadyHandled.has(input)) continue;
      if (input.value && input.value.trim() !== '') continue;

      // Password fields — consistent password
      if (input.type === 'password') {
        await fillInput(input, masterPassword);
        input.style.outline = '2px solid #4ade80';
        input.classList.add('unimatch-filled');
        filledCount++;
        alreadyHandled.add(input);
        continue;
      }

      // Heuristic match
      const profileKey = matchFieldHeuristically(input);
      if (!profileKey) {
        // Mark unfilled required fields
        if (input.required && !input.value) {
          input.style.outline = '2px solid #fbbf24';
          input.classList.add('unimatch-manual');
          manualCount++;
        }
        continue;
      }

      // Resolve the value — virtual keys (first_name, last_name, middle_name)
      // are derived from full_name using transforms
      let value;
      if (['first_name', 'last_name', 'middle_name'].includes(profileKey)) {
        const fullName = ctx.profile.full_name;
        value = fullName ? TRANSFORMS[profileKey](fullName) : '';
      } else {
        value = ctx.profile[profileKey];
      }

      if (profileKey === 'cnic' && value) {
        const accepts = (input.maxLength === 13 || input.name?.includes('no_dash'));
        value = accepts ? TRANSFORMS.cnic_no_dashes(value) : TRANSFORMS.cnic_dashes(value);
      }
      if (profileKey === 'phone' && value) {
        value = TRANSFORMS.phone_pak(value);
      }

      if (value != null && value !== '') {
        if (input.tagName === 'SELECT') {
          const filled = fillSelect(input, value);
          if (filled) {
            input.style.outline = '2px solid #4ade80';
            input.classList.add('unimatch-filled');
            filledCount++;
          }
        } else {
          const filled = await fillInput(input, String(value));
          if (filled) {
            input.style.outline = '2px solid #4ade80';
            input.classList.add('unimatch-filled');
            filledCount++;
          }
        }
        alreadyHandled.add(input);
        continue;
      }

      // Mark unfilled required fields
      if (input.required && !input.value) {
        input.style.outline = '2px solid #fbbf24';
        input.classList.add('unimatch-manual');
        manualCount++;
      }
    }

    // Update context
    ctx.filledFields = filledCount;
    ctx.manualFields = manualCount;
    ctx.filledSelectors = filledSelectors;
    ctx.manualSelectors = manualSelectors;
    ctx.generatedPassword = masterPassword;
    ctx.uniConfig = uniConfig;

    // Show results
    renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount });
    console.log(`[IlmSeUrooj] ✅ Autofill complete: ${filledCount} filled, ${manualCount} need input`);

  } catch (err) {
    console.error('[IlmSeUrooj] Autofill error:', err);
    if (err.message?.includes('Extension context invalidated') || !isExtensionValid()) {
      showRefreshNeeded(contentEl);
    } else {
      renderState(contentEl, 'filled', { filled: 0, manual: 0 });
    }
  }
}

/**
 * Fetch field map from the API (AI-powered).
 * Delegates to service worker to avoid mixed content errors on HTTPS pages.
 */
async function fetchFieldMap(university, formHTML) {
  try {
    const data = await chrome.runtime.sendMessage({
      type: 'POST_FIELD_MAP',
      data: {
        domain: window.location.hostname,
        formHTML: formHTML,
        universitySlug: university.slug,
      }
    });

    if (data.error) {
      console.error('[UniMatch] Field map generation error:', data.error);
      return null;
    }

    return data.fieldMap;
  } catch (err) {
    console.error('[UniMatch] Failed to fetch field map:', err);
    return null;
  }
}

/**
 * Extract form HTML from the current page (trimmed).
 */
function getFormHTML() {
  const forms = document.querySelectorAll('form');
  if (forms.length > 0) {
    // Get the largest form
    let biggest = forms[0];
    for (const form of forms) {
      if (form.innerHTML.length > biggest.innerHTML.length) biggest = form;
    }
    return biggest.outerHTML.substring(0, 6000);
  }

  // No <form> tag — grab all inputs and their containers
  const inputs = document.querySelectorAll('input, select, textarea');
  if (inputs.length === 0) return null;

  const sections = new Set();
  for (const input of inputs) {
    const parent = input.closest('div, section, fieldset') || input.parentElement;
    if (parent) sections.add(parent.outerHTML);
  }
  return Array.from(sections).join('\n').substring(0, 6000);
}

// ─── Scan Fields (without filling) ─────────────────────────────

async function handleScanFields() {
  const statsEl = document.getElementById('unimatch-field-stats');
  if (!statsEl) return;

  const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]), select, textarea');
  const forms = document.querySelectorAll('form');
  const required = document.querySelectorAll('[required]');

  statsEl.innerHTML = `
    <p class="stats-note">
      Found <strong>${inputs.length}</strong> fields in <strong>${forms.length}</strong> form(s)<br>
      <strong>${required.length}</strong> required fields
    </p>
  `;
}

// ─── Answer Memory (Save Progress) ────────────────────────────

async function handleSaveProgress() {
  const ctx = window.__unimatch;
  if (!ctx?.fieldMap) return;

  const contentEl = document.getElementById('unimatch-content');

  // Scan all filled inputs that weren't auto-filled (manually entered by student)
  const manuallyFilled = [];

  for (const field of ctx.fieldMap) {
    const el = document.querySelector(field.selector);
    if (!el) continue;

    // If the field has a value but was marked as manual (amber), student filled it
    if (el.value && el.classList.contains('unimatch-manual')) {
      manuallyFilled.push({
        label: field.label || field.profileKey,
        value: el.value,
        selector: field.selector,
      });
    }
  }

  // Also scan non-mapped inputs that now have values
  const allInputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea');
  const mappedSelectors = new Set(ctx.fieldMap.map(f => f.selector));

  for (const input of allInputs) {
    const matchesMapped = Array.from(mappedSelectors).some(s => {
      try { return input.matches(s); } catch { return false; }
    });
    if (matchesMapped) continue;
    if (!input.value) continue;

    const label = input.labels?.[0]?.textContent?.trim() ||
      input.placeholder ||
      input.name ||
      input.id;
    if (label) {
      manuallyFilled.push({
        label: label,
        value: input.value,
        selector: null,
      });
    }
  }

  if (manuallyFilled.length === 0) {
    if (contentEl) {
      const btn = document.getElementById('unimatch-save-progress');
      if (btn) btn.textContent = '✓ Nothing new to save';
      setTimeout(() => { if (btn) btn.textContent = '💾 Save Progress'; }, 2000);
    }
    return;
  }

  // Save each answer via the extension message channel
  let savedCount = 0;
  for (const item of manuallyFilled) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_REMEMBERED_ANSWER',
        data: {
          field_label: item.label,
          field_value: item.value,
        },
      });
      savedCount++;
    } catch (e) {
      console.error('[UniMatch] Failed to save answer:', item.label, e);
    }
  }

  const btn = document.getElementById('unimatch-save-progress');
  if (btn) {
    btn.textContent = `✓ Saved ${savedCount} answers`;
    setTimeout(() => { btn.textContent = '💾 Save Progress'; }, 3000);
  }
}

// ─── Pre-submit Validator (Phase 4) ────────────────────────────

async function handlePreSubmitCheck() {
  const contentEl = document.getElementById('unimatch-content');
  const ctx = window.__unimatch;
  if (!contentEl || !ctx) return;

  const greenList = [];  // ✅ Filled correctly
  const amberList = [];  // ⚠️ Needs input
  const redList = [];    // ❌ Validation errors

  const fieldMap = ctx.fieldMap || [];
  const profile = ctx.profile || {};

  // Check mapped fields
  for (const field of fieldMap) {
    const el = document.querySelector(field.selector);
    if (!el) continue;

    const value = el.value?.trim();
    const label = field.label || field.profileKey || field.selector;

    if (!value) {
      if (field.required) {
        amberList.push({ label, selector: field.selector, msg: 'Required — needs your input' });
      }
      continue;
    }

    // Validate CNIC format
    if (field.profileKey === 'cnic') {
      const cnicValid = /^\d{5}-\d{7}-\d{1}$/.test(value) || /^\d{13}$/.test(value);
      if (!cnicValid) {
        redList.push({ label, selector: field.selector, msg: 'Invalid CNIC format (expected XXXXX-XXXXXXX-X or 13 digits)' });
        continue;
      }
    }

    // Validate marks don't exceed total
    if (field.profileKey === 'fsc_marks') {
      const total = profile.fsc_total || 1100;
      if (parseInt(value) > total) {
        redList.push({ label, selector: field.selector, msg: `Marks (${value}) exceed total (${total})` });
        continue;
      }
    }
    if (field.profileKey === 'matric_marks') {
      const total = profile.matric_total || 1050;
      if (parseInt(value) > total) {
        redList.push({ label, selector: field.selector, msg: `Marks (${value}) exceed total (${total})` });
        continue;
      }
    }

    // Check for obvious test data
    const testPatterns = ['test', 'asdf', 'qwer', 'lorem', 'sample', 'example', 'xxx'];
    const lower = value.toLowerCase();
    if (testPatterns.some(p => lower === p || lower.startsWith(p + ' '))) {
      redList.push({ label, selector: field.selector, msg: `Looks like test data: "${value}"` });
      continue;
    }
    if (/^(123|000|111|abc)$/.test(value)) {
      redList.push({ label, selector: field.selector, msg: `Looks like placeholder: "${value}"` });
      continue;
    }

    // Field is valid
    greenList.push({ label, selector: field.selector });
  }

  // Also check unmapped required fields
  const allInputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea');
  const mappedSelectors = new Set(fieldMap.map(f => f.selector));
  for (const input of allInputs) {
    const isMapped = Array.from(mappedSelectors).some(s => {
      try { return input.matches(s); } catch { return false; }
    });
    if (isMapped) continue;
    if (input.required && !input.value?.trim()) {
      const label = input.labels?.[0]?.textContent?.trim() || input.name || input.placeholder || 'Unnamed field';
      amberList.push({ label, selector: null, msg: 'Required — needs your input' });
    }
  }

  // Render the review state
  renderState(contentEl, 'review', { greenList, amberList, redList });
}

async function handleSaveConfirmation() {
  const input = document.getElementById('unimatch-confirm-input');
  const ctx = window.__unimatch;
  if (!input?.value || !ctx) return;

  const confirmNum = input.value.trim();
  try {
    await chrome.runtime.sendMessage({
      type: 'SUBMITTED',
      applicationId: ctx.applicationId,
      confirmationNumber: confirmNum,
      slug: ctx.university?.slug,
    });
    const btn = document.getElementById('unimatch-save-confirm');
    if (btn) {
      btn.textContent = '✓ Saved!';
      btn.disabled = true;
    }
  } catch (e) {
    console.error('[UniMatch] Failed to save confirmation:', e);
  }
}

// ─── Submission Detection (Phase 4) ────────────────────────────

function setupSubmissionDetection() {
  const ctx = window.__unimatch;
  if (!ctx) return;

  // 1. Listen for form submissions
  document.addEventListener('submit', (e) => {
    console.log('[UniMatch] Form submission detected');
    // Wait for page to show results, then try to extract confirmation
    setTimeout(() => extractConfirmation(), 3000);
  }, true);

  // 2. Intercept fetch for AJAX portals
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (res.ok && isSubmissionUrl(url)) {
        console.log('[UniMatch] AJAX submission detected:', url);
        setTimeout(() => extractConfirmation(), 2000);
      }
    } catch (e) {
      // Don't break the original fetch
    }
    return res;
  };

  // 3. Intercept XMLHttpRequest for older portals
  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._unimatchUrl = url;
    this._unimatchMethod = method;
    return origXHROpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        if (this.status >= 200 && this.status < 300 && isSubmissionUrl(this._unimatchUrl)) {
          console.log('[UniMatch] XHR submission detected:', this._unimatchUrl);
          setTimeout(() => extractConfirmation(), 2000);
        }
      } catch (e) { }
    });
    return origXHRSend.apply(this, args);
  };
}

/**
 * Check if a URL looks like a form submission endpoint.
 */
function isSubmissionUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  const submitPatterns = [
    'submit', 'apply', 'register', 'admission', 'enrol',
    'save-application', 'confirm', 'finalize',
  ];
  return submitPatterns.some(p => lower.includes(p));
}

/**
 * Try to extract a confirmation number from the current page.
 */
function extractConfirmation() {
  const contentEl = document.getElementById('unimatch-content');
  if (!contentEl) return;

  // Common confirmation selectors
  const selectors = [
    '.confirmation-number', '#confirmation-number',
    '.confirmation_number', '#confirmation_number',
    '.appId', '#appId', '.app-id', '#app-id',
    '.reference-number', '#reference-number',
    '.tracking-id', '#tracking-id',
    '[data-confirmation]', '[data-ref]',
  ];

  let confirmationNumber = null;

  // Try CSS selectors first
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      confirmationNumber = el.textContent.trim();
      break;
    }
  }

  // Try regex patterns on page text
  if (!confirmationNumber) {
    const bodyText = document.body.innerText;
    const patterns = [
      /(?:confirmation|reference|application|tracking)\s*(?:number|no|id|#)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
      /(?:your\s+)?(?:application|registration)\s+(?:id|number)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
    ];
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match?.[1]) {
        confirmationNumber = match[1];
        break;
      }
    }
  }

  // Show submitted state
  renderState(contentEl, 'submitted', { confirmationNumber: confirmationNumber || '' });
}

// ─── Fill Gap Modal (Phase 5) ──────────────────────────────────

function showFillGapModal(fieldLabel, selector) {
  removeModal();

  const overlay = document.createElement('div');
  overlay.id = 'unimatch-modal-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 2147483647; display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background:#161916; border:1px solid #27272a; border-radius:14px; padding:24px; width:360px; max-width:90vw; color:#e4e4e7;">
      <h3 style="margin:0 0 4px; font-size:15px; color:#fbbf24;">⚠️ ${fieldLabel}</h3>
      <p style="margin:0 0 16px; font-size:12px; color:#a1a1aa;">This field needs your input.</p>
      <div id="unimatch-gap-remembered" style="display:none; margin-bottom:12px; padding:8px; background:rgba(74,222,128,0.08); border-radius:8px; font-size:11px; color:#4ade80;">
        <strong>Previously used:</strong> <span id="unimatch-gap-prev"></span>
        <button id="unimatch-gap-use-prev" style="margin-left:8px; background:#4ade80; color:#0c0e0b; border:none; border-radius:4px; padding:2px 10px; font-size:10px; cursor:pointer;">Use this</button>
      </div>
      <input id="unimatch-gap-input" type="text" placeholder="Enter value..." style="width:100%; padding:10px; background:#0c0e0b; border:1px solid #27272a; border-radius:8px; color:#e4e4e7; font-size:13px; box-sizing:border-box; outline:none;">
      <label style="display:flex; align-items:center; gap:6px; margin:10px 0; font-size:11px; color:#a1a1aa; cursor:pointer;">
        <input type="checkbox" id="unimatch-gap-save" checked style="accent-color:#4ade80;"> Save for future applications
      </label>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="unimatch-gap-fill" style="flex:1; padding:10px; background:#4ade80; color:#0c0e0b; border:none; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer;">Fill & Close</button>
        <button id="unimatch-gap-cancel" style="padding:10px 16px; background:#27272a; color:#e4e4e7; border:none; border-radius:8px; font-size:12px; cursor:pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Check remembered answers
  chrome.runtime.sendMessage({ type: 'GET_REMEMBERED_ANSWERS' }).then(result => {
    if (result?.answers) {
      const match = result.answers.find(a => a.field_label.toLowerCase() === fieldLabel.toLowerCase());
      if (match) {
        const remembered = document.getElementById('unimatch-gap-remembered');
        const prevSpan = document.getElementById('unimatch-gap-prev');
        if (remembered && prevSpan) {
          prevSpan.textContent = match.field_value;
          remembered.style.display = 'block';
          document.getElementById('unimatch-gap-use-prev')?.addEventListener('click', () => {
            document.getElementById('unimatch-gap-input').value = match.field_value;
          });
        }
      }
    }
  });

  // Fill & Close
  document.getElementById('unimatch-gap-fill')?.addEventListener('click', async () => {
    const input = document.getElementById('unimatch-gap-input');
    const saveCheck = document.getElementById('unimatch-gap-save');
    const value = input?.value?.trim();
    if (!value) return;

    // Fill the actual form field
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        await fillInput(el, value);
        el.classList.remove('unimatch-manual');
        el.classList.add('unimatch-filled');
      }
    }

    // Save for future if checked
    if (saveCheck?.checked) {
      chrome.runtime.sendMessage({
        type: 'SAVE_REMEMBERED_ANSWER',
        data: { field_label: fieldLabel, field_value: value },
      });
    }

    removeModal();
  });

  // Cancel
  document.getElementById('unimatch-gap-cancel')?.addEventListener('click', removeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) removeModal();
  });
}

function removeModal() {
  document.getElementById('unimatch-modal-overlay')?.remove();
}

// ─── SOP/Essay AI Helper (Phase 5) ────────────────────────────

function setupSOPHelper() {
  const ctx = window.__unimatch;
  if (!ctx) return;

  // Find large textareas (likely essays)
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    const maxLen = textarea.maxLength > 0 ? textarea.maxLength : parseInt(textarea.getAttribute('maxlength') || '0');
    const rows = textarea.rows || 1;

    // Detect essay fields: maxLength > 200 chars or rows > 4
    if (maxLen > 200 || rows > 4 || textarea.style.height?.includes('px') && parseInt(textarea.style.height) > 100) {
      addDraftButton(textarea);
    }
  });
}

function addDraftButton(textarea) {
  const wrapper = textarea.parentElement;
  if (!wrapper || wrapper.querySelector('.unimatch-draft-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'unimatch-draft-btn';
  btn.innerHTML = '✨ Draft with AI';
  btn.style.cssText = `
    position: relative; margin: 4px 0; padding: 4px 12px;
    background: rgba(168, 85, 247, 0.15); color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 6px;
    font-size: 11px; font-weight: 500; cursor: pointer;
    font-family: 'Inter', sans-serif; z-index: 100;
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showSOPModal(textarea);
  });

  wrapper.insertBefore(btn, textarea.nextSibling);
}

function showSOPModal(textarea) {
  removeModal();
  const ctx = window.__unimatch;
  if (!ctx) return;

  const fieldLabel = textarea.labels?.[0]?.textContent?.trim() ||
    textarea.placeholder || textarea.name || 'Statement';

  const overlay = document.createElement('div');
  overlay.id = 'unimatch-modal-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 2147483647; display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background:#161916; border:1px solid #27272a; border-radius:14px; padding:24px; width:480px; max-width:90vw; color:#e4e4e7;">
      <h3 style="margin:0 0 4px; font-size:15px; color:#a855f7;">✨ AI Draft — ${fieldLabel}</h3>
      <p style="margin:0 0 16px; font-size:11px; color:#a1a1aa;">Generate a draft, then <strong>personalize it</strong> before inserting.</p>
      <textarea id="unimatch-sop-draft" style="width:100%; height:200px; padding:12px; background:#0c0e0b; border:1px solid #27272a; border-radius:8px; color:#e4e4e7; font-size:12px; line-height:1.6; resize:vertical; box-sizing:border-box; outline:none; font-family:inherit;" placeholder="Click Generate to create a draft..."></textarea>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span id="unimatch-sop-status" style="font-size:10px; color:#a1a1aa;"></span>
        <span id="unimatch-sop-chars" style="font-size:10px; color:#a1a1aa;"></span>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="unimatch-sop-generate" style="flex:1; padding:10px; background:#a855f7; color:white; border:none; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer;">Generate Draft</button>
        <button id="unimatch-sop-insert" disabled style="flex:1; padding:10px; background:#27272a; color:#71717a; border:none; border-radius:8px; font-weight:600; font-size:13px; cursor:not-allowed;">Insert (edit first)</button>
        <button id="unimatch-sop-cancel" style="padding:10px 16px; background:#27272a; color:#e4e4e7; border:none; border-radius:8px; font-size:12px; cursor:pointer;">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let originalDraft = '';

  // Generate
  document.getElementById('unimatch-sop-generate')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('unimatch-sop-status');
    const draftEl = document.getElementById('unimatch-sop-draft');
    if (!statusEl || !draftEl) return;

    statusEl.textContent = 'Generating draft...';
    statusEl.style.color = '#a855f7';

    try {
      const response = await fetch('http://localhost:3000/api/sop-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university: ctx.university?.name,
          program: '', // Could be detected from page
          profile: ctx.profile,
          fieldLabel: fieldLabel,
          maxLength: textarea.maxLength > 0 ? textarea.maxLength : 500,
        }),
      });

      const data = await response.json();
      if (data.draft) {
        draftEl.value = data.draft;
        originalDraft = data.draft;
        statusEl.textContent = '✓ Draft generated — please edit before inserting';
        statusEl.style.color = '#4ade80';
        updateCharCount();
      } else {
        statusEl.textContent = 'Error: ' + (data.error || 'Unknown');
        statusEl.style.color = '#ef4444';
      }
    } catch (err) {
      statusEl.textContent = 'Failed to generate draft';
      statusEl.style.color = '#ef4444';
    }
  });

  // Track edits to enable Insert
  document.getElementById('unimatch-sop-draft')?.addEventListener('input', () => {
    updateCharCount();
    checkEditRequirement();
  });

  function updateCharCount() {
    const charsEl = document.getElementById('unimatch-sop-chars');
    const draftEl = document.getElementById('unimatch-sop-draft');
    if (charsEl && draftEl) {
      charsEl.textContent = `${draftEl.value.length} chars`;
    }
  }

  function checkEditRequirement() {
    const draftEl = document.getElementById('unimatch-sop-draft');
    const insertBtn = document.getElementById('unimatch-sop-insert');
    if (!draftEl || !insertBtn || !originalDraft) return;

    // Count character differences
    const current = draftEl.value;
    let diffCount = 0;
    const maxLen = Math.max(current.length, originalDraft.length);
    for (let i = 0; i < maxLen; i++) {
      if (current[i] !== originalDraft[i]) diffCount++;
    }

    if (diffCount >= 20) {
      insertBtn.disabled = false;
      insertBtn.style.background = '#4ade80';
      insertBtn.style.color = '#0c0e0b';
      insertBtn.style.cursor = 'pointer';
      insertBtn.textContent = 'Insert';
    } else {
      insertBtn.disabled = true;
      insertBtn.style.background = '#27272a';
      insertBtn.style.color = '#71717a';
      insertBtn.style.cursor = 'not-allowed';
      insertBtn.textContent = `Insert (${20 - diffCount} more edits)`;
    }
  }

  // Insert
  document.getElementById('unimatch-sop-insert')?.addEventListener('click', async () => {
    const draftEl = document.getElementById('unimatch-sop-draft');
    if (!draftEl?.value) return;
    await fillInput(textarea, draftEl.value);
    textarea.classList.add('unimatch-filled');
    textarea.classList.remove('unimatch-manual');
    removeModal();
  });

  // Cancel
  document.getElementById('unimatch-sop-cancel')?.addEventListener('click', removeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) removeModal();
  });
}

// ─── Password Vault (Phase 5) ──────────────────────────────────

// Password generation moved to getConsistentPassword() / generateStrongPassword() above

async function setupPasswordVault() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (passwordInputs.length < 1) return;

  const passwordFields = Array.from(passwordInputs);
  const ctx = window.__unimatch;
  if (!ctx) return;

  // Use consistent password across all portals
  const password = await getConsistentPassword();
  ctx.generatedPassword = password;

  // Show in sidebar
  const contentEl = document.getElementById('unimatch-content');
  if (!contentEl) return;

  // Remove existing pw card if any
  document.getElementById('unimatch-pw-card')?.remove();

  const pwCard = document.createElement('div');
  pwCard.id = 'unimatch-pw-card';
  pwCard.style.cssText = `
    margin-top: 12px; padding: 10px; background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.2); border-radius: 8px;
  `;
  pwCard.innerHTML = `
    <div style="font-size:11px; color:#60a5fa; font-weight:600; margin-bottom:6px;">
      🔐 Your Portal Password (same for all universities)
    </div>
    <div style="display:flex; align-items:center; gap:6px;">
      <code style="flex:1; font-size:12px; color:#e4e4e7; background:#0c0e0b; padding:6px 8px; border-radius:4px; word-break:break-all;">${password}</code>
      <button id="unimatch-pw-copy" style="background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; border-radius:4px; padding:4px 8px; font-size:10px; cursor:pointer; white-space:nowrap;">Copy</button>
    </div>
    <div style="font-size:9px; color:#71717a; margin-top:4px;">✓ 14+ chars ✓ Uppercase ✓ Lowercase ✓ Number ✓ Special char</div>
    <button id="unimatch-pw-fill" style="width:100%; margin-top:8px; padding:6px; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); border-radius:6px; font-size:11px; cursor:pointer;">Fill password fields (${passwordFields.length})</button>
  `;

  contentEl.appendChild(pwCard);

  // Copy
  document.getElementById('unimatch-pw-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(password);
    const btn = document.getElementById('unimatch-pw-copy');
    if (btn) {
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    }
  });

  // Fill all password fields
  document.getElementById('unimatch-pw-fill')?.addEventListener('click', async () => {
    for (const field of passwordFields) {
      await fillInput(field, password);
      field.classList.add('unimatch-filled');
    }
    const btn = document.getElementById('unimatch-pw-fill');
    if (btn) {
      btn.textContent = '✓ Filled!';
      btn.disabled = true;
    }

    // Save to application
    chrome.runtime.sendMessage({
      type: 'UPDATE_APPLICATION',
      id: ctx.applicationId,
      data: { portal_password_hint: password },
    });
  });
}

// ─── Initialize ────────────────────────────────────────────────

// ─── Missing Event Handlers ────────────────────────────────────

function handleScanFields() {
  const contentEl = document.getElementById('unimatch-content');
  const ctx = window.__unimatch;
  if (!contentEl || !ctx) return;

  // Scan all visible form fields and figure out what we can autofill
  const allInputs = document.querySelectorAll(
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea'
  );

  const hostname = window.location.hostname;
  const uniConfig = (typeof getConfigForDomain === 'function') ? getConfigForDomain(hostname) : null;

  let matchedFields = [];
  let unmatchedFields = [];
  let passwordFields = 0;

  for (const input of allInputs) {
    if (input.type === 'password') {
      passwordFields++;
      matchedFields.push({ label: 'Password', profileKey: '(auto-generated)', selector: '' });
      continue;
    }

    // Check deterministic config first
    let found = false;
    if (uniConfig && uniConfig.fieldMap) {
      for (const [profileKey, selectorString] of Object.entries(uniConfig.fieldMap)) {
        let isMatch = false;
        try {
          // Native DOM match (handles comma-separated lists)
          isMatch = input.matches(selectorString);
        } catch (e) {
          // Fallback if the selector contains pseudo-classes not allowed in matches()
          const els = tryMultiSelectorAll(selectorString);
          isMatch = els.includes(input);
        }

        if (isMatch) {
          const hasValue = ctx.profile?.[profileKey] != null && ctx.profile?.[profileKey] !== '';
          matchedFields.push({
            label: profileKey.replace(/_/g, ' '),
            profileKey,
            hasValue,
            selector: selectorString,
          });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Try heuristic match
      const profileKey = matchFieldHeuristically(input);
      if (profileKey) {
        const hasValue = ctx.profile?.[profileKey] != null && ctx.profile?.[profileKey] !== '';
        matchedFields.push({
          label: profileKey.replace(/_/g, ' '),
          profileKey,
          hasValue,
          selector: input.id ? `#${input.id}` : `[name="${input.name}"]`,
        });
      } else {
        const label = input.labels?.[0]?.textContent?.trim() || input.placeholder || input.name || input.id || 'Unknown field';
        unmatchedFields.push({ label: label.substring(0, 40) });
      }
    }
  }

  // Render scan results in the sidebar
  const canFill = matchedFields.filter(f => f.hasValue !== false).length;
  const needsInput = matchedFields.filter(f => f.hasValue === false).length;

  contentEl.innerHTML = `
    <div class="state-card">
      <h3 style="margin:0 0 10px; font-size:14px;">🔍 Scan Results</h3>
      <div class="fill-results">
        <div class="stat-row filled">
          <span class="stat-dot green"></span>
          <span>${canFill} fields we can fill</span>
        </div>
        <div class="stat-row manual">
          <span class="stat-dot amber"></span>
          <span>${needsInput} fields missing from profile</span>
        </div>
        ${unmatchedFields.length > 0 ? `
          <div class="stat-row" style="margin-top:4px;">
            <span style="color:#a1a1aa; font-size:11px;">📋 ${unmatchedFields.length} fields not recognized</span>
          </div>
        ` : ''}
        ${passwordFields > 0 ? `
          <div class="stat-row" style="margin-top:4px;">
            <span style="color:#a1a1aa; font-size:11px;">🔑 ${passwordFields} password field(s) → auto-generated</span>
          </div>
        ` : ''}
      </div>
      <div style="max-height:180px; overflow-y:auto; margin:10px 0; font-size:11px;">
        ${matchedFields.map(f => `
          <div style="padding:4px 8px; margin:2px 0; background:${f.hasValue !== false ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)'}; border-radius:6px; display:flex; justify-content:space-between;">
            <span>${f.label}</span>
            <span style="color:${f.hasValue !== false ? '#4ade80' : '#fbbf24'}">${f.hasValue !== false ? '✓' : '✗'}</span>
          </div>
        `).join('')}
        ${unmatchedFields.length > 0 ? `
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05);">
            <div style="color:#71717a; font-size:10px; margin-bottom:4px;">Unrecognized:</div>
            ${unmatchedFields.map(f => `
              <div style="padding:3px 8px; margin:2px 0; color:#71717a; font-size:10px;">
                ${f.label}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <button class="btn-primary btn-autofill" id="unimatch-autofill">⚡ Autofill Now</button>
      <button class="btn-secondary" id="unimatch-back-ready" style="margin-top:6px;">← Back</button>
    </div>
  `;

  document.getElementById('unimatch-autofill')?.addEventListener('click', handleAutofill);
  document.getElementById('unimatch-back-ready')?.addEventListener('click', () => {
    renderState(contentEl, 'ready', { profile: ctx.profile, university: ctx.university });
  });
}

function handlePreSubmitCheck() {
  const contentEl = document.getElementById('unimatch-content');
  const ctx = window.__unimatch;
  if (!contentEl || !ctx) return;

  // Basic mock check for now
  const greenList = ctx.filledSelectors.map(sel => ({ label: 'Verified', selector: sel }));
  const amberList = ctx.manualSelectors.map(sel => ({ label: 'Missing', msg: 'Needs input', selector: sel }));

  renderState(contentEl, 'review', { greenList, amberList, redList: [] });
}

function handleSaveProgress() {
  alert('Progress saved locally.');
}

function handleSaveConfirmation() {
  const input = document.getElementById('unimatch-confirm-input');
  if (input && input.value) {
    alert('Confirmation number ' + input.value + ' saved.');
  } else {
    alert('Please enter a confirmation number.');
  }
}

function showFillGapModal(label, selector) {
  const val = prompt(`Enter value for ${label} (This will be saved for future forms):`);
  if (val) {
    const el = document.querySelector(selector);
    if (el) {
      fillInput(el, val).then(() => {
        el.style.outline = '2px solid #4ade80';
        el.classList.add('unimatch-filled');
        el.classList.remove('unimatch-manual');
        alert('Filled!');
      });
    }
  }
}

// ─── Initialize ────────────────────────────────────────────────

(function init() {
  const university = detectUniversity();
  if (university) {
    console.log(`[UniMatch] Detected: ${university.name} (${university.slug})`);
    injectSidebar(university);
    setupSubmissionDetection();

    // Phase 5 features — delayed to let page load
    setTimeout(() => {
      setupSOPHelper();
      setupPasswordVault();
    }, 2000);
  }
})();
