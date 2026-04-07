/**
 * UniMatch Content Script
 * Detects university portals, injects the sidebar, manages autofill + answer memory.
 */

// Silently suppress "Extension context invalidated" unhandled rejections.
// These happen when the extension is reloaded while the tab is still open.
// The user just needs to refresh the page — no console noise needed.
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('Extension context invalidated') ||
    e.reason?.message?.includes('extension context') ||
    String(e.reason).includes('Extension context')) {
    e.preventDefault();
  }
});

// ─── Global constants ──────────────────────────────────────────
const BAHRIA_FILL_KEY       = '__unimatch_bahria_fill';       // sessionStorage key for Bahria Profile.aspx multi-phase fill
const BAHRIA_APPLY_FILL_KEY = '__unimatch_bahria_apply_fill'; // sessionStorage key for Bahria ApplyProgram.aspx multi-phase fill

// ─── University Domain Registry ────────────────────────────────
// Built dynamically from ALL_UNIVERSITIES (universities/index.js loaded first)

const UNIVERSITY_DOMAINS = (() => {
  const map = {
    'localhost': { slug: 'test', name: '🧪 Test Portal' },
    '127.0.0.1': { slug: 'test', name: '🧪 Test Portal' },
  };
  if (typeof ALL_UNIVERSITIES !== 'undefined') {
    for (const uni of ALL_UNIVERSITIES) {
      for (const domain of (uni.portalDomains || [])) {
        map[domain] = { slug: uni.slug, name: uni.name };
      }
    }
  }
  return map;
})();

// ─── Transform Functions ───────────────────────────────────────

const TRANSFORMS = {
  percent_to_marks_1100: (v) => Math.round(parseFloat(v) * 11),
  percent_to_marks_1050: (v) => Math.round(parseFloat(v) * 10.5),
  marks_to_percent: (v, total) => ((v / total) * 100).toFixed(2),
  date_dmy: (v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },
  date_ymd: (v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  date_mdy: (v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  },
  phone_pak: (v) => {
    const str = String(v ?? '').replace(/\D/g, '');
    if (!str) return '';
    if (str.startsWith('92') && str.length >= 11) return '0' + str.slice(2); // 923xx → 03xx
    return str.startsWith('0') ? str : '0' + str;
  },
  // International Pakistani format: 923XXXXXXXXX (12 digits, no +, no 0)
  phone_92: (v) => {
    const str = String(v ?? '').replace(/\D/g, '');
    if (!str) return '';
    if (str.startsWith('92') && str.length >= 11) return str.slice(0, 12);
    if (str.startsWith('0') && str.length >= 11) return '92' + str.slice(1);
    if (str.length === 10 && str.startsWith('3')) return '92' + str;
    return '92' + str.replace(/^0+/, '');
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

// ─── Field Format Inference ────────────────────────────────────
// Read every available signal on an element to determine the exact
// format a specific field requires, without any university hardcoding.

/**
 * Returns a helper that gets the combined hint text for a field:
 * placeholder + title + pattern + label[for] text + wrapping label text.
 */
function getFieldHintText(el) {
  const parts = [
    el.getAttribute('placeholder') || '',
    el.getAttribute('title') || '',
    el.getAttribute('pattern') || '',
    el.getAttribute('data-placeholder') || '',
  ];
  // label[for=id] or label[for=formcontrolname]
  const ids = [el.id, el.getAttribute('formcontrolname')].filter(Boolean);
  for (const id of ids) {
    try {
      const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (lbl) { parts.push(lbl.textContent || ''); break; }
    } catch (_) {}
  }
  // Wrapping label
  const wrap = el.closest('label');
  if (wrap) parts.push(wrap.textContent || '');
  // Adjacent sibling label (previous element)
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'LABEL') parts.push(prev.textContent || '');
  return parts.join(' ').toLowerCase();
}

/**
 * Infer CNIC format from field signals.
 * Returns 'dashes' (XXXXX-XXXXXXX-X) or 'no_dashes' (XXXXXXXXXXXXX).
 */
function inferCNICFormat(el) {
  // type="number" can never accept dashes
  if (el.type === 'number') return 'no_dashes';

  // maxLength is the most reliable signal
  const ml = el.maxLength;
  if (ml === 13) return 'no_dashes';
  if (ml === 15) return 'dashes';

  const hint = getFieldHintText(el);

  // Explicit no-dashes signals
  if (/no[\s\-]?dash|without[\s\-]?dash|13[\s\-]?digit|nodash|nondash|without[\s\-]?[\-]|digits only/.test(hint)) return 'no_dashes';
  // Explicit dashes signals — placeholder shows "XXXXX-XXXXXXX-X" style
  if (/\d{5}-\d{7}-\d|\bxxxxx-xxxxxxx|\bwith[\s\-]?dash/.test(hint)) return 'dashes';

  // Name/id contains no-dash hint
  const sig = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.getAttribute('formcontrolname') || '') + ' ' + (el.className || '')).toLowerCase();
  if (/nodash|no_dash|nondash|without_dash|cnic13|digits/.test(sig)) return 'no_dashes';

  // Default: dashes (most Pakistani portals show dashed CNIC)
  return 'dashes';
}

/**
 * Infer phone format from field signals.
 * Returns 'local' (03xxxxxxxxx), 'intl_92' (923xxxxxxxxx), or 'intl_plus' (+923xxxxxxxxx).
 */
function inferPhoneFormat(el) {
  const ml = el.maxLength;

  // maxLength is the strongest signal for phone format
  if (ml === 11) return 'local';   // 03xxxxxxxxx = 11 chars
  if (ml === 12) return 'intl_92'; // 923xxxxxxxxx = 12 chars
  if (ml === 13) return 'intl_plus'; // +923xxxxxxxxx = 13 chars
  if (ml === 14) return 'intl_92';  // some portals allow 14 (923xxxxxxxxx + 2 extras)

  const hint = getFieldHintText(el);

  // Explicit +92 / international with plus
  if (/\+92|\+923|with\s*\+|plus.*92/.test(hint)) return 'intl_plus';
  // 923 format without plus
  if (/923|format.*92[^+]|92\s*3|country\s*code.*92|with\s*92|92\s*followed/.test(hint)) return 'intl_92';
  // Explicit local/03 format
  if (/\b03[0-9]|\bformat.*03|03xx|0[3-9]\d{9}/.test(hint)) return 'local';

  // Name/id/formcontrolname signals
  const sig = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.getAttribute('formcontrolname') || '')).toLowerCase();
  if (/intl|international|country_code|with_code/.test(sig)) return 'intl_92';

  // Default: local Pakistani format
  return 'local';
}

/**
 * Apply the correct phone transform based on inferred format.
 */
function applyPhoneTransform(value, format) {
  if (format === 'intl_92') return TRANSFORMS.phone_92(value);
  if (format === 'intl_plus') {
    const base = TRANSFORMS.phone_92(value);
    return base ? '+' + base : base;
  }
  return TRANSFORMS.phone_pak(value);
}

/**
 * Apply CNIC / phone format transforms to a value based on what the field signals
 * it requires. Safe to call for any profileKey — no-ops for non-CNIC/phone keys.
 */
function applyFieldTransform(el, profileKey, value) {
  if (!value) return value;
  if (profileKey === 'cnic' || profileKey === 'father_cnic' || profileKey === 'mother_cnic') {
    return inferCNICFormat(el) === 'no_dashes'
      ? TRANSFORMS.cnic_no_dashes(value)
      : TRANSFORMS.cnic_dashes(value);
  }
  if (profileKey === 'phone' || profileKey === 'guardian_phone' || profileKey === 'whatsapp') {
    return applyPhoneTransform(value, inferPhoneFormat(el));
  }
  return value;
}

// ─── Profile Value Resolver ─────────────────────────────────────
// Maps profileKey strings to actual profile data, supporting nested / computed keys

function profileValueFor(key, profile) {
  if (!profile || !key) return undefined;

  // Direct match
  if (profile[key] !== undefined && profile[key] !== null && profile[key] !== '') return profile[key];

  // Computed / derived keys
  switch (key) {
    case 'first_name':
      return TRANSFORMS.first_name(profile.full_name);
    case 'last_name':
      return TRANSFORMS.last_name(profile.full_name);
    case 'middle_name':
      return TRANSFORMS.middle_name(profile.full_name);
    case 'date_of_birth':
    case 'dob':
      return profile.date_of_birth || profile.dob;
    case 'dob_day': {
      const d = new Date(profile.date_of_birth || profile.dob);
      return isNaN(d.getTime()) ? undefined : String(d.getDate());
    }
    case 'dob_month': {
      const d = new Date(profile.date_of_birth || profile.dob);
      return isNaN(d.getTime()) ? undefined : String(d.getMonth() + 1);
    }
    case 'dob_year': {
      const d = new Date(profile.date_of_birth || profile.dob);
      return isNaN(d.getTime()) ? undefined : String(d.getFullYear());
    }
    case 'matric_percent':
      return profile.matric_marks && profile.matric_total
        ? ((profile.matric_marks / profile.matric_total) * 100).toFixed(2)
        : profile.matric_percent;
    case 'inter_percent':
      return profile.inter_marks && profile.inter_total
        ? ((profile.inter_marks / profile.inter_total) * 100).toFixed(2)
        : profile.inter_percent;
    case 'matric_marks':
      return profile.matric_marks || profile.matric_obtained;
    case 'matric_total': {
      const mt = profile.ibcc_olevel_total ?? profile.matric_total;
      return mt != null ? String(mt) : '1100';
    }
    case 'fsc_marks':
    case 'inter_marks':
    case 'hssc_marks':
      if (typeof getInterMarks === 'function') return getInterMarks(profile);
      return profile.fsc_marks || profile.inter_marks || profile.inter_obtained;
    case 'fsc_total':
    case 'inter_total':
    case 'hssc_total': {
      const ft = profile.ibcc_alevel_total ?? profile.fsc_total ?? profile.inter_total;
      if (ft != null) return String(ft);
      if (typeof getInterTotal === 'function') return getInterTotal(profile);
      return '1100';
    }
    case 'fsc_percentage':
    case 'inter_percentage':
    case 'hssc_percentage':
      if (typeof getInterPercentage === 'function') return getInterPercentage(profile);
      return profile.fsc_percentage || profile.inter_percent;
    case 'matric_percentage':
      if (typeof getMatricPercentage === 'function') return getMatricPercentage(profile);
      return profile.matric_percentage || profile.matric_percent;
    case 'matric_grade':
      return marksToGrade(profile.matric_marks, profile.matric_total);
    case 'inter_grade':
      return marksToGrade(profile.inter_marks, profile.inter_total);
    case 'matric_board':
      return profile.matric_board || profile.board;
    case 'inter_board':
      return profile.inter_board || profile.board;
    case 'matric_year':
      return profile.matric_year || profile.matric_passing_year;
    case 'inter_year':
      return profile.inter_year || profile.inter_passing_year || profile.fsc_year;
    case 'age': {
      const d = new Date(profile.date_of_birth || profile.dob);
      if (isNaN(d.getTime())) return undefined;
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
      return String(age);
    }
    case 'cnic_no_dashes':
      return profile.cnic ? profile.cnic.replace(/-/g, '') : undefined;
    case 'phone_with_zero':
      return profile.phone ? TRANSFORMS.phone_pak(profile.phone) : undefined;
    // ── Province / District (prefer domicile fields) ──────────
    case 'province':
      return profile.province || profile.domicile_province;
    case 'district':
      return profile.district || profile.domicile_district;
    // Domicile field that could show provinces OR districts depending on portal —
    // try district first (most specific), fall back to city, then province.
    case 'domicile_location':
      return profile.district || profile.domicile_district || profile.city
          || profile.domicile || profile.province || profile.domicile_province;
    // ── IBCC: auto-calculate percentage from marks if not stored directly ──
    case 'ibcc_equivalent_inter':
      if (profile.ibcc_equivalent_inter != null) return profile.ibcc_equivalent_inter;
      if (profile.ibcc_alevel_marks && profile.ibcc_alevel_total)
        return parseFloat(((profile.ibcc_alevel_marks / profile.ibcc_alevel_total) * 100).toFixed(2));
      return undefined;
    case 'ibcc_equivalent_matric':
      if (profile.ibcc_equivalent_matric != null) return profile.ibcc_equivalent_matric;
      if (profile.ibcc_olevel_marks && profile.ibcc_olevel_total)
        return parseFloat(((profile.ibcc_olevel_marks / profile.ibcc_olevel_total) * 100).toFixed(2));
      return undefined;
    case 'ibcc_alevel_marks':
      return profile.ibcc_alevel_marks != null ? String(profile.ibcc_alevel_marks) : undefined;
    case 'ibcc_alevel_total':
      return profile.ibcc_alevel_total != null ? String(profile.ibcc_alevel_total) : undefined;
    case 'ibcc_olevel_marks':
      return profile.ibcc_olevel_marks != null ? String(profile.ibcc_olevel_marks) : undefined;
    case 'ibcc_olevel_total':
      return profile.ibcc_olevel_total != null ? String(profile.ibcc_olevel_total) : undefined;
    // ── Father / Mother status, income, profession ─────────────
    case 'father_first_name': {
      const n = (profile.father_name || '').trim();
      return n ? n.split(/\s+/)[0] : undefined;
    }
    case 'father_last_name': {
      const parts = (profile.father_name || '').trim().split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : undefined;
    }
    case 'mother_first_name': {
      const n = (profile.mother_name || '').trim();
      return n ? n.split(/\s+/)[0] : undefined;
    }
    case 'mother_last_name': {
      const parts = (profile.mother_name || '').trim().split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : undefined;
    }
    case 'father_status':
      return profile.father_status;
    case 'mother_status':
      return profile.mother_status;
    case 'father_income':
      return profile.father_income != null ? String(profile.father_income) : undefined;
    case 'mother_income':
      return profile.mother_income != null ? String(profile.mother_income) : undefined;
    case 'father_occupation':
    case 'father_profession':
      return profile.father_occupation || profile.father_profession;
    case 'mother_profession':
    case 'mother_occupation':
      return profile.mother_profession || profile.mother_occupation;
    // ── Split phone components ─────────────────────────────────
    case 'phone_country_code': {
      if (profile.phone_country_code) return profile.phone_country_code;
      return '+92';
    }
    case 'phone_area_code': {
      if (profile.phone_area_code) return profile.phone_area_code;
      const ph = String(profile.phone || '').replace(/\D/g, '');
      if (ph.startsWith('92') && ph.length >= 5) return ph.slice(2, 5);
      if (ph.startsWith('0') && ph.length >= 4) return ph.slice(1, 4);
      return ph.slice(0, 3) || undefined;
    }
    case 'phone_local_number': {
      if (profile.phone_local_number) return profile.phone_local_number;
      const ph2 = String(profile.phone || '').replace(/\D/g, '');
      if (ph2.startsWith('92') && ph2.length > 5) return ph2.slice(5);
      if (ph2.startsWith('0') && ph2.length > 4) return ph2.slice(4);
      return ph2.length > 3 ? ph2.slice(3) : undefined;
    }
    // ── Education system / Academic background ─────────────────
    case 'education_system':
    case 'academic_background':
      return profile.education_system;
    // ── Education page: certificate type per section ────────────
    case 'matric_certificate':
      return profile.education_system === 'cambridge' ? 'O-Level' : 'Matriculation';
    case 'inter_certificate':
      return profile.education_system === 'cambridge' ? 'A-Level' : 'Intermediate';
    // ── Education page: result status ───────────────────────────
    case 'inter_result_status': {
      const statusMap = {
        completed: 'Exam given and result in Hand',
        appearing: 'Appearing in Annual Exam',
        part1_only: 'As Level',
      };
      return statusMap[profile.inter_status] || undefined;
    }
    // ── Education page: discipline (stream) ─────────────────────
    case 'inter_discipline': {
      const streamMap = {
        pre_medical: 'Medical',
        pre_engineering: 'Engineering',
        ics: 'Science',
        icom: 'Commerce',
        arts: 'Art',
        general: 'General',
      };
      return streamMap[profile.fsc_stream] || undefined;
    }
    // ── Education page: current level ───────────────────────────
    case 'inter_current_level': {
      const levelMap = {
        part1_only: 'As Level',
        appearing: 'First Year Intermediate/Equivalent',
        completed: profile.education_system === 'cambridge' ? 'A Level' : 'Second Year Intermediate/12 Grade/Equivalent',
      };
      return levelMap[profile.inter_status] || undefined;
    }
    // ── Education page: marks/year per section ──────────────────
    case 'matric_obtained': {
      // For Cambridge students, IBCC O-Level marks are the authoritative matric marks
      const v = profile.ibcc_olevel_marks ?? profile.matric_marks;
      return v != null ? String(v) : undefined;
    }
    case 'matric_total_marks': {
      const v = profile.ibcc_olevel_total ?? profile.matric_total;
      if (v != null) return String(v);
      // Fallback: Pakistani SSC standard total
      if ((profile.education_system || '').toLowerCase() !== 'cambridge') return '1100';
      return undefined;
    }
    case 'matric_pct': {
      if (profile.ibcc_olevel_marks && profile.ibcc_olevel_total)
        return String(parseFloat(((profile.ibcc_olevel_marks / profile.ibcc_olevel_total) * 100).toFixed(2)));
      const v = profile.ibcc_equivalent_matric ?? profile.matric_percentage;
      return v != null ? String(v) : undefined;
    }
    case 'matric_passing_year':
      return profile.matric_year != null ? String(profile.matric_year) : undefined;
    case 'inter_obtained': {
      // For Cambridge students, IBCC A-Level marks are the authoritative inter marks
      const v = profile.ibcc_alevel_marks ?? profile.fsc_marks;
      return v != null ? String(v) : undefined;
    }
    case 'inter_total_marks': {
      const v = profile.ibcc_alevel_total ?? profile.fsc_total;
      return v != null ? String(v) : undefined;
    }
    case 'inter_pct': {
      if (profile.ibcc_alevel_marks && profile.ibcc_alevel_total)
        return String(parseFloat(((profile.ibcc_alevel_marks / profile.ibcc_alevel_total) * 100).toFixed(2)));
      const v = profile.ibcc_equivalent_inter ?? profile.fsc_percentage;
      return v != null ? String(v) : undefined;
    }
    case 'inter_passing_year':
      return profile.fsc_year != null ? String(profile.fsc_year) : undefined;
    case 'matric_board_name':
      return profile.olevel_board || profile.matric_board || profile.board_name;
    case 'inter_board_name':
      return profile.alevel_board || profile.fsc_board || profile.board_name;
    case 'matric_school_name':
      return profile.olevel_school || profile.matric_school || profile.school_name;
    case 'inter_school_name':
      return profile.alevel_school || profile.fsc_school || profile.school_name;
    case 'matric_passing_year':
      return profile.olevel_year != null ? String(profile.olevel_year)
        : profile.matric_year != null ? String(profile.matric_year) : undefined;
    case 'inter_passing_year':
      return profile.alevel_year != null ? String(profile.alevel_year)
        : profile.fsc_year != null ? String(profile.fsc_year) : undefined;
    case 'matric_board_name': {
      const b = profile.olevel_board || profile.matric_board || profile.board_name;
      return b === 'cambridge' ? 'Cambridge' : b === 'edexcel' ? 'Edexcel' : b;
    }
    case 'inter_board_name': {
      const b = profile.alevel_board || profile.fsc_board || profile.board_name;
      return b === 'cambridge' ? 'Cambridge' : b === 'edexcel' ? 'Edexcel' : b;
    }
    case 'portal_username':
      // Generate the login username: CNIC (no dashes) → email prefix → name slug
      if (profile.cnic) return profile.cnic.replace(/-/g, '');
      if (profile.portal_email || profile.email) return (profile.portal_email || profile.email).split('@')[0];
      return (profile.full_name || '').toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    case 'full_name_as_login':
      // Used where the "Login" field expects the applicant's full name (e.g. COMSATS signup)
      return profile.full_name || undefined;
    case 'portal_password':
      // Resolved separately via getConsistentPassword() — return stored value if present
      return profile.portal_password || undefined;
    // ── Derived / default fields ───────────────────────────────
    case 'salutation': {
      // Derive title from gender: Male → Mr., Female → Mrs., Transgender → M/S
      if (profile.salutation) return profile.salutation;
      const g = (profile.gender || '').toLowerCase().trim();
      if (g === 'male' || g === 'm') return 'Mr.';
      if (g === 'female' || g === 'f') return 'Mrs.';
      if (g === 'transgender') return 'M/S';
      return undefined;
    }
    case 'marital_status':
      // Stored value if set, else default to Single
      return profile.marital_status || 'Single';
    case 'disability_type':
      // Stored value if set, else default to No Disability
      return profile.disability_type || 'No Disability';
    case 'emergency_relation':
      // Emergency contact relation — use stored value or default to Father
      return profile.emergency_relation || 'Father';
    default:
      return undefined;
  }
}

function marksToGrade(marks, total) {
  if (!marks || !total) return '';
  const pct = (marks / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// ─── Heuristic Field Detection ─────────────────────────────────
// Matches form fields to profile keys by analyzing name, id, label, placeholder

const FIELD_HEURISTICS = [
  // ── Email ──────────────────────────────────────────────────────
  // Covers: standard, ASP.NET (txtEmail, txtEmailAddress), common Pakistani portals
  {
    match: ['email', 'e-mail', 'e_mail', 'emailaddress', 'email_address', 'email_id', 'emailid',
      'student_email', 'applicant_email', 'user_email', 'contact_email', 'email_contact',
      'email address', 'your email', 'applicantemail', 'mail_id', 'mailid',
      // Pakistani portal variants
      'email_addr', 'email_input', 'applicant_mail', 'student_mail', 'reg_email',
      'registration_email', 'primary_email', 'alternate_email', 'alt_email',
      'personal_email', 'official_email', 'institutional_email',
      // ASP.NET style (after prefix stripping: txtEmail → email, but keep for label match)
      'email address *', 'email *', 'your email address'],
    profileKey: 'email', priority: 10
  },

  // ── CNIC / National ID ─────────────────────────────────────────
  {
    match: ['cnic', 'nic', 'national_id', 'nationalid', 'id_card', 'idcard', 'cnic_no', 'cnic_number',
      'b_form', 'bform', 'nicop', 'identity_card', 'id_number', 'id_no', 'national_identity',
      'nadra', 'id_card_no', 'nic_number', 'form_b', 'form-b', 'nicno', 'id card', 'cnicno',
      'national id', 'national identity card', 'cnic/nicop', 'identity_no',
      // Pakistani portal variants
      'cnic_num', 'nadra_id', 'national_id_card', 'applicant_cnic', 'student_cnic',
      'applicant_nic', 'father_id_proof', 'cnic_or_nicop', 'nic_no', 'id_proof',
      'identity_number', 'national_identity_number', 'cnic_nicop', 'applicantcnic',
      'cnic / b-form', 'cnic / b form', 'b-form', 'bform_no', 'form_b_no'],
    profileKey: 'cnic', priority: 9
  },

  // ── CNIC (no dashes) ──────────────────────────────────────────
  {
    match: ['cnic_no_dash', 'cnicnodash', 'cnic_without_dash', 'cnic_nodash', 'nic_no_dash',
      'cnic_digits', 'cnic13', 'nadra_no', 'cnicno_dash', 'cnic_plain', 'cnic_raw'],
    profileKey: 'cnic', priority: 9
  },

  // ── Phone ──────────────────────────────────────────────────────
  {
    match: ['phone', 'mobile', 'cell', 'tel', 'telephone', 'phone_number', 'mobileno', 'contact_no',
      'mob_no', 'cell_no', 'cellno', 'mobile_no', 'contact_number', 'mobile_number', 'phone_no',
      'cell_number', 'phone_num', 'mob_num', 'ph_no', 'phno', 'contact_cell',
      'mobile number', 'phone number', 'cell number', 'mobile no', 'phone no',
      'contact mobile', 'applicant_phone', 'student_phone', 'applicant_mobile',
      'contact_mob', 'mob', 'contact_phone', 'personal_phone', 'personal_mobile',
      // Pakistani portal variants
      'phone_no', 'mob_number', 'cell_phone', 'applicant_cell', 'student_cell',
      'home_phone', 'res_phone', 'contact_no_cell', 'mobile_ph', 'phone_mob',
      'applicant_contact', 'student_contact',
      'phone (with country code)', 'mobile (pakistan)', 'cell (pk)'],
    profileKey: 'phone', priority: 8
  },

  // ── Guardian / Parent / Alternate Phone ───────────────────────
  {
    match: ['guardian_phone', 'guardian_mobile', 'guardian_cell', 'guardian_contact',
      'guardian_no', 'guardian_number', 'guardian phone', 'guardian mobile',
      'parent_phone', 'parent_mobile', 'parent_cell', 'parent_contact', 'parent_number',
      'parents_phone', 'parents_mobile', 'parent phone', 'parent mobile',
      'father_phone', 'father_mobile', 'father_cell', 'father_contact', 'father_phone_no',
      'father phone', 'father mobile',
      'alternate_phone', 'alt_phone', 'other_phone', 'secondary_phone',
      'alternate_mobile', 'alt_mobile', 'other_mobile', 'secondary_mobile',
      'alternate_contact', 'alt_contact', 'other_contact', 'secondary_contact',
      'alternate phone', 'alt phone', 'other phone', 'emergency_contact',
      'emergency_phone', 'emergency_mobile', 'emergency contact',
      'contact2', 'phone2', 'mobile2', 'second_phone', 'second_mobile',
      // Pakistani portal variants
      'wali_phone', 'wali_mobile', 'wali_contact', 'sarparest_phone',
      'parent_guardian_phone', 'guardian_or_parent_phone'],
    profileKey: 'guardian_phone', priority: 8
  },

  // ── WhatsApp ──────────────────────────────────────────────────
  {
    match: ['whatsapp', 'whatsapp_no', 'whatsapp_number', 'whatsapp number', 'wp_no',
      'whatsapp_mob', 'whatsapp_mobile', 'wp_number', 'wapp_no', 'whatsapp_cell'],
    profileKey: 'whatsapp', priority: 7
  },

  // ── Father / Mother split names — MUST be before first_name/last_name ──
  // Priority 13 so "Father's First Name" label beats the generic first_name (11).
  {
    match: ["father's first name", "father first name", "father_first_name",
      "father's given name", 'dad first name', 'paternal first name',
      'fathers first name', 'father_fname'],
    profileKey: 'father_first_name', priority: 13
  },
  {
    match: ["father's last name", "father last name", "father_last_name",
      "father's surname", 'dad last name', 'paternal last name',
      'fathers last name', 'father_lname', 'father_surname'],
    profileKey: 'father_last_name', priority: 13
  },
  {
    match: ["mother's first name", "mother first name", "mother_first_name",
      "mother's given name", 'mom first name', 'maternal first name',
      'mothers first name', 'mother_fname'],
    profileKey: 'mother_first_name', priority: 13
  },
  {
    match: ["mother's last name", "mother last name", "mother_last_name",
      "mother's surname", 'mom last name', 'maternal last name',
      'mothers last name', 'mother_lname', 'mother_surname'],
    profileKey: 'mother_last_name', priority: 13
  },

  // ── First / Last / Middle — MUST be before full_name ──────────
  {
    match: ['first_name', 'firstname', 'fname', 'f_name', 'given_name', 'givenname',
      'f_nm', 'frst_nm', 'first_nm', 'applicant_fname', 'student_fname', 'sfname',
      'first name', 'given name', 'name1', 'first-name', 'forename', 'fore_name',
      'name_first', 'applicant_first', 'candidate_first_name',
      // Pakistani portal variants
      'first_name_eng', 'fname_en', 'first_name_en', 'applicant_first_name',
      'student_first_name', 'name_en_first', 'fname_english'],
    profileKey: 'first_name', priority: 11
  },

  {
    match: ['last_name', 'lastname', 'lname', 'l_name', 'surname', 'family_name', 'familyname',
      'l_nm', 'lst_nm', 'last_nm', 'applicant_lname', 'slname', 'sur_name', 'surename',
      'last name', 'family name', 'name2', 'last-name', 'name_last', 'candidate_last_name',
      'lname_en', 'last_name_en', 'surname_en', 'applicant_last_name', 'student_last_name'],
    profileKey: 'last_name', priority: 11
  },

  {
    match: ['middle_name', 'middlename', 'mname', 'm_name', 'middle_nm', 'mid_name',
      'middle name', 'middle-name', 'middle_initial', 'mid_nm', 'middle_name_en'],
    profileKey: 'middle_name', priority: 11
  },

  // ── Full Name ──────────────────────────────────────────────────
  {
    match: ['full_name', 'fullname', 'applicant_name', 'student_name', 'candidatename',
      'candidate_name', 'name_of_applicant', 'name_of_student', 'complete_name', 'full_nm',
      'full name', 'complete name', 'applicant name', 'student name', 'name of applicant',
      'yourname', 'your_name', 'applicantname', 'name_complete', 'complete_nm',
      // Pakistani portal variants
      'full_name_eng', 'name_en', 'name_english', 'fullname_en', 'applicant_full_name',
      'student_full_name', 'name_as_on_cnic', 'name_on_cnic', 'name_cnic',
      'applicant_name_en', 'name_in_english', 'full_name_english',
      'name_urdu', 'full_name_urdu', 'name_in_urdu',
      'name_as_matric', 'name_as_per_matric'],
    profileKey: 'full_name', priority: 7
  },

  // ── Father / Guardian ──────────────────────────────────────────
  {
    match: ['father', 'father_name', 'fathername', 'fathers_name', 'fathersname', 'father_nm',
      "father's name", 'fathers name', 'dad_name', 'father_first_name',
      'guardian', 'guardian_name', 'parent_name', 'parentname',
      'wali', 'wali_name', 'father_full_name', 'sarparest',
      // Pakistani portal variants
      'father_name_en', 'father_name_urdu', 'fname_father', 'father_nm_en',
      'father_or_guardian', 'father_guardian_name', 'guardian_father_name',
      'applicant_father_name', 'student_father_name', 'father_s_name',
      "father / guardian's name", 'fathers_full_name', 'guardians_name',
      'parent_guardian_name', 'father_name_as_cnic', 'father_name_on_cnic',
      // Emergency contact name — filled with guardian/father name
      'emergency_name', 'emergencyname', 'emergency_contact_name', 'emergency contact name',
      'emergency_person', 'emergency_contact_person', 'emergencycontactname'],
    profileKey: 'father_name', priority: 7
  },

  // ── Father CNIC ────────────────────────────────────────────────
  {
    match: ['father_cnic', 'fathercnic', 'guardian_cnic', 'parent_cnic', 'father_nic',
      'father_id', 'father_id_card', 'father cnic', "father's cnic", 'dad_cnic', 'fcnic',
      'father_cnic_no', 'guardian_nic', 'wali_cnic', 'father_nadra', 'parent_nic'],
    profileKey: 'father_cnic', priority: 6
  },

  // ── Mother CNIC ────────────────────────────────────────────────
  {
    match: ['mother_cnic', 'mothercnic', 'mother_nic', 'mother_id', 'mother_id_card',
      'mother cnic', "mother's cnic", 'mom_cnic', 'mcnic', 'mother_cnic_no',
      'mother_nadra', 'mother_nic_no', 'mother_national_id'],
    profileKey: 'mother_cnic', priority: 6
  },

  // ── Mother's Name ──────────────────────────────────────────────
  {
    match: ['mother_name', 'mothername', 'mothers_name', "mother's name", 'mom_name',
      'mother', 'mother_full_name', 'mname', 'mother_nm', 'mother_name_en',
      'applicant_mother_name', 'student_mother_name'],
    profileKey: 'mother_name', priority: 5
  },

  // ── Date of Birth ──────────────────────────────────────────────
  {
    match: ['dob', 'date_of_birth', 'dateofbirth', 'birthdate', 'birth_date', 'birth_dt',
      'bdate', 'date_birth', 'd_o_b', 'dob_date', 'born_date', 'date_born',
      'date of birth', 'birthday', 'birth date', 'applicant_dob', 'student_dob',
      'date_of_birth_applicant', 'dob_full',
      // Three-part select names (day/month/year components all map here)
      'birth_day', 'birth_month', 'birth_year', 'dob_day', 'dob_month', 'dob_year',
      'day_of_birth', 'month_of_birth', 'year_of_birth',
      'bd_day', 'bd_month', 'bd_year', 'dob_dd', 'dob_mm', 'dob_yyyy',
      'birth_dd', 'birth_mm', 'birth_yyyy',
      // Pakistani portal variants
      'date_birth', 'applicant_birth_date', 'student_birth_date', 'dob_applicant',
      'date_of_birth_dd_mm_yyyy', 'dob_format', 'birth_date_full',
      'date_of_birth (dd/mm/yyyy)', 'dob (dd/mm/yyyy)'],
    profileKey: 'date_of_birth', priority: 6
  },

  // ── Gender ──────────────────────────────────────────────────────
  {
    match: ['gender', 'sex', 'gender_id', 'applicant_gender', 'student_gender', 'male_female',
      'gender_type', 'applicant_sex', 'gen',
      'gender_select', 'sex_type', 'gender_code', 'applicant_sex_type'],
    profileKey: 'gender', priority: 5
  },

  // ── Blood Group ────────────────────────────────────────────────
  {
    match: ['blood_group', 'bloodgroup', 'bloodgroupid', 'blood_group_id', 'blood_type', 'bloodtype',
      'blood group', 'blood type', 'blood_grp', 'bg', 'blood_group_type',
      'applicant_blood_group', 'student_blood_group'],
    profileKey: 'blood_group', priority: 4
  },

  // ── City ───────────────────────────────────────────────────────
  {
    match: ['city', 'town', 'city_name', 'resident_city', 'current_city', 'home_city',
      'city of residence', 'city_residence', 'applicant_city', 'domicile_city',
      'city_of_residence', 'residence_city', 'student_city',
      // Pakistani portal variants
      'city_id', 'city_code', 'permanent_city', 'perm_city', 'local_city',
      'domicile_city_name', 'birth_city', 'city_birth', 'mailing_city',
      'correspondence_city', 'applicant_city_name'],
    profileKey: 'city', priority: 5
  },

  // ── Province / Domicile ────────────────────────────────────────
  {
    match: ['province', 'state', 'domicile', 'domicile_province', 'province_name', 'region',
      'state / province', 'state/province', 'province / state', 'province/state',
      'home_province', 'applicant_province', 'province of domicile', 'prov',
      'domicile_prov', 'province_of_domicile', 'residence_province',
      // Pakistani portal variants
      'province_id', 'province_code', 'domicile_id', 'domicile_code',
      'prov_name', 'domicile_name', 'permanent_province', 'perm_province',
      'applicant_domicile', 'student_domicile', 'domicile_certificate',
      'domicile_prov_name', 'province of origin', 'province_of_origin'],
    profileKey: 'province', priority: 5
  },

  // ── District ───────────────────────────────────────────────────
  {
    match: ['district', 'district_name', 'domicile_district', 'home_district', 'tehsil',
      'zila', 'district_of_domicile', 'dist',
      'district_id', 'domicile_district_name', 'perm_district', 'district_code',
      // Angular camelCase: domicileId on portals with full district lists (e.g. UET Taxila)
      'domicileid'],
    profileKey: 'district', priority: 4
  },

  // ── Address ────────────────────────────────────────────────────
  {
    match: ['address', 'postal_address', 'mailing_address', 'residential_address',
      'permanent_address', 'home_address', 'current_address', 'present_address',
      'local_address', 'street_address', 'street', 'addr', 'full_address',
      'correspondence_address', 'home address', 'mailing address', 'residence address',
      'permanent address', 'perm_address', 'res_address', 'applicant_address',
      // Pakistani portal variants
      'address1', 'address_line1', 'address_line_1', 'address_line2',
      'permanent_addr', 'perm_addr', 'home_addr', 'local_addr', 'curr_address',
      'applicant_addr', 'student_address', 'correspondence_addr', 'corr_address',
      'contact_address', 'resident_address', 'house_address', 'house_no_street',
      'house_no', 'house_number', 'house #', 'house#', 'house no', 'house number',
      'house_num', 'hno', 'h_no', 'flat_no', 'flat_number', 'building_no'],
    profileKey: 'address', priority: 4
  },

  // ── Postal Code ────────────────────────────────────────────────
  {
    match: ['postal_code', 'postalcode', 'zipcode', 'zip', 'zip_code', 'post_code', 'postcode',
      'area_code', 'pincode', 'pin_code', 'postal code', 'zip code',
      'postal_zip', 'zip_postal', 'post_zip', 'area_postal_code'],
    profileKey: 'postal_code', priority: 3
  },

  // ── Nationality / Religion ─────────────────────────────────────
  {
    match: ['nationality', 'citizenship', 'country_of_citizenship', 'country', 'citizen',
      'applicant_nationality', 'national_status', 'nationality_id', 'citizenship_status',
      'country_of_origin', 'national_origin',
      // Angular/PrimeNG residency dropdowns (e.g. UET Taxila formcontrolname="resident")
      'resident', 'residency', 'residency_status', 'residency_type', 'resident_type',
      'residency_category', 'applicant_residency'],
    profileKey: 'nationality', priority: 3
  },
  {
    match: ['religion', 'faith', 'religion_name', 'mazhab', 'deen', 'religious_affiliation',
      'religion_id', 'religionid', 'religion_code', 'applicant_religion', 'student_religion'],
    profileKey: 'religion', priority: 3
  },

  // ── Board ──────────────────────────────────────────────────────
  {
    match: ['board', 'board_name', 'boardname', 'examination_board', 'exam_board',
      'board_of_inter', 'hssc_board', 'inter_board', 'fsc_board', 'matric_board',
      'ssc_board', 'bise', 'board of intermediate', 'board of education',
      'board_of_education', 'board_exam', 'inter_board_name',
      // Pakistani portal variants
      'board_id', 'board_code', 'bise_board', 'board_inter', 'board_matric',
      'inter_exam_board', 'ssc_exam_board', 'hssc_exam_board',
      'board_of_intermediate_education', 'board_of_secondary_education',
      'matric_board_name', 'inter_board_name', 'bise_name', 'bise_id'],
    profileKey: 'board_name', priority: 4
  },

  // ── School / College ───────────────────────────────────────────
  {
    match: ['school', 'college', 'school_name', 'institution', 'school_college', 'college_name',
      'last_institution', 'previous_institution', 'last_school', 'institution_name',
      'last_attended', 'school_attended', 'name of college', 'college attended',
      'school_college_name', 'intermediate_college', 'fsc_college',
      'hssc_college', 'last_college', 'attended_school',
      // Pakistani portal variants
      'college_id', 'school_id', 'institution_id', 'fsc_institution',
      'inter_college', 'inter_institution', 'matric_school', 'matric_institution',
      'college_attended', 'school_last', 'college_last', 'previous_school',
      'previous_college', 'last_attended_school', 'last_attended_college',
      'hssc_institution', 'ssc_school', 'ssc_institution',
      'school_college_attended', 'inst_name', 'instname'],
    profileKey: 'school_name', priority: 4
  },

  // ── Passing Year ───────────────────────────────────────────────
  {
    match: ['passing_year', 'passingyear', 'year_of_passing', 'grad_year', 'graduation_year',
      'pass_year', 'year_passed', 'completion_year', 'exam_year', 'inter_year',
      'fsc_year', 'hssc_year', 'year of passing', 'passing year', 'ssc_year',
      'matric_year', 'year_of_completion', 'passing_yr',
      // Pakistani portal variants
      'year_of_pass', 'exam_passing_year', 'fsc_passing_year', 'inter_passing_year',
      'matric_passing_year', 'ssc_passing_year', 'hssc_passing_year',
      'year_exam', 'pass_yr', 'year_completion', 'graduation_yr', 'exam_yr'],
    profileKey: 'passing_year', priority: 4
  },

  // ── Roll Number ────────────────────────────────────────────────
  {
    match: ['roll_number', 'rollnumber', 'roll_no', 'rollno', 'roll', 'exam_roll',
      'matric_roll', 'inter_roll', 'ssc_roll', 'hssc_roll', 'candidate_roll',
      'board_roll', 'roll_num', 'roll number', 'board roll no', 'roll_no_inter',
      'inter_roll_no', 'fsc_roll_no', 'hssc_roll_no', 'roll_no_ssc', 'ssc_roll_no',
      // Pakistani portal variants
      'roll_no_matric', 'roll_no_fsc', 'examination_roll_no', 'board_roll_no',
      'matric_roll_no', 'inter_roll_number', 'fsc_roll_number', 'ssc_roll_number',
      'hssc_roll_number', 'rollno_inter', 'rollno_matric', 'exam_rollno'],
    profileKey: 'roll_number', priority: 5
  },

  // ── FSc / A-Level Marks (obtained) ────────────────────────────
  // profileKey 'inter_obtained' uses ibcc_alevel_marks for Cambridge students,
  // falling back to fsc_marks for Pakistani students.
  {
    match: ['fsc_marks', 'fscmarks', 'hssc_marks', 'inter_marks', 'intermediate_marks',
      'fsc_obtained', 'inter_obtained', 'hssc_obtained', 'inter_obt_marks',
      'f_sc_marks', 'fsc_obt', 'inter_obt', 'total_marks_inter',
      'marks_obtained_inter', 'hssc_marks_obtained', 'intermarks', 'marks_inter',
      'fsc obtained marks', 'inter obtained', 'hssc obtained', 'marks_intermediate',
      'hsc_marks', 'hscmarks', 'inter_marks_obtained', 'fsc_total_obtained',
      // Pakistani portal variants
      'inter_obtained_marks', 'hssc_obtained_marks', 'fsc_obtained_marks',
      'inter_marks_obt', 'hssc_marks_obt', 'fsc_marks_obt',
      'class_12_marks', 'grade_12_marks', 'pre_engineering_marks',
      'pre_medical_marks', 'fa_marks', 'fsc_part_1_2_marks',
      'inter_part1_part2_marks', 'combined_inter_marks'],
    profileKey: 'inter_obtained', priority: 6
  },

  // ── FSc / A-Level Total Marks ──────────────────────────────────
  // profileKey 'inter_total_marks' uses ibcc_alevel_total for Cambridge students.
  {
    match: ['fsc_total', 'fsctotal', 'hssc_total', 'inter_total', 'total_marks_fsc',
      'total_fsc', 'fsc_max', 'inter_max', 'hssc_max', 'total_inter',
      'inter total marks', 'fsc total', 'hsc_total', 'intermediate_total',
      'hssc_total_marks', 'fsc_total_marks',
      'inter_total_marks', 'fsc_max_marks', 'inter_max_marks', 'hssc_max_marks',
      'class_12_total', 'grade_12_total', 'fsc_full_marks'],
    profileKey: 'inter_total_marks', priority: 5
  },

  // ── FSc Percentage ─────────────────────────────────────────────
  {
    match: ['fsc_percentage', 'fscpercentage', 'inter_percentage', 'hssc_percentage',
      'fsc_pct', 'inter_pct', 'percentage_fsc', 'hssc_pct', 'intermediate_percentage',
      'fsc_percent', 'inter_percent',
      'inter_pct_age', 'hssc_pct_age', 'fsc_pct_age', 'intermediate_pct',
      'class_12_percentage', 'grade_12_percentage', 'inter_score_pct'],
    profileKey: 'fsc_percentage', priority: 5
  },

  // ── FSc Part-I marks ───────────────────────────────────────────
  {
    match: ['part1_marks', 'part_1_marks', 'fsc_part1', 'part1_obtained', 'partone_marks',
      'part_i_marks', 'year1_marks', 'part 1 marks', 'part-1 marks', 'part1marks',
      'part_one_marks', 'yr1_marks', 'inter_part1', 'hssc_part1', 'fsc_part_1'],
    profileKey: 'fsc_part1_marks', priority: 6
  },

  // ── Matric / O-Level Marks (obtained) ─────────────────────────
  // profileKey 'matric_obtained' uses ibcc_olevel_marks for Cambridge students,
  // falling back to matric_marks for Pakistani students.
  {
    match: ['matric_marks', 'matricmarks', 'ssc_marks', 'matric_obtained', 'ssc_obtained',
      'matric_obt', 'ssc_obt', 'marks_obtained_matric', 'marks_matric',
      'matric_obtained_marks', 'ssc_marks_obtained', 'marks_ssc',
      'matriculation_marks', 'matric obtained', 'ssc obtained marks',
      'class_10_marks', 'grade_10_marks', 'secondary_marks', 'ssc_obt_marks',
      // Pakistani portal variants
      'matric_obt_marks', 'ssc_obtained_marks', 'matric_marks_obtained',
      'ssc_marks_obt', 'matriculation_obtained', 'class_9_10_marks',
      'secondary_school_marks', 'matric_score',
      // Generic Angular/PrimeNG formcontrolname used on qualification tables
      'obtainmarks'],
    profileKey: 'matric_obtained', priority: 6
  },

  // ── Matric / O-Level Total Marks ───────────────────────────────
  // profileKey 'matric_total_marks' uses ibcc_olevel_total for Cambridge students.
  {
    match: ['matric_total', 'matrictotal', 'ssc_total', 'total_marks_matric',
      'total_matric', 'matric_max', 'ssc_max', 'total_ssc', 'matriculation_total',
      'matric total', 'ssc total marks', 'secondary_total', 'class_10_total',
      'matric_total_marks', 'ssc_total_marks', 'matric_max_marks', 'ssc_max_marks',
      'matric_full_marks', 'class_10_total_marks',
      // Generic Angular/PrimeNG formcontrolname
      'totalmarks'],
    profileKey: 'matric_total_marks', priority: 5
  },

  // ── Matric Percentage ──────────────────────────────────────────
  {
    match: ['matric_percentage', 'matricpercentage', 'ssc_percentage', 'matric_pct',
      'matric_percent', 'ssc_pct', 'secondary_percentage',
      'class_10_percentage', 'grade_10_percentage', 'matric_score_pct',
      'ssc_pct_age', 'matric_pct_age'],
    profileKey: 'matric_percentage', priority: 5
  },

  // ── IBCC Equivalence ───────────────────────────────────────────
  {
    match: ['ibcc_equivalent_inter', 'ibcc_inter', 'ibcc_alevel', 'ibcc_alevel_percentage',
      'ibcc equivalent inter', 'ibcc inter percentage', 'ibcc percentage inter',
      'alevel_ibcc', 'a_level_ibcc', 'ibcc_fsc', 'ibcc fsc percentage',
      'inter ibcc', 'alevel ibcc percentage', 'ibcc equivalent percentage inter'],
    profileKey: 'ibcc_equivalent_inter', priority: 7
  },
  {
    match: ['ibcc_equivalent_matric', 'ibcc_matric', 'ibcc_olevel', 'ibcc_olevel_percentage',
      'ibcc equivalent matric', 'ibcc matric percentage', 'ibcc percentage matric',
      'olevel_ibcc', 'o_level_ibcc', 'ibcc_ssc', 'ibcc ssc percentage',
      'matric ibcc', 'olevel ibcc percentage', 'ibcc equivalent percentage matric'],
    profileKey: 'ibcc_equivalent_matric', priority: 7
  },
  {
    match: ['ibcc_alevel_marks', 'ibcc alevel marks', 'ibcc alevel obtained',
      'ibcc_alevel_obtained', 'ibcc inter marks', 'ibcc_inter_marks'],
    profileKey: 'ibcc_alevel_marks', priority: 7
  },
  {
    match: ['ibcc_alevel_total', 'ibcc alevel total', 'ibcc inter total',
      'ibcc_inter_total', 'ibcc_alevel_max', 'ibcc inter max marks'],
    profileKey: 'ibcc_alevel_total', priority: 7
  },
  {
    match: ['ibcc_olevel_marks', 'ibcc olevel marks', 'ibcc olevel obtained',
      'ibcc_olevel_obtained', 'ibcc matric marks', 'ibcc_matric_marks'],
    profileKey: 'ibcc_olevel_marks', priority: 7
  },
  {
    match: ['ibcc_olevel_total', 'ibcc olevel total', 'ibcc matric total',
      'ibcc_matric_total', 'ibcc_olevel_max', 'ibcc matric max marks'],
    profileKey: 'ibcc_olevel_total', priority: 7
  },

  // ── Education form: section-context-aware generic labels ──────
  // IBA and similar portals repeat generic labels ("Obtained Marks", "Total Marks",
  // "Year of Passing", "Name of Board") in each education section.
  // These heuristics provide the CONTEXT-SPECIFIC profileKey.
  // matchFieldHeuristically resolves the right key via getEduSectionContext().
  {
    match: ['obtained marks', 'obtained_marks', 'marks obtained', 'marks_obtained'],
    profileKey: 'edu_obtained_marks', priority: 7
  },
  {
    match: ['total marks', 'total_marks', 'maximum marks', 'max_marks', 'full marks'],
    profileKey: 'edu_total_marks', priority: 7
  },
  {
    match: ['percentage(%)', 'percentage (%)', 'percentage', 'percent', 'pct', 'percentage(%)'],
    profileKey: 'edu_percentage', priority: 6
  },
  {
    match: ['year of passing', 'year_of_passing', 'passing year', 'passing_year'],
    profileKey: 'edu_passing_year', priority: 7
  },
  {
    match: ['name of board', 'name_of_board', 'board name', 'board_name'],
    profileKey: 'edu_board_name', priority: 7
  },
  {
    match: ['name of school / college', 'name of school/college', 'name of school',
      'name of college', 'name of institute', 'name_of_school', 'name_of_college',
      'name_of_institute', 'name of institution'],
    profileKey: 'edu_school_name', priority: 7
  },
  {
    match: ['certificate / degree', 'certificate/degree', 'certificate degree',
      'degree certificate', 'certificate_degree', 'degree_type', 'certificate_type'],
    profileKey: 'edu_certificate', priority: 8
  },
  {
    match: ['result status', 'result_status', 'exam status', 'exam_status',
      'current status', 'current_status', 'result_type'],
    profileKey: 'inter_result_status', priority: 7
  },
  {
    match: ['discipline', 'stream', 'subject_group', 'subject group', 'faculty',
      'field of study', 'field_of_study'],
    profileKey: 'inter_discipline', priority: 6
  },
  {
    match: ['current level', 'current_level', 'education level', 'education_level',
      'class level', 'class_level', 'level of education'],
    profileKey: 'inter_current_level', priority: 7
  },

  // ── NET / NTS Score ────────────────────────────────────────────
  {
    match: ['net_score', 'net_marks', 'netscore', 'net', 'nts_score', 'nts_marks',
      'entry_test', 'entry_test_score', 'entrance_score', 'entrance_marks', 'admission_test',
      'test_score', 'test_marks', 'merit_score', 'aggregate_score', 'entry_test_marks',
      'aggregate_marks', 'test_percentile', 'merit_aggregate', 'admission_test_score',
      // Pakistani portal variants
      'nts_marks_obtained', 'net_marks_obtained', 'nts_test_score', 'entry_test_result',
      'admission_test_marks', 'university_test_score', 'uni_test_score',
      'hat_score', 'hat_marks', 'lcat_score', 'ncat_score', 'step_score',
      'paf_test_score', 'navy_test_score', 'army_test_score'],
    profileKey: 'net_score', priority: 5
  },

  // ── ECAT Score ─────────────────────────────────────────────────
  {
    match: ['ecat_score', 'ecat_marks', 'ecat', 'engineering_test', 'enet_score',
      'ecat_result', 'ecat_marks_obtained', 'engineering_admission_test'],
    profileKey: 'ecat_score', priority: 6
  },

  // ── MCAT/MDCAT Score ──────────────────────────────────────────
  {
    match: ['mcat_score', 'mcat', 'mcat_marks', 'mdcat_score', 'mdcat', 'mdcat_marks',
      'medical_test', 'uhs_score', 'mdcat_result', 'mcat_result', 'uhs_test_score'],
    profileKey: 'net_score', priority: 6
  },

  // ── SAT Score ─────────────────────────────────────────────────
  {
    match: ['sat_score', 'sat', 'sat_marks', 'sat1', 'sat2', 'sat_result', 'sat_total'],
    profileKey: 'sat_score', priority: 6
  },

  // ── GAT/GRE ───────────────────────────────────────────────────
  {
    match: ['gat_score', 'gat', 'gre_score', 'gre', 'gmat_score', 'gmat', 'ielts', 'toefl',
      'ielts_score', 'toefl_score', 'gat_general', 'gat_subject'],
    profileKey: 'net_score', priority: 4
  },

  // ── Statement of Purpose ───────────────────────────────────────
  {
    match: ['statement_of_purpose', 'sop', 'personal_statement', 'essay', 'motivation_letter',
      'statement', 'why_join', 'why_apply', 'about_yourself', 'motivation', 'cover_letter',
      'statement of purpose', 'personal statement', 'application essay',
      'sop_text', 'personal_essay', 'motivation_statement', 'letter_of_intent',
      'why_this_university', 'why_apply_here'],
    profileKey: 'statement_of_purpose', priority: 3
  },

  // ── Father Occupation / Profession ────────────────────────────
  {
    match: ['father_profession', 'father_occupation', 'fathers_profession', 'fathers_occupation',
      "father's profession", "father's occupation", 'father_job', 'father_work',
      'dad_profession', 'dad_occupation', 'father_employment', 'father_business',
      'guardian_occupation', 'guardian_profession', 'parent_occupation',
      'father profession', 'father occupation', 'father job',
      'fathers_employment', 'father_vocation', 'father_trade',
      // Pakistani portal variants
      'father_prof', 'father_occ', 'father_emp', 'father_designation',
      'guardian_job', 'guardian_work', 'wali_occupation', 'wali_profession'],
    profileKey: 'father_occupation', priority: 7
  },

  // ── Father Status (alive / deceased / shaheed) ─────────────────
  {
    match: ['father_status', 'father_alive', 'is_father_alive', 'father_living',
      "father's status", 'father_vital_status', 'father_life_status', 'father_condition',
      'father status', 'father alive', 'is father alive', 'father living',
      // Pakistani portal variants
      'father_state', 'father_condition', 'father_health', 'wali_status'],
    profileKey: 'father_status', priority: 6
  },

  // ── Father Income ─────────────────────────────────────────────
  {
    match: ['father_income', 'fathers_income', "father's income", 'father_monthly_income',
      'father income', 'guardian_income', 'parent_income', 'father_salary',
      'family_income', 'household_income', 'monthly_income', 'annual_income',
      // Pakistani portal variants
      'father_earn', 'wali_income', 'father_earnings', 'guardian_salary',
      'father_monthly_salary', 'income_father'],
    profileKey: 'father_income', priority: 5
  },

  // ── Mother Profession ──────────────────────────────────────────
  {
    match: ['mother_profession', 'mother_occupation', 'mothers_profession', 'mothers_occupation',
      "mother's profession", "mother's occupation", 'mother_job', 'mother_work',
      'mom_profession', 'mom_occupation', 'mother_employment', 'mother_business',
      'mother profession', 'mother occupation', 'mother job',
      // Pakistani portal variants
      'mother_prof', 'mother_occ', 'mother_emp', 'mother_vocation'],
    profileKey: 'mother_profession', priority: 6
  },

  // ── Mother Status ─────────────────────────────────────────────
  {
    match: ['mother_status', 'mother_alive', 'is_mother_alive', 'mother_living',
      "mother's status", 'mother_vital_status', 'mother_life_status', 'mother_condition',
      'mother status', 'mother alive', 'is mother alive', 'mother living',
      'mother_state', 'mother_health'],
    profileKey: 'mother_status', priority: 6
  },

  // ── Mother Income ─────────────────────────────────────────────
  {
    match: ['mother_income', 'mothers_income', "mother's income", 'mother_monthly_income',
      'mother income', 'mother_salary', 'mother_earnings', 'mother_monthly_salary',
      'income_mother'],
    profileKey: 'mother_income', priority: 5
  },

  // ── Phone Country Code ────────────────────────────────────────
  {
    match: ['country_code', 'phone_country', 'country_code_phone', 'country_calling_code',
      'intl_code', 'phone_prefix', 'phone_country_code', 'calling_code',
      'international_code', 'dial_code', 'phone_dial_code', 'country dialing code',
      'country code', 'phone country code', 'code_phone'],
    profileKey: 'phone_country_code', priority: 9
  },

  // ── Phone Area Code ───────────────────────────────────────────
  {
    match: ['area_code', 'std_code', 'operator_code', 'network_code', 'phone_area',
      'local_exchange', 'city_code', 'exchange_code', 'phone_area_code',
      'area code', 'network code', 'operator code', 'mobile_code',
      'network_prefix', 'phone_exchange'],
    profileKey: 'phone_area_code', priority: 8
  },

  // ── Phone Local Number ────────────────────────────────────────
  {
    match: ['subscriber_number', 'local_number', 'phone_number_part', 'line_number',
      'extension_number', 'phone_local', 'phone_subscriber', 'local_phone',
      'subscriber number', 'local number', 'phone number', 'number_only',
      'phone_no_number', 'mobile_number_only'],
    profileKey: 'phone_local_number', priority: 7
  },

  // ── Education System / Academic Background ─────────────────────
  {
    match: ['education_system', 'academic_background', 'academic_system', 'qualification_type',
      'education_type', 'schooling_system', 'board_type', 'academic_qualification',
      'education system', 'academic background', 'qualification type',
      'previous_education', 'pre_education_type', 'inter_system', 'fsc_or_alevel',
      // Pakistani portal variants
      'edu_sys', 'academic_sys', 'study_system', 'education_category',
      'qualification_category', 'academic_category', 'inter_type_qualification'],
    profileKey: 'education_system', priority: 6
  },

  // ── Domicile location (camelCase Angular formcontrolname) ────────
  // 'domicileId' normalizes to 'domicileid'. The province heuristic's 'domicile_id'
  // keyword also normalizes to 'domicileid' when separators are stripped, giving it
  // a score of 20 (priority 5 + exact 10 + primary bonus 5). This entry at priority 10
  // ensures district-first matching wins for camelCase domicile fields on Angular portals.
  {
    match: ['domicileid'],
    profileKey: 'domicile_location', priority: 10
  },

  // ── Salutation / Title ─────────────────────────────────────────
  // Derived from gender: Male → Mr., Female → Mrs., Transgender → M/S
  {
    match: ['salutation', 'salutationtypeid', 'salutation_type', 'salutation_type_id',
      'salutation_id', 'title', 'name_title', 'title_name', 'prefix', 'name_prefix',
      'honorific', 'mr_mrs', 'mr_ms', 'mr_dr'],
    profileKey: 'salutation', priority: 5
  },

  // ── Emergency Contact Relation ─────────────────────────────────
  {
    match: ['emergency_relation', 'emergencyrelation', 'emergency_contact_relation',
      'emergency relation', 'emergency contact relation', 'emergency_contact_type',
      'relation_emergency', 'contact_relation', 'relation_with_student',
      'relation_with_applicant', 'relation to applicant', 'relation to student',
      'ddlemergencyrelation', 'emergency_relationship'],
    profileKey: 'emergency_relation', priority: 5
  },

  // ── Marital Status ─────────────────────────────────────────────
  {
    match: ['maritalstatus', 'marital_status', 'marital', 'civil_status', 'civilstatus',
      'relationship_status', 'marital status', 'marital_state', 'married_status'],
    profileKey: 'marital_status', priority: 3
  },

  // ── Disability Type ────────────────────────────────────────────
  {
    match: ['disabilitytypeid', 'disability_type', 'disability_type_id', 'disability',
      'disability_status', 'handicap', 'handicap_type', 'physical_disability',
      'disability type', 'disability_category', 'special_need', 'special_needs'],
    profileKey: 'disability_type', priority: 3
  },
];

// Fields that should NEVER be autofilled by heuristics
const EXCLUDED_FIELD_PATTERNS = [
  'captcha', 'verification', 'verify', 'otp', 'token', 'csrf',
  'login', 'userid', 'user_id', 'username', 'user_name', 'loginid', 'login_id',
  'recaptcha', 'security_code', 'securitycode', 'answer',
  'pin_code', 'pincode', 'pin',
  'secret', 'question', 'hint',
  // ASP.NET style verification fields
  'txtverif', 'txtcaptcha', 'imgcode', 'securityimage', 'imgverif',
  'verificationcode', 'verification_code', 'txtpin',
  // Explicit login/account-creation fields that aren't profile data
  'confirm_password', 'confirmpassword', 'password_confirm', 're_password', 'retype',
  // Residence TYPE (accommodation type) — not a profile field; form-specific default
  // Any field whose name/id contains "residence" is a residence-type dropdown (Own/Rented/etc.)
  // City/province heuristic keywords like "city_of_residence" live in FIELD_HEURISTICS labels
  // and never appear in actual field name attributes — so this exclusion is safe.
  'residence',
];

// Pakistani city → province lookup
const CITY_TO_PROVINCE = {
  'karachi': 'Sindh', 'hyderabad': 'Sindh', 'sukkur': 'Sindh', 'larkana': 'Sindh',
  'nawabshah': 'Sindh', 'mirpur khas': 'Sindh', 'khairpur': 'Sindh', 'jacobabad': 'Sindh',
  'lahore': 'Punjab', 'faisalabad': 'Punjab', 'rawalpindi': 'Punjab', 'gujranwala': 'Punjab',
  'multan': 'Punjab', 'bahawalpur': 'Punjab', 'sargodha': 'Punjab', 'sialkot': 'Punjab',
  'sheikhupura': 'Punjab', 'jhang': 'Punjab', 'rahim yar khan': 'Punjab', 'gujrat': 'Punjab',
  'kasur': 'Punjab', 'dera ghazi khan': 'Punjab', 'sahiwal': 'Punjab', 'okara': 'Punjab',
  'islamabad': 'Islamabad Capital Territory', 'federal': 'Islamabad Capital Territory',
  'peshawar': 'Khyber Pakhtunkhwa', 'mardan': 'Khyber Pakhtunkhwa', 'abbottabad': 'Khyber Pakhtunkhwa',
  'swat': 'Khyber Pakhtunkhwa', 'kohat': 'Khyber Pakhtunkhwa', 'mansehra': 'Khyber Pakhtunkhwa',
  'dera ismail khan': 'Khyber Pakhtunkhwa', 'nowshera': 'Khyber Pakhtunkhwa',
  'quetta': 'Balochistan', 'turbat': 'Balochistan', 'khuzdar': 'Balochistan', 'hub': 'Balochistan',
  'muzaffarabad': 'Azad Kashmir', 'mirpur': 'Azad Kashmir', 'rawalakot': 'Azad Kashmir',
  'gilgit': 'Gilgit-Baltistan', 'skardu': 'Gilgit-Baltistan',
};

/**
 * Normalize a string for heuristic comparison:
 * lowercases, strips common ASP.NET prefixes (txt, lbl, ctl, txt_),
 * and collapses separators.
 */
/**
 * Walk up the DOM from el to find the nearest section heading text.
 * Returns 'matric', 'inter', 'undergrad', 'grad', or null.
 */
function getEduSectionContext(el) {
  let node = el.parentElement;
  while (node && node !== document.body) {
    // Check headings or card-title children of this container
    const heading = node.querySelector('h1,h2,h3,h4,h5,h6,legend,.card-title,.panel-title,.section-title,.accordion-title,.tab-title');
    const headText = (heading?.textContent || '').toLowerCase();
    if (/matric|ssc|secondary|o[\s.-]?level|class\s*10/.test(headText)) return 'matric';
    if (/inter|hssc|higher secondary|a[\s.-]?level|class\s*12/.test(headText)) return 'inter';
    if (/under.?grad|bachelor|b\.a|b\.sc|b\.com/.test(headText)) return 'undergrad';
    if (/\bgrad|master|m\.a|m\.sc|m\.com/.test(headText)) return 'grad';
    node = node.parentElement;
  }
  return null;
}

function normalizeSignal(s) {
  return s
    .toLowerCase()
    .replace(/^(txt|lbl|ctl|ddl|rb|chk|txt_|lbl_|ctl_)/, '') // ASP.NET prefixes
    .replace(/[\-_\s]+/g, '_')                                  // unify separators
    .trim();
}

/**
 * Build a combined signal string for an input element.
 * Used for quick pattern checks (username, login, etc.).
 */
function buildFieldSignature(el) {
  const parts = [
    el.name, el.id,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    el.getAttribute('data-label'),
    el.getAttribute('autocomplete'),
  ].filter(Boolean).map(s => s.toLowerCase().replace(/[\-\s]+/g, '_'));
  // Add label text
  if (el.labels?.length) parts.push(el.labels[0].textContent.toLowerCase().replace(/[\s\-]+/g, '_'));
  else {
    const lbl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
    if (lbl) parts.push(lbl.textContent.toLowerCase().replace(/[\s\-]+/g, '_'));
  }
  return parts.join(' ');
}

/**
 * Try to match a form element to a profile key using multi-signal heuristics.
 * Analyzes: name, id, placeholder, label text, aria-label, data-*, autocomplete.
 */
function matchFieldHeuristically(el) {
  if (el.type === 'password') return null;
  if (el.type === 'hidden') return null;

  // Collect raw signals
  const rawName = el.name || '';
  const rawId = el.id || '';
  const rawPlaceholder = el.getAttribute('placeholder') || '';
  const rawAriaLabel = el.getAttribute('aria-label') || '';
  const rawDataLabel = el.getAttribute('data-label') || el.getAttribute('data-field') || '';
  const rawAutocomplete = el.getAttribute('autocomplete') || '';
  // For custom widget divs (typeahead etc.) use title as placeholder-equivalent signal
  const rawTitle = (el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA')
    ? (el.getAttribute('title') || '') : '';
  // Find associated label
  let labelText = '';
  if (el.labels?.length) {
    labelText = el.labels[0].textContent || '';
  } else {
    // Search nearby label by for= attribute
    if (rawId) {
      const lbl = document.querySelector(`label[for="${rawId}"]`);
      if (lbl) labelText = lbl.textContent || '';
    }
    // Or a wrapping label
    if (!labelText) {
      const wrapping = el.closest('label');
      if (wrapping) labelText = wrapping.textContent || '';
    }
    // Table-based forms (e.g. ASP.NET WebForms): label text is in adjacent <td>/<th>
    if (!labelText) {
      const cell = el.closest('td, th');
      if (cell) {
        const row = cell.parentElement;
        if (row) {
          const cells = Array.from(row.children);
          const myIdx = cells.indexOf(cell);
          if (myIdx > 0) {
            const prevCell = cells[myIdx - 1];
            if (!prevCell.querySelector('input, select, textarea')) {
              labelText = prevCell.textContent || '';
            }
          }
        }
      }
    }
    // Immediate previous sibling that looks like a label (no form elements inside)
    if (!labelText) {
      const prev = el.previousElementSibling;
      if (prev && !prev.querySelector('input, select, textarea')) {
        if (['LABEL', 'SPAN', 'B', 'STRONG', 'P', 'DIV', 'LI'].includes(prev.tagName)) {
          labelText = prev.textContent || '';
        }
      }
    }
  }

  // Build normalized signals (name/id get extra weight as primary identifiers)
  const normName = normalizeSignal(rawName);
  const normId = normalizeSignal(rawId);
  // Angular formcontrolname attribute — treated as primary signal (equivalent to name/id)
  const rawFormControl = el.getAttribute('formcontrolname') || '';
  const normFormControl = normalizeSignal(rawFormControl);
  const normPlaceholder = (rawPlaceholder).toLowerCase().trim();
  const normAriaLabel = (rawAriaLabel).toLowerCase().trim();
  const normLabel = (labelText).toLowerCase().trim().replace(/[*:]+$/, '').trim();
  const normData = (rawDataLabel).toLowerCase().trim();
  const normAC = (rawAutocomplete).toLowerCase().trim();

  // All signals as array (primary ones first for priority ordering)
  const primarySignals = [normName, normId, normFormControl].filter(Boolean);
  const normTitle = rawTitle.toLowerCase().trim();
  const secondarySignals = [normLabel, normAriaLabel, normPlaceholder, normData, normAC, normTitle].filter(Boolean);
  const allSignals = [...primarySignals, ...secondarySignals];

  // ── HTML type shortcuts (checked before signal-based logic) ─────
  // These widgets have no name/id/placeholder, so they must be identified
  // by type or class before the allSignals empty-check.
  if (el.type === 'email') return 'email';
  if (el.type === 'tel' || el.classList.contains('vti__input') || el.closest('.vue-tel-input')) {
    // Check parent container text for alternate/guardian context so the
    // second phone field on a form (e.g. IBA alternate number) maps to guardian_phone.
    const container = el.closest('tr, .form-group, .field-group, [class*="form"], [class*="field"], [class*="row"]');
    const ctxText = (container?.textContent || el.parentElement?.textContent || '').toLowerCase();
    if (/alternate|alt\b|guardian|parent\b|emergency|secondary|other\s*(?:phone|mobile|number)/.test(ctxText)) {
      return 'guardian_phone';
    }
    return 'phone';
  }

  if (allSignals.length === 0) return null;

  // ── Exclusion check ─────────────────────────────────────────────
  // IMPORTANT: only check primary signals + placeholder/aria-label — NOT the TD proximity label.
  // TD labels like "UserID (Email Address):" legitimately contain "userid" but are email fields.
  const exclusionSignals = [...primarySignals, normPlaceholder, normAriaLabel].filter(Boolean);
  const combined = exclusionSignals.join(' ');
  if (EXCLUDED_FIELD_PATTERNS.some(p => combined.includes(p))) return null;

  // Still use full allSignals for the full pattern matching below
  const fullCombined = allSignals.join(' ');

  // Proximity-based CAPTCHA image detection
  const isCaptchaImg = (img) => {
    const s = ((img.src || '') + ' ' + (img.alt || '') + ' ' + (img.className || '')).toLowerCase();
    return /captcha|verify|security|securityimage|imgcode/.test(s);
  };
  for (const sibling of [el.previousElementSibling, el.nextElementSibling]) {
    if (sibling?.tagName === 'IMG' && isCaptchaImg(sibling)) return null;
  }
  if (el.parentElement) {
    for (const child of el.parentElement.children) {
      if (child.tagName === 'IMG' && isCaptchaImg(child)) return null;
    }
  }

  // ── HTML type shortcuts ─────────────────────────────────────────
  if (el.type === 'date') {
    if (allSignals.some(s => s.includes('birth') || s.includes('dob') || s.includes('born'))) return 'date_of_birth';
  }

  // ── Autocomplete standard values ────────────────────────────────
  const acMap = {
    'email': 'email', 'tel': 'phone', 'tel-national': 'phone',
    'given-name': 'first_name', 'family-name': 'last_name', 'additional-name': 'middle_name',
    'name': 'full_name', 'bday': 'date_of_birth',
    'sex': 'gender', 'address-line1': 'address', 'address-level2': 'city',
    'address-level1': 'province', 'country': 'nationality', 'postal-code': 'postal_code',
  };
  if (normAC && acMap[normAC]) return acMap[normAC];

  // ── Father / Mother split name fast paths (MUST be before first_name/last_name) ──
  if (allSignals.some(s => /father|dad|paternal/.test(s) && /\bfirst[_\s-]?name\b/.test(s))) return 'father_first_name';
  if (allSignals.some(s => /father|dad|paternal/.test(s) && (/\blast[_\s-]?name\b/.test(s) || /\bsurname\b/.test(s)))) return 'father_last_name';
  if (allSignals.some(s => /mother|mom|maternal/.test(s) && /\bfirst[_\s-]?name\b/.test(s))) return 'mother_first_name';
  if (allSignals.some(s => /mother|mom|maternal/.test(s) && (/\blast[_\s-]?name\b/.test(s) || /\bsurname\b/.test(s)))) return 'mother_last_name';

  // ── First / Last / Middle before generic name ───────────────────
  if (allSignals.some(s => {
    if (/father|mother|dad|mom|parent|guardian/.test(s)) return false;
    return /\bfirst[_\s-]?name\b/.test(s) || /\bgiven[_\s-]?name\b/.test(s) ||
      s === 'fname' || s === 'first_name' || s === 'firstname' || s === 'f_name' ||
      s === 'f_nm' || s === 'frst_nm' || s === 'sfname';
  })) return 'first_name';

  if (allSignals.some(s => {
    if (/father|mother|dad|mom|parent|guardian/.test(s)) return false;
    return /\blast[_\s-]?name\b/.test(s) || /\bsurname\b/.test(s) ||
      /\bfamily[_\s-]?name\b/.test(s) || s === 'lname' || s === 'last_name' ||
      s === 'lastname' || s === 'l_name' || s === 'l_nm' || s === 'slname';
  })) return 'last_name';

  if (allSignals.some(s => /\bmiddle[_\s-]?name\b/.test(s) || s === 'mname' ||
    s === 'middle_name' || s === 'middlename' || s === 'm_name')) return 'middle_name';

  // ── Generic "name" → full_name (excluding first/last/middle/login/user/roll/father/mother/emergency) ──
  if (allSignals.some(s => {
    if (!/\bname\b/.test(s)) return false;
    if (/\b(first|last|middle|login|user|sur|father|mother|roll|school|college|board|institution|guardian|parent|emergency)\b/.test(s)) return false;
    // Also exclude if signal itself contains these substrings
    if (s.includes('mother') || s.includes('father') || s.includes('guardian') || s.includes('parent') || s.includes('emergency')) return false;
    return true;
  })) return 'full_name';

  // ── Heuristic table scan ────────────────────────────────────────
  // After the scan, context-aware keys (edu_*) are resolved to their
  // section-specific profileKeys using the DOM section heading.
  let bestKey = null;
  let bestScore = -1;

  for (const h of FIELD_HEURISTICS) {
    for (const keyword of h.match) {
      const normKw = normalizeSignal(keyword);

      // Primary signals get 2× priority bonus
      for (const [idx, sig] of allSignals.entries()) {
        const isPrimary = idx < primarySignals.length;
        const bonus = isPrimary ? 5 : 0;

        let score = -1;

        // Strip all separators, punctuation, ASP.NET $ delimiters, and quote variants so
        // "father\u2019s income (pkr)" → "fathersinccomepkr" can match keyword "father's_income"
        // Also strips $ (ASP.NET name delimiter) and parentheses from label signals
        const sigNoSep = sig.replace(/[\s_\-$()''‛`"]+/g, '');
        const normKwNoSep = normKw.replace(/[\s_\-$()''‛`"]+/g, '');
        if (sig === normKw || sigNoSep === normKwNoSep) {
          // Exact match (with and without separators)
          score = h.priority + 10 + bonus;
        } else if (sig.startsWith(normKw) || sig.endsWith(normKw) ||
          sigNoSep.endsWith(normKwNoSep)) {
          // Prefix/suffix match
          score = h.priority + 6 + bonus;
        } else if (sig.includes(normKw) || sigNoSep.includes(normKwNoSep)) {
          // Contains match — also without separators (fixes ASP.NET camelCase IDs)
          if (sig.length >= 3) score = h.priority + bonus;
        } else if (normKw.includes(sig) && sig.length >= 6) {
          // Keyword contains signal — only if signal is long enough to be unambiguous
          // (prevents short signals like "residence" matching "city_of_residence" keyword)
          if (sig.length >= 3) score = h.priority + bonus;
        }

        if (score > bestScore) {
          bestScore = score;
          bestKey = h.profileKey;
        }
      }
    }
  }

  // ── Resolve context-aware education keys ────────────────────────
  if (bestKey && bestKey.startsWith('edu_')) {
    const ctx = getEduSectionContext(el);
    const isInter = ctx === 'inter';
    const isMatric = ctx === 'matric';
    switch (bestKey) {
      case 'edu_obtained_marks': return isInter ? 'inter_obtained' : isMatric ? 'matric_obtained' : 'matric_obtained';
      case 'edu_total_marks': return isInter ? 'inter_total_marks' : isMatric ? 'matric_total_marks' : 'matric_total_marks';
      case 'edu_percentage': return isInter ? 'inter_pct' : isMatric ? 'matric_pct' : 'matric_pct';
      case 'edu_passing_year': return isInter ? 'inter_passing_year' : isMatric ? 'matric_passing_year' : 'matric_passing_year';
      case 'edu_board_name': return isInter ? 'inter_board_name' : 'matric_board_name';
      case 'edu_school_name': return isInter ? 'inter_school_name' : 'matric_school_name';
      case 'edu_certificate': return isInter ? 'inter_certificate' : 'matric_certificate';
      default: return bestKey;
    }
  }

  return bestKey;
}

// ─── Site URL Helper ───────────────────────────────────────────

let _cachedSiteUrl = null;
async function getSiteUrl() {
  if (_cachedSiteUrl) return _cachedSiteUrl;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_SITE_BASE' });
    _cachedSiteUrl = result?.url || 'http://localhost:3000';
  } catch {
    _cachedSiteUrl = 'http://localhost:3000';
  }
  return _cachedSiteUrl;
}

// ─── Shadow DOM + Regular DOM Traversal ────────────────────────

/**
 * Collect all form fields from the document including any shadow DOM roots.
 * Returns a flat array of input/select/textarea elements.
 */
function collectAllFields(root = document) {
  const results = [];
  const SELECTOR = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea, div.typeahead, [class*="typeahead"][tabindex], p-dropdown, p-calendar';

  try {
    results.push(...root.querySelectorAll(SELECTOR));
  } catch { /* ignore */ }

  // Traverse shadow roots
  const walker = document.createTreeWalker(
    root === document ? document.body || document : root,
    NodeFilter.SHOW_ELEMENT,
    null,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.shadowRoot) {
      results.push(...collectAllFields(node.shadowRoot));
    }
  }

  return results;
}

// ─── Date Format Detection ─────────────────────────────────────

/**
 * Detect the date format a field expects and format the date accordingly.
 * Returns formatted string or original ISO value.
 */
function formatDateForInput(isoDate, el) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year);
  const mon = MONTH_NAMES[month - 1].charAt(0).toUpperCase() + MONTH_NAMES[month - 1].slice(1, 3); // "Jan"
  const monFull = MONTH_NAMES[month - 1].charAt(0).toUpperCase() + MONTH_NAMES[month - 1].slice(1); // "January"

  const ph = (el?.getAttribute('placeholder') || '').toLowerCase();
  const pat = (el?.getAttribute('pattern') || '').toLowerCase();
  const combined = ph + ' ' + pat;

  // DD-Mon-YYYY or DD/Mon/YYYY
  if (/dd[\/\-\s]mon/i.test(combined)) return `${dd}-${mon}-${yyyy}`;
  // Mon-DD-YYYY
  if (/mon[\/\-\s]dd/i.test(combined)) return `${mon}-${dd}-${yyyy}`;
  // YYYY/MM/DD
  if (/yyyy[\/\-]mm[\/\-]dd/.test(combined)) return `${yyyy}-${mm}-${dd}`;
  // MM/DD/YYYY (US)
  if (/mm[\/\-]dd[\/\-]yyyy/.test(combined)) return `${mm}/${dd}/${yyyy}`;
  // DD/MM/YYYY (default Pakistani)
  if (/dd[\/\-]mm[\/\-]yyyy/.test(combined)) return `${dd}/${mm}/${yyyy}`;
  // D/M/YYYY
  if (/d[\/\-]m[\/\-]y/.test(combined)) return `${day}/${month}/${yyyy}`;

  // Fallback: detect from placeholder format string
  if (ph.includes('mm/dd')) return `${mm}/${dd}/${yyyy}`;
  if (ph.includes('dd/mm') || ph.includes('dd-mm')) return `${dd}/${mm}/${yyyy}`;
  if (ph.includes('yyyy-mm') || ph.includes('yyyy/mm')) return `${yyyy}-${mm}-${dd}`;
  if (ph.includes('dd-mon') || ph.includes('dd mon')) return `${dd}-${mon}-${yyyy}`;
  if (ph.includes('mon-dd') || ph.includes('mon dd')) return `${mon}-${dd}-${yyyy}`;

  // Absolute fallback: DD/MM/YYYY
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Program / Degree Detection ────────────────────────────────

/**
 * Try to detect the program/degree being applied for from the page.
 * Returns a short string like "BS Computer Science" or null.
 */
function detectProgram() {
  const DEGREE_PREFIXES = ['bs', 'ms', 'be', 'me', 'bba', 'mba', 'bsc', 'msc', 'phd', 'mbbs', 'bds', 'llb', 'llm'];
  const candidates = [
    // Common element patterns where programs appear
    document.querySelector('h1, h2')?.textContent,
    document.querySelector('.program-name, .programme-name, #program-name, #programme')?.textContent,
    document.querySelector('select[name*="program"] option:checked, select[name*="programme"] option:checked, select[id*="program"] option:checked')?.textContent,
    document.querySelector('[class*="program-title"], [class*="programme-title"]')?.textContent,
    document.title,
  ].filter(Boolean).map(t => t.trim());

  for (const text of candidates) {
    const lower = text.toLowerCase();
    for (const deg of DEGREE_PREFIXES) {
      const idx = lower.indexOf(deg);
      if (idx !== -1) {
        // Extract a reasonable-length program name starting from the degree prefix
        const snippet = text.slice(idx, idx + 60).split('\n')[0].trim();
        if (snippet.length > 4) return snippet;
      }
    }
  }
  return null;
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
  // Look beyond h1/h2 — many university portals use h3, legend, caption, or table headings
  const h1 = (() => {
    for (const sel of ['h1', 'h2', 'h3', 'legend', 'caption']) {
      const el = document.querySelector(sel);
      if (el) { const t = el.textContent.toLowerCase().trim(); if (t.length > 2) return t; }
    }
    // Fallback: look for a heading-like td[colspan] or th that is INSIDE a form or the first
    // table that contains inputs (scoped to form context to avoid nav/menu pollution)
    const formContainer = document.querySelector('form') || document.querySelector('table:has(input)');
    if (formContainer) {
      for (const el of formContainer.querySelectorAll('td[colspan], th')) {
        const t = el.textContent.trim().toLowerCase();
        if (t.length > 3 && t.length < 80 && !el.querySelector('input, select, button')) return t;
      }
    }
    return '';
  })();

  // Count field types
  const passwordFields = document.querySelectorAll('input[type="password"]').length;
  const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"]').length;
  const allInputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button])').length;

  // Detect "Create Login" style pages — creating a new account despite "login" in title/heading
  const isCreateLoginPage = (h1.includes('create') || pageTitle.includes('create')) &&
    (h1.includes('login') || pageTitle.includes('login'));
  const isNewRegistration = h1.includes('new registration') || pageTitle.includes('new registration');

  // Login signals — exclude "create login" context
  const loginSignals = [
    url.includes('login'), url.includes('signin'), url.includes('log-in'), url.includes('sign-in'),
    h1.includes('log in'), (h1.includes('login') && !isCreateLoginPage), h1.includes('sign in'), h1.includes('signin'),
    (pageTitle.includes('login') && !isCreateLoginPage), pageTitle.includes('sign in'),
  ].filter(Boolean).length;

  // Registration signals
  const registerSignals = [
    url.includes('register'), url.includes('signup'), url.includes('sign-up'), url.includes('create-account'),
    url.includes('new-user'), url.includes('create_account'), url.includes('newregistration'),
    h1.includes('register'), h1.includes('sign up'), h1.includes('create account'), h1.includes('new user'),
    isCreateLoginPage, isNewRegistration,
    pageTitle.includes('register'), pageTitle.includes('sign up'), pageTitle.includes('create'),
  ].filter(Boolean).length;

  // Application signals
  const appSignals = [
    url.includes('application'), url.includes('admission'), url.includes('apply'),
    url.includes('form'), url.includes('enrollment'),
    h1.includes('application'), h1.includes('admission'), h1.includes('apply'),
    pageTitle.includes('application'), pageTitle.includes('admission'),
  ].filter(Boolean).length;

  // Login: has a password field + few total inputs (username+password pattern).
  // The emailFields check is intentionally removed — many portals use type="text" for username.
  // A password field + ≤4 total inputs is a strong login signal regardless of email type.
  // If appSignals/registerSignals also fire, login takes priority when password is present.
  if (loginSignals > 0 || (passwordFields >= 1 && allInputs <= 4)) {
    return 'login';
  }

  // Registration: has password + more fields (e.g. name, father name, email, confirm email)
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
 * Find a registration/signup link on a login page (legacy stub — delegates to new implementation below).
 */

// ─── Consistent Password System ────────────────────────────────

/**
 * Get or generate the user's consistent password.
 * Same password is stored and reused across all universities.
 * Meets all common constraints: 14+ chars, uppercase, lowercase, number, special.
 */
async function getConsistentPassword() {
  // Priority 1: use portal_password from the user's profile (set in Profile page)
  const stored = await chrome.storage.local.get(['unimatch_master_password', 'unimatch_profile']);
  const profilePwd = stored.unimatch_profile?.portal_password;
  if (profilePwd && profilePwd.length >= 8) {
    // Keep master password in sync with profile password
    if (profilePwd !== stored.unimatch_master_password) {
      await chrome.storage.local.set({ unimatch_master_password: profilePwd });
    }
    return profilePwd;
  }

  // Priority 2: use previously stored master password
  if (stored.unimatch_master_password) return stored.unimatch_master_password;

  // Priority 3: generate a new strong password
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

// ─── Username Generation ────────────────────────────────────────
/**
 * Generate a portal username from profile data.
 * Strategy order (most common for Pakistani uni portals):
 * 1. CNIC without dashes (e.g. 3520112345673) — most common
 * 2. portal_email prefix (before @)
 * 3. email prefix
 * 4. FirstLetterLastname (e.g. mkhan) lower-cased
 */
function generatePortalUsername(profile) {
  if (profile?.cnic) return profile.cnic.replace(/-/g, '');
  const email = profile?.portal_email || profile?.email || '';
  if (email) return email.split('@')[0];
  const names = (profile?.full_name || '').trim().split(/\s+/);
  const first = names[0] || '';
  const last = names[names.length - 1] || '';
  return (first.slice(0, 1) + last).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find the register/create-account link on a login page.
 * Returns { href, text } or null.
 */
function findRegisterLinkEl() {
  const registerWords = [
    'register', 'sign up', 'signup', 'create account', 'create an account',
    'new user', 'new account', 'don\'t have', 'no account', 'not registered',
    'first time', 'new applicant', 'new student', 'new registration',
  ];
  // Try <a> tags first, then buttons
  for (const tag of ['a', 'button']) {
    for (const el of document.querySelectorAll(tag)) {
      const text = (el.textContent || '').toLowerCase().trim();
      const href = (el.href || '').toLowerCase();
      if (registerWords.some(w => text.includes(w) || href.includes(w.replace(/\s/g, '')))) {
        return el;
      }
    }
  }
  return null;
}

function findRegisterLink() {
  const el = findRegisterLinkEl();
  if (!el) return null;
  return { text: el.textContent?.trim() || 'Register', href: el.href || '#' };
}

async function handleGoToRegister() {
  // Use university config's registrationUrl if available
  const uniCfg = (typeof getConfigForDomain === 'function') ? getConfigForDomain(window.location.hostname) : null;
  if (uniCfg?.registrationUrl && uniCfg.registrationUrl !== window.location.href) {
    window.location.href = uniCfg.registrationUrl;
    return;
  }
  const el = findRegisterLinkEl();
  if (el) {
    if (el.tagName === 'A' && el.href) {
      window.location.href = el.href;
    } else {
      el.click();
    }
  } else {
    // Try common registration URL patterns based on current URL
    const base = window.location.origin;
    const path = window.location.pathname;
    const candidates = [
      base + path.replace(/login|signin|LogIn|Login/gi, 'Register'),
      base + path.replace(/login|signin|LogIn|Login/gi, 'Signup'),
      base + '/register', base + '/Register', base + '/signup', base + '/SignUp',
      base + '/Home/Register', base + '/account/register', base + '/user/register',
      base + '/new-user', base + '/create-account',
    ].filter(u => u !== window.location.href);
    // Open first plausible one in same tab
    if (candidates[0]) window.location.href = candidates[0];
  }
}

// ─── Smart Suggestions ─────────────────────────────────────────

function buildSmartSuggestions(pageType, university) {
  const suggestions = [];
  const registerLink = findRegisterLink();

  if (pageType === 'login') {
    // Intentionally empty — the ready state renders a full login card instead
  } else if (pageType === 'register') {
    suggestions.push({
      icon: '📝',
      text: 'Registration page detected.',
      sub: 'Click <strong>Autofill</strong> — UniMatch fills your name, email, CNIC, DOB, marks, and auto-generates a strong password.',
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

  // Handle PrimeNG <p-dropdown> custom components (Angular portals)
  // The inner <input> is readonly — must interact via DOM clicks
  if (tagName === 'p-dropdown') {
    return fillPrimeNGDropdown(el, value);
  }

  // Handle PrimeNG <p-calendar> date picker — native setter + input event
  if (tagName === 'p-calendar') {
    return fillPrimeNGCalendar(el, value);
  }

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

  // For date inputs, handle ISO format conversion
  if (inputType === 'date') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (nativeSetter) nativeSetter.call(el, iso);
      else el.value = iso;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
      return true;
    }
  }

  // For other inputs, use native setter for React/Vue compatibility
  if (nativeSetter) {
    nativeSetter.call(el, String(value));
  } else {
    el.value = String(value);
  }

  // Dispatch React-compatible synthetic events
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  try {
    const ev = new InputEvent('input', { bubbles: true, data: String(value), inputType: 'insertText' });
    el.dispatchEvent(ev);
  } catch (_) { /* InputEvent not supported in older browsers */ }
  el.dispatchEvent(new Event('blur', { bubbles: true }));

  // Handle intl-tel-input (iti) widgets — must call setNumber() to sync the library's
  // internal state, otherwise the flag picker widget ignores the raw value assignment.
  if (inputType === 'tel') {
    try {
      const itiInstance = window.intlTelInputGlobals?.getInstance(el);
      if (itiInstance) {
        itiInstance.setNumber(String(value));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (_) { /* intl-tel-input not present */ }
  }

  // Handle vue-tel-input — identified by class vti__input; Vue listens on the
  // wrapper element, so dispatch the input event there as well.
  if (el.classList.contains('vti__input')) {
    const wrapper = el.closest('.vue-tel-input');
    if (wrapper) wrapper.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Small random delay to avoid bot detection
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  return true;
}

/**
 * Fill an IBA-style typeahead widget (class="typeahead"):
 *   1. Click .typeahead-selected to open the dropdown
 *   2. Wait for .typeahead-dropdown to appear in the DOM
 *   3. Type into input.typeahead-input to filter options
 *   4. Click the matching a.ac-result
 */
async function fillTypeahead(container, value) {
  if (!container || !value) return false;
  const valLow = value.toLowerCase().trim();

  const trigger = container.querySelector('.typeahead-selected');
  if (!trigger) return false;

  // Open the dropdown
  trigger.click();

  // Wait up to 1 s for .typeahead-dropdown to appear
  let dropdown = null;
  for (let i = 0; i < 10; i++) {
    dropdown = container.querySelector('.typeahead-dropdown');
    if (dropdown) break;
    await new Promise(r => setTimeout(r, 100));
  }
  if (!dropdown) return false;

  // Type into the search input to filter options
  const searchInput = dropdown.querySelector('input.typeahead-input');
  if (searchInput) {
    searchInput.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(searchInput, value);
    else searchInput.value = value;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    // Wait for the list to filter — AJAX-loaded typeaheads need longer
    await new Promise(r => setTimeout(r, 500));
  }

  // Click the best matching a.ac-result
  const options = Array.from(container.querySelectorAll('a.ac-result'));
  let best = options.find(a => a.textContent.trim().toLowerCase() === valLow) ||
    options.find(a => a.textContent.trim().toLowerCase().includes(valLow)) ||
    options.find(a => valLow.includes(a.textContent.trim().toLowerCase()));

  if (best) {
    // Vue typeaheads register selection on mousedown (before blur fires on the search input).
    // A plain click() alone causes blur to fire first and reset the value.
    best.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 30));
    best.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    // Extra settle time so Vue re-renders and dependent fields (e.g. AJAX-loaded
    // board/school lists) fully populate before the next fill runs.
    await new Promise(r => setTimeout(r, 400));
    return true;
  }

  // Nothing matched — close by clicking trigger again
  trigger.click();
  return false;
}

/**
 * Fill a PrimeNG <p-dropdown> by clicking the trigger and selecting the matching item.
 * Required for Angular Reactive Forms where the inner <input> is readonly — direct value
 * assignment has no effect. Used for fields like Gender and Residency on Angular portals.
 *
 * Matching order (case-insensitive):
 *   1. Exact text match
 *   2. Option text starts with value (covers "Pakistan" → "Pakistani")
 *   3. Value starts with option text (covers "Pakistani" stored value → "Pakistani" option)
 *   4. Option text contains value (≥3 chars)
 *   5. Alias lookup for known value→option mismatches (e.g. "other" → "Transgender")
 */
async function fillPrimeNGDropdown(el, value) {
  if (!value) return false;
  const val = String(value).toLowerCase().trim();

  // Semantic alias table: maps profile-stored values → possible option texts on portals.
  // Used when direct string matching fails. Keys and values are all lowercase.
  const PRIMENG_ALIASES = {
    // Gender
    'male':        ['male', 'm', 'boy', 'mr.'],
    'female':      ['female', 'f', 'girl', 'woman', 'mrs.'],
    'other':       ['transgender', 'others', 'other gender', 'other'],
    'transgender': ['transgender', 'other'],
    // Nationality / residency
    'pakistan':    ['pakistan', 'pakistani', 'pk'],
    'foreign':     ['foreign student', 'foreigner', 'foreign national', 'foreign'],
    'non-pakistani': ['foreign student', 'foreign', 'non-pakistani'],
    // Religion — Islam and Muslim are used interchangeably across portals
    'islam':       ['muslim', 'islam', 'islamic', 'muslims'],
    'muslim':      ['muslim', 'islam', 'islamic'],
    'christian':   ['christian', 'christianity', 'christ'],
    'hindu':       ['hindu', 'hinduism'],
    'ahmadi':      ['ahmadi', 'ahmadiyya', 'qadiani'],
    // Salutation
    'mr.':         ['mr.', 'mr'],
    'mrs.':        ['mrs.', 'mrs', 'ms.', 'ms'],
    'mr':          ['mr.', 'mr'],
    'mrs':         ['mrs.', 'mrs', 'ms.', 'ms'],
    'm/s':         ['m/s', 'ms', 'transgender'],
    // Marital status
    'single':      ['single', 'unmarried', 'bachelor', 'spinster'],
    'married':     ['married', 'wed', 'wedded'],
    'divorced':    ['divorced', 'divorcee', 'separated'],
    // Disability
    'no disability': ['no disability', 'none', 'n/a', 'not applicable', 'no', 'normal', 'no handicap'],
    // Blood group
    'a+': ['a+', 'a positive', 'a pos'],
    'a-': ['a-', 'a negative', 'a neg'],
    'b+': ['b+', 'b positive', 'b pos'],
    'b-': ['b-', 'b negative', 'b neg'],
    'o+': ['o+', 'o positive', 'o pos'],
    'o-': ['o-', 'o negative', 'o neg'],
    'ab+': ['ab+', 'ab positive', 'ab pos'],
    'ab-': ['ab-', 'ab negative', 'ab neg'],
  };

  const trigger = el.querySelector('.p-dropdown-trigger');
  if (!trigger) return false;
  trigger.click();

  // Wait for Angular change detection to render the overlay panel
  await new Promise(r => setTimeout(r, 200));

  // PrimeNG overlays are appended to <body> as CDK portals — check document first
  const panel = document.querySelector('.p-dropdown-panel:not(.p-hidden)')
             || document.querySelector('.p-dropdown-panel')
             || el.querySelector('.p-dropdown-panel');
  if (!panel) return false;

  // Query ALL items FIRST — before any filtering. This is critical: if we type into
  // the filter first and the search term doesn't match the actual option text (e.g.
  // "islam" typed → "Muslim" hidden), all subsequent matching fails on an empty list.
  let items = Array.from(panel.querySelectorAll('.p-dropdown-item, [role="option"]'));
  if (!items.length) return false;

  const findInList = (list, searchVal) => {
    if (!searchVal) return null;
    const sv = String(searchVal).toLowerCase().trim();
    return (
      list.find(o => o.textContent.trim().toLowerCase() === sv) ||
      list.find(o => o.textContent.trim().toLowerCase().startsWith(sv)) ||
      list.find(o => sv.startsWith(o.textContent.trim().toLowerCase()) && o.textContent.trim().length >= 3) ||
      (sv.length >= 3 ? list.find(o => o.textContent.trim().toLowerCase().includes(sv)) : null)
    );
  };
  const findItem = (sv) => findInList(items, sv);

  // 1. Direct match
  let target = findItem(val);

  // 2. Alias fallback — handles semantic equivalences (Islam↔Muslim, Mr↔Mr., etc.)
  if (!target) {
    for (const [aliasKey, aliasVals] of Object.entries(PRIMENG_ALIASES)) {
      if (val === aliasKey || aliasKey.startsWith(val) || val.startsWith(aliasKey)) {
        for (const av of aliasVals) {
          target = findItem(av);
          if (target) break;
        }
        if (target) break;
      }
    }
  }

  // 3. Dynamic profile-value fallback — tries all categorical profile values against
  // the full (unfiltered) items list. Handles location dropdowns that may show
  // provinces, districts, or cities interchangeably.
  if (!target) {
    const profile = window.__unimatch?.profile;
    if (profile) {
      const candidates = [
        profile.district, profile.domicile_district, profile.tehsil,
        profile.city, profile.domicile,
        profile.province, profile.domicile_province,
        profile.religion, profile.nationality, profile.blood_group,
        profile.marital_status, profile.disability_type,
      ].filter(v => v && typeof v === 'string' && v.toLowerCase().trim() !== val);

      for (const cv of candidates) {
        target = findItem(cv);
        if (target) break;
      }
    }
  }

  // 4. Filter-based last resort — only for large virtual-scrolled lists where not all
  // items are rendered in the DOM at once (e.g. 500+ option dropdowns).
  // Use the best matching candidate we found (or the original val) as the search term.
  if (!target) {
    const filterInput = panel.querySelector('.p-dropdown-filter');
    if (filterInput && items.length >= 30) {
      // Pick the best search term: first alias candidate that makes sense, else val
      const searchTerm = (() => {
        const a = PRIMENG_ALIASES[val];
        return (a && a[0]) ? a[0] : val;
      })();
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(filterInput, searchTerm);
      filterInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      // Re-query the now-filtered list
      items = Array.from(panel.querySelectorAll('.p-dropdown-item, [role="option"]'));
      target = findInList(items, val) || findInList(items, searchTerm);
      // Try profile candidates on filtered list too
      if (!target) {
        const profile = window.__unimatch?.profile;
        if (profile) {
          const candidates = [
            profile.district, profile.domicile_district, profile.city,
            profile.domicile, profile.province, profile.domicile_province,
          ].filter(v => v && typeof v === 'string');
          for (const cv of candidates) {
            target = findInList(items, cv);
            if (target) break;
          }
        }
      }
    }
  }

  if (!target) {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return false;
  }

  target.click();
  await new Promise(r => setTimeout(r, 50));
  return true;
}

/**
 * Fill a PrimeNG <p-calendar> date picker by typing into its inner input.
 * PrimeNG Calendar's onUserInput handler parses the typed value using its
 * dateFormat (default: mm/dd/yy where yy = 4-digit year in PrimeNG).
 * Direct .value assignment fails — must use native setter + fire input event.
 */
async function fillPrimeNGCalendar(el, value) {
  if (!value) return false;

  // Parse value to a Date object. Handles ISO (YYYY-MM-DD) and DD/MM/YYYY.
  let date;
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmyMatch = String(value).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (isoMatch) {
    date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  } else if (dmyMatch) {
    const a = parseInt(dmyMatch[1]), b = parseInt(dmyMatch[2]), y = parseInt(dmyMatch[3]);
    date = a > 12 ? new Date(y, b - 1, a) : new Date(y, a - 1, b);
  }
  if (!date || isNaN(date.getTime())) return false;

  const input = el.querySelector('input');
  if (!input) return false;

  // Detect PrimeNG dateFormat from the element attribute.
  // PrimeNG default: 'mm/dd/yy' where 'yy' = 2-digit year, 'yyyy' = 4-digit.
  // The parser reads exactly 2 chars for 'yy' — typing 4 digits with 'yy' format
  // causes a parse error, so we MUST match the format token exactly.
  const rawFmt = (el.getAttribute('dateformat') || el.getAttribute('ng-reflect-date-format') || 'mm/dd/yy').toLowerCase();
  const useFullYear = rawFmt.includes('yyyy');

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yr = useFullYear
    ? String(date.getFullYear())                          // 4-digit
    : String(date.getFullYear()).slice(-2).padStart(2, '0'); // 2-digit

  // Build the formatted string by replacing tokens in the detected format pattern.
  // Replace longest token first (yyyy before yy) to avoid double-replacement.
  const formatted = rawFmt
    .replace('dd',   dd)
    .replace('mm',   mm)
    .replace('yyyy', String(date.getFullYear()))
    .replace('yy',   yr);

  // Method 1: document.execCommand('insertText') — fires a real InputEvent that
  // Angular/PrimeNG treats identically to user typing. Most reliable for Ivy apps.
  input.focus();
  input.select();
  const inserted = document.execCommand('insertText', false, formatted);
  if (inserted) {
    await new Promise(r => setTimeout(r, 80));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur',   { bubbles: true }));
    return true;
  }

  // Method 2: Native setter + synthetic input event (fallback for stricter CSP)
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (nativeSetter) nativeSetter.call(input, formatted); else input.value = formatted;
  input.dispatchEvent(new Event('input',  { bubbles: true }));
  await new Promise(r => setTimeout(r, 80));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur',   { bubbles: true }));
  return true;
}


/**
 * verifyFilledField — post-fill double-check.
 *
 * Called ~150 ms after a successful fill to confirm the value actually landed
 * and wasn't silently reset by the framework (Angular OnChanges, Vue watchers,
 * ASP.NET UpdatePanel, etc.).
 *
 * Returns true  → fill confirmed, keep green highlight.
 * Returns false → fill was rejected/reset, caller should re-mark amber.
 *
 * Design rules:
 *  - Fails OPEN: any uncertainty returns true (no false negatives).
 *  - Never re-fills — read-only, no side effects.
 *  - Shape validators only run for fields where the value shape is unambiguous.
 *  - For p-dropdown / p-calendar the displayed label is the ground truth.
 */
function verifyFilledField(el, intendedValue, profileKey) {
  try {
    const tag = el.tagName;

    // ── PrimeNG p-dropdown: check the displayed label text ─────────────────
    if (tag === 'P-DROPDOWN') {
      const label = (el.querySelector('.p-dropdown-label')?.textContent || '').trim().toLowerCase();
      // Empty label strings that mean "nothing selected"
      if (!label || label === 'select' || label === '--' || label === 'none' || label === 'choose') return false;
      // If we can compare directly, do so — otherwise presence of any label is enough
      const intended = String(intendedValue).toLowerCase().trim();
      if (intended && label !== intended) {
        // Accept if label starts with intended, or intended starts with label (partial match)
        // This handles "Mr." vs "mr", "Muslim" vs "islam" (alias-filled), etc.
        if (!label.startsWith(intended) && !intended.startsWith(label) && !label.includes(intended)) {
          // Last-resort: if label is non-empty and non-placeholder, trust it (alias match)
          return label.length >= 1 && label !== 'select' && label !== '--';
        }
      }
      return true;
    }

    // ── PrimeNG p-calendar: check the inner input is non-empty ────────────
    if (tag === 'P-CALENDAR') {
      const input = el.querySelector('input');
      return !!(input?.value?.trim());
    }

    // ── <select>: a selected index > 0 with a non-empty value ─────────────
    if (tag === 'SELECT') {
      return el.selectedIndex > 0 && el.value !== '' && el.value != null;
    }

    // ── <input> / <textarea>: non-empty value present ─────────────────────
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const v = el.value?.trim();
      if (!v) return false;

      // Shape validators — only for keys where the expected shape is unambiguous.
      // All validators fail open: if the value parses at all, it passes.
      const SHAPE = {
        cnic:          s => /^\d{5}-\d{7}-\d$/.test(s) || /^\d{13}$/.test(s),
        father_cnic:   s => /^\d{5}-\d{7}-\d$/.test(s) || /^\d{13}$/.test(s),
        mother_cnic:   s => /^\d{5}-\d{7}-\d$/.test(s) || /^\d{13}$/.test(s),
        email:         s => s.includes('@') && s.includes('.'),
        date_of_birth: s => {
          // Accept any parseable date or common format strings
          if (/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(s)) return true;
          const d = new Date(s); return !isNaN(d.getTime()) && d.getFullYear() > 1900;
        },
        phone:         s => s.replace(/\D/g, '').length >= 10,
        guardian_phone:s => s.replace(/\D/g, '').length >= 10,
      };
      const validator = SHAPE[profileKey];
      // If validator exists and explicitly fails → reject; if no validator → pass
      if (validator && !validator(v)) return false;

      return true;
    }

    // Typeahead div and other exotic tags — presence of any value is enough
    return true;
  } catch {
    // Never crash the fill loop — fail open
    return true;
  }
}

function fillSelect(el, value) {
  if (!value && value !== 0) return false;
  const val = String(value).toLowerCase().trim();
  const options = Array.from(el.options).filter(o => o.value !== '' || o.text.trim() !== '');

  // 1. Exact value match (case-insensitive)
  let match = options.find(o => o.value.toLowerCase() === val);
  // 2. Exact text match
  if (!match) match = options.find(o => o.text.toLowerCase().trim() === val);
  // 3. If numeric value, try month name, padded number, etc.
  if (!match) {
    const numVal = parseInt(val, 10);
    if (!isNaN(numVal) && numVal >= 1 && numVal <= 12) {
      const mn = MONTH_NAMES[numVal - 1];
      const ms = MONTH_SHORT[numVal - 1];
      match =
        options.find(o => o.text.toLowerCase().trim() === mn) ||
        options.find(o => o.text.toLowerCase().trim() === ms) ||
        options.find(o => o.text.toLowerCase().trim().startsWith(mn.slice(0, 3))) ||
        options.find(o => o.value.toLowerCase() === mn) ||
        options.find(o => o.value === String(numVal)) ||
        options.find(o => o.value === String(numVal).padStart(2, '0'));
    }
    // Year selects — match numeric value directly
    if (!isNaN(numVal) && numVal >= 1950 && numVal <= 2100) {
      match = options.find(o => o.value === String(numVal)) ||
        options.find(o => o.text.trim() === String(numVal));
    }
  }
  // 4. Strip leading zeros and retry
  if (!match && val.startsWith('0')) {
    const stripped = val.replace(/^0+/, '');
    match = options.find(o => o.value.toLowerCase() === stripped) ||
      options.find(o => o.text.toLowerCase().trim() === stripped);
  }
  // 5. Normalize Pakistani city/board names (e.g. "Federal Board" -> "FBISE")
  if (!match) {
    const aliases = {
      'federal': ['fbise', 'federal board', 'federal board islamabad'],
      'lahore': ['bise lahore', 'lahore board'],
      'rawalpindi': ['bise rawalpindi', 'rawalpindi board'],
      'karachi': ['bise karachi', 'karachi board', 'board of secondary education karachi'],
      'aga khan': ['akueb', 'aga khan university examination board'],
      'cambridge': ['cie', 'cambridge international', 'o level', 'a level'],
      'male': ['m', 'boy'],
      'female': ['f', 'girl', 'woman'],
      // Religion — map stored value to common dropdown variants
      'muslim': ['islam', 'islamic', 'muslim', 'muslims'],
      'non-muslim': ['non-muslim', 'non muslim', 'nonmuslim', 'christian', 'hindu', 'sikh', 'other religion'],
      // Education: certificate type
      'o-level': ['o-level', 'o level', 'olevel', 'o/level'],
      'a-level': ['a-level', 'a level', 'alevel', 'a/level'],
      'matriculation': ['matriculation', 'matric', 'ssc', 'secondary'],
      'intermediate': ['intermediate', 'inter', 'hssc', 'fsc', 'fa', 'ics', 'icom'],
      // Education: discipline/stream
      'medical': ['medical', 'pre-medical', 'pre medical', 'pre_medical', 'biology', 'bio'],
      'engineering': ['engineering', 'pre-engineering', 'pre engineering', 'pre_engineering', 'engg'],
      'science': ['science', 'ics', 'computer science', 'general science'],
      'commerce': ['commerce', 'icom', 'business'],
      'art': ['art', 'arts', 'humanities', 'fa'],
      'general': ['general', 'general studies'],
      // Education: result status
      'exam given and result in hand': ['completed', 'result in hand', 'result available', 'passed'],
      'appearing in annual exam': ['appearing', 'will appear', 'going to appear'],
      'as level': ['part1_only', 'as level', 'as-level', 'first year only', 'part 1'],
      // Education: current level
      'first year intermediate/equivalent': ['appearing', 'first year', '1st year', 'part 1 only'],
      'second year intermediate/12 grade/equivalent': ['completed', 'second year', '2nd year'],
      'sindh': ['sindh board', 'bsek'],
      'punjab': ['punjab board'],
      // Education system
      'cambridge': ['o level', 'a level', 'olevel', 'alevel', 'o/a level', 'o & a level', 'cambridge', 'cambridge system'],
      'pakistani': ['fsc', 'matric', 'bise', 'intermediate', 'hssc/ssc', 'matric/fsc', 'local board', 'pakistan'],
      // Father/mother status
      'alive': ['alive', 'living', 'present', 'yes'],
      'deceased': ['deceased', 'dead', 'passed', 'no', 'late', 'marhoom'],
      'shaheed': ['shaheed', 'martyr'],
      // Salutation
      'mr.': ['mr', 'mr.'],
      'mrs.': ['mrs', 'mrs.', 'ms', 'ms.'],
      'm/s': ['m/s', 'ms', 'transgender'],
      // Marital status defaults
      'single': ['single', 'unmarried', 'bachelor', 'spinster'],
      // Disability defaults
      'no disability': ['no disability', 'none', 'n/a', 'not applicable', 'no', 'normal'],
    };
    for (const [key, alts] of Object.entries(aliases)) {
      if (val === key || alts.some(a => val.includes(a))) {
        match = options.find(o => {
          const ot = o.text.toLowerCase().trim();
          const ov = o.value.toLowerCase();
          return ot === key || ot.includes(key) || alts.some(a => ot.includes(a) || ov.includes(a));
        });
        if (match) break;
      }
    }
  }
  // 6. Partial text match (option text contains value or vice versa — only for longer strings)
  if (!match && val.length >= 3) {
    match = options.find(o => o.text.toLowerCase().includes(val)) ||
      options.find(o => val.includes(o.text.toLowerCase().trim()) && o.text.trim().length >= 3);
  }
  // 7. Income range matching — numeric value (e.g. 10000) matched to range option text
  // e.g. "Less than Rs. 10,000" or "10,001 - 25,000" or "Below 10000"
  // Picks the BEST match: smallest upper bound (for "less than"), or tightest range containing numVal.
  if (!match) {
    const numVal = parseFloat(val.replace(/,/g, ''));
    if (!isNaN(numVal) && numVal >= 0) {
      let bestOption = null;
      let bestUpper = Infinity;  // for "less than" — prefer smallest upper bound
      let bestGtLower = -Infinity; // for "above" — prefer largest lower bound
      let bestRangeWidth = Infinity; // for ranges — prefer tightest range

      for (const o of options) {
        const ot = o.text.replace(/[,٬،]/g, '').toLowerCase().trim();
        // "less than X" / "below X" / "up to X" / "under X" / "upto X"
        // [^\d]*? skips any currency prefix (Rs., PKR, rupees, etc.) before the number
        const ltMatch = ot.match(/(?:less\s*than|below|up\s*to|upto|under|<)\s*[^\d]*?(\d+)/i);
        if (ltMatch) {
          const upper = parseFloat(ltMatch[1]);
          // numVal <= upper handles exact boundary (e.g. 10000 matches "Less than 10,000")
          if (numVal <= upper && upper < bestUpper) {
            bestUpper = upper;
            bestOption = o;
          }
          continue;
        }
        // "above X" / "more than X" / "over X" / "greater than X"
        const gtMatch = ot.match(/(?:above|more\s*than|over|greater\s*than|>)\s*[^\d]*?(\d+)/i);
        if (gtMatch) {
          const lower = parseFloat(gtMatch[1]);
          if (numVal > lower && lower > bestGtLower && !bestOption) {
            bestGtLower = lower;
            bestOption = o;
          }
          continue;
        }
        // "X - Y" or "X to Y" range (with optional currency between)
        const rangeMatch = ot.match(/(\d+)\s*(?:[^\d]*?)(?:[-–]|to)\s*[^\d]*?(\d+)/);
        if (rangeMatch) {
          const lo = parseFloat(rangeMatch[1]);
          const hi = parseFloat(rangeMatch[2]);
          // Allow ±1 tolerance for round-number boundaries (e.g. 10000 in "10001-30000")
          if (numVal >= lo - 1 && numVal <= hi) {
            const width = hi - lo;
            if (width < bestRangeWidth) {
              bestRangeWidth = width;
              bestOption = o;
            }
          }
        }
      }
      if (bestOption) match = bestOption;
    }
  }
  // 8. Levenshtein distance fallback for close matches (typos in option values)
  if (!match && val.length >= 4) {
    let bestDist = Infinity;
    for (const o of options) {
      const ot = o.text.toLowerCase().trim();
      if (ot.length < 2) continue;
      const dist = levenshtein(val, ot);
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        match = o;
      }
    }
  }
  // 9. Dynamic profile-value fallback — when the primary value doesn't match any option,
  // try other categorical profile fields. Handles cases like "province" dropdown that
  // actually shows districts, or religion field that uses "Muslim" vs "Islam".
  if (!match) {
    const _p = window.__unimatch?.profile;
    if (_p) {
      const _candidates = [
        _p.district, _p.domicile_district, _p.tehsil,
        _p.city, _p.domicile,
        _p.province, _p.domicile_province,
        _p.religion, _p.nationality, _p.blood_group,
        _p.marital_status, _p.disability_type,
      ].filter(v => v && typeof v === 'string' && v.toLowerCase().trim() !== val);
      for (const cv of _candidates) {
        const cvl = cv.toLowerCase().trim();
        match = options.find(o => o.text.toLowerCase().trim() === cvl) ||
                options.find(o => o.text.toLowerCase().trim().startsWith(cvl)) ||
                (cvl.length >= 3 ? options.find(o => o.text.toLowerCase().includes(cvl)) : null);
        if (match) break;
      }
    }
  }

  if (match) {
    // Use native setter so Vue/React reactivity proxies intercept the assignment.
    // Direct el.value = x bypasses the proxy and Vue re-renders revert the value.
    const prevSelectValue = el.value;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, match.value);
    else el.value = match.value;
    // Only fire change/input when the value actually changed. Firing unconditionally
    // triggers ASP.NET AutoPostBack selects (nationality, country, etc.) even when
    // the desired value is already selected — causing a full page reload mid-fill.
    if (el.value !== prevSelectValue) {
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  }
  return false;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0));
  return dp[m][n];
}

function fillRadio(el, value) {
  const val = String(value).toLowerCase().trim();
  // Find all radios with the same name
  const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);

  // Alias groups — maps profile values to all the strings that might appear in form radio labels/values
  const RADIO_ALIASES = {
    'cambridge': ['cambridge', 'o level', 'a level', 'o_level', 'a_level', 'olevel', 'alevel',
      'o-level', 'a-level', 'o/a level', 'o / a level', 'o&a level', 'cambridge system'],
    'pakistani': ['fsc', 'matric', 'pakistani', 'fssc', 'bise', 'intermediate', 'intermediate/matric',
      'pak', 'pakistan', 'local', 'local board', 'sssc/hssc', 'ssc/hssc', 'matric/fsc'],
    'male': ['male', 'm', 'boy'],
    'female': ['female', 'f', 'girl', 'woman'],
    'alive': ['alive', 'living', 'present', 'yes', 'active'],
    'deceased': ['deceased', 'dead', 'passed away', 'late', 'no', 'marhoom', 'not alive'],
    'shaheed': ['shaheed', 'martyr', 'شہید'],
  };
  const checkValues = [val, ...(RADIO_ALIASES[val] || [])];

  for (const checkVal of checkValues) {
    for (const radio of radios) {
      const labelText = (radio.labels?.[0]?.textContent || '').toLowerCase().trim();
      // Also check TD proximity label
      const tdLabel = (() => {
        const cell = radio.closest('td, th');
        if (!cell) return '';
        const row = cell.parentElement;
        if (!row) return '';
        const nextCell = cell.nextElementSibling;
        if (nextCell && !nextCell.querySelector('input, select, textarea')) return nextCell.textContent.toLowerCase();
        return '';
      })();
      const radioVal = radio.value.toLowerCase().trim();
      const combined = labelText + ' ' + tdLabel + ' ' + radioVal;

      if (radioVal === checkVal || combined.includes(checkVal)) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
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

// ─── Creative Feature Engine ────────────────────────────────

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { }
  }
  return _audioCtx;
}

function playFillTone(index = 0, total = 1) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const baseFreq = 440 + (index / Math.max(total, 1)) * 440;
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { }
}

function playSuccessFanfare() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch { }
}

function sparkleField(el) {
  if (!el || !isVisibleEl(el)) return;
  el.style.transition = 'box-shadow 0.05s ease, outline 0.05s ease';
  el.style.boxShadow = '0 0 0 2px rgba(74,222,128,0.9), 0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.2)';
  el.style.outline = 'none';
  // inject sparkle CSS if not present
  if (!document.getElementById('um-sparkle-style')) {
    const s = document.createElement('style');
    s.id = 'um-sparkle-style';
    s.textContent = `
      @keyframes um-field-fill {
        0%   { background-color: rgba(74,222,128,0.12); }
        100% { background-color: transparent; }
      }
      .um-filled-flash { animation: um-field-fill 0.6s ease forwards; }
    `;
    document.head.appendChild(s);
  }
  el.classList.add('um-filled-flash');
  setTimeout(() => {
    el.style.boxShadow = '';
    el.style.transition = '';
    el.classList.remove('um-filled-flash');
  }, 700);
}

function showScanLine(duration = 1200) {
  const existing = document.getElementById('um-scanline');
  if (existing) existing.remove();
  if (!document.getElementById('um-scanline-style')) {
    const s = document.createElement('style');
    s.id = 'um-scanline-style';
    s.textContent = `
      @keyframes um-scan-move {
        0%   { top: 0; opacity: 0; }
        5%   { opacity: 1; }
        95%  { opacity: 1; }
        100% { top: 100vh; opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
  const line = document.createElement('div');
  line.id = 'um-scanline';
  line.style.cssText = `
    position: fixed; left: 0; top: 0; width: 100%; height: 3px; z-index: 2147483646;
    pointer-events: none;
    background: linear-gradient(90deg, transparent 0%, #4ade80 30%, #86efac 50%, #4ade80 70%, transparent 100%);
    box-shadow: 0 0 12px 4px rgba(74,222,128,0.7), 0 0 30px 8px rgba(74,222,128,0.3);
    animation: um-scan-move ${duration}ms ease-in-out forwards;
  `;
  document.body.appendChild(line);
  setTimeout(() => line.remove(), duration + 200);
}

function showAchievementToast(filled, manual, timeSaved) {
  const existing = document.getElementById('um-toast');
  if (existing) existing.remove();
  if (!document.getElementById('um-toast-style')) {
    const s = document.createElement('style');
    s.id = 'um-toast-style';
    s.textContent = `
      @keyframes um-toast-in { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      @keyframes um-toast-out { from { transform: translateX(0); opacity:1; } to { transform: translateX(120%); opacity:0; } }
    `;
    document.head.appendChild(s);
  }
  const toast = document.createElement('div');
  toast.id = 'um-toast';
  toast.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 2147483645;
    background: #0c1a0d; border: 1px solid rgba(74,222,128,0.4);
    border-radius: 14px; padding: 14px 18px; pointer-events: none;
    font-family: 'Inter', -apple-system, sans-serif; color: #e4e4e7;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.1);
    animation: um-toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
    min-width: 220px;
  `;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:22px">&#9889;</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:#4ade80">Form Blasted!</div>
        <div style="font-size:10px;color:#71717a">Ilm Se Urooj</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center">
      <div style="background:rgba(74,222,128,0.08);border-radius:8px;padding:6px">
        <div style="font-size:18px;font-weight:700;color:#4ade80">${filled}</div>
        <div style="font-size:9px;color:#71717a">FILLED</div>
      </div>
      <div style="background:rgba(251,191,36,0.08);border-radius:8px;padding:6px">
        <div style="font-size:18px;font-weight:700;color:#fbbf24">${manual}</div>
        <div style="font-size:9px;color:#71717a">MANUAL</div>
      </div>
      <div style="background:rgba(96,165,250,0.08);border-radius:8px;padding:6px">
        <div style="font-size:18px;font-weight:700;color:#60a5fa">${timeSaved}s</div>
        <div style="font-size:9px;color:#71717a">SAVED</div>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'um-toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

function animateCounter(el, target, duration = 800) {
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ─── Helpers ────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isVisibleEl(el) {
  if (!el) return false;
  try {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
  } catch { return false; }
}

// ─── Advanced Date Filling ──────────────────────────────────────
// Handles: native date inputs · three-part selects · Flatpickr · jQuery UI ·
// Pikaday · Bootstrap Datepicker · React DatePicker · custom calendar widgets.

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Master date-fill function. Tries every strategy in order.
 */
async function fillDateAdvanced(el, isoDate) {
  if (!isoDate || !el) return false;
  const d = new Date(isoDate + 'T00:00:00'); // force local midnight
  if (isNaN(d.getTime())) return false;

  const day = d.getDate();
  const month = d.getMonth() + 1; // 1-based
  const year = d.getFullYear();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const yyyy = String(year);

  // ── 1. Native <input type="date"> ─────────────────────────────
  if (el.type === 'date') {
    const ok = await fillInput(el, `${yyyy}-${mm}-${dd}`);
    return ok;
  }
  if (el.type === 'datetime-local') {
    return await fillInput(el, `${yyyy}-${mm}-${dd}T00:00`);
  }
  if (el.type === 'month') {
    return await fillInput(el, `${yyyy}-${mm}`);
  }

  // ── 2. Library-level API (fastest, no DOM click needed) ────────

  // Flatpickr
  if (el._flatpickr) {
    try { el._flatpickr.setDate(d, true); return true; } catch { /* continue */ }
  }

  // Pikaday (checks el._pikaday or the instance stored on the element)
  const pikadayInst = el._pikaday || el.pikadayInstance;
  if (pikadayInst) {
    try { pikadayInst.setDate(d); return true; } catch { /* continue */ }
  }

  // jQuery UI Datepicker
  if (typeof window.$ !== 'undefined') {
    try {
      const $el = window.$(el);
      if ($el.data('datepicker') || $el.hasClass('hasDatepicker')) {
        $el.datepicker('setDate', d);
        return true;
      }
    } catch { /* continue */ }
  }

  // React-DatePicker / date-fns based pickers — try via data attribute
  if (el.getAttribute('data-input') !== null || el.classList.contains('flatpickr-input')) {
    try {
      el._flatpickr?.setDate(d, true);
      return true;
    } catch { /* continue */ }
  }

  // ── 3. Three-part day/month/year select group ───────────────────
  // Look in the closest form container for three selects resembling a date
  const container = el.closest('fieldset, .form-group, .row, tr, .date-group, .dob-group') ||
    el.parentElement?.parentElement || el.parentElement;
  if (container) {
    const filled = await tryThreePartSelects(container, day, month, year);
    if (filled) return true;
  }

  // ── 4. Text input — try formatted value ────────────────────────
  const formatted = formatDateForInput(isoDate, el);
  const textOk = await fillInput(el, formatted);
  if (textOk) {
    // Dismiss any calendar that may have opened
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    el.blur();
    return true;
  }

  // ── 5. Click-based calendar widget interaction ─────────────────
  return await tryInteractCalendar(el, d);
}

/**
 * Detect and fill three-part day/month/year select elements in a container.
 */
async function tryThreePartSelects(container, day, month, year) {
  const selects = Array.from(container.querySelectorAll('select'));
  if (selects.length < 2) return false;

  let daySel = null, monthSel = null, yearSel = null;

  // First pass: name/id/class heuristics (handles dob_day, dob_month, dob_year patterns)
  // Also handles ASP.NET prefix-stripped names (ddlDOBDay → dobday after stripping ddl)
  for (const s of selects) {
    const rawSig = (s.name + ' ' + s.id + ' ' + (s.className || '')).toLowerCase();
    // Strip ASP.NET prefixes (ddl, txt, etc.) for additional matching
    const strippedSig = rawSig.replace(/\b(ddl|txt|lbl|ctl|drp|sel|cmb)/g, '');
    const sig = rawSig + ' ' + strippedSig;
    // Also check adjacent TD label for day/month/year hint
    const tdLabel = (() => {
      const cell = s.closest('td, th');
      if (!cell) return '';
      const row = cell.parentElement;
      if (!row) return '';
      const prevCell = Array.from(row.children).find(c => {
        const i = Array.from(row.children).indexOf(cell);
        return Array.from(row.children).indexOf(c) === i - 1 && !c.querySelector('input,select,textarea');
      });
      return (prevCell?.textContent || '').toLowerCase();
    })();
    if (!daySel && (/(^|_|-)day($|_|-)|^dd$|_dd$|\bday\b|\bdin\b/.test(sig) || /\bday\b/.test(tdLabel))) { daySel = s; continue; }
    if (!monthSel && (/(^|_|-)month($|_|-)|^mm$|_mm$|\bmonth\b/.test(sig) || /\bmonth\b|\bmah\b/.test(tdLabel))) { monthSel = s; continue; }
    if (!yearSel && (/(^|_|-)year($|_|-)|^yy$|_yy$|yyyy|\byear\b/.test(sig) || /\byear\b|\bsaal\b/.test(tdLabel))) { yearSel = s; continue; }
  }

  // Second pass: guess by option count if name heuristics failed
  if (!daySel || !monthSel || !yearSel) {
    for (const s of selects) {
      if (daySel && monthSel && yearSel) break;
      const n = s.options.length;
      // Day: 28-32 options
      if (!daySel && n >= 28 && n <= 32) { daySel = s; continue; }
      // Month: 12-13 options
      if (!monthSel && n >= 12 && n <= 13) { monthSel = s; continue; }
      // Year: 10-150 options (that look like years)
      if (!yearSel && n >= 10 && n <= 150) {
        const firstRealOpt = Array.from(s.options).find(o => o.value && /^\d{4}$/.test(o.value.trim()));
        if (firstRealOpt) { yearSel = s; }
      }
    }
  }

  let filled = false;

  if (daySel) {
    const dd = String(day).padStart(2, '0');
    const ok = fillSelect(daySel, String(day)) || fillSelect(daySel, dd);
    if (ok) filled = true;
  }

  if (monthSel) {
    filled = fillMonthSelect(monthSel, month) || filled;
  }

  if (yearSel) {
    const ok = fillSelect(yearSel, String(year));
    if (ok) filled = true;
  }

  return filled;
}

/**
 * Fill a month <select> with every possible variant of month representation.
 */
function fillMonthSelect(sel, month) {
  const mn = MONTH_NAMES[month - 1];        // 'january'
  const ms = MONTH_SHORT[month - 1];        // 'jan'
  const mUp = mn.charAt(0).toUpperCase() + mn.slice(1); // 'January'
  const mm = String(month).padStart(2, '0'); // '05'
  const opts = Array.from(sel.options);

  // Try all variants in order of specificity
  const match =
    // Exact text match: "January", "january", "JANUARY"
    opts.find(o => o.text.toLowerCase().trim() === mn) ||
    // Short name: "Jan", "jan"
    opts.find(o => o.text.toLowerCase().trim() === ms) ||
    // Text starts with first 3 chars (covers "Jan.", "January")
    opts.find(o => o.text.toLowerCase().trim().startsWith(mn.slice(0, 3))) ||
    // Numeric value: "5"
    opts.find(o => o.value === String(month)) ||
    // Zero-padded value: "05"
    opts.find(o => o.value === mm) ||
    // Value is month name: "January", "may", etc.
    opts.find(o => o.value.toLowerCase() === mn) ||
    opts.find(o => o.value.toLowerCase() === ms) ||
    // 0-indexed month (January = 0)
    opts.find(o => o.value === String(month - 1)) ||
    // Any option whose numeric value equals month (for padded or unpadded)
    opts.find(o => parseInt(o.value, 10) === month) ||
    // Option text contains month name anywhere
    opts.find(o => o.text.toLowerCase().includes(mn));

  if (match) {
    sel.value = match.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  return false;
}

/**
 * Click-based calendar interaction for custom date pickers.
 * Handles jQuery UI, Bootstrap Datepicker, Flatpickr (fallback), Pikaday, and generic calendars.
 */
async function tryInteractCalendar(el, date) {
  el.click();
  el.focus();
  await sleep(350);

  const targetDay = date.getDate();
  const targetMonth = date.getMonth(); // 0-based
  const targetYear = date.getFullYear();

  // Selectors for popular calendar containers (visible only)
  const CALENDAR_ROOTS = [
    '.ui-datepicker',
    '.flatpickr-calendar',
    '.pika-single',
    '.datepicker-dropdown',
    '.bootstrap-datepicker',
    '.datetimepicker-dropdown',
    '[class*="datepicker-popup"]',
    '[class*="calendar-popup"]',
    '[class*="calendar-dropdown"]',
    '[class*="picker-container"]',
    '[role="dialog"][aria-label*="calendar" i]',
    '[role="dialog"][aria-label*="date" i]',
    'div[id*="datepicker"]:not([style*="display:none"])',
  ];

  let calendar = null;
  for (const sel of CALENDAR_ROOTS) {
    try {
      const found = document.querySelector(sel);
      if (found && isVisibleEl(found)) { calendar = found; break; }
    } catch { /* invalid selector — skip */ }
  }

  if (!calendar) { el.blur(); return false; }

  // ── Try select-based month/year navigation ─────────────────────
  const yearSel = calendar.querySelector('select.ui-datepicker-year, [class*="year-select"], select[aria-label*="year" i]');
  const monthSel = calendar.querySelector('select.ui-datepicker-month, [class*="month-select"], select[aria-label*="month" i]');

  if (yearSel) { fillSelect(yearSel, String(targetYear)); await sleep(80); }
  if (monthSel) { fillSelect(monthSel, String(targetMonth)); await sleep(80); }

  // ── Navigate with prev/next if no select ──────────────────────
  if (!yearSel || !monthSel) {
    for (let attempt = 0; attempt < 28; attempt++) {
      const header = calendar.querySelector(
        '.ui-datepicker-title, [class*="calendar-header"], [class*="month-year"], ' +
        '[class*="current-month"], [class*="navigation"] h2, [class*="navigation"] span'
      );
      const headerText = (header?.textContent || '').toLowerCase();
      const curMonth = MONTH_NAMES.findIndex(m => headerText.includes(m));
      const curYearM = headerText.match(/\d{4}/);
      const curYear = curYearM ? parseInt(curYearM[0]) : null;

      if (curMonth === targetMonth && curYear === targetYear) break;

      const needNext = !curYear || curYear < targetYear ||
        (curYear === targetYear && curMonth < targetMonth);
      const nav = needNext
        ? calendar.querySelector('.ui-datepicker-next, [class*="next-month"], [class*="nav-next"], [aria-label*="next" i], [title*="next" i]')
        : calendar.querySelector('.ui-datepicker-prev, [class*="prev-month"], [class*="nav-prev"], [aria-label*="prev" i], [title*="prev" i]');
      if (!nav) break;
      nav.click();
      await sleep(120);
    }
  }

  // ── Click the target day cell ──────────────────────────────────
  const dayCells = calendar.querySelectorAll(
    'td a, td[data-day], [class*="day-cell"]:not([class*="disabled"]):not([class*="other-month"]),' +
    '[class*="calendar-day"]:not([class*="disabled"]), [data-date], [role="gridcell"] [role="button"]'
  );

  for (const cell of dayCells) {
    const txt = (cell.textContent || '').trim();
    const dDay = cell.getAttribute('data-day') || cell.getAttribute('data-date') ||
      cell.getAttribute('aria-label')?.match(/\d+/)?.[0];

    if (txt === String(targetDay) ||
      (dDay && (dDay === String(targetDay) || dDay.startsWith(String(targetYear) + '-' + String(targetMonth + 1).padStart(2, '0') + '-' + String(targetDay).padStart(2, '0'))))) {
      cell.click();
      await sleep(100);
      return true;
    }
  }

  el.blur();
  return false;
}

// ─── Smart Floating Suggestion Chips ───────────────────────────
// When user focuses an empty field that can be autofilled, show a chip
// below the field showing the profile value. Click to fill instantly.

let _chipEl = null;

function removeChip() {
  _chipEl?.remove();
  _chipEl = null;
}

function showSuggestionChip(el, value, profileKey) {
  removeChip();
  if (!value) return;

  const rect = el.getBoundingClientRect();
  if (!rect.width) return;

  const chip = document.createElement('div');
  chip.id = 'unimatch-chip';
  chip.setAttribute('style', `
    position: fixed;
    left: ${Math.min(rect.left, window.innerWidth - 260)}px;
    top: ${rect.bottom + 4 + window.scrollY - window.scrollY}px;
    z-index: 2147483640;
    background: #161916;
    border: 1px solid #4ade80;
    border-radius: 8px;
    padding: 6px 12px;
    font: 12px/1.4 'Inter', -apple-system, sans-serif;
    color: #e4e4e7;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 280px;
    animation: chip-in 0.15s ease;
    pointer-events: auto;
  `);
  chip.innerHTML = `
    <span style="color:#4ade80;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${profileKey.replace(/_/g, ' ')}</span>
    <span style="color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px">${String(value).slice(0, 40)}</span>
    <span style="color:#4ade80;font-size:11px;font-weight:700;flex-shrink:0">↵ Fill</span>
  `;

  // Inject animation
  if (!document.getElementById('unimatch-chip-style')) {
    const s = document.createElement('style');
    s.id = 'unimatch-chip-style';
    s.textContent = '@keyframes chip-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
  }

  document.body.appendChild(chip);
  _chipEl = chip;

  chip.addEventListener('mousedown', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeChip();
    if (profileKey === 'date_of_birth') {
      await fillDateAdvanced(el, value);
    } else {
      await fillInput(el, String(applyFieldTransform(el, profileKey, value)));
    }
    el.style.outline = '2px solid #4ade80';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-filled');
    el.classList.remove('unimatch-manual');
  });
}

function setupFloatingSuggestions() {
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el || !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;
    if (el.type === 'password' || el.type === 'hidden') return;
    if (el.value && el.value.trim()) return; // already has content

    const ctx = window.__unimatch;
    if (!ctx?.profile) return;

    const profileKey = matchFieldHeuristically(el);
    if (!profileKey) return;

    let value;
    if (['first_name', 'last_name', 'middle_name'].includes(profileKey)) {
      const fn = ctx.profile.full_name;
      value = fn ? TRANSFORMS[profileKey](fn) : '';
    } else {
      value = ctx.profile[profileKey];
    }

    if (value != null && value !== '') {
      // Small delay so it doesn't fight with the focus event
      setTimeout(() => showSuggestionChip(el, value, profileKey), 120);
    }
  }, true);

  document.addEventListener('focusout', () => {
    setTimeout(removeChip, 200); // allow click to register first
  }, true);
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
  sidebar.classList.add('collapsed');
  sidebar.innerHTML = buildSidebarHTML(university);
  document.body.appendChild(sidebar);

  // Block ALL clicks/mousedowns inside the sidebar from reaching the host page.
  // This prevents things like COMSATS's chatbot widget from firing when the user
  // clicks extension buttons.
  sidebar.addEventListener('click', e => e.stopPropagation());
  sidebar.addEventListener('mousedown', e => e.stopPropagation());
  sidebar.addEventListener('mouseup', e => e.stopPropagation());

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

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const isNowCollapsed = sidebar.classList.toggle('collapsed');
    toggle.classList.toggle('sidebar-open', !isNowCollapsed);
    // Persist state across page navigations
    chrome.storage.local.set({ unimatch_sidebar_open: !isNowCollapsed }).catch(() => { });
  });

  sidebarInstance = sidebar;

  // Restore saved open/closed state
  chrome.storage.local.get('unimatch_sidebar_open').then(stored => {
    if (stored.unimatch_sidebar_open === true) {
      sidebar.classList.remove('collapsed');
      toggle.classList.add('sidebar-open');
    }
  }).catch(() => { });

  initSidebarState(university);
}

function buildSidebarHTML(university) {
  return `
    <div class="unimatch-header">
      <div class="unimatch-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--um-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c6 3 10 3 16 0v-5"/>
        </svg>
        <span>Ilm Se Urooj</span>
      </div>
      <button id="unimatch-close" title="Close">✕</button>
    </div>
    <div class="unimatch-university">
      <span class="uni-badge">🏫 ${university.name}</span>
    </div>
    <div id="unimatch-content" class="unimatch-content">
      <div class="unimatch-loading">
        <div class="spinner"></div>
        <p>Connecting...</p>
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
      <p>The extension was updated. Press <strong>Ctrl+F5</strong> to reload.</p>
      <button class="btn-primary" onclick="location.reload()">🔄 Refresh Now</button>
    </div>
  `;
}

// ─── Sidebar State Management ──────────────────────────────────

// ─── Auto-Connect from IlmSeUrooj site ────────────────────────
// Supabase v2 stores the session in localStorage under this key.
const SUPABASE_LS_KEY = 'sb-nqmvfierglxgjgqjmxmp-auth-token';

function isOnIlmSeUroojSite() {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' ||
    h === 'ilmseurooj.com' || h.endsWith('.ilmseurooj.com') ||
    h.endsWith('.vercel.app');
}

async function tryAutoConnectFromSite() {
  try {
    const raw = localStorage.getItem(SUPABASE_LS_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    const token = session?.access_token;
    if (!token) return false;
    console.log('[IlmSeUrooj] 🔑 Supabase session found — auto-connecting…');
    const result = await chrome.runtime.sendMessage({
      type: 'AUTH_TOKEN',
      token,
      siteUrl: window.location.origin,
    });
    if (result?.profile) {
      console.log('[IlmSeUrooj] ✅ Auto-connected as:', result.profile.full_name);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[IlmSeUrooj] Auto-connect error:', e.message);
    return false;
  }
}

async function initSidebarState(university) {
  const contentEl = document.getElementById('unimatch-content');
  if (!contentEl) return;

  document.getElementById('unimatch-close')?.addEventListener('click', () => {
    sidebarInstance?.classList.add('collapsed');
    document.getElementById('unimatch-toggle')?.classList.remove('sidebar-open');
    chrome.storage.local.set({ unimatch_sidebar_open: false }).catch(() => { });
  });

  if (!isExtensionValid()) {
    showRefreshNeeded(contentEl);
    return;
  }

  // On the IlmSeUrooj site itself, silently pull the real Supabase session
  // from localStorage and send it to the background — zero manual steps.
  // Skip if we already have a fresh cached token+profile (< 30 min old).
  if (isOnIlmSeUroojSite()) {
    const cached = await chrome.storage.local.get(['unimatch_token', 'unimatch_profile', 'profile_cached_at']);
    const isFresh = cached.unimatch_token && cached.unimatch_profile && cached.profile_cached_at
      && (Date.now() - cached.profile_cached_at < 30 * 60 * 1000);
    if (!isFresh) {
      renderState(contentEl, 'loading');
      await tryAutoConnectFromSite();
    }
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['unimatch_token', 'unimatch_profile']);
  } catch (e) {
    showRefreshNeeded(contentEl);
    return;
  }

  const FAKE_TOKENS = ['demo_token', 'real_token', 'test_token', 'fake_token'];
  if (!stored.unimatch_token || !stored.unimatch_profile || FAKE_TOKENS.includes(stored.unimatch_token)) {
    if (FAKE_TOKENS.includes(stored.unimatch_token)) {
      await chrome.storage.local.remove(['unimatch_token', 'token_expiry', 'unimatch_profile']);
    }
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

  // Auto-resume Bahria multi-phase fill after a postback reload.
  // Polls until window.__unimatch.profile is ready (chrome.storage.local may be
  // slightly behind on slow connections), then fires handleAutofill.
  const needsResume = (isBahriaProfilePage()       && sessionStorage.getItem(BAHRIA_FILL_KEY))
                   || (isBahriaApplyProgramPage()   && sessionStorage.getItem(BAHRIA_APPLY_FILL_KEY));
  if (needsResume) {
    const tryResume = (attempt) => {
      if (attempt >= 10) return; // give up after ~6.5 s total
      if (window.__unimatch?.profile) {
        handleAutofill();
      } else {
        setTimeout(() => tryResume(attempt + 1), attempt === 0 ? 1500 : 500);
      }
    };
    tryResume(0);
  }
}

// ─── Progress Bar Helper ───────────────────────────────────────

function buildProgressBar(container) {
  // renderState('loading') already includes the bar; just return the element
  if (!container) return null;
  return document.getElementById('unimatch-progress');
}

// ─── Inline Profile Editor (removed — use website profile page) ─

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

    case 'not_logged_in': {
      const onSite = isOnIlmSeUroojSite();
      container.innerHTML = `
        <div class="state-card um-auth-card">
          <div class="um-auth-icon">${onSite ? '🔗' : '🎓'}</div>
          <h3>${onSite ? 'Connect Your Profile' : 'Sign In to Autofill'}</h3>
          <p>${onSite
          ? 'You\'re on IlmSeUrooj — tap below to sync your account with the extension.'
          : 'Sign in with your IlmSeUrooj profile to autofill university applications instantly.'}</p>
          <button class="um-btn-full um-btn-signin" id="unimatch-signin">
            ${onSite ? '🔄 Connect My Account' : '⚡ Sign In'}
          </button>
          <button class="um-btn-full um-btn-website" id="unimatch-goto-site">
            ${onSite ? '👤 Go to Profile' : '📝 Create Free Account'}
          </button>
        </div>
      `;
      document.getElementById('unimatch-signin')?.addEventListener('click', async () => {
        try {
          if (!isExtensionValid()) { showRefreshNeeded(container); return; }
          if (isOnIlmSeUroojSite()) {
            renderState(container, 'loading');
            const ok = await tryAutoConnectFromSite();
            if (ok) {
              const stored = await chrome.storage.local.get(['unimatch_token', 'unimatch_profile']);
              if (stored.unimatch_profile) {
                const uni = detectUniversity();
                window.__unimatch = { university: uni, profile: stored.unimatch_profile, fieldMap: null, filledFields: 0, manualFields: 0, filledSelectors: [], manualSelectors: [] };
                renderState(container, 'ready', { profile: stored.unimatch_profile, university: uni });
                return;
              }
            }
            renderState(container, 'not_logged_in');
            return;
          }
          const extId = chrome.runtime.id;
          const base = await getSiteUrl();
          window.open(`${base}/extension-auth?ext=${extId}`, '_blank', 'width=500,height=600');
        } catch (e) {
          if (e.message?.includes('Extension context invalidated')) showRefreshNeeded(container);
        }
      });
      document.getElementById('unimatch-goto-site')?.addEventListener('click', async () => {
        try {
          const base = await getSiteUrl();
          window.open(`${base}/${onSite ? 'profile' : 'profile'}`, '_blank');
        } catch { /* extension invalidated — ignore */ }
      });
      break;
    } // end case 'not_logged_in'

    case 'warning_ibcc':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon" style="color:#fbbf24">⚠️</div>
          <h3>IBCC equivalence not entered in your profile.</h3>
          <p>Required for this portal.</p>
          <a class="btn-primary" id="unimatch-ibcc-link" href="#" target="_blank">Complete Profile →</a>
        </div>
      `;
      getSiteUrl().then(base => {
        const link = document.getElementById('unimatch-ibcc-link');
        if (link) link.href = `${base}/profile`;
      });
      break;

    case 'warning_no_marks':
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon" style="color:#fbbf24">⚠️</div>
          <h3>No intermediate marks in your profile yet.</h3>
          <p>${data.uniName || 'This university'} requires FSc Part-I minimum to apply.</p>
          <a class="btn-primary" id="unimatch-marks-link" href="#" target="_blank">Update Profile →</a>
        </div>
      `;
      getSiteUrl().then(base => {
        const link = document.getElementById('unimatch-marks-link');
        if (link) link.href = `${base}/profile`;
      });
      break;

    case 'loading':
      container.innerHTML = `
        <div class="state-card">
          <div class="um-loading-title">⚡ Filling form...</div>
          <div class="autofill-progress-wrap">
            <div id="unimatch-progress" class="autofill-progress-bar"></div>
          </div>
          <p class="um-loading-sub">Detecting and filling all form fields...</p>
        </div>
      `;
      break;

    case 'ready': {
      const profile = data.profile;
      const displayName = profile?.full_name || 'Student';
      const completeness = calculateCompleteness(profile);
      const isProjected = ['part1_only', 'appearing'].includes(profile?.inter_status);
      const isCambridge = profile?.education_system === 'cambridge';
      const pageType = detectPageType();
      const program = detectProgram();

      const PROFILE_ROWS = [
        { key: 'full_name', icon: '👤', label: 'Name' },
        { key: 'father_name', icon: '👨', label: 'Father' },
        { key: 'cnic', icon: '🪪', label: 'CNIC' },
        { key: 'email', icon: '✉️', label: 'Email' },
        { key: 'phone', icon: '📱', label: 'Phone' },
        { key: 'date_of_birth', icon: '🎂', label: 'DOB' },
        { key: 'city', icon: '📍', label: 'City' },
        { key: 'fsc_marks', icon: '📊', label: 'FSc marks' },
        { key: 'matric_marks', icon: '📊', label: 'Matric marks' },
      ];

      const previewRows = PROFILE_ROWS.map(r => {
        const val = profile?.[r.key];
        const hasVal = val != null && val !== '';
        const display = hasVal ? String(val).slice(0, 22) + (String(val).length > 22 ? '…' : '') : '—';
        return `<div class="um-preview-row">
          <span class="um-preview-label">${r.icon} ${r.label}</span>
          <span class="um-preview-value${hasVal ? '' : ' missing'}">${display}</span>
        </div>`;
      }).join('');

      const gaps = PROFILE_ROWS.filter(r => !profile?.[r.key]).map(r => r.label);
      const gapHTML = gaps.length
        ? `<div class="um-gap-warning">⚠ Missing: ${gaps.join(' · ')}</div>`
        : '';

      const marksWarning = isProjected
        ? '<div class="um-marks-note projected">⚠ Using projected marks from Part-I</div>'
        : isCambridge
          ? '<div class="um-marks-note cambridge">ℹ Using IBCC equivalence %</div>'
          : '';

      const portalEmail = profile?.portal_email || profile?.email || '';
      const displayName2 = profile?.full_name || portalEmail || '';
      const regLink = findRegisterLink();

      const uniCfgReady = (typeof getConfigForDomain === 'function') ? getConfigForDomain(window.location.hostname) : null;
      const isEmailSentCred = uniCfgReady?.credentialSystem === 'email_sent';
      const registrationNote = uniCfgReady?.registrationNote || '';

      let loginRegisterCard = '';
      if (pageType === 'login') {
        // Use actual link text from page if found, otherwise use config name or generic
        const regBtnLabel = regLink
          ? `📝 ${regLink.text} →`
          : uniCfgReady?.name ? `📝 Register at ${uniCfgReady.name} →` : '📝 Find Registration Page →';
        const uniName = uniCfgReady?.name || 'this university';
        const pwLabel = isEmailSentCred
          ? `<span style="color:#60a5fa">Check email for credentials 📧</span>`
          : `<span style="color:var(--um-accent)">●●●●●●●● (saved)</span>`;
        loginRegisterCard = `
          <div class="um-context-card login">
            <div class="um-context-title">🔑 Login Page</div>
            <div class="um-cred-box">
              <div class="um-cred-row"><span class="label">Username:</span><span class="value">${portalEmail}</span></div>
              <div class="um-cred-row"><span class="label">Password:</span><span class="value">${pwLabel}</span></div>
            </div>
            ${isEmailSentCred ? `<div class="um-reg-note">📧 ${uniName} emails your username &amp; password after registration. Check your inbox — do not use your own password.</div>` : ''}
            <button class="um-context-btn" id="unimatch-goto-register">${regBtnLabel}</button>
          </div>`;
      } else if (pageType === 'register') {
        loginRegisterCard = `
          <div class="um-context-card register">
            <div class="um-context-title">📝 Registration Page — Ready</div>
            <div class="um-cred-box">
              <div class="um-cred-row"><span class="label">Name:</span><span class="value">${displayName2}</span></div>
              <div class="um-cred-row"><span class="label">Email/UserID:</span><span class="value">${portalEmail}</span></div>
              ${isEmailSentCred ? '' : `<div class="um-cred-row"><span class="label">Password:</span><span class="value" style="color:var(--um-accent)">Portal password ✓</span></div>`}
            </div>
            ${isEmailSentCred ? `<div class="um-reg-note">📧 Password will be emailed after submitting — no password field needed.</div>` : ''}
            ${registrationNote ? `<div class="um-reg-note" style="margin-top:4px">${registrationNote}</div>` : ''}
          </div>`;
      }

      const ringColor = completeness >= 80 ? 'var(--um-accent)' : completeness >= 50 ? 'var(--um-amber)' : 'var(--um-red)';
      const ringFill = (completeness / 100) * 94.2;

      container.innerHTML = `
        <div class="state-card">
          <div class="um-profile-row">
            <div class="avatar">${displayName.charAt(0).toUpperCase()}</div>
            <div class="um-profile-name">
              <strong>${displayName}</strong>
              <span class="profile-pct">${completeness}% complete</span>
            </div>
            <svg width="28" height="28" viewBox="0 0 36 36" class="profile-ring">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--um-border)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="${ringColor}" stroke-width="3"
                stroke-dasharray="${ringFill} 94.2" stroke-linecap="round" transform="rotate(-90 18 18)"/>
              <text x="18" y="22" text-anchor="middle" font-size="9" fill="${ringColor}" font-family="monospace">${completeness}%</text>
            </svg>
          </div>

          ${loginRegisterCard}
          ${program ? `<div class="um-program-badge">📋 ${program}</div>` : ''}

          <details class="um-details">
            <summary><span>Profile preview</span><span class="um-expand-arrow">▼</span></summary>
            <div class="um-preview-grid">${previewRows}</div>
          </details>

          ${gapHTML}
          ${marksWarning}

          <div id="unimatch-suggestions"></div>

          <button class="btn-primary btn-autofill" id="unimatch-autofill">
            ⚡ Autofill Now <span style="font-size:9px;opacity:0.5;margin-left:6px">Alt+Shift+A</span>
          </button>
          <div style="font-size:9px;color:#52525b;text-align:center;margin:3px 0 1px">
            Focus any field and press <span style="color:#4ade80;font-family:monospace">Ctrl+Shift+4</span> to fill it instantly
          </div>
          <div class="um-btn-grid">
            <button class="btn-secondary" id="unimatch-refresh-profile">🔄 Refresh</button>
            <button class="btn-secondary" id="unimatch-scan">🔍 Scan Fields</button>
          </div>
          <div id="unimatch-field-stats" style="margin:4px 0"></div>
          <div class="um-btn-grid">
            <button class="btn-secondary" id="unimatch-review-btn">📋 Review</button>
            <button class="btn-secondary" id="unimatch-timeline-btn">📅 Deadlines</button>
          </div>
          <button class="btn-secondary um-btn-full-row" id="unimatch-edit-profile">👤 Edit Profile on Website</button>
          <div class="um-safety-note">🔒 Never auto-submits · Only you submit</div>
        </div>
      `;

      // Smart suggestions
      const suggestions = buildSmartSuggestions(pageType, data.university);
      const suggestionsEl = document.getElementById('unimatch-suggestions');
      if (suggestionsEl && suggestions.length > 0) {
        suggestionsEl.innerHTML = suggestions.map(s => `
          <div class="um-suggestion">
            <span>${s.icon}</span> ${s.text}
            ${s.sub ? `<div class="um-suggestion-sub">${s.sub}</div>` : ''}
          </div>
        `).join('');
      }

      document.getElementById('unimatch-autofill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-scan')?.addEventListener('click', handleScanFields);
      document.getElementById('unimatch-review-btn')?.addEventListener('click', handlePreSubmitCheck);
      document.getElementById('unimatch-goto-register')?.addEventListener('click', handleGoToRegister);

      document.getElementById('unimatch-timeline-btn')?.addEventListener('click', () => {
        handleDeadlines(container);
      });

      document.getElementById('unimatch-refresh-profile')?.addEventListener('click', async () => {
        renderState(container, 'loading');
        // Try auto-connect from site first (picks up latest Supabase session)
        if (isOnIlmSeUroojSite()) await tryAutoConnectFromSite();
        // Then refresh from API
        const result = await chrome.runtime.sendMessage({ type: 'REFRESH_PROFILE' });
        if (result?.profile) {
          const uni = detectUniversity();
          window.__unimatch = { university: uni, profile: result.profile, fieldMap: null, filledFields: 0, manualFields: 0, filledSelectors: [], manualSelectors: [] };
          renderState(container, 'ready', { profile: result.profile, university: uni });
        } else {
          // Re-read from storage
          const stored = await chrome.storage.local.get('unimatch_profile');
          renderState(container, stored.unimatch_profile ? 'ready' : 'not_logged_in', { profile: stored.unimatch_profile, university: detectUniversity() });
        }
      });

      document.getElementById('unimatch-edit-profile')?.addEventListener('click', async () => {
        try {
          const base = await chrome.runtime.sendMessage({ type: 'GET_SITE_BASE' });
          window.open((base?.url || 'http://localhost:3000') + '/profile', '_blank');
        } catch { window.open('http://localhost:3000/profile', '_blank'); }
      });
      break;
    }

    case 'filled': {
      const pct = data.filled + data.manual > 0
        ? Math.round((data.filled / (data.filled + data.manual)) * 100) : 0;
      const pageType = detectPageType();
      const ctx2 = window.__unimatch;
      const filledProfile = ctx2?.profile;
      const portalEmail2 = filledProfile?.portal_email || filledProfile?.email || '';
      const displayFullName2 = filledProfile?.full_name || portalEmail2 || '';
      const filledPassword = data.password || ctx2?.generatedPassword || '';

      const uniCfgFilled = (typeof getConfigForDomain === 'function') ? getConfigForDomain(window.location.hostname) : null;
      const isEmailSentCredFilled = uniCfgFilled?.credentialSystem === 'email_sent';
      const filledRegNote = uniCfgFilled?.registrationNote || '';

      const uniFilledName = uniCfgFilled?.name || 'this university';
      const isLoginFilled = pageType === 'login';

      // Show credential summary on login/register pages so user knows what was filled
      const credSummary = (isLoginFilled || pageType === 'register') ? `
        <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:10px;margin-top:10px;font-size:10px">
          <div style="font-weight:600;color:#4ade80;margin-bottom:6px">📋 ${pageType === 'register' ? 'Account Created With:' : 'Login Filled:'}</div>
          ${pageType === 'register' ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="color:#71717a">Name:</span>
            <span style="color:#e4e4e7;font-family:monospace;max-width:160px;overflow:hidden;text-overflow:ellipsis">${displayFullName2}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="color:#71717a">${isLoginFilled ? 'Username:' : 'Email/UserID:'}</span>
            <span style="color:#e4e4e7;font-family:monospace;max-width:160px;overflow:hidden;text-overflow:ellipsis">${portalEmail2}</span>
          </div>
          ${isEmailSentCredFilled ? `
          <div style="margin-top:6px;padding:6px 8px;background:rgba(96,165,250,0.08);border-radius:5px;color:#60a5fa">
            📧 ${isLoginFilled
            ? `${uniFilledName} emails your password — use the credentials from your inbox.`
            : `Check your inbox — ${uniFilledName} will email your username &amp; password.`}
          </div>` : `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#71717a">Password:</span>
            <div style="display:flex;gap:4px;align-items:center">
              <span id="pw-display" style="color:#e4e4e7;font-family:monospace;font-size:9px">●●●●●●●●</span>
              <button id="pw-reveal" style="background:none;border:none;color:#4ade80;font-size:9px;cursor:pointer;padding:0">Show</button>
              <button id="pw-copy" style="background:none;border:none;color:#60a5fa;font-size:9px;cursor:pointer;padding:0">Copy</button>
            </div>
          </div>`}
        </div>
        ${pageType === 'register' && !isEmailSentCredFilled ? `<div style="margin-top:8px;padding:6px 8px;background:rgba(251,191,36,0.06);border-radius:6px;font-size:9px;color:#fbbf24">⚠ Save these credentials! You need them to log back in later.</div>` : ''}
      ` : '';

      container.innerHTML = `
        <div class="state-card">
          <div style="font-size:22px;font-weight:700;color:#4ade80;text-align:center;margin-bottom:2px">${pct}%</div>
          <div style="font-size:10px;color:#71717a;text-align:center;margin-bottom:10px">form complete</div>
          <div style="height:3px;background:#1f2a1c;border-radius:2px;margin-bottom:12px">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:2px"></div>
          </div>
          <div class="fill-results">
            <div class="stat-row filled">
              <span class="stat-dot green"></span>
              <span><strong>${data.filled}</strong> fields auto-filled</span>
            </div>
            <div class="stat-row manual">
              <span class="stat-dot amber"></span>
              <span><strong>${data.manual}</strong> need your input</span>
            </div>
            ${data.conflicts > 0 ? `<div class="stat-row" style="background:rgba(96,165,250,0.1);color:#60a5fa">
              <span class="stat-dot" style="background:#60a5fa"></span>
              <span><strong>${data.conflicts}</strong> conflicts skipped</span>
            </div>` : ''}
          </div>
          ${credSummary}
          ${filledRegNote && pageType === 'register' ? `
          <div style="margin-top:8px;padding:8px 10px;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.25);border-radius:7px;font-size:10px;color:#60a5fa;line-height:1.5">
            ${filledRegNote}
          </div>` : ''}
          <div style="margin-top:10px;padding:8px 10px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:7px;font-size:10px;color:#fbbf24;line-height:1.5">
            Caution: Always recheck every filled field before submitting. The extension may make errors or fill incorrect values.
          </div>
          <div class="um-btn-grid" style="margin-top:10px">
            <button class="btn-secondary" id="unimatch-scan-remaining" title="Highlight unfilled fields on this page">Scan Remaining <span id="unimatch-scan-badge" style="background:rgba(96,165,250,0.2);color:#60a5fa;border-radius:10px;padding:1px 6px;font-size:9px;margin-left:3px"></span></button>
            <button class="btn-secondary" id="unimatch-fill-remaining" title="Fill only the empty fields, leave already-filled ones untouched">Fill Remaining</button>
          </div>
          <div id="unimatch-scan-note" style="font-size:9px;color:#71717a;text-align:center;min-height:14px;margin-top:4px"></div>
          <div class="um-btn-grid">
            <button class="btn-secondary" id="unimatch-save-progress">Save</button>
            <button class="btn-secondary" id="unimatch-refill">Re-fill All</button>
          </div>
          <button class="btn-primary um-btn-full-row" id="unimatch-review">Pre-submit Check</button>
          <div class="um-safety-note">Alt+Shift+A re-fill · Ctrl+Shift+4 fill focused field · Alt+Shift+R review</div>
        </div>
      `;
      document.getElementById('unimatch-review')?.addEventListener('click', handlePreSubmitCheck);
      document.getElementById('unimatch-refill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-save-progress')?.addEventListener('click', handleSaveProgress);
      document.getElementById('unimatch-scan-remaining')?.addEventListener('click', handleScanRemaining);
      document.getElementById('unimatch-fill-remaining')?.addEventListener('click', handleFillRemaining);
      // Password show/copy in credential summary
      document.getElementById('pw-reveal')?.addEventListener('click', async () => {
        const pw = await getConsistentPassword();
        const display = document.getElementById('pw-display');
        const btn = document.getElementById('pw-reveal');
        if (display && btn) {
          if (btn.textContent === 'Show') { display.textContent = pw; btn.textContent = 'Hide'; }
          else { display.textContent = '●●●●●●●●'; btn.textContent = 'Show'; }
        }
      });
      document.getElementById('pw-copy')?.addEventListener('click', async () => {
        const pw = await getConsistentPassword();
        navigator.clipboard?.writeText(pw);
        const btn = document.getElementById('pw-copy');
        if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
      });
      break;
    }

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
  const mappedValue = optionMap?.[String(value).toLowerCase()] || value;
  return fillSelect(el, mappedValue);
}

// ─── Extension Context Guard ───────────────────────────────────

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

// ─── IBA Education Background Page — Dedicated Handler ────────────────────
// Detects and sequentially fills the IBA "Educational Background" multi-section form.
// Skips all *_school_address fields (Google Places autocomplete — must be filled manually).
// Ticks "Not Applicable To Me" for Undergraduate / Graduate / Other sections.

// ─── IBA Candidate Registration — Demographic Step ─────────────
// The demographic wizard step (Step 1) at onlineadmission.iba.edu.pk has no
// id/name on any input — all fields are addressed by querySelectorAll index.
// The generic heuristic engine cannot match them, so we handle them here.

// Education wizard step — accordion toggle buttons are present in the DOM
function isIBAEducationWizardPage() {
  if (!window.location.hostname.includes('iba.edu.pk')) return false;
  return !!(
    document.querySelector('#kt_wizard_v1') &&
    document.querySelector("[aria-controls='accordion-1']")
  );
}

function isIBADemographicPage() {
  if (!window.location.hostname.includes('iba.edu.pk')) return false;
  // Demographic step: wizard present but accordion toggle buttons not yet rendered
  return !!(
    document.querySelector('#kt_wizard_v1') &&
    !document.querySelector("[aria-controls='accordion-1']") &&
    !document.querySelector('[id*="_school_address"]') &&
    !document.querySelector('[id*="matric"]')
  );
}

async function fillIBADemographicPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function markGreen(el) {
    if (!el) return;
    el.style.outline = '2px solid #4ade80';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-filled');
    el.classList.remove('unimatch-manual');
    onFilled(el);
  }
  function markAmber(el) {
    if (!el) return;
    el.style.outline = '2px solid #fbbf24';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-manual');
    onManual(el);
  }

  // Native setters so Vue's reactivity system picks up the change
  const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const nativeSelectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;

  function doFillInput(el, value) {
    if (!el || value == null || value === '') return false;
    if (nativeInputSetter) nativeInputSetter.call(el, String(value));
    else el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    markGreen(el);
    return true;
  }

  function doFillSelect(el, value) {
    if (!el || value == null || value === '') return false;
    // Use existing fillSelect which already has the religion alias map
    const ok = fillSelect(el, String(value));
    if (ok) markGreen(el); else markAmber(el);
    return ok;
  }

  // Typeahead fill: click trigger → wait for input → type → wait for results → click best
  async function doTypeahead(scope, index, value) {
    if (!value) return;
    const val = String(value);
    const typeaheads = document.querySelectorAll(`${scope} .typeahead`);
    const container = typeaheads[index];
    if (!container) { console.warn(`[IBA Demo] typeahead[${index}] not found in ${scope}`); return; }

    const trigger = container.querySelector('.typeahead-selected');
    if (!trigger) { console.warn(`[IBA Demo] .typeahead-selected not found at index ${index}`); return; }
    trigger.click();
    await delay(400);

    // Poll for the input — Vue conditionally renders it after the click
    let input = null;
    for (let i = 0; i < 25; i++) {
      input = container.querySelector('.typeahead-input');
      if (input) break;
      await delay(100);
    }
    if (!input) { console.warn(`[IBA Demo] .typeahead-input did not appear at index ${index}`); markAmber(trigger); return; }

    if (nativeInputSetter) nativeInputSetter.call(input, val);
    else input.value = val;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(900);

    // Click best matching result — mousedown before click so Vue's event handler fires
    const results = Array.from(container.querySelectorAll('ul.typeahead-list a.ac-result'));
    if (results.length > 0) {
      const lower = val.toLowerCase();
      const target = results.find(a => a.textContent.trim().toLowerCase() === lower)
        || results.find(a => a.textContent.trim().toLowerCase().includes(lower))
        || results[0];
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      target.click();
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      markGreen(target);
      // Province selection triggers async city-list reload — wait longer for cascade
      await delay(index === 1 ? 1200 : 600);
    } else {
      console.warn(`[IBA Demo] no typeahead results for "${val}" at index ${index}`);
      markAmber(input);
    }
  }

  // Radio helper — finds the right option using partial/case-insensitive value match
  function doRadio(options) {
    // options: [{ value, sfb }] — sfb is a querySelectorAll('...')[N] string
    return (rawValue) => {
      if (!rawValue) return;
      const strVal = String(rawValue).toLowerCase();
      const opt = options.find(o => {
        const ov = String(o.value).toLowerCase();
        return ov === strVal || ov.includes(strVal) || strVal.includes(ov);
      });
      if (!opt) { console.warn(`[IBA Demo] no radio option for "${rawValue}"`); return; }
      // Parse querySelectorAll('...')[N] without eval
      const m = opt.sfb.match(/^querySelectorAll\((['"])([\s\S]*?)\1\)\[(\d+)\]$/);
      const el = m ? document.querySelectorAll(m[2])[parseInt(m[3], 10)] : document.querySelector(opt.sfb);
      if (!el) { console.warn(`[IBA Demo] radio element not found for "${rawValue}"`); return; }
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      markGreen(el);
    };
  }

  const scope = '#kt_wizard_v1';
  const pv = (key) => profileValueFor(key, profile);

  // ── Dynamic label-based field finder ──────────────────────────
  // Walks the DOM to find an input/select by the visible label text near it.
  // Used as primary discovery; index-based is the fallback.
  // This makes the handler resilient to IBA adding/removing fields that shift indices.
  function findByLabel(labelText, type = 'input') {
    const lower = labelText.toLowerCase();
    const root = document.querySelector(scope);
    if (!root) return null;

    // 1. Find a <label> whose text matches, then follow its `for` attribute or
    //    find the nearest input/select inside the same parent container.
    const allLabels = Array.from(root.querySelectorAll('label, .col-form-label, .form-label, [class*="label"]'));
    for (const lbl of allLabels) {
      if (!lbl.textContent.toLowerCase().includes(lower)) continue;
      // Try `for` attribute first
      if (lbl.htmlFor) {
        const el = document.getElementById(lbl.htmlFor);
        if (el) return el;
      }
      // Walk up to the nearest form-group container, then find the input
      let container = lbl.parentElement;
      for (let i = 0; i < 4 && container; i++) {
        const el = container.querySelector(type === 'select' ? 'select' : 'input, textarea');
        if (el && el !== lbl) return el;
        container = container.parentElement;
      }
    }

    // 2. Scan placeholder attributes
    const inputs = Array.from(root.querySelectorAll(type === 'select' ? 'select' : 'input[type="text"], input[type="number"], input[type="date"], input[type="email"]'));
    return inputs.find(el => (el.placeholder || '').toLowerCase().includes(lower)) || null;
  }

  // Resolve a text input: try label-based first, fall back to positional index.
  function resolveInput(labelHints, fallbackIndex) {
    for (const hint of labelHints) {
      const el = findByLabel(hint);
      if (el) return el;
    }
    return document.querySelectorAll(`${scope} input[type="text"]`)[fallbackIndex] || null;
  }

  function resolveSelect(labelHints, fallbackIndex) {
    for (const hint of labelHints) {
      const el = findByLabel(hint, 'select');
      if (el) return el;
    }
    return document.querySelectorAll(`${scope} select`)[fallbackIndex] || null;
  }

  // ── Text inputs (label-based with index fallback) ──────────────
  doFillInput(resolveInput(['first name'], 0), pv('first_name'));
  doFillInput(resolveInput(['middle name'], 1), pv('middle_name'));
  doFillInput(resolveInput(['last name'], 2), pv('last_name'));
  doFillInput(resolveInput(['email'], 3), pv('email'));

  // CNIC — format inferred from field signals (dashes vs no-dashes)
  const cnicEl = resolveInput(['cnic', 'national id', 'identity'], 4);
  const cnicRaw = pv('cnic');
  if (cnicEl && cnicRaw) {
    const fmt = inferCNICFormat(cnicEl) === 'no_dashes' ? TRANSFORMS.cnic_no_dashes : TRANSFORMS.cnic_dashes;
    doFillInput(cnicEl, fmt(String(cnicRaw)));
  }

  // ── Nationality radio ─────────────────────────────────────────
  doRadio([
    { value: 'Pakistan', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[0]" },
    { value: 'Other', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[1]" },
  ])(pv('nationality') || 'Pakistan');

  // ── Religion select ────────────────────────────────────────────
  // fillSelect already has: 'muslim' ← ['islam','islamic'], 'non-muslim' ← ['christian','hindu',...]
  const religionEl = resolveSelect(['religion'], 0);
  doFillSelect(religionEl, pv('religion') || profile.religion || 'Muslim');

  // ── Phone (vue-tel-input — no label to discover, always positional) ──
  const telInputs = document.querySelectorAll(`${scope} .vue-tel-input .vti__input`);
  if (telInputs[0]) doFillInput(telInputs[0], pv('phone') || profile.phone || '');
  if (telInputs[1]) doFillInput(telInputs[1], pv('guardian_phone') || profile.guardian_phone || '');

  // ── Alternate email — skip entirely, leave for manual entry ───
  const altEmailEl = resolveInput(['alternate email', 'alt email', 'secondary email'], 5);
  if (altEmailEl) markAmber(altEmailEl);

  // ── Date of birth ──────────────────────────────────────────────
  const dateInputs = document.querySelectorAll(`${scope} input[type="date"]`);
  const dobRaw = pv('date_of_birth') || pv('dob');
  if (dateInputs[0] && dobRaw) doFillInput(dateInputs[0], TRANSFORMS.date_ymd(dobRaw));

  // ── Gender radio ───────────────────────────────────────────────
  doRadio([
    { value: 'Male', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[2]" },
    { value: 'Female', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[3]" },
    { value: 'Other', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[4]" },
  ])(pv('gender'));

  // ── House number ───────────────────────────────────────────────
  const houseEl = resolveInput(['house #', 'house no', 'house number'], 6);
  if (houseEl) doFillInput(houseEl, profile.house_number || profile.house_no || '');

  // ── Postal address same as residential (default: No) ──────────
  doRadio([
    { value: '1', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[5]" },
    { value: '0', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[6]" },
  ])('0');

  // ── Country → Province → City typeaheads (cascade) ────────────
  await doTypeahead(scope, 0, pv('country') || profile.country || 'Pakistan');
  await doTypeahead(scope, 1, pv('province') || pv('state_province') || profile.province || '');
  await doTypeahead(scope, 2, pv('district') || pv('city') || profile.city || '');

  // ── Father info ────────────────────────────────────────────────
  const fFnEl = resolveInput(["father's first name", 'father first'], 9);
  if (fFnEl) doFillInput(fFnEl, pv('father_first_name'));

  const fLnEl = resolveInput(["father's last name", 'father last'], 10);
  if (fLnEl) doFillInput(fLnEl, pv('father_last_name'));

  const fCnicEl = resolveInput(["father's cnic", 'father cnic'], 11);
  const fCnic = pv('father_cnic') || profile.father_cnic;
  if (fCnicEl && fCnic) {
    const fmt = inferCNICFormat(fCnicEl) === 'no_dashes' ? TRANSFORMS.cnic_no_dashes : TRANSFORMS.cnic_dashes;
    doFillInput(fCnicEl, fmt(String(fCnic)));
  }

  // Father NTN — explicitly block so generic tiers don't fill it
  const fNtnEl = resolveInput(["father's ntn", 'father ntn', 'ntn no'], 12);
  if (fNtnEl) markAmber(fNtnEl); // marks as manual + adds to alreadyHandled

  // ── Mother info ────────────────────────────────────────────────
  const mFnEl = resolveInput(["mother's first name", 'mother first'], 13);
  if (mFnEl) doFillInput(mFnEl, pv('mother_first_name'));

  const mLnEl = resolveInput(["mother's last name", 'mother last'], 14);
  if (mLnEl) doFillInput(mLnEl, pv('mother_last_name'));

  const mCnicEl = resolveInput(["mother's cnic", 'mother cnic'], 15);
  const mCnic = pv('mother_cnic') || profile.mother_cnic;
  if (mCnicEl && mCnic) {
    const fmt = inferCNICFormat(mCnicEl) === 'no_dashes' ? TRANSFORMS.cnic_no_dashes : TRANSFORMS.cnic_dashes;
    doFillInput(mCnicEl, fmt(String(mCnic)));
  }

  // ── Marital status ─────────────────────────────────────────────
  const maritalEl = resolveSelect(['marital'], 1);
  doFillSelect(maritalEl, pv('marital_status') || 'Single');

  // ── IBA studied (default: No) ──────────────────────────────────
  doRadio([
    { value: '1', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[7]" },
    { value: '0', sfb: "querySelectorAll('#kt_wizard_v1 input[type=\"radio\"]')[8]" },
  ])('0');

  // ── Domicile ───────────────────────────────────────────────────
  const domicileEl = resolveSelect(['domicile'], 2);
  doFillSelect(domicileEl, pv('domicile') || pv('province') || profile.domicile || '');

  // ── Special needs (default: No) ───────────────────────────────
  const specialEl = resolveSelect(['special', 'unique personal need'], 3);
  doFillSelect(specialEl, 'No');

  // ── Banned org declaration — answer is "No" (not affiliated) ──
  const bannedEl = resolveSelect(['banned', 'affiliated'], 4);
  doFillSelect(bannedEl, 'No');

  console.log('[IBA Demo] Demographic fill complete');
}

async function fillIBAEducationWizardPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function markGreen(el) {
    if (!el) return;
    el.style.outline = '2px solid #4ade80';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-filled');
    el.classList.remove('unimatch-manual');
    onFilled(el);
  }
  function markAmber(el) {
    if (!el) return;
    el.style.outline = '2px solid #fbbf24';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-manual');
    onManual(el);
  }

  const nativeSelectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

  async function doSelect(el, value) {
    if (!el || value == null || value === '') return false;
    const ok = fillSelect(el, String(value));
    if (ok) {
      if (nativeSelectSetter) nativeSelectSetter.call(el, el.value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      markGreen(el);
      await delay(300);
      return true;
    }
    markAmber(el);
    return false;
  }

  async function doInput(el, value) {
    if (!el || value == null || value === '') return false;
    if (nativeInputSetter) nativeInputSetter.call(el, String(value));
    else el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    markGreen(el);
    return true;
  }

  // Shared incremental-typing typeahead for ALL Vue typeahead components in IBA.
  // Used by both school/board (doTypeahead) and subject (doSubjectTypeahead) fields
  // because all three are the same Vue component and require identical interaction.
  async function typeaheadFill(container, value) {
    if (!container || !value) return false;

    // Strip parenthetical qualifiers from subject names, e.g. "Mathematics (D)" → "Mathematics".
    // The IBA dropdown has "Mathematics" and "Additional Mathematics" — typing "Mathematics (D)"
    // matches "Additional Mathematics" first because the extra text pushes the exact match down.
    let val = String(value).trim().replace(/\s*\(.*?\)\s*$/, '').trim();
    // Keep original for fallback matching against result text
    const origLow = String(value).trim().toLowerCase();

    // Subject spelling alias map: profile value → shorter search term that the IBA
    // typeahead will actually return results for. The scoreMatch function then picks
    // the closest result (e.g. typing "islam" returns "Islamiat" which scores highest).
    const SEARCH_ALIASES = {
      'islamiyat': 'islam',
      'islamiat':  'islam',
      'islamic studies': 'islam',
      'pak studies': 'pakistan',
      'pakistan study': 'pakistan',
      'urdu language': 'urdu',
      'urdu compulsory': 'urdu',
      'english compulsory': 'english',
      'english (compulsory)': 'english',
      'general mathematics': 'mathematics',
      'additional math': 'additional math',
    };
    const aliasKey = val.toLowerCase();
    if (SEARCH_ALIASES[aliasKey]) val = SEARCH_ALIASES[aliasKey];

    const valLow = val.toLowerCase();

    const trigger = container.querySelector('.typeahead-selected');
    if (!trigger) {
      console.warn(`[IBA Edu] typeahead trigger not found for "${val}"`);
      return false;
    }

    // Hard 15s overall timeout — if the component never responds, bail out rather
    // than hanging the entire fill indefinitely.
    let timedOut = false;
    const timeoutId = setTimeout(() => { timedOut = true; }, 15000);

    try {
      // 1. Close any previously-open dropdown.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await delay(200);
      if (timedOut) return false;

      // 1b. If this slot already has a selected value, clear it first.
      //     IBA typeahead shows "Type or click to select" as placeholder text when empty.
      //     If the trigger text differs from that placeholder, a value is already selected
      //     and the component will block a new selection. Find and click the remove button.
      const placeholderText = 'type or click to select';
      const currentText = (trigger.textContent || '').trim().toLowerCase();
      if (currentText && currentText !== placeholderText) {
        // Look for a remove/clear button — typically an × span or a button sibling
        const clearBtn = container.querySelector(
          '.typeahead-clear, [data-clear], .remove-btn, button.clear, span.clear, ' +
          'button[aria-label*="remove"], button[aria-label*="clear"], .fa-times, .fa-remove'
        );
        if (clearBtn) {
          clearBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          clearBtn.click();
          await delay(300);
        }
      }
      if (timedOut) return false;

      // 2. Scroll into view — Vue's v-show/intersection guard hides the dropdown
      //    when the trigger element is outside the viewport.
      trigger.scrollIntoView({ behavior: 'instant', block: 'center' });
      await delay(300);
      if (timedOut) return false;

      // 3. Open the dropdown: mousedown → click → mouseup.
      trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      trigger.click();
      trigger.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
      await delay(300);
      if (timedOut) return false;

      // 4. Poll up to 4s for the search input to appear.
      let input = null;
      for (let i = 0; i < 40; i++) {
        if (timedOut) break;
        input = container.querySelector('.typeahead-dropdown .typeahead-input')
              || container.querySelector('.typeahead-input');
        if (input) break;
        await delay(100);
      }
      if (!input || timedOut) {
        console.warn(`[IBA Edu] typeahead input never appeared for "${val}"`);
        return false;
      }

      // 5. Focus so the component activates its keyboard listeners.
      input.focus();
      input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      await delay(150);
      if (timedOut) return false;

      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

      // 6. Clear any stale value.
      if (input.value !== '') {
        if (nativeSetter) nativeSetter.call(input, '');
        else input.value = '';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Backspace', bubbles: true }));
        await delay(150);
        if (timedOut) return false;
      }

      // Helper: type a string character-by-character into `input` at 80ms/char.
      async function typeInto(str) {
        for (let i = 1; i <= str.length; i++) {
          if (timedOut) return;
          const ch      = str[i - 1];
          const partial = str.slice(0, i);
          input.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }));
          if (nativeSetter) nativeSetter.call(input, partial);
          else input.value = partial;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
          await delay(80);
        }
      }

      // Helper: clear the search input back to empty.
      async function clearInput() {
        if (nativeSetter) nativeSetter.call(input, '');
        else input.value = '';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Backspace', bubbles: true }));
        await delay(200);
      }

      // Helper: wait for filtered results to stabilise, return them.
      async function pollResults() {
        await delay(200);
        let res = [], prev2 = -1;
        for (let i = 0; i < 30; i++) {
          if (timedOut) break;
          res = Array.from(container.querySelectorAll('a.ac-result'));
          if (res.length > 0 && res.length === prev2) break;
          prev2 = res.length;
          await delay(100);
        }
        return res;
      }

      // Score-based best match: penalises extra words so "Mathematics" beats
      // "Additional Mathematics", and shared-prefix handles "Islamiat"→"Islamiyat".
      function scoreMatch(resultText, search) {
        const rt = resultText.toLowerCase();
        const s  = search.toLowerCase();
        if (rt === s) return 1000;
        const sw = s.split(/\s+/).filter(Boolean);
        const rw = rt.split(/\s+/).filter(Boolean);
        const overlap = sw.filter(w => rw.some(r => r.startsWith(w) || w.startsWith(r))).length;
        let prefix = 0;
        while (prefix < s.length && prefix < rt.length && s[prefix] === rt[prefix]) prefix++;
        const extra = Math.max(0, rw.length - sw.length);
        return overlap * 20 + prefix * 2 - extra * 10 + (rt.includes(s) ? 5 : 0);
      }

      // 7 & 8. Two-phase search:
      //   Phase 1 — type only the first word (e.g. "Urdu" from "Urdu Language").
      //     • If exactly 1 result → select it immediately (no ambiguity).
      //     • If 0 or multiple results → Phase 2.
      //   Phase 2 — clear and type the full (stripped) name, then pick by score.
      //   This handles: "Urdu Language" (no such entry, but "Urdu" exists alone),
      //   "Islamiat" (close to "Islamiyat"), and avoids "Additional Mathematics"
      //   stealing the slot for "Mathematics".
      const firstWord = val.split(/\s+/)[0];
      const multiWord = val.split(/\s+/).length > 1;

      let results = [];

      if (multiWord) {
        // Phase 1: type first word only, then wait longer for Vue to finish filtering.
        // Standard pollResults exits when count stabilises — but on first-word searches
        // Vue may show 6 unfiltered results that temporarily stabilise before narrowing.
        // We wait 600ms upfront to let the full filter cycle complete, then check count.
        await typeInto(firstWord);
        if (timedOut) return false;
        await delay(600); // extended wait — let Vue fully filter on first word
        if (timedOut) return false;
        // Now poll until stable
        let p1res = [], p1prev = -1;
        for (let i = 0; i < 20; i++) {
          if (timedOut) break;
          p1res = Array.from(container.querySelectorAll('a.ac-result'));
          if (p1res.length > 0 && p1res.length === p1prev) break;
          p1prev = p1res.length;
          await delay(150);
        }
        results = p1res;
        if (timedOut) return false;

        if (results.length === 1) {
          // Exactly one option after first word — unambiguous, select it
        } else {
          // 0 or multiple results — clear and type the full name
          await clearInput();
          if (timedOut) return false;
          await typeInto(val);
          if (timedOut) return false;
          results = await pollResults();
          if (timedOut) return false;
        }
      } else {
        // Single-word value — type it directly
        await typeInto(val);
        if (timedOut) return false;
        results = await pollResults();
        if (timedOut) return false;
      }

      if (results.length === 0 || timedOut) {
        console.warn(`[IBA Edu] typeahead: no results for "${val}"`);
        return false;
      }

      const scored = results.map(a => ({ el: a, score: scoreMatch(a.textContent.trim(), val) }));
      scored.sort((a, b) => b.score - a.score);
      const target = scored[0].el;

      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      await delay(60);
      target.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
      await delay(600);
      return true;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // School / board typeahead wrapper.
  async function doTypeahead(container, value) {
    if (!container || !value) return false;
    const ok = await typeaheadFill(container, value);
    if (ok) { markGreen(container); return true; }
    markAmber(container); return false;
  }

  // Subject typeahead wrapper (same Vue component as school/board).
  async function doSubjectTypeahead(container, value) {
    if (!container || !value) return false;
    const ok = await typeaheadFill(container, value);
    if (ok) { markGreen(container); return true; }
    markAmber(container); return false;
  }

  // Clear all pre-filled subject slots in an accordion before writing new values.
  // IBA pre-fills some rows with default subjects (e.g. Mathematics in row 2).
  // If we try to select the same subject in another row, the component rejects it
  // with "already selected". Clearing all subject slots first prevents that conflict.
  async function clearSubjectRows(acc) {
    const subjectThs = Array.from(acc.querySelectorAll('.typeahead')).slice(2);
    for (const th of subjectThs) {
      const placeholderText = 'type or click to select';
      const triggerText = (th.querySelector('.typeahead-selected')?.textContent || '').trim().toLowerCase();
      if (!triggerText || triggerText === placeholderText) continue;
      // Found a pre-filled slot — look for a remove/clear button inside the container
      const clearBtn = th.querySelector(
        '.typeahead-clear, [data-clear], .remove-btn, button.clear, span.clear, ' +
        '.fa-times, .fa-remove, [aria-label*="remove"], [aria-label*="clear"]'
      );
      if (clearBtn) {
        clearBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        clearBtn.click();
        await delay(400);
      }
    }
    await delay(300);
  }

  // Parse subjects: stored as JSON array string or actual array
  // Expected shapes:
  //   Matric/FSc: [{name, total, obtained, percentage}, ...]
  //   O-Level/A-Level: [{name, grade}, ...]
  function parseSubjects(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  }

  // Ensure N subject rows exist in an accordion by clicking "Add New Subject" as needed.
  // Returns the current count of rendered subject rows after any clicks.
  async function ensureSubjectRows(acc, neededTotal) {
    for (let attempt = 0; attempt < 20; attempt++) {
      // Subject typeaheads start at index 2 (0=school, 1=board)
      const currentRows = acc.querySelectorAll('.typeahead').length - 2;
      if (currentRows >= neededTotal) break;

      // Find "Add New Subject" / "Add Subject" button
      const addBtn = Array.from(acc.querySelectorAll('button, a[role="button"], .btn'))
        .find(b => /add.*(new\s+)?subject/i.test(b.textContent.trim()));
      if (!addBtn) { console.warn('[IBA Edu] "Add New Subject" button not found'); break; }

      addBtn.click();
      await delay(1000); // wait for Vue to insert and mount the new row
    }
    await delay(500); // final settle before caller starts filling rows
    return acc.querySelectorAll('.typeahead').length - 2;
  }

  // Open an accordion panel, skip if already expanded
  async function openAccordion(id, waitMs = 900) {
    const btn = document.querySelector(`[aria-controls='${id}']`);
    if (!btn) { console.warn(`[IBA Edu] Accordion not found: ${id}`); return false; }
    if (btn.getAttribute('aria-expanded') === 'true') { await delay(200); return true; }
    btn.click();
    await delay(waitMs);
    return true;
  }

  // Tick "Not Applicable To Me" inside a scoped accordion panel
  async function tickNotApplicable(scope) {
    const section = document.querySelector(scope);
    if (!section) return;
    const cbs = Array.from(section.querySelectorAll('input[type="checkbox"]'));
    for (const cb of cbs) {
      const label = cb.closest('label') ||
        document.querySelector(`label[for="${cb.id}"]`) ||
        cb.parentElement;
      const text = (label?.textContent || '').toLowerCase();
      const sibText = Array.from(cb.parentElement?.childNodes || [])
        .map(n => n.textContent || '').join(' ').toLowerCase();
      if (text.includes('not applicable') || sibText.includes('not applicable')) {
        if (!cb.checked) { cb.click(); await delay(300); }
        markGreen(cb);
        return;
      }
    }
    // Fallback: first checkbox in the accordion
    if (cbs[0] && !cbs[0].checked) { cbs[0].click(); await delay(300); markGreen(cbs[0]); }
  }

  const isOLevel = profile.education_system === 'cambridge';

  // ══════════════════════════════════════════════════
  //  ACCORDION 1 — Matric / O-Level
  // ══════════════════════════════════════════════════
  await openAccordion('accordion-1', 900);
  const acc1 = document.querySelector('#accordion-1');
  if (acc1) {
    let sels = () => Array.from(acc1.querySelectorAll('select'));
    let ths = () => Array.from(acc1.querySelectorAll('.typeahead'));
    let nums = () => Array.from(acc1.querySelectorAll('input[type="number"]'));

    // 1. Certificate/Degree — must be set first; Vue re-renders subject rows based on this
    await doSelect(sels()[0], isOLevel ? 'O-Level' : 'Matriculation');
    await delay(700); // wait for Vue to swap the row layout

    // 2. School (typeahead 0)
    const school1 = isOLevel ? profile.olevel_school : profile.matric_school;
    if (school1) await doTypeahead(ths()[0], school1);

    // 3. Board (typeahead 1)
    const board1 = isOLevel ? (profile.olevel_board || 'Cambridge') : profile.matric_board;
    if (board1) await doTypeahead(ths()[1], board1);

    if (isOLevel) {
      // O-Level selects after cert: [1]=year, [2]=discipline
      await doSelect(sels()[1], String(profile.olevel_year || profile.matric_year || ''));
      await doSelect(sels()[2], profileValueFor('matric_discipline', profile));

      const subjects = parseSubjects(profile.olevel_subjects);
      if (subjects.length > 0) {
        // Clear any pre-filled subject slots before writing, otherwise the component
        // rejects a subject as "already selected" if it appears in another pre-filled row.
        await clearSubjectRows(acc1);
        // Ensure enough rows exist before filling (5 default; click Add for extras)
        await ensureSubjectRows(acc1, subjects.length);

        for (let i = 0; i < subjects.length; i++) {
          const s = subjects[i];
          if (!s) continue;
          // Re-query live DOM each iteration — Vue may have inserted new elements
          const freshThs = Array.from(acc1.querySelectorAll('.typeahead'));
          const freshSels = Array.from(acc1.querySelectorAll('select'));
          // O-Level subjects stored as {subject, grade} — NOT {name, grade}
          const subName1 = s.subject || s.name;
          if (subName1) await doSubjectTypeahead(freshThs[2 + i], subName1);
          if (s.grade) await doSelect(freshSels[3 + i], s.grade);
        }
      }
    } else {
      // Matriculation selects: [1]=year, [2]=grade/CGPA, [3]=discipline
      await doSelect(sels()[1], String(profile.matric_year || ''));
      await doSelect(sels()[2], profileValueFor('matric_grade', profile));
      await doSelect(sels()[3], profileValueFor('matric_discipline', profile));

      // Row 1 aggregate inputs: [0]=total, [1]=obtained, [2]=percentage
      await doInput(nums()[0], profile.matric_total || '1100');
      await doInput(nums()[1], profile.matric_marks || profile.matric_obtained);
      await doInput(nums()[2], profile.matric_percentage || profile.matric_percent);

      const subjects = parseSubjects(profile.matric_subjects);
      if (subjects.length > 0) {
        await clearSubjectRows(acc1);
        await ensureSubjectRows(acc1, subjects.length);

        for (let i = 0; i < subjects.length; i++) {
          const s = subjects[i];
          if (!s) continue;
          const freshThs = Array.from(acc1.querySelectorAll('.typeahead'));
          const freshNums = Array.from(acc1.querySelectorAll('input[type="number"]'));
          const nBase = 3 + i * 3;
          if (s.name) await doSubjectTypeahead(freshThs[2 + i], s.name);
          if (s.total) await doInput(freshNums[nBase], s.total);
          if (s.obtained) await doInput(freshNums[nBase + 1], s.obtained);
          if (s.percentage) await doInput(freshNums[nBase + 2], s.percentage);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════
  //  ACCORDION 2 — Intermediate / A-Level
  // ══════════════════════════════════════════════════
  await openAccordion('accordion-2', 900);
  const acc2 = document.querySelector('#accordion-2');
  if (acc2) {
    let sels = () => Array.from(acc2.querySelectorAll('select'));
    let ths = () => Array.from(acc2.querySelectorAll('.typeahead'));
    let nums = () => Array.from(acc2.querySelectorAll('input[type="number"]'));

    await doSelect(sels()[0], isOLevel ? 'A-Level' : 'Intermediate');
    await delay(700);

    const school2 = isOLevel ? profile.alevel_school : profile.fsc_school;
    if (school2) await doTypeahead(ths()[0], school2);

    const board2 = isOLevel ? (profile.alevel_board || 'Cambridge') : profile.fsc_board;
    if (board2) await doTypeahead(ths()[1], board2);

    if (isOLevel) {
      // A-Level DOM mirrors Intermediate layout — Result Status is still present even in A-Level mode.
      // sel[0]=cert, sel[1]=result_status, sel[2]=year, sel[3]=discipline, sel[4]=current_level
      // Grade selects begin at index 5 (not 3).
      await doSelect(sels()[2], String(profile.alevel_year || profile.fsc_year || ''));
      await doSelect(sels()[3], profileValueFor('inter_discipline', profile));

      const subjects = parseSubjects(profile.alevel_subjects);
      if (subjects.length > 0) {
        await clearSubjectRows(acc2);
        await ensureSubjectRows(acc2, subjects.length);

        for (let i = 0; i < subjects.length; i++) {
          const s = subjects[i];
          if (!s) continue;
          const freshThs = Array.from(acc2.querySelectorAll('.typeahead'));
          const freshSels = Array.from(acc2.querySelectorAll('select'));
          // A-Level subjects stored as {subject, as_grade, a2_grade} — NOT {name, grade}
          const subName2 = s.subject || s.name;
          const subGrade2 = s.grade || s.a2_grade || s.as_grade;
          if (subName2) await doSubjectTypeahead(freshThs[2 + i], subName2);
          if (subGrade2) await doSelect(freshSels[5 + i], subGrade2);
        }
      }
    } else {
      // Intermediate selects: [1]=result_status, [2]=year, [3]=discipline, [4]=current_level
      await doSelect(sels()[1], profileValueFor('inter_result_status', profile));
      await doSelect(sels()[2], String(profile.fsc_year || profile.inter_year || ''));
      await doSelect(sels()[3], profileValueFor('inter_discipline', profile));

      // Row 1 aggregate inputs: [0]=total, [1]=obtained, [2]=percentage
      await doInput(nums()[0], profile.fsc_total || profile.inter_total || '1100');
      await doInput(nums()[1], profile.fsc_marks || profile.inter_marks);
      await doInput(nums()[2], profile.fsc_percentage || profile.inter_percent);

      // Current level (index 4)
      await doSelect(sels()[4], profileValueFor('inter_current_level', profile));

      const subjects = parseSubjects(profile.fsc_subjects || profile.inter_subjects);
      if (subjects.length > 0) {
        await clearSubjectRows(acc2);
        await ensureSubjectRows(acc2, subjects.length);

        for (let i = 0; i < subjects.length; i++) {
          const s = subjects[i];
          if (!s) continue;
          const freshThs = Array.from(acc2.querySelectorAll('.typeahead'));
          const freshNums = Array.from(acc2.querySelectorAll('input[type="number"]'));
          const nBase = 3 + i * 3;
          if (s.name) await doSubjectTypeahead(freshThs[2 + i], s.name);
          if (s.total) await doInput(freshNums[nBase], s.total);
          if (s.obtained) await doInput(freshNums[nBase + 1], s.obtained);
          if (s.percentage) await doInput(freshNums[nBase + 2], s.percentage);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════
  //  ACCORDIONS 3-5 — tick "Not Applicable To Me"
  // ══════════════════════════════════════════════════
  for (const [ctrl, scope] of [
    ['accordion-3', '#accordion-3'],
    ['accordion-4', '#accordion-4'],
    ['accordion-5', '#accordion-5'],
  ]) {
    await openAccordion(ctrl, 500);
    await tickNotApplicable(scope);
  }

  console.log('[IBA Edu Wizard] Education fill complete');
}

// ─── GIKI Education Pages — Dedicated Handlers ────────────────
// Page 1: /student_previous_education/  (SSC / O-Level)
// Page 2: /student_new_hssc_equ.html/   (HSSC / A-Level)
// Both pages use AJAX to populate boards and (page 2) the dynamic form
// container. Generic heuristics cannot handle the cascading selects.

function isGIKISSCPage() {
  return window.location.hostname.includes('admissions.giki.edu.pk') &&
    window.location.pathname.includes('student_previous_education') &&
    !!document.querySelector('select#name[name="name"]');
}

function isGIKIHSSCPage() {
  return window.location.hostname.includes('admissions.giki.edu.pk') &&
    (window.location.pathname.includes('student_new_hssc_equ') ||
     window.location.pathname.includes('student_previous_education_hssc')) &&
    !!document.querySelector('select#name[name="name"]');
}

// ── Subject name → GIKI option value ─────────────────────────────────────
// Two tiers: Pakistan-specific (1001–1009) preferred for local boards,
// International CIE (101–203) for Cambridge/Edexcel boards.
// Match is attempted on the stripped, lowercase subject name.
const GIKI_SUBJECT_MAP = {
  // Pakistan-specific subjects (preferred for SSC/local)
  'islamiyat': 1001, 'islamiat': 1001, 'islamic studies': 1001, 'islam': 1001,
  'pakistan studies': 1002, 'pak studies': 1002,
  'urdu': 1003, 'urdu (compulsory)': 1003,
  'english': 1004, 'english language': 1004, 'english compulsory': 1004,
  'mathematics': 1005, 'maths': 1005, 'math': 1005, 'mathematics (d)': 1005,
  'physics': 1006,
  'chemistry': 1007, 'chemistry/computer/it': 1007,
  'biology': 1008, 'biology/computer/it': 1008,
  'bio/cs/it': 1009,
  // International CIE subjects
  'accounting': 101,
  'afrikaans': 102,
  'agriculture': 104,
  'arabic': 105,
  'art & design': 107, 'art and design': 107,
  'business studies': 115, 'business': 115,
  'chinese': 117, 'chinese (mandarin)': 117,
  'computer science': 123, 'computer science 1': 123,
  'economics': 127,
  'english as a second language': 132, 'english second language': 132, 'esl': 132,
  'further mathematics': 148, 'further maths': 148,
  'geography': 149,
  'global perspectives': 152,
  'history': 158,
  'information & communication technology': 159, 'ict': 159, 'information technology': 159,
  'latin': 164,
  'media studies': 171,
  'music': 172,
  'physical education': 175, 'pe': 175,
  'psychology': 180,
  'religious studies': 181,
  'sociology': 187,
  'spanish': 188,
  'statistics': 191,
  'urdu as a second language': 199, 'urdu second language': 199,
};

// Resolve a subject name to its closest GIKI option value.
// First tries exact/normalized match, then partial word overlap.
function resolveGIKISubjectValue(subjectName) {
  if (!subjectName) return null;
  const s = String(subjectName).toLowerCase().trim().replace(/\s*\(.*?\)\s*/g, '').trim();
  // Exact match
  if (GIKI_SUBJECT_MAP[s] !== undefined) return String(GIKI_SUBJECT_MAP[s]);
  // Original with parens still in
  const orig = String(subjectName).toLowerCase().trim();
  if (GIKI_SUBJECT_MAP[orig] !== undefined) return String(GIKI_SUBJECT_MAP[orig]);
  // Partial: find best key overlap
  let best = null, bestScore = 0;
  for (const [key, val] of Object.entries(GIKI_SUBJECT_MAP)) {
    if (s.includes(key) || key.includes(s)) {
      const score = Math.min(s.length, key.length);
      if (score > bestScore) { bestScore = score; best = String(val); }
    }
  }
  return best;
}

// ── Board name → GIKI board ID ────────────────────────────────────────────
const GIKI_BOARD_MAP = {
  // Local boards
  'bise lahore': 144, 'lahore': 144,
  'bise bahawalpur': 146, 'bahawalpur': 146,
  'bise rawalpindi': 147, 'rawalpindi': 147,
  'bise dg khan': 148, 'bise dera ghazi khan': 148, 'dera ghazi khan': 148,
  'bise faisalabad': 149, 'faisalabad': 149,
  'bise gujranwala': 150, 'gujranwala': 150,
  'bise multan': 151, 'multan': 151,
  'bise sahiwal': 152, 'sahiwal': 152,
  'bise sargodha': 153, 'sargodha': 153,
  'bise hyderabad': 154, 'hyderabad': 154,
  'bise karachi': 155, 'karachi': 155,
  'bise larkana': 156, 'larkana': 156,
  'bise mirpur khas': 157, 'mirpur khas': 157,
  'bise sukkur': 158, 'sukkur': 158,
  'bise peshawar': 159, 'peshawar': 159,
  'bise abbottabad': 160, 'abbottabad': 160,
  'bise dera ismail khan': 161, 'bise di khan': 161, 'dera ismail khan': 161,
  'bise kohat': 162, 'kohat': 162,
  'bise malakand': 163, 'malakand': 163,
  'bise mardan': 164, 'mardan': 164,
  'bise swat': 165, 'swat': 165,
  'bise quetta': 166, 'quetta': 166,
  'bise khuzdar': 167, 'khuzdar': 167,
  'bise turbat': 168, 'turbat': 168,
  'bise loralai': 169, 'loralai': 169,
  'bise kashmir': 170, 'kashmir': 170,
  'technical board lahore': 171,
  'technical board karachi': 172,
  'fbise': 176, 'fbise islamabad': 176, 'federal board': 176,
  'bise ajk': 177, 'ajk': 177,
  'bise shaheed benazirabad': 178,
  'akueb': 179, 'akueb karachi': 179,
  'bise bannu': 180, 'bannu': 180,
  'bte peshawar': 181,
  'karakoram': 182,
  'bte karachi': 183,
  'bte lahore': 184,
  'bise islamabad': 186, 'islamabad': 186,
  'ziauddin': 187,
  'bise zhob': 188, 'zhob': 188,
  // International boards
  'cambridge': 601, 'cie': 601, 'cambridge international': 601,
  'edexcel': 602, 'pearson edexcel': 611,
  'ib': 600, 'international baccalaureate': 600,
  'ap': 603, 'advanced placement': 603,
  'ucles': 608,
};

function resolveGIKIBoardId(boardName) {
  if (!boardName) return null;
  const b = String(boardName).toLowerCase().trim();
  if (GIKI_BOARD_MAP[b] !== undefined) return String(GIKI_BOARD_MAP[b]);
  for (const [key, val] of Object.entries(GIKI_BOARD_MAP)) {
    if (b.includes(key) || key.includes(b)) return String(val);
  }
  return null;
}

// ── Study group selection for HSSC/A-Level ────────────────────────────────
// The select options are full text strings. Infer the group from profile subjects.
function resolveGIKIStudyGroup(profile) {
  const subjectsRaw = profile.fsc_subjects || profile.inter_subjects ||
                      profile.alevel_subjects || profile.olevel_subjects || [];
  const subjects = (Array.isArray(subjectsRaw)
    ? subjectsRaw
    : (() => { try { return JSON.parse(subjectsRaw); } catch { return []; } })()
  ).map(s => ((s.subject || s.name || '')).toLowerCase());

  const has = (kw) => subjects.some(s => s.includes(kw));

  // DAE groups
  const isDAE = profile.education_system === 'dae';
  if (isDAE) {
    if (has('civil')) return 'Civil';
    if (has('electrical')) return 'Electrical';
    if (has('mechanical')) return 'Mechanical';
    if (has('computer') || has('cs')) return 'Computer';
    if (has('chemical')) return 'Chemical';
    if (has('electronics')) return 'Electronics';
    return 'Mechanical';
  }
  // IBDP
  if (profile.education_system === 'ibdp') return 'IBDP';

  // HSSC / A-Level groups
  const hasMath    = has('math');
  const hasPhysics = has('physics');
  const hasChem    = has('chem');
  const hasBio     = has('bio');
  const hasCS      = has('computer') || has('cs/it') || has('cs ') || has('information technology');

  if (hasMath && hasPhysics && hasChem && !hasBio) return 'Pre Engineering';
  if (hasBio && hasChem && hasPhysics && hasMath) return 'Pre Med with Math';
  if (hasBio && hasChem && !hasMath) return 'Pre Medical';
  if (hasCS && hasMath) return 'CS/IT with 3rd Sub';
  if (hasCS) return 'Computer Science/IT';
  // Fallback: check profile inter_discipline
  const disc = (profile.inter_discipline || '').toLowerCase();
  if (disc.includes('pre eng') || disc.includes('engineering')) return 'Pre Engineering';
  if (disc.includes('pre med') || disc.includes('medical')) return 'Pre Medical';
  if (disc.includes('computer') || disc.includes('cs')) return 'Computer Science/IT';
  if (disc.includes('art') || disc.includes('human')) return 'Arts/Humanities';
  return 'Pre Engineering'; // safest default for GIKI
}

// ── Trigger jQuery change + wait for AJAX ────────────────────────────────
async function triggerJQueryChange(el, waitMs) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  // Native event
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  // jQuery event (if jQuery is on the page)
  if (window.jQuery) {
    try { window.jQuery(el).trigger('change'); } catch { /* ignore */ }
  }
  await delay(waitMs);
}

// ── Wait for select to be populated by AJAX ──────────────────────────────
async function waitForSelectOptions(sel, minOptions, maxWaitMs) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (sel.options.length >= minOptions) return true;
    await delay(150);
  }
  return false;
}

// ── Select a <select> by numeric string value or by text match ───────────
function setSelectValue(el, value) {
  if (!el || value == null) return false;
  const v = String(value);
  // Try exact value match first
  let opt = Array.from(el.options).find(o => o.value === v);
  // Then text match (case-insensitive substring)
  if (!opt) opt = Array.from(el.options).find(o => o.text.toLowerCase().includes(v.toLowerCase()));
  if (!opt) return false;
  el.value = opt.value;
  return true;
}

async function fillGIKISSCPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const isOLevel = profile.education_system === 'cambridge';
  const degreeValue = isOLevel ? 'OLV10' : 'SSC10';

  function mark(el, ok) {
    if (!el) return;
    if (ok) {
      el.style.outline = '2px solid #4ade80';
      el.style.outlineOffset = '2px';
      el.classList.add('unimatch-filled');
      onFilled?.(el);
    } else {
      el.style.outline = '2px solid #fbbf24';
      el.style.outlineOffset = '2px';
      el.classList.add('unimatch-manual');
      onManual?.(el);
    }
  }

  // 1. Set degree type
  const degSel = document.querySelector('select#name');
  if (!degSel) { console.warn('[GIKI SSC] degree selector not found'); return; }
  degSel.value = degreeValue;
  mark(degSel, degSel.value === degreeValue);
  await triggerJQueryChange(degSel, 300);

  // 2. Wait for board options to load via AJAX (up to 5s)
  const boardSel = document.querySelector('select#board_id');
  if (boardSel) {
    const loaded = await waitForSelectOptions(boardSel, 2, 5000);
    if (loaded) {
      const boardProfile = isOLevel
        ? (profile.olevel_board || 'Cambridge')
        : (profile.matric_board || profile.board || '');
      const boardId = resolveGIKIBoardId(boardProfile);
      let ok = false;
      if (boardId) ok = setSelectValue(boardSel, boardId);
      if (!ok && boardProfile) ok = setSelectValue(boardSel, boardProfile);
      if (ok) {
        boardSel.dispatchEvent(new Event('change', { bubbles: true }));
        mark(boardSel, true);
      } else {
        mark(boardSel, false);
      }
      // Wait longer here — the board change fires AJAX that may mutate the DOM.
      // Grades must only be set AFTER this settles, otherwise they get wiped.
      await delay(1500);
    }
  }

  // 3. Passing year
  const yearEl = document.querySelector('#passing_year3, [name="passing_year3"]');
  if (yearEl) {
    const yr = isOLevel
      ? (profile.olevel_year || profile.matric_year || '')
      : (profile.matric_year || '');
    if (yr) {
      const ok = await fillInput(yearEl, String(yr));
      mark(yearEl, ok);
    }
  }

  // 4. Institute
  const instEl = document.querySelector('#institute, [name="institute"]');
  if (instEl) {
    const school = isOLevel
      ? (profile.olevel_school || '')
      : (profile.matric_school || profile.school || '');
    if (school) {
      const ok = await fillInput(instEl, school);
      mark(instEl, ok);
    }
  }

  if (isOLevel) {
    // ── O-Level path ──────────────────────────────────────────────────────
    // applying_for and country_of_degree first — these may trigger their own
    // handlers. Set them before grades so any resulting DOM changes happen first.
    const applyEl = document.querySelector('#applying_for');
    if (applyEl) {
      const ok = setSelectValue(applyEl, 'All');
      if (ok) applyEl.dispatchEvent(new Event('change', { bubbles: true }));
      mark(applyEl, ok);
    }

    const countryEl = document.querySelector('#country_of_degree');
    if (countryEl) {
      const ok = setSelectValue(countryEl, 'Pakistan');
      if (ok) countryEl.dispatchEvent(new Event('change', { bubbles: true }));
      mark(countryEl, ok);
    }

    await delay(600); // let any handlers from applying_for/country settle

    // The 8 subject selects are READ-ONLY pre-filled by the server.
    // Do NOT set their value or dispatch any events on them — jQuery handlers
    // on the subject selects reset the paired grade field when change fires.
    // Strategy: read the pre-filled subject text, look up the grade from the
    // profile, then set the grade select value ONLY using the native setter
    // with NO events dispatched — avoids any reset handlers entirely.
    const subjects = (() => {
      const raw = profile.olevel_subjects;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw); } catch { return []; }
    })();

    // Build a lookup: normalised subject name → grade
    const gradeBySubject = {};
    for (const s of subjects) {
      const name = (s.subject || s.name || '').toLowerCase().trim()
        .replace(/\s*\(.*?\)\s*/g, '').trim();
      if (name && s.grade) gradeBySubject[name] = s.grade;
    }

    const nativeSelectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;

    for (let i = 0; i < 8; i++) {
      const subSel   = document.querySelector(`#subject_${i + 1}_readonly`);
      const gradeSel = document.querySelector(`#grade_${i + 1}`);
      if (!subSel || !gradeSel) continue;

      // Read the pre-filled subject text from the currently selected option
      const selectedOpt = subSel.options[subSel.selectedIndex];
      const rowSubjectRaw = (selectedOpt?.text || '').trim();
      if (!rowSubjectRaw || rowSubjectRaw.toLowerCase().startsWith('select')) {
        await delay(200);
        continue;
      }

      // Normalise and look up in profile grades
      const rowSubjectNorm = rowSubjectRaw.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      let grade = gradeBySubject[rowSubjectNorm];

      // Fuzzy fallback: partial word overlap
      if (!grade) {
        for (const [profSubject, profGrade] of Object.entries(gradeBySubject)) {
          if (rowSubjectNorm.includes(profSubject) || profSubject.includes(rowSubjectNorm)) {
            grade = profGrade;
            break;
          }
        }
      }

      if (grade) {
        // Find the matching option value
        const targetOpt = Array.from(gradeSel.options).find(o => o.value === grade || o.text === grade);
        if (targetOpt) {
          // Use native setter only — no change/input events to avoid reset handlers
          if (nativeSelectSetter) nativeSelectSetter.call(gradeSel, targetOpt.value);
          else gradeSel.value = targetOpt.value;
          mark(gradeSel, true);
        } else {
          mark(gradeSel, false);
        }
      }
      mark(subSel, true); // subject is read-only, mark green to acknowledge
      await delay(200);
    }

  } else {
    // ── SSC/Matric path ───────────────────────────────────────────────────
    const obtEl  = document.querySelector('#obtained_marks');
    const totEl  = document.querySelector('#total_marks');
    if (obtEl) mark(obtEl, await fillInput(obtEl, profile.matric_marks || profile.matric_obtained || ''));
    if (totEl) mark(totEl, await fillInput(totEl, profile.matric_total || '1100'));
  }

  console.log('[GIKI SSC] Fill complete');
}

async function fillGIKIHSSCPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const isOLevel = profile.education_system === 'cambridge';
  const degreeValue = isOLevel ? 'ALV12' : 'HSSC12';
  // Result declared = yes only when education is complete (not appearing/part1 only)
  const pendingStatuses = ['appearing', 'part1_only', 'pending', 'awaiting', 'not_declared'];
  const interStatus = (profile.inter_status || profile.alevel_status || '').toLowerCase();
  const resultDeclared = pendingStatuses.includes(interStatus) ? 'no' : 'yes';

  function mark(el, ok) {
    if (!el) return;
    if (ok) {
      el.style.outline = '2px solid #4ade80';
      el.style.outlineOffset = '2px';
      el.classList.add('unimatch-filled');
      onFilled?.(el);
    } else {
      el.style.outline = '2px solid #fbbf24';
      el.style.outlineOffset = '2px';
      el.classList.add('unimatch-manual');
      onManual?.(el);
    }
  }

  // 1. Set degree type → triggers AJAX for boards + study groups
  const degSel = document.querySelector('select#name');
  if (!degSel) { console.warn('[GIKI HSSC] degree selector not found'); return; }
  degSel.value = degreeValue;
  mark(degSel, degSel.value === degreeValue);
  await triggerJQueryChange(degSel, 400);

  // 2. Board — wait for AJAX (up to 5s)
  const boardSel = document.querySelector('select#board_id');
  if (boardSel) {
    const loaded = await waitForSelectOptions(boardSel, 2, 5000);
    if (loaded) {
      const boardProfile = isOLevel
        ? (profile.alevel_board || 'Cambridge')
        : (profile.fsc_board || profile.inter_board || profile.board || '');
      const boardId = resolveGIKIBoardId(boardProfile);
      let ok = boardId ? setSelectValue(boardSel, boardId) : false;
      if (!ok && boardProfile) ok = setSelectValue(boardSel, boardProfile);
      if (ok) boardSel.dispatchEvent(new Event('change', { bubbles: true }));
      mark(boardSel, ok);
      await delay(200);
    }
  }

  // 3. Study group — wait for AJAX (up to 4s)
  const studyGroupSel = document.querySelector('select#study_group_id');
  if (studyGroupSel) {
    const loaded = await waitForSelectOptions(studyGroupSel, 2, 4000);
    if (loaded) {
      const groupName = resolveGIKIStudyGroup(profile);
      // Options are full text strings — use text-includes match
      const opt = Array.from(studyGroupSel.options)
        .find(o => o.text.toLowerCase().includes(groupName.toLowerCase()));
      if (opt) {
        studyGroupSel.value = opt.value;
        studyGroupSel.dispatchEvent(new Event('change', { bubbles: true }));
        mark(studyGroupSel, true);
      } else {
        mark(studyGroupSel, false);
      }
      await delay(200);
    }
  }

  // 4. Result declared → triggers AJAX to load #dynamic-form-container
  const resultSel = document.querySelector('select#result_declared');
  if (resultSel) {
    resultSel.value = resultDeclared;
    mark(resultSel, true);
    await triggerJQueryChange(resultSel, 400);

    // Wait for dynamic form container to be populated (up to 6s)
    const dynContainer = document.querySelector('#dynamic-form-container');
    if (dynContainer) {
      let waited = 0;
      while (waited < 6000) {
        if (dynContainer.querySelector('input, select')) break;
        await delay(200);
        waited += 200;
      }
      await delay(300); // extra settle
    }
  }

  // 5. Fill fields inside #dynamic-form-container (and page-level fields)
  const yearEl = document.querySelector('#passing_year3');
  if (yearEl) {
    const yr = isOLevel
      ? (profile.alevel_year || profile.fsc_year || profile.inter_year || '')
      : (profile.fsc_year || profile.inter_year || '');
    if (yr) mark(yearEl, await fillInput(yearEl, String(yr)));
  }

  const instEl = document.querySelector('#institute');
  if (instEl) {
    const school = isOLevel
      ? (profile.alevel_school || '')
      : (profile.fsc_school || profile.inter_school || profile.school || '');
    if (school) mark(instEl, await fillInput(instEl, school));
  }

  const applyEl = document.querySelector('#applying_for');
  if (applyEl) {
    const ok = setSelectValue(applyEl, 'All');
    if (ok) applyEl.dispatchEvent(new Event('change', { bubbles: true }));
    mark(applyEl, ok);
  }

  if (isOLevel) {
    // ── A-Level path: 3 fixed subject rows ───────────────────────────────
    const countryEl = document.querySelector('#country_of_degree');
    if (countryEl) {
      const ok = setSelectValue(countryEl, 'Pakistan');
      if (ok) countryEl.dispatchEvent(new Event('change', { bubbles: true }));
      mark(countryEl, ok);
    }

    const subjects = (() => {
      const raw = profile.alevel_subjects;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw); } catch { return []; }
    })();

    for (let i = 0; i < 3; i++) {
      const subSel   = document.querySelector(`#subject_${i + 1}_readonly`);
      const gradeSel = document.querySelector(`#grade_${i + 1}`);
      if (!subSel) continue;

      const s = subjects[i];
      if (!s) continue;

      const subName = s.subject || s.name || '';
      const subVal  = resolveGIKISubjectValue(subName);
      let subOk = false;
      if (subVal) subOk = setSelectValue(subSel, subVal);
      if (!subOk && subName) subOk = setSelectValue(subSel, subName);
      if (subOk) subSel.dispatchEvent(new Event('change', { bubbles: true }));
      mark(subSel, subOk);

      if (gradeSel) {
        const grade = s.grade || s.a2_grade || s.as_grade || '';
        if (grade) {
          const gradeOk = setSelectValue(gradeSel, grade);
          if (gradeOk) gradeSel.dispatchEvent(new Event('change', { bubbles: true }));
          mark(gradeSel, gradeOk);
        }
      }
      await delay(80);
    }

    const obtEl = document.querySelector('#obtained_marks');
    const totEl = document.querySelector('#total_marks');
    if (obtEl) mark(obtEl, await fillInput(obtEl, profile.alevel_marks || profile.fsc_marks || ''));
    if (totEl) mark(totEl, await fillInput(totEl, profile.alevel_total || profile.fsc_total || ''));

  } else {
    // ── HSSC/FSc path ─────────────────────────────────────────────────────
    const y1Obt = document.querySelector('#year1_obtained_marks');
    const y1Tot = document.querySelector('#year1_total_marks');
    const obtEl = document.querySelector('#obtained_marks');
    const totEl = document.querySelector('#total_marks');
    const mathObt = document.querySelector('#maths_obtained_marks');
    const mathTot = document.querySelector('#maths_total_marks');
    const phyObt  = document.querySelector('#phy_obtained_marks');
    const phyTot  = document.querySelector('#phy_total_marks');

    // Total marks across both years combined into fsc_marks / fsc_total
    if (obtEl) mark(obtEl, await fillInput(obtEl, profile.fsc_marks || profile.inter_marks || ''));
    if (totEl) mark(totEl, await fillInput(totEl, profile.fsc_total || profile.inter_total || '1100'));
    // Part 1 marks if available
    if (y1Obt && profile.fsc_year1_marks) mark(y1Obt, await fillInput(y1Obt, profile.fsc_year1_marks));
    if (y1Tot && profile.fsc_year1_total) mark(y1Tot, await fillInput(y1Tot, profile.fsc_year1_total));
    // Subject-specific marks
    if (mathObt && profile.fsc_math_marks) mark(mathObt, await fillInput(mathObt, profile.fsc_math_marks));
    if (mathTot && profile.fsc_math_total) mark(mathTot, await fillInput(mathTot, profile.fsc_math_total));
    if (phyObt  && profile.fsc_physics_marks) mark(phyObt,  await fillInput(phyObt,  profile.fsc_physics_marks));
    if (phyTot  && profile.fsc_physics_total) mark(phyTot,  await fillInput(phyTot,  profile.fsc_physics_total));
  }

  console.log('[GIKI HSSC] Fill complete');
}

// ─── SPECIAL: UET Taxila — Qualification Section ─────────────────────────────
// Angular PrimeNG repeating table. Each row holds 17 fields sharing the same
// formcontrolname values; rows are targeted by DOM index.

function isUETTaxilaQualificationPage() {
  return window.location.hostname.includes('entrytest.uettaxila.edu.pk') &&
    (window.location.pathname.includes('/home/qualification') ||
     !!document.querySelector('[formcontrolname="qualificationTypeId"]'));
}

async function fillUETTaxilaQualificationPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  const isOLevel   = (profile.education_system || '').toLowerCase() === 'cambridge';
  // Intermediate/A-Level row: only add when the result is fully declared
  const addInterRow = isOLevel
    ? (profile.alevel_status === 'complete')
    : (profile.inter_status  === 'complete');

  // ── Row data ────────────────────────────────────────────────────
  // Row 0 (Matric / O-Level): use IBCC O-Level marks for Cambridge students
  const r0Marks = profile.ibcc_olevel_marks ?? profile.matric_marks;
  const r0Total = profile.ibcc_olevel_total ?? profile.matric_total;
  const r0Pct   = (r0Marks && r0Total)
    ? parseFloat(((r0Marks / r0Total) * 100).toFixed(2))
    : (profile.ibcc_equivalent_matric ?? profile.matric_percentage);
  const r0Year  = profile.olevel_year  ?? profile.matric_year;
  const r0Board = isOLevel
    ? (profile.olevel_board  ?? profile.board_name ?? 'Cambridge')
    : (profile.matric_board  ?? profile.board_name ?? 'FBISE');
  const r0School = isOLevel
    ? (profile.olevel_school ?? profile.school_name ?? '')
    : (profile.matric_school ?? profile.school_name ?? '');
  const r0Roll  = profile.matric_roll_no ?? profile.roll_number ?? '';

  // Row 1 (Intermediate / A-Level): use IBCC A-Level marks for Cambridge students
  const r1Marks = profile.ibcc_alevel_marks ?? profile.fsc_marks;
  const r1Total = profile.ibcc_alevel_total ?? profile.fsc_total;
  const r1Pct   = (r1Marks && r1Total)
    ? parseFloat(((r1Marks / r1Total) * 100).toFixed(2))
    : (profile.ibcc_equivalent_inter ?? profile.fsc_percentage);
  const r1Year  = isOLevel ? profile.alevel_year : (profile.fsc_year ?? profile.inter_year);
  const r1Board = isOLevel
    ? (profile.alevel_board ?? profile.board_name ?? 'Cambridge')
    : (profile.fsc_board    ?? profile.board_name ?? 'FBISE');
  const r1School = isOLevel
    ? (profile.alevel_school ?? profile.school_name ?? '')
    : (profile.fsc_school   ?? profile.school_name ?? '');
  const r1Roll  = profile.fsc_roll_no ?? profile.inter_roll_no ?? profile.roll_number ?? '';

  function calcDivision(pct) {
    const p = parseFloat(pct);
    if (!p) return null;
    if (p >= 60) return '1st';
    if (p >= 45) return '2nd';
    if (p >= 33) return '3rd';
    return null;
  }

  function areaOfStudy(isInterRow) {
    const stream = ((isInterRow ? profile.fsc_stream : profile.matric_stream) || profile.fsc_stream || '').toLowerCase();
    if (stream.includes('computer') || stream.includes('ics'))                     return 'Science(Computer)';
    if (stream.includes('medical') || stream.includes('bio') || stream.includes('pre-medical')) return 'Science(Biology)';
    if (stream.includes('arts')    || stream.includes('humanities'))               return 'Arts';
    if (stream.includes('commerce'))                                               return 'Arts';
    // Default: Science(Biology) for inter (pre-medical most common), General Sciences for matric
    return isInterRow ? 'Science(Biology)' : 'General Sciences';
  }

  // ── DOM helpers ─────────────────────────────────────────────────
  function mark(el, ok) {
    if (!el) return;
    el.style.outline = ok ? '2px solid #4ade80' : '2px solid #fbbf24';
    el.style.outlineOffset = '2px';
    if (ok) onFilled?.(el); else onManual?.(el);
  }

  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

  function fillInputNumber(scope, fcName, value) {
    if (value == null || value === '') return false;
    const input = scope.querySelector(`p-inputnumber[formcontrolname="${fcName}"] input`);
    if (!input) return false;
    input.focus();
    if (nativeSetter) nativeSetter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (nativeSetter) nativeSetter.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur',  { bubbles: true }));
    mark(input, true);
    return true;
  }

  function fillPlainInput(scope, fcName, value) {
    if (value == null || value === '') return false;
    const input = scope.querySelector(`input[formcontrolname="${fcName}"]`);
    if (!input) return false;
    if (nativeSetter) nativeSetter.call(input, String(value));
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    mark(input, true);
    return true;
  }

  // Open a PrimeNG dropdown scoped to a row, find and click the matching item.
  // Large lists (countries, boards) use the filter box first.
  async function fillDropdown(scope, fcName, value) {
    if (!value) return false;
    const pDrop = scope.querySelector(`p-dropdown[formcontrolname="${fcName}"]`)
               || scope.querySelector(`[formcontrolname="${fcName}"]`);
    const trigger = pDrop?.querySelector('.p-dropdown-trigger') || pDrop?.querySelector('.p-dropdown');
    if (!trigger) return false;
    trigger.click();
    await delay(250);

    const panel = document.querySelector('.p-dropdown-panel:not([style*="display: none"])')
               || document.querySelector('.p-dropdown-panel');
    if (!panel) return false;

    const val = String(value).toLowerCase().trim();
    let items = Array.from(panel.querySelectorAll('.p-dropdown-item, [role="option"]'));

    // Use filter box for large lists (countries, boards have 100+ options)
    const filterEl = panel.querySelector('.p-dropdown-filter');
    if (filterEl && items.length >= 30) {
      if (nativeSetter) nativeSetter.call(filterEl, value);
      filterEl.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(350);
      items = Array.from(panel.querySelectorAll('.p-dropdown-item, [role="option"]'));
    }

    const target = items.find(o => o.textContent.trim().toLowerCase() === val)
                || items.find(o => o.textContent.trim().toLowerCase().startsWith(val))
                || items.find(o => val.length >= 3 && o.textContent.trim().toLowerCase().includes(val))
                || items.find(o => val.length >= 3 && val.includes(o.textContent.trim().toLowerCase()) && o.textContent.trim().length >= 3);

    if (!target) {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      mark(pDrop, false);
      return false;
    }
    target.click();
    await delay(150);
    mark(pDrop || trigger, true);
    return true;
  }

  // ── Row management ───────────────────────────────────────────────
  function getQualRows() {
    // Primary: <tr> elements that contain a qualificationTypeId dropdown
    const rows = Array.from(document.querySelectorAll('tr'))
      .filter(tr => tr.querySelector('[formcontrolname="qualificationTypeId"]'));
    if (rows.length > 0) return rows;
    // Fallback: any container element with qualificationTypeId
    return Array.from(document.querySelectorAll('[formcontrolname="qualificationTypeId"]'))
      .map(el => el.closest('[formgroupname], [ng-reflect-form-group-name], tr, div.row, li') || el.parentElement)
      .filter((el, i, arr) => el && arr.indexOf(el) === i);
  }

  async function ensureRows(needed) {
    let rows = getQualRows();
    while (rows.length < needed) {
      const addBtn = document.querySelector('.pi-plus')?.closest('button')
                  || document.querySelector('button[title*="add" i], button[title*="new" i]');
      if (!addBtn) break;
      addBtn.click();
      await delay(450);
      const next = getQualRows();
      if (next.length <= rows.length) break; // nothing added
      rows = next;
    }
    return getQualRows();
  }

  // ── Fill a single row ────────────────────────────────────────────
  async function fillRow(row, qualType, marks, total, pct, year, board, school, roll, isInter) {
    // 1. Qualification type (Matric / Intermediate) — may change dependent fields
    const qualOk = await fillDropdown(row, 'qualificationTypeId', qualType);
    if (qualOk) await delay(350); // wait for areaOfStudyId options to update

    // 2. Area of study
    await fillDropdown(row, 'areaOfStudyId', areaOfStudy(isInter));

    // 3. Mode of study — Regular Full Time
    await fillDropdown(row, 'modeOfStudyId', 'Regular Full Time');

    // 4. Marks
    fillInputNumber(row, 'totalMarks', total);
    fillInputNumber(row, 'obtainMarks', marks);

    // 5. Division (calculated from percentage)
    const div = calcDivision(pct);
    if (div) await fillDropdown(row, 'division', div);

    // 6. Roll number
    fillPlainInput(row, 'rollNumber', roll);

    // 7. Result pending — No (result is complete/declared)
    await fillDropdown(row, 'resultPending', 'No');

    // 8. Country — Pakistan (triggers instituteId reload)
    const countryOk = await fillDropdown(row, 'countryId', 'Pakistan');
    if (countryOk) await delay(500); // wait for board list to load

    // 9. Board / University
    await fillDropdown(row, 'instituteId', board);

    // 10. School / Campus
    fillPlainInput(row, 'institute', school);

    // 11. Year of completion
    fillInputNumber(row, 'yearOfCompletion', year);

    console.log(`[UET Taxila Qual] Filled ${qualType} row`);
  }

  // ── Execute ──────────────────────────────────────────────────────
  const needed = addInterRow ? 2 : 1;
  const rows = await ensureRows(needed);
  if (rows.length === 0) {
    console.warn('[UET Taxila Qual] No qualification rows found');
    return;
  }

  // Row 0: Matric / O-Level
  await fillRow(rows[0], 'Matric', r0Marks, r0Total, r0Pct, r0Year, r0Board, r0School, r0Roll, false);

  // Row 1: Intermediate / A-Level (only if complete)
  if (addInterRow && rows.length >= 2) {
    await fillRow(rows[1], 'Intermediate', r1Marks, r1Total, r1Pct, r1Year, r1Board, r1School, r1Roll, true);
  } else if (addInterRow) {
    console.warn('[UET Taxila Qual] Intermediate row needed but could not be added');
  }

  console.log('[UET Taxila Qual] Qualification section fill complete');
}

// ─── SPECIAL: Bahria University CMS Profile.aspx ─────────────────────────────
// Profile.aspx uses ASP.NET WebForms with full-page postbacks for Province →
// District → Tehsil cascade. We persist fill state in sessionStorage across
// page reloads so the fill continues automatically each postback phase.

function isBahriaProfilePage() {
  return window.location.hostname.includes('cms.bahria.edu.pk') &&
    /profile\.aspx/i.test(window.location.pathname);
}

function isBahriaApplyProgramPage() {
  return window.location.hostname.includes('cms.bahria.edu.pk') &&
    /ApplyProgram\.aspx/i.test(window.location.pathname);
}

/**
 * fillBahriaApplyProgramPage — fills the Pre-Requisite Qualification section
 * on cms.bahria.edu.pk/Sys/Candidate/ApplyProgram.aspx.
 *
 * All three postbacks on this page are UpdatePanel AJAX (no full page reload).
 * We hook into Sys.WebForms.PageRequestManager.add_endRequest so every DOM
 * update is fully settled before we touch the next dependent field.
 *
 * Postback sequence:
 *  1. Select Pre-Req Qualification  → Status dropdown appears
 *  2. Select Result Status          → Academic Record table renders
 *  3. Select Row 0 Degree           → Subjects field type changes (select ↔ input)
 *  4. Fill all remaining text fields
 */
/**
 * fillBahriaApplyProgramPage — multi-phase fill for ApplyProgram.aspx.
 *
 * The Row 0 Degree dropdown fires a full ASP.NET __doPostBack (page reload),
 * wiping all in-memory state. We use sessionStorage to survive the reload:
 *
 *   Phase 0  Fresh run: Steps 1-2 (UpdatePanel safe), save state, fire degree
 *            change (may reload).
 *   Phase 1  First resume after reload: redo Steps 1-2, try degree change again
 *            (saves phase 2 in case it also reloads).
 *   Phase 2  Second resume: redo Steps 1-2, set degree VALUE ONLY (no event —
 *            prevents infinite reload loop), fill all text fields.
 *
 * If Step 3 uses UpdatePanel (not full postback), we never leave Phase 0 and
 * sessionStorage is cleared immediately after the await resolves.
 */
async function fillBahriaApplyProgramPage(profile, onFilled, onManual) {
  // Guard: MutationObserver suppressed for entire fill sequence
  window.__unimatch = window.__unimatch || {};
  window.__unimatch._bahriaApplyFilling = true;

  const delay = ms => new Promise(r => setTimeout(r, ms));
  const PREFIX = 'BodyPH_repeaterAcademicRecords_ucAcademicRecord_';

  // ── Helpers ────────────────────────────────────────────────────
  function byId(id) { return document.getElementById(id); }

  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }

  function fillText(id, value) {
    const el = byId(id);
    if (!el || value == null || value === '') return false;
    setNativeValue(el, String(value));
    onFilled(el);
    return true;
  }

  function bestSelectOption(sel, text) {
    if (!text) return null;
    const t = String(text).trim().toLowerCase();
    return Array.from(sel.options).find(o => o.value.toLowerCase() === t)
        || Array.from(sel.options).find(o => o.text.trim().toLowerCase() === t)
        || Array.from(sel.options).find(o => o.text.trim().toLowerCase().includes(t) && t.length >= 3)
        || Array.from(sel.options).find(o => t.includes(o.text.trim().toLowerCase()) && o.text.trim().length >= 3)
        || null;
  }

  function waitForUpdatePanel(maxWaitMs = 5000) {
    return new Promise(resolve => {
      let done = false;
      const timeout = setTimeout(() => { if (!done) { done = true; resolve(); } }, maxWaitMs);
      try {
        const prm = window.Sys?.WebForms?.PageRequestManager?.getInstance?.();
        if (!prm) { clearTimeout(timeout); resolve(); return; }
        const handler = () => {
          if (done) return;
          done = true;
          clearTimeout(timeout);
          prm.remove_endRequest(handler);
          resolve();
        };
        prm.add_endRequest(handler);
      } catch {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  async function setSelectAndWait(id, value, maxWaitMs = 6000) {
    const sel = byId(id);
    if (!sel) return false;
    const opt = bestSelectOption(sel, value);
    if (!opt) return false;
    const waitPromise = waitForUpdatePanel(maxWaitMs);
    sel.value = opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    onFilled(sel);
    await waitPromise;
    await delay(200);
    return true;
  }

  // Fill all text/dropdown fields for both rows from a state object.
  function fillAllRows(s) {
    // Row 0 subjects: O-Level = free-text input, SSC = dropdown
    if (s.row0IsOLevel) {
      fillText(`${PREFIX}0_tbSubjects_0`, s.row0Subjects);
    } else {
      const subSel = byId(`${PREFIX}0_ddlSubjects_0`);
      if (subSel) {
        const subOpt = bestSelectOption(subSel, s.row0Subjects) || bestSelectOption(subSel, 'SCIENCE');
        if (subOpt) { subSel.value = subOpt.value; onFilled(subSel); }
      }
    }
    fillText(`${PREFIX}0_tbObtainedMarks_0`, s.row0Marks);
    fillText(`${PREFIX}0_tbTotalMarks_0`,    s.row0Total);
    fillText(`${PREFIX}0_tbPercentage_0`,    s.row0Pct);
    fillText(`${PREFIX}0_tbInstitute_0`,     s.row0School);
    fillText(`${PREFIX}0_tbBoardUniversity_0`, s.row0Board);
    fillText(`${PREFIX}0_tbPassingYear_0`,   s.row0Year);

    // Row 1 degree (no postback — just set value)
    const row1DegreeSel = byId(`${PREFIX}1_ddlDegreeType_1`);
    if (row1DegreeSel) {
      const dOpt = Array.from(row1DegreeSel.options).find(o => o.value === s.row1DegreeVal)
                || Array.from(row1DegreeSel.options).find(o => o.value !== '');
      if (dOpt) { row1DegreeSel.value = dOpt.value; onFilled(row1DegreeSel); }
    }
    fillText(`${PREFIX}1_tbSubjects_1`,        s.row1Subjects);
    fillText(`${PREFIX}1_tbObtainedMarks_1`,   s.row1Marks);
    fillText(`${PREFIX}1_tbTotalMarks_1`,      s.row1Total);
    fillText(`${PREFIX}1_tbPercentage_1`,      s.row1Pct);
    fillText(`${PREFIX}1_tbInstitute_1`,       s.row1School);
    fillText(`${PREFIX}1_tbBoardUniversity_1`, s.row1Board);
    fillText(`${PREFIX}1_tbPassingYear_1`,     s.row1Year);

    console.log('[Bahria ApplyProgram] All rows filled');
  }

  // ── Phase resume: reloaded after degree postback ────────────────
  const resumeState = (() => {
    try { return JSON.parse(sessionStorage.getItem(BAHRIA_APPLY_FILL_KEY) || 'null'); }
    catch { return null; }
  })();

  if (resumeState) {
    sessionStorage.removeItem(BAHRIA_APPLY_FILL_KEY);
    console.log(`[Bahria ApplyProgram] Resume phase ${resumeState.phase}`);
    try {
      // Full postback wiped Steps 1-2 — redo them (UpdatePanel, safe)
      await setSelectAndWait('BodyPH_ddlPreReqQualification', resumeState.preReqQual);
      await setSelectAndWait('BodyPH_ddlAdmissionCriteriaPreReqID', resumeState.resultStatusValue);

      if (resumeState.phase < 2) {
        // Phase 1: attempt degree change again; save phase 2 guard in case it reloads
        sessionStorage.setItem(BAHRIA_APPLY_FILL_KEY, JSON.stringify({ ...resumeState, phase: 2 }));
        const degOk = await setSelectAndWait(`${PREFIX}0_ddlDegreeType_0`, resumeState.row0DegreeVal);
        // If we reach this line: no full postback happened — clear guard and fill
        sessionStorage.removeItem(BAHRIA_APPLY_FILL_KEY);
        if (!degOk) console.warn('[Bahria ApplyProgram] Phase 1: Row 0 degree not found, filling anyway');
        fillAllRows(resumeState);
      } else {
        // Phase 2: degree change keeps reloading — set value only, no event
        console.log('[Bahria ApplyProgram] Phase 2: setting degree value without postback');
        const degSel = byId(`${PREFIX}0_ddlDegreeType_0`);
        if (degSel) {
          const dOpt = Array.from(degSel.options).find(o => o.value === resumeState.row0DegreeVal)
                    || Array.from(degSel.options).find(o => o.value !== '');
          if (dOpt) { degSel.value = dOpt.value; onFilled(degSel); }
        }
        fillAllRows(resumeState);
      }
    } finally {
      window.__unimatch._bahriaApplyFilling = false;
    }
    return;
  }

  // ── Phase 0: fresh start ────────────────────────────────────────
  try {
    const eduSystem = (profile.education_system || '').toLowerCase();
    const preReqQual = (eduSystem === 'cambridge') ? 'A-LEVEL' : 'HSSC';

    const alevelComplete = (profile.alevel_status === 'complete') || (profile.inter_status === 'complete');
    const currentYear = new Date().getFullYear();
    const interYear   = parseInt(profile.fsc_year || profile.alevel_year || 0);
    const hsscPartial = profile.inter_status === 'appearing' || (interYear > currentYear);
    const isPartial   = preReqQual === 'A-LEVEL' ? !alevelComplete : hsscPartial;

    const resultStatusValue = preReqQual === 'A-LEVEL'
      ? (alevelComplete ? '1089' : '1090')   // COMPLETE AVAILABLE : NOT AVAILABLE
      : (hsscPartial    ? '1094' : '1093');   // PARTIAL : COMPLETE AVAILABLE

    const row0IsOLevel = (eduSystem === 'cambridge');

    function getRow0DegreeValue() {
      if (preReqQual === 'A-LEVEL')
        return row0IsOLevel ? (isPartial ? '3801' : '3799') : (isPartial ? '3800' : '3798');
      if (isPartial) return row0IsOLevel ? '3814' : '3813';
      return row0IsOLevel ? '3811' : '3810';
    }

    // Snapshot all fill data before any postback — these survive in sessionStorage
    const fillState = {
      preReqQual,
      resultStatusValue,
      row0DegreeVal : getRow0DegreeValue(),
      row0IsOLevel,
      // Row 0: O-Level / SSC data — use IBCC O-Level marks for Cambridge students
      row0Marks   : profile.ibcc_olevel_marks ?? profile.matric_marks,
      row0Total   : profile.ibcc_olevel_total ?? profile.matric_total,
      row0Pct     : (() => {
        const m = profile.ibcc_olevel_marks ?? profile.matric_marks;
        const t = profile.ibcc_olevel_total ?? profile.matric_total;
        if (m && t) return parseFloat(((m / t) * 100).toFixed(2));
        return profile.ibcc_equivalent_matric ?? profile.matric_percentage;
      })(),
      row0Year    : profile.olevel_year    ?? profile.matric_year,
      row0Board   : profile.olevel_board   ?? profile.matric_board  ?? profile.board_name ?? '',
      row0School  : profile.olevel_school  ?? profile.matric_school ?? profile.school_name ?? '',
      row0Subjects: row0IsOLevel
        ? (Array.isArray(profile.olevel_subjects)
            ? profile.olevel_subjects.map(s => `${s.subject} (${s.grade})`).join(', ')
            : (profile.olevel_subjects || ''))
        : 'SCIENCE',
      // Row 1: A-Level / HSSC data — use IBCC A-Level marks for Cambridge students
      row1DegreeVal: preReqQual === 'A-LEVEL'
        ? '3802'
        : (isPartial ? '3815' : '3812'),
      row1Marks   : profile.ibcc_alevel_marks ?? profile.fsc_marks,
      row1Total   : profile.ibcc_alevel_total ?? profile.fsc_total,
      row1Pct     : (() => {
        const m = profile.ibcc_alevel_marks ?? profile.fsc_marks;
        const t = profile.ibcc_alevel_total ?? profile.fsc_total;
        if (m && t) return parseFloat(((m / t) * 100).toFixed(2));
        return profile.ibcc_equivalent_inter ?? profile.fsc_percentage;
      })(),
      row1Year    : profile.alevel_year  ?? profile.fsc_year,
      row1Board   : profile.alevel_board ?? profile.fsc_board  ?? profile.board_name ?? '',
      row1School  : profile.alevel_school ?? profile.fsc_school ?? profile.school_name ?? '',
      row1Subjects: preReqQual === 'A-LEVEL'
        ? (Array.isArray(profile.alevel_subjects)
            ? profile.alevel_subjects.map(s => `${s.subject} (${s.grade})`).join(', ')
            : (profile.alevel_subjects || ''))
        : (profile.fsc_stream || ''),
    };

    // Step 1: Pre-Req Qualification (UpdatePanel)
    console.log(`[Bahria ApplyProgram] Phase 0 Step 1: Pre-Req Qualification = ${preReqQual}`);
    const step1ok = await setSelectAndWait('BodyPH_ddlPreReqQualification', preReqQual);
    if (!step1ok) {
      console.warn('[Bahria ApplyProgram] Pre-Req Qualification select failed');
      return;
    }

    // Step 2: Result Status (UpdatePanel)
    console.log(`[Bahria ApplyProgram] Phase 0 Step 2: Result Status = ${resultStatusValue}`);
    const step2ok = await setSelectAndWait('BodyPH_ddlAdmissionCriteriaPreReqID', resultStatusValue);
    if (!step2ok) {
      console.warn('[Bahria ApplyProgram] Result Status select failed');
      return;
    }

    // Step 3: Row 0 Degree — may fire __doPostBack (full reload).
    // Save state BEFORE firing so Phase 1 can resume from sessionStorage.
    sessionStorage.setItem(BAHRIA_APPLY_FILL_KEY, JSON.stringify({ phase: 1, ...fillState }));
    console.log(`[Bahria ApplyProgram] Phase 0 Step 3: Row 0 Degree = ${fillState.row0DegreeVal}`);
    const step3ok = await setSelectAndWait(`${PREFIX}0_ddlDegreeType_0`, fillState.row0DegreeVal);

    // If we reach here: UpdatePanel fired (no full postback) — clear state, fill normally
    sessionStorage.removeItem(BAHRIA_APPLY_FILL_KEY);
    if (!step3ok) console.warn('[Bahria ApplyProgram] Row 0 Degree not found, filling anyway');
    fillAllRows(fillState);

  } finally {
    window.__unimatch._bahriaApplyFilling = false;
  }
}

function bahriaProvinceText(province) {
  const p = (province || '').toLowerCase().trim();
  if (p.includes('punjab')) return 'PUNJAB';
  if (p.includes('sindh')) return 'SINDH';
  if (p.includes('baloch')) return 'BALOCHISTAN';
  if (p.includes('kpk') || p.includes('khyber') || p.includes('pakhtun') || p.includes('pukhtun') || p.includes('nwfp')) return 'KHYBER-PAKHTUNKHWA';
  if (p.includes('islamabad') || p.includes('ict') || p.includes('federal')) return 'ISLAMABAD';
  if (p.includes('gilgit') || p.includes('gb') || p.includes('baltistan')) return 'GILGIT-BALTISTAN';
  if (p.includes('azad') || p.includes('kashmir') || p.includes('ajk')) return 'AZAD KASHMIR';
  if (p.includes('fata')) return 'FATA';
  return null;
}

async function fillBahriaProfilePage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const PREFIX = 'BodyPH_CandidateProfile_';

  function el(suffix) { return document.getElementById(PREFIX + suffix); }

  function setInputValue(input, value) {
    // Use the matching prototype setter — textarea and input have separate prototypes.
    // Calling HTMLInputElement.prototype.value.set on a textarea throws "Illegal invocation".
    const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(input, value); else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function fillInput(suffix, value) {
    const inp = el(suffix);
    if (!inp || value == null || value === '') return false;
    if (inp.readOnly) return false;
    setInputValue(inp, String(value));
    onFilled(inp);
    return true;
  }

  function bestOption(sel, text) {
    if (!text) return null;
    const t = String(text).trim().toLowerCase();
    let opt = Array.from(sel.options).find(o => o.value === text);
    if (!opt) opt = Array.from(sel.options).find(o => o.text.trim().toLowerCase() === t);
    if (!opt) opt = Array.from(sel.options).find(o => o.text.trim().toLowerCase().includes(t) && t.length >= 3);
    if (!opt) opt = Array.from(sel.options).find(o => t.includes(o.text.trim().toLowerCase()) && o.text.trim().length >= 3);
    return opt || null;
  }

  function fillSelect(suffix, value) {
    const sel = el(suffix);
    if (!sel || value == null || value === '') return false;
    const opt = bestOption(sel, value);
    if (!opt) { onManual(sel); return false; }
    sel.value = opt.value;
    // Do NOT fire onchange/dispatchEvent — ASP.NET AutoPostBack selects have
    // onchange set to __doPostBack which would prematurely submit the form.
    // Postbacks are triggered explicitly via aspnetPostback() only.
    onFilled(sel);
    return true;
  }

  function fillSelectByValue(suffix, numericValue) {
    const sel = el(suffix);
    if (!sel) return false;
    const opt = Array.from(sel.options).find(o => o.value === String(numericValue));
    if (!opt) { onManual(sel); return false; }
    sel.value = opt.value;
    onFilled(sel);
    return true;
  }

  function fillRadio(groupSuffix, value) {
    // Bahria radio IDs: BodyPH_CandidateProfile_rblGender_0, _1, _2 ...
    // Do NOT fire change/click events — ASP.NET AutoPostBack radios have
    // onclick="__doPostBack(...)" which would prematurely reload the page.
    // Setting .checked = true is sufficient; the value is submitted with the
    // next intentional form.submit() call (the Province postback).
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'))
      .filter(r => r.id.includes(PREFIX + groupSuffix) || r.name.includes('$' + groupSuffix));
    const target = radios.find(r => r.value === String(value));
    if (!target) { if (radios[0]) onManual(radios[0]); return false; }
    target.checked = true;
    onFilled(target);
    return true;
  }

  function formatCNIC(raw) {
    const digits = (raw || '').replace(/[^0-9]/g, '');
    if (digits.length === 13) return `${digits.slice(0,5)}-${digits.slice(5,12)}-${digits.slice(12)}`;
    return raw || '';
  }

  function formatDOB(raw) {
    if (!raw) return '';
    // Handle YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY — output MM/DD/YYYY
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
    const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      // Could be DD/MM or MM/DD — if first part > 12, it's DD/MM
      const a = parseInt(dmyMatch[1]), b = parseInt(dmyMatch[2]);
      if (a > 12) return `${String(b).padStart(2,'0')}/${String(a).padStart(2,'0')}/${dmyMatch[3]}`;
      return raw; // already MM/DD/YYYY or ambiguous, keep as-is
    }
    return raw;
  }

  // ── Read pending postback phase from sessionStorage ──────────────────────
  let state = null;
  try { state = JSON.parse(sessionStorage.getItem(BAHRIA_FILL_KEY) || 'null'); } catch(e) {}
  const phase = state?.phase ?? 0;
  console.log(`[Bahria Profile] Phase ${phase}`);

  // ── Reliable ASP.NET postback from content script ────────────────────────
  // Content scripts run in an isolated JS world — calling page-registered
  // sel.onchange() or radio.onclick() can silently fail. The only guaranteed
  // path is to set the hidden __EVENTTARGET/__EVENTARGUMENT fields and call
  // form.submit() directly — pure DOM manipulation, always works.
  async function aspnetPostback(controlName) {
    await delay(200);
    const evTarget = document.getElementById('__EVENTTARGET');
    const evArg    = document.getElementById('__EVENTARGUMENT');
    const form     = document.forms[0];
    if (!form) { console.warn('[Bahria] No form found for postback'); return; }
    if (evTarget) evTarget.value = controlName;
    if (evArg)    evArg.value = '';
    console.log(`[Bahria Profile] Submitting form for control: ${controlName}`);
    form.submit();
  }

  // ── Poll until a select has > minCount options (server populated it) ─────
  async function waitForOptions(suffix, minCount, maxWaitMs) {
    const end = Date.now() + maxWaitMs;
    while (Date.now() < end) {
      const s = el(suffix);
      if (s && s.options.length > minCount) return s;
      await delay(300);
    }
    return el(suffix);
  }

  // ── Father Alive value from profile.father_status ────────────────────────
  // DB column: father_status TEXT CHECK IN ('alive', 'deceased', 'shaheed')
  function fatherAliveValue() {
    const fs = (profile.father_status || '').toLowerCase().trim();
    if (fs === 'deceased' || fs === 'shaheed') return '2'; // No
    return '1'; // alive or not set → Yes
  }

  // ── fillStaticFields — fills all non-cascade fields ─────────────────────
  // Called at the start of EVERY phase because ASP.NET may reload field values
  // from the database on each postback, wiping whatever JS set before the submit.
  async function fillStaticFields() {
    fillInput('tbName', profile.full_name);
    fillInput('tbCNIC', formatCNIC(profile.cnic));
    fillInput('tbDOB', formatDOB(profile.date_of_birth));
    fillInput('tbMobile', profile.mobile || profile.phone);
    fillInput('tbPhoneHome', profile.phone || profile.mobile);

    const gdr = (profile.gender || '').toLowerCase();
    if (gdr === 'male' || gdr === 'm') fillRadio('rblGender', '1');
    else if (gdr === 'female' || gdr === 'f') fillRadio('rblGender', '2');

    fillRadio('rblCategory', '4'); // Others (civilian default)

    const bgMap = { 'AB-':'1','AB+':'2','A-':'3','A+':'4','B-':'5','B+':'6','O-':'7','O+':'8' };
    const bgKey = (profile.blood_group || '').trim().toUpperCase();
    if (bgMap[bgKey]) fillSelectByValue('ddlBloodGroup', bgMap[bgKey]);

    const rel = (profile.religion || 'Islam').toLowerCase();
    if (rel.includes('islam') || rel.includes('muslim')) fillSelect('ddlReligion', 'Islam');
    else if (rel.includes('christ')) fillSelect('ddlReligion', 'Christian');
    else if (rel.includes('hindu')) fillSelect('ddlReligion', 'Hindu');
    else fillSelect('ddlReligion', 'Islam');

    fillSelectByValue('ddlPhysicalDisability', '0');
    fillSelectByValue('ddlPakistanBarCouncilNo', '0');

    const area = (profile.area_type || '').toLowerCase();
    fillRadio('rblAreaType', area === 'rural' ? '2' : '1');

    const addr = profile.address || profile.current_address || '';
    fillInput('tbCurrentAddress', addr);
    const sameCb = el('cbSameAsCurrentAddress');
    if (sameCb && addr && !sameCb.checked) { sameCb.click(); await delay(100); }

    fillSelectByValue('ddlSourceOfInformation', '5');

    fillInput('tbNextOfKin', profile.father_name || profile.guardian_name || '');
    fillInput('tbNextOfKinRelationship', profile.father_name ? 'Father' : 'Guardian');

    fillInput('tbEmergencyContactName', profile.father_name || profile.guardian_name || '');
    fillInput('tbEmergencyMobile', profile.guardian_phone || profile.mobile || '');
    fillInput('tbEmergencyPhone', profile.guardian_phone || profile.phone || '');

    fillSelect('ddlNTNOrCNIC', 'CNIC');
    await delay(100);
    fillInput('tbNTNOrCNIC', formatCNIC(profile.father_cnic));
    fillInput('tbTaxPayerName', profile.father_name || profile.guardian_name || '');
    fillInput('tbTaxPayerRelationship', profile.father_name ? 'Father' : 'Guardian');

    fillInput('tbFatherName', profile.father_name || '');

    // Father details section (only visible after Province postback renders it,
    // but safe to call here on every phase — fillInput no-ops if field absent)
    fillInput('tbFatherCNIC', formatCNIC(profile.father_cnic));
    fillInput('tbFatherDesignation', profile.father_profession || profile.father_designation || '');
    fillInput('tbFatherMobile', profile.guardian_phone || '');
    fillSelectByValue('ddlSponsoredBy', '1');
    if (profile.annual_income) fillInput('tbAnnualIncome', String(profile.annual_income));

    // Father Alive radio — set .checked without firing events (no premature postback)
    const faVal = fatherAliveValue();
    fillRadio('rblFatherAlive', faVal);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 0 — Fill all static fields + set Father Alive radio (no postback) +
  //           select Province, then trigger Province postback. ASP.NET receives
  //           the Father Alive radio value in that same POST submission and
  //           renders the father details section in its response — saving one
  //           extra page reload vs triggering Father Alive postback separately.
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === 0) {
    await fillStaticFields();

    const faVal = fatherAliveValue();
    console.log(`[Bahria Profile] father_status="${profile.father_status}" → rblFatherAlive value=${faVal} (1=Yes, 2=No)`);

    await delay(150);

    // Province — set value only, trigger postback via form.submit()
    const provinceText = bahriaProvinceText(profile.province || profile.domicile_province || '');
    const districtVal  = profile.district || profile.domicile_district || profile.city || '';
    const tehsilVal    = profile.tehsil || '';
    const domicileVal  = profile.domicile || profile.domicile_district || profile.district || '';

    const pEl = el('ddlProvince');
    const pOpt = pEl && provinceText ? bestOption(pEl, provinceText) : null;
    if (pOpt) {
      pEl.value = pOpt.value;
      onFilled(pEl);
      sessionStorage.setItem(BAHRIA_FILL_KEY, JSON.stringify({
        phase: 1, district: districtVal, tehsil: tehsilVal, domicile: domicileVal
      }));
      console.log(`[Bahria Profile] Phase 0 → Province postback (${provinceText})`);
      await aspnetPostback('ctl00$BodyPH$CandidateProfile$ddlProvince');
      return;
    }

    // No province match — skip cascade, fill domicile and done
    if (pEl) onManual(pEl);
    if (domicileVal) fillSelect('ddlDomicile', domicileVal);
    sessionStorage.removeItem(BAHRIA_FILL_KEY);

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1 — After Province postback. District options are now server-populated.
  //           Father details section is rendered (ASP.NET saw FA radio in POST).
  //           Fill father details + Sponsor + Income, then select District and
  //           trigger District postback.
  // ──────────────────────────────────────────────────────────────────────────
  } else if (phase === 1) {
    const { district, tehsil, domicile } = state;

    // Re-fill all static fields (ASP.NET may have reloaded them from DB after postback)
    await fillStaticFields();
    await delay(200);

    // Wait for District options to be populated (server fills them after Province postback)
    const dEl = await waitForOptions('ddlDistrict', 1, 8000);
    if (dEl && district && dEl.options.length > 1) {
      const opt = bestOption(dEl, district);
      if (opt) {
        dEl.value = opt.value;
        onFilled(dEl);
        sessionStorage.setItem(BAHRIA_FILL_KEY, JSON.stringify({ phase: 2, tehsil, domicile }));
        console.log(`[Bahria Profile] Phase 1 → District postback (${district})`);
        await aspnetPostback('ctl00$BodyPH$CandidateProfile$ddlDistrict');
        return;
      }
      console.warn(`[Bahria Profile] District "${district}" not found in options`);
      onManual(dEl);
    } else if (dEl && dEl.options.length <= 1) {
      console.warn('[Bahria Profile] District options never loaded — skipping District postback');
      if (dEl) onManual(dEl);
    }
    if (domicile) fillSelect('ddlDomicile', domicile);
    sessionStorage.removeItem(BAHRIA_FILL_KEY);

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2 — After District postback. Tehsil options now populated.
  // ──────────────────────────────────────────────────────────────────────────
  } else if (phase === 2) {
    const { tehsil, domicile } = state;
    // Re-fill all static fields (ASP.NET may have reloaded them from DB after postback)
    await fillStaticFields();
    const tEl = await waitForOptions('ddlTehsil', 1, 8000);
    if (tEl && tehsil) {
      const opt = bestOption(tEl, tehsil);
      if (opt) {
        tEl.value = opt.value;
        onFilled(tEl);
        // Check if Tehsil also has AutoPostBack (onchange attribute contains doPostBack)
        const tehsilHasPostback = (tEl.getAttribute('onchange') || '').includes('doPostBack');
        if (tehsilHasPostback) {
          sessionStorage.setItem(BAHRIA_FILL_KEY, JSON.stringify({ phase: 3, domicile }));
          console.log(`[Bahria Profile] Phase 2 → Tehsil postback (${tehsil})`);
          await aspnetPostback('ctl00$BodyPH$CandidateProfile$ddlTehsil');
          return;
        }
      } else {
        onManual(tEl);
      }
    }
    if (domicile) fillSelect('ddlDomicile', domicile);
    sessionStorage.removeItem(BAHRIA_FILL_KEY);

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 — After Tehsil postback (only if Tehsil had AutoPostBack). Domicile.
  // ──────────────────────────────────────────────────────────────────────────
  } else if (phase === 3) {
    const { domicile } = state;
    // Re-fill all static fields (ASP.NET may have reloaded them from DB after postback)
    await fillStaticFields();
    if (domicile) fillSelect('ddlDomicile', domicile);
    sessionStorage.removeItem(BAHRIA_FILL_KEY);
  }

  console.log(`[Bahria Profile] Phase ${phase} complete`);
}

function isIBAEducationPage() {
  if (!window.location.hostname.includes('iba.edu.pk')) return false;
  // Detect by presence of education-specific IDs or page text landmarks
  return !!(
    document.querySelector('[id*="_school_address"]') ||
    (document.querySelector('[id*="matric"]') &&
      (document.querySelector('[id*="undergrad"]') || document.body.innerText.includes('Not Applicable To Me')))
  );
}

async function fillIBAEducationPage(profile, onFilled, onManual) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const nativeSelectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;

  function markGreen(el) {
    el.style.outline = '2px solid #4ade80';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-filled');
    el.classList.remove('unimatch-manual');
  }
  function markAmber(el) {
    el.style.outline = '2px solid #fbbf24';
    el.style.outlineOffset = '2px';
    el.classList.add('unimatch-manual');
  }

  async function doFillSelect(el, value) {
    if (!el || value == null || value === '') return false;
    const ok = fillSelect(el, String(value));
    if (ok) {
      if (nativeSelectSetter) nativeSelectSetter.call(el, el.value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      markGreen(el);
      onFilled?.(el);
      await delay(300);
      return true;
    }
    markAmber(el);
    onManual?.(el);
    return false;
  }

  async function doFillInput(el, value) {
    if (!el || value == null || value === '') return false;
    const ok = await fillInput(el, String(value));
    if (ok) { markGreen(el); onFilled?.(el); await delay(200); return true; }
    markAmber(el); onManual?.(el);
    return false;
  }

  async function doFillTypeahead(container, value) {
    if (!container || !value) return false;
    const ok = await fillTypeahead(container, value);
    if (ok) { markGreen(container); onFilled?.(container); return true; }
    markAmber(container); onManual?.(container);
    return false;
  }

  async function tickNotApplicable(section) {
    if (!section) return false;
    const allCheckboxes = Array.from(section.querySelectorAll('input[type="checkbox"]'));
    for (const cb of allCheckboxes) {
      // Look for associated label text
      const labelEl = cb.closest('label') ||
        document.querySelector(`label[for="${cb.id}"]`) ||
        cb.parentElement;
      const labelText = (labelEl?.textContent || '').toLowerCase();
      // Also check sibling text nodes
      const sibText = Array.from(cb.parentElement?.childNodes || [])
        .map(n => n.textContent || '').join(' ').toLowerCase();
      if (labelText.includes('not applicable') || sibText.includes('not applicable')) {
        if (!cb.checked) { cb.click(); await delay(300); }
        markGreen(cb);
        onFilled?.(cb);
        return true;
      }
    }
    return false;
  }

  // Find a section container by heading keywords; returns { heading, container } or null
  function findSection(keywords) {
    const kws = (Array.isArray(keywords) ? keywords : [keywords]).map(k => k.toLowerCase());
    const headingSelectors = 'h1,h2,h3,h4,h5,h6,.card-title,.panel-title,.section-title,.section-heading,legend,.form-section-header,[class*="section-header"]';
    for (const h of document.querySelectorAll(headingSelectors)) {
      const ht = h.textContent.toLowerCase().trim();
      if (!kws.some(k => ht.includes(k))) continue;
      // Walk up to find the enclosing container that holds form fields
      let el = h.parentElement;
      for (let i = 0; i < 6 && el && el !== document.body; i++, el = el.parentElement) {
        if (el.querySelectorAll('input,select,.typeahead').length > 0) return { heading: h, container: el };
      }
      // Try next siblings if no ancestor matches
      let sib = h.nextElementSibling;
      while (sib) {
        if (sib.querySelectorAll('input,select,.typeahead').length > 0) return { heading: h, container: sib };
        if (sib.querySelectorAll(headingSelectors).length > 0) break; // hit next section
        sib = sib.nextElementSibling;
      }
    }
    return null;
  }

  // Get SELECTs from a container, excluding any that are part of Google Places address inputs
  function sectionSelects(c) {
    return Array.from(c.querySelectorAll('select')).filter(s => {
      const key = (s.id + ' ' + (s.name || '')).toLowerCase();
      return !key.includes('school_address') && !key.includes('_address');
    });
  }

  // Get text/number inputs from a container, excluding Google Places address inputs
  function sectionInputs(c) {
    return Array.from(c.querySelectorAll('input[type="text"],input[type="number"],input:not([type])')).filter(i => {
      const key = (i.id + ' ' + (i.name || '')).toLowerCase();
      return !key.includes('school_address') && !key.includes('_address') &&
        !i.classList.contains('pac-target-input'); // Google Places class
    });
  }

  // Get typeahead containers from a section
  function sectionTypeaheads(c) {
    return Array.from(c.querySelectorAll('[class*="typeahead"][tabindex], .typeahead, div.typeahead'));
  }

  // ═══════════════════════════════════════════════════
  //  MATRIC / O-LEVEL SECTION
  // ═══════════════════════════════════════════════════
  const matricSec = findSection(['matric', 'secondary', 'o-level', 'o level', 'ssc']);
  if (matricSec) {
    console.log('[IlmSeUrooj] IBA Edu: Matric section found');
    const mc = matricSec.container;
    const sels = sectionSelects(mc);
    const ths = sectionTypeaheads(mc);
    const inps = sectionInputs(mc);

    // 1. Certificate / Degree type SELECT
    const certSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('cert') || id.includes('degree') || id.includes('type') ||
        Array.from(s.options).some(o => ['matric', 'o-level', 'ssc', 'secondary'].some(v => o.text.toLowerCase().includes(v)));
    }) || sels[0];
    const certVal = profile.education_system === 'cambridge' ? 'O-Level' : 'Matriculation';
    if (certSel) await doFillSelect(certSel, certVal);

    // 2. School name typeahead (1st typeahead in section)
    const schoolVal = profile.olevel_school || profile.matric_school;
    if (ths[0] && schoolVal) await doFillTypeahead(ths[0], schoolVal);

    // 3. Board typeahead (2nd typeahead in section)
    const boardVal = profile.education_system === 'cambridge'
      ? 'Cambridge' : (profile.olevel_board || profile.matric_board);
    if (ths[1] && boardVal) await doFillTypeahead(ths[1], boardVal);

    // 4. Passing year SELECT
    const yearSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('year') || id.includes('pass') ||
        Array.from(s.options).some(o => /^(19|20)\d\d$/.test((o.value || o.text).trim()));
    });
    const yearVal = profile.olevel_year || profile.matric_year;
    if (yearSel && yearVal) await doFillSelect(yearSel, String(yearVal));

    // 5. Obtained marks
    const obtInp = inps.find(i => {
      const id = i.id.toLowerCase(); return id.includes('obtain') || id.includes('marks') || id.includes('score');
    });
    if (obtInp && profile.matric_marks) await doFillInput(obtInp, profile.matric_marks);

    // 6. Total marks
    const totInp = inps.find(i => { const id = i.id.toLowerCase(); return id.includes('total') || id.includes('max'); });
    if (totInp && profile.matric_total) await doFillInput(totInp, profile.matric_total);

    // 7. Percentage
    const pctInp = inps.find(i => { const id = i.id.toLowerCase(); return id.includes('pct') || id.includes('percent') || id.includes('perc'); });
    const pctVal = profile.matric_percentage ||
      (profile.matric_marks && profile.matric_total
        ? ((profile.matric_marks / profile.matric_total) * 100).toFixed(2) : null);
    if (pctInp && pctVal) await doFillInput(pctInp, pctVal);
  }

  // ═══════════════════════════════════════════════════
  //  INTERMEDIATE / A-LEVEL SECTION
  // ═══════════════════════════════════════════════════
  const interSec = findSection(['intermediate', 'a-level', 'a level', 'hssc', 'higher secondary']);
  if (interSec) {
    console.log('[IlmSeUrooj] IBA Edu: Intermediate section found');
    const ic = interSec.container;
    const sels = sectionSelects(ic);
    const ths = sectionTypeaheads(ic);
    const inps = sectionInputs(ic);

    // 1. Certificate / Degree type SELECT
    const certSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('cert') || id.includes('degree') || id.includes('type') ||
        Array.from(s.options).some(o => ['intermediate', 'a-level', 'hssc', 'fsc', 'fa', 'ics'].some(v => o.text.toLowerCase().includes(v)));
    }) || sels[0];
    const certVal = profile.education_system === 'cambridge' ? 'A-Level' : 'Intermediate';
    if (certSel) await doFillSelect(certSel, certVal);

    // 2. School name typeahead
    const schoolVal = profile.alevel_school || profile.fsc_school;
    if (ths[0] && schoolVal) await doFillTypeahead(ths[0], schoolVal);

    // 3. Board typeahead
    const boardVal = profile.education_system === 'cambridge'
      ? 'Cambridge' : (profile.alevel_board || profile.fsc_board);
    if (ths[1] && boardVal) await doFillTypeahead(ths[1], boardVal);

    // 4. Result Status SELECT
    const statusSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('status') || id.includes('result') ||
        Array.from(s.options).some(o =>
          o.text.toLowerCase().includes('appearing') || o.text.toLowerCase().includes('result in hand'));
    });
    const statusVal = profileValueFor('inter_result_status', profile);
    if (statusSel && statusVal) await doFillSelect(statusSel, statusVal);

    // 5. Passing year SELECT
    const yearSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('year') || id.includes('pass') ||
        Array.from(s.options).some(o => /^(19|20)\d\d$/.test((o.value || o.text).trim()));
    });
    const yearVal = profile.alevel_year || profile.fsc_year || profile.inter_year;
    if (yearSel && yearVal) await doFillSelect(yearSel, String(yearVal));

    // 6. Discipline SELECT
    const discSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('discipline') || id.includes('stream') ||
        Array.from(s.options).some(o =>
          ['engineering', 'medical', 'science', 'commerce', 'arts', 'general'].some(v => o.text.toLowerCase().includes(v)));
    });
    const discVal = profileValueFor('inter_discipline', profile);
    if (discSel && discVal) await doFillSelect(discSel, discVal);

    // 7. Current Level SELECT
    const levelSel = sels.find(s => {
      const id = s.id.toLowerCase();
      return id.includes('level') || id.includes('current') ||
        Array.from(s.options).some(o =>
          o.text.toLowerCase().includes('first year') || o.text.toLowerCase().includes('a level') ||
          o.text.toLowerCase().includes('second year') || o.text.toLowerCase().includes('12 grade'));
    });
    const levelVal = profileValueFor('inter_current_level', profile);
    if (levelSel && levelVal) await doFillSelect(levelSel, levelVal);

    // 8. Obtained marks
    const obtInp = inps.find(i => {
      const id = i.id.toLowerCase(); return id.includes('obtain') || id.includes('marks') || id.includes('score');
    });
    const obtVal = profile.fsc_marks || profile.inter_marks;
    if (obtInp && obtVal) await doFillInput(obtInp, obtVal);

    // 9. Total marks
    const totInp = inps.find(i => { const id = i.id.toLowerCase(); return id.includes('total') || id.includes('max'); });
    const totVal = profile.fsc_total || profile.inter_total;
    if (totInp && totVal) await doFillInput(totInp, totVal);

    // 10. Percentage
    const pctInp = inps.find(i => { const id = i.id.toLowerCase(); return id.includes('pct') || id.includes('percent') || id.includes('perc'); });
    const pctVal = profile.fsc_percentage ||
      (obtVal && totVal ? ((obtVal / totVal) * 100).toFixed(2) : null);
    if (pctInp && pctVal) await doFillInput(pctInp, pctVal);
  }

  // ═══════════════════════════════════════════════════
  //  UNDERGRADUATE — tick "Not Applicable To Me"
  // ═══════════════════════════════════════════════════
  const ugSec = findSection(['undergraduate', 'bachelor', "bachelor's", 'b.s program', 'bs program', 'bachelors']);
  if (ugSec) {
    console.log('[IlmSeUrooj] IBA Edu: ticking Not Applicable for Undergraduate');
    await tickNotApplicable(ugSec.container);
  }

  // ═══════════════════════════════════════════════════
  //  GRADUATE — tick "Not Applicable To Me"
  // ═══════════════════════════════════════════════════
  const gradSec = findSection(['graduate', "master's", 'masters', 'm.s program', 'ms program', 'mba', 'post-graduate', 'postgraduate', 'phd', 'mphil']);
  if (gradSec && gradSec.container !== ugSec?.container) {
    console.log('[IlmSeUrooj] IBA Edu: ticking Not Applicable for Graduate');
    await tickNotApplicable(gradSec.container);
  }

  // ═══════════════════════════════════════════════════
  //  OTHER QUALIFICATION — tick "Not Applicable To Me"
  // ═══════════════════════════════════════════════════
  const otherSec = findSection(['other qualification', 'other education', 'other degree', 'other academic', 'any other', 'other (specify)']);
  if (otherSec && otherSec.container !== ugSec?.container && otherSec.container !== gradSec?.container) {
    console.log('[IlmSeUrooj] IBA Edu: ticking Not Applicable for Other');
    await tickNotApplicable(otherSec.container);
  }
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
  showScanLine(1500);
  const _fillStart = Date.now();

  try {
    let filledCount = 0;
    let manualCount = 0;
    let skippedCount = 0;
    let conflictCount = 0;
    const filledSelectors = [];
    const manualSelectors = [];
    const conflictList = [];
    const alreadyHandled = new Set();
    const filledProfileKeyOnce = new Set(); // tracks which profileKeys have been filled once
    const masterPassword = await getConsistentPassword();

    // When "Fill Remaining" is triggered, skip fields already filled this session.
    const fillRemainingOnly = !!ctx._fillRemainingOnly;

    // Animated progress bar
    const progressBar = buildProgressBar(contentEl);
    const totalFields = (fillRemainingOnly ? collectRemainingFields() : collectAllFields()).length || 1;
    let processedFields = 0;
    const tickProgress = () => {
      processedFields++;
      if (progressBar) progressBar.style.width = `${Math.min(100, (processedFields / totalFields) * 100)}%`;
    };

    // ─── SPECIAL: Bahria University ApplyProgram.aspx ───────────────────────
    // UpdatePanel AJAX page — all postbacks are partial (no page reload).
    // Fills Pre-Requisite Qualification section with cascading dropdown sequence.
    if (isBahriaApplyProgramPage()) {
      console.log('[IlmSeUrooj] Bahria ApplyProgram.aspx detected');
      await fillBahriaApplyProgramPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      return;
    }

    // ─── SPECIAL: Bahria University Profile.aspx ────────────────────────────
    // Multi-phase handler: Province → District → Tehsil use ASP.NET full-page
    // postbacks. Phase state is stored in sessionStorage and auto-resumed.
    if (isBahriaProfilePage()) {
      console.log('[IlmSeUrooj] Bahria Profile.aspx detected');
      // Phase 0 only: force a fresh profile fetch so sensitive fields like
      // father_status are never read from a stale 30-min cache.
      const pendingPhase = (() => { try { return JSON.parse(sessionStorage.getItem(BAHRIA_FILL_KEY) || 'null')?.phase ?? 0; } catch(e) { return 0; } })();
      if (pendingPhase === 0) {
        try {
          const fresh = await chrome.runtime.sendMessage({ action: 'REFRESH_PROFILE' });
          if (fresh?.profile) {
            ctx.profile = fresh.profile;
            window.__unimatch.profile = fresh.profile;
            console.log('[IlmSeUrooj] Bahria: fresh profile loaded, father_status =', fresh.profile.father_status);
          }
        } catch(e) { console.warn('[IlmSeUrooj] Bahria: profile refresh failed, using cached', e); }
      }
      await fillBahriaProfilePage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      // Only render filled state if we're not mid-postback (sessionStorage cleared = done)
      if (!sessionStorage.getItem(BAHRIA_FILL_KEY)) {
        renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      }
      return;
    }

    // ─── SPECIAL: UET Taxila — Qualification Table ───────────────────────────
    if (isUETTaxilaQualificationPage()) {
      console.log('[IlmSeUrooj] UET Taxila qualification page detected');
      await fillUETTaxilaQualificationPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      return;
    }

    // ─── SPECIAL: GIKI Education Pages ──────────────────────────────
    if (isGIKISSCPage()) {
      console.log('[IlmSeUrooj] GIKI SSC/O-Level page detected');
      await fillGIKISSCPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      return;
    }
    if (isGIKIHSSCPage()) {
      console.log('[IlmSeUrooj] GIKI HSSC/A-Level page detected');
      await fillGIKIHSSCPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      return;
    }

    // ─── SPECIAL: IBA Candidate Registration — Education Wizard Step ─
    // Fires when the user is on step 2 (accordion-1..5 visible). Must be checked
    // BEFORE the demographic handler since both pages share the same URL.
    if (isIBAEducationWizardPage()) {
      console.log('[IlmSeUrooj] IBA Education wizard step detected — running dedicated handler');
      // 3-minute hard cap — if the wizard hasn't finished by then, show what we have
      const wizardTimeout = new Promise(resolve => setTimeout(() => {
        console.warn('[IlmSeUrooj] IBA Edu Wizard: 3-minute timeout reached, forcing completion');
        resolve();
      }, 180000));
      await Promise.race([
        fillIBAEducationWizardPage(
          ctx.profile,
          (el) => { filledCount++; alreadyHandled.add(el); filledSelectors.push(el.id || el.name || 'iba-edu-wiz'); tickProgress(); },
          (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
        ),
        wizardTimeout
      ]);
      console.log(`[IlmSeUrooj] IBA Edu Wizard done: ${filledCount} filled, ${manualCount} manual`);
      renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
      return;
    }

    // ─── SPECIAL: IBA Candidate Registration — Demographic Step ─
    // Fires on Step 1 of the wizard. No id/name on inputs — heuristic engine
    // cannot match them, so we fill by index before any generic tier runs.
    if (isIBADemographicPage()) {
      console.log('[IlmSeUrooj] IBA Demographic step detected — running dedicated handler');
      await fillIBADemographicPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); filledSelectors.push(el.id || el.name || 'iba-demo'); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      console.log(`[IlmSeUrooj] IBA Demo handler done: ${filledCount} filled, ${manualCount} manual`);
    }

    // ─── SPECIAL: IBA Education Background Page ──────────────────
    // Runs before all tiers — dedicated sequential handler for the multi-section form.
    if (isIBAEducationPage()) {
      console.log('[IlmSeUrooj] IBA Education page detected — running dedicated handler');
      await fillIBAEducationPage(
        ctx.profile,
        (el) => { filledCount++; alreadyHandled.add(el); filledSelectors.push(el.id || el.name || 'iba-edu'); tickProgress(); },
        (el) => { manualCount++; alreadyHandled.add(el); tickProgress(); }
      );
      console.log(`[IlmSeUrooj] IBA Edu handler done: ${filledCount} filled, ${manualCount} manual`);
    }

    // ─── TIER 1: Deterministic per-university config ───────────
    // Uses verified CSS selectors from extension/universities/index.js
    const hostname = window.location.hostname;
    const uniConfig = (typeof getConfigForDomain === 'function') ? getConfigForDomain(hostname) : null;

    // Select the right field map based on current page type
    let tier1FieldMap = uniConfig?.fieldMap;
    if (uniConfig) {
      const pt = detectPageType();
      if (pt === 'login' && uniConfig.loginFieldMap) tier1FieldMap = uniConfig.loginFieldMap;
      else if (pt === 'register' && uniConfig.registerFieldMap) tier1FieldMap = uniConfig.registerFieldMap;
    }

    if (uniConfig && tier1FieldMap) {
      console.log(`[IlmSeUrooj] ✅ Found config for ${uniConfig.name} (${uniConfig.slug})`);
      console.log(`[IlmSeUrooj] Form type: ${uniConfig.formType}, Verified: ${uniConfig.verified}`);

      for (const [profileKey, selectorString] of Object.entries(tier1FieldMap)) {
        const els = tryMultiSelectorAll(selectorString);

        if (els.length === 0) {
          skippedCount++;
          console.log(`[IlmSeUrooj] ⏭ Skipped ${profileKey}: no element matched`);
          continue;
        }

        for (const el of els) {
          // Safety: skip non-form elements (avoids "Illegal invocation" from fillInput on divs/spans)
          const elTag = el.tagName;
          if (elTag !== 'INPUT' && elTag !== 'SELECT' && elTag !== 'TEXTAREA') continue;
          tickProgress();
          // Resolve value — use profileValueFor helper for computed/derived keys
          let rawValue;
          if (profileKey === 'portal_password') {
            rawValue = masterPassword;
          } else if (profileKey === 'portal_username') {
            rawValue = generatePortalUsername(ctx.profile);
          } else if (profileKey === 'portal_email') {
            rawValue = ctx.profile?.portal_email || ctx.profile?.email;
          } else if (profileKey === 'confirm_email') {
            rawValue = ctx.profile?.portal_email || ctx.profile?.email;
          } else {
            rawValue = profileValueFor(profileKey, ctx.profile) ?? ctx.profile?.[profileKey];
          }

          alreadyHandled.add(el);

          // Redirect duplicate phone fills to guardian_phone (e.g. "Alternate Number" field)
          let effectiveKey = profileKey;
          if (profileKey === 'phone' && filledProfileKeyOnce.has('phone')) {
            effectiveKey = 'guardian_phone';
            rawValue = profileValueFor('guardian_phone', ctx.profile) ?? ctx.profile?.['guardian_phone'];
          }

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
            // Use enhanced fillRadio (handles aliases for education_system, gender, status etc.)
            filled = fillRadio(el, String(value));
          } else if (profileKey === 'date_of_birth') {
            filled = await fillDateAdvanced(el, String(value));
          } else {
            filled = await fillInput(el, String(value));
          }

          if (filled) {
            await new Promise(r => setTimeout(r, 150));
            const verified = verifyFilledField(el, value, effectiveKey);
            if (verified) {
              el.style.outline = '2px solid #4ade80';
              el.style.outlineOffset = '2px';
              el.classList.add('unimatch-filled');
              el.classList.remove('unimatch-manual');
              filledCount++;
              filledProfileKeyOnce.add(effectiveKey);
              filledSelectors.push(selectorString);
            } else {
              el.style.outline = '2px solid #fbbf24';
              el.style.outlineOffset = '2px';
              el.classList.remove('unimatch-filled');
              el.classList.add('unimatch-manual');
              manualCount++;
              manualSelectors.push(selectorString);
              console.warn(`[IlmSeUrooj] TIER 1 verify failed: "${effectiveKey}" on ${el.id || el.name || el.tagName}`);
            }
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
        if (fillRemainingOnly && el.classList.contains('unimatch-filled')) continue;
        alreadyHandled.add(el);

        let value = profileValueFor(field.profileKey, ctx.profile) ?? ctx.profile[field.profileKey];

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

    // ─── TIER 2.5: Explicit three-part date group scan ─────────
    // Guaranteed fill for .date-group containers regardless of name heuristics
    if (ctx.profile.date_of_birth) {
      const dDate = new Date(ctx.profile.date_of_birth + 'T00:00:00');
      if (!isNaN(dDate.getTime())) {
        const dobDay = dDate.getDate(), dobMonth = dDate.getMonth() + 1, dobYear = dDate.getFullYear();

        // A. CSS class-based containers (modern forms)
        const dateGrps = document.querySelectorAll(
          '.date-group, .dob-group, [class*="date-group"], [class*="dob-group"],' +
          '[class*="date-field"], [class*="dob-field"], [class*="birth-date"]'
        );
        for (const grp of dateGrps) {
          const grpSelects = Array.from(grp.querySelectorAll('select')).filter(s => !alreadyHandled.has(s));
          if (grpSelects.length >= 2) {
            const grpFilled = await tryThreePartSelects(grp, dobDay, dobMonth, dobYear);
            if (grpFilled) {
              grpSelects.forEach(s => {
                alreadyHandled.add(s);
                s.style.outline = '2px solid #4ade80';
                s.style.outlineOffset = '2px';
                s.classList.add('unimatch-filled');
                sparkleField(s);
              });
              filledCount += grpSelects.length;
            }
          }
        }

        // B. Table row scan — covers ASP.NET WebForms like NUST
        // Finds any <tr> whose cells have a DOB label and contains 2+ selects
        const DOB_LABEL_PATTERN = /date.*birth|d[\s.]?o[\s.]?b|birth.*date|تاریخ.*پیدائش/i;
        for (const tr of document.querySelectorAll('tr')) {
          // Skip if DOB selects in this row are already handled
          const trSelects = Array.from(tr.querySelectorAll('select')).filter(s => !alreadyHandled.has(s));
          if (trSelects.length < 2) continue;
          // Check if any cell in this row carries a DOB label
          const hasDOBLabel = Array.from(tr.children).some(cell => {
            const t = cell.textContent;
            return DOB_LABEL_PATTERN.test(t) && !cell.querySelector('input, select, textarea');
          });
          if (!hasDOBLabel) continue;
          const trFilled = await tryThreePartSelects(tr, dobDay, dobMonth, dobYear);
          if (trFilled) {
            trSelects.forEach(s => {
              alreadyHandled.add(s);
              s.style.outline = '2px solid #4ade80';
              s.style.outlineOffset = '2px';
              s.classList.add('unimatch-filled');
              sparkleField(s);
            });
            filledCount += trSelects.length;
          }
        }
      }
    }

    // ─── TIER 2.6: Split phone group scan ─────────────────────
    // Detects table rows / containers where a phone label is adjacent to 2-3 short inputs
    // (country code + area code + local number pattern used by ASP.NET portals)
    if (ctx.profile.phone) {
      const phoneStr = String(ctx.profile.phone || '').replace(/\D/g, '');
      if (phoneStr.length >= 7) {
        // Compute split parts
        let countryCode = '+92', areaCode = '', localNum = '';
        if (phoneStr.startsWith('92') && phoneStr.length >= 5) {
          areaCode = phoneStr.slice(2, 5);
          localNum = phoneStr.slice(5);
        } else if (phoneStr.startsWith('0') && phoneStr.length >= 4) {
          areaCode = phoneStr.slice(1, 4);
          localNum = phoneStr.slice(4);
        } else {
          areaCode = phoneStr.slice(0, 3);
          localNum = phoneStr.slice(3);
        }

        const PHONE_LABEL_PATTERN = /phone|mobile|cell|تele|mob|contact.*no|موبائل|فون/i;
        for (const tr of document.querySelectorAll('tr')) {
          const tInputs = Array.from(tr.querySelectorAll('input[type="text"], input[type="tel"], input:not([type])'))
            .filter(i => !alreadyHandled.has(i));
          if (tInputs.length < 2) continue;
          // Row must have a phone-related label cell
          const hasPhoneLabel = Array.from(tr.children).some(cell => {
            const t = cell.textContent;
            return PHONE_LABEL_PATTERN.test(t) && !cell.querySelector('input, select, textarea');
          });
          if (!hasPhoneLabel) continue;

          // Assign by maxlength or position
          // Typical pattern: [country_code(2-4)] [area(3-4)] [number(6-8)]
          // or just [area(4)] [number(7)]
          let ccInp = null, areaInp = null, numInp = null;
          for (const inp of tInputs) {
            const ml = inp.maxLength || 0;
            const sig = (inp.name + ' ' + inp.id).toLowerCase();
            if (!ccInp && (ml > 0 && ml <= 4 || /country|code|prefix|intl/.test(sig))) { ccInp = inp; continue; }
            if (!areaInp && (ml > 0 && ml <= 5 || /area|exchange|operator|network/.test(sig))) { areaInp = inp; continue; }
            if (!numInp) { numInp = inp; }
          }
          // If only 2 inputs found, treat as area + number (no country code field)
          if (tInputs.length === 2 && !numInp) {
            areaInp = tInputs[0];
            numInp = tInputs[1];
            ccInp = null;
          }

          let phoneSplitFilled = false;
          if (ccInp) { const ok = await fillInput(ccInp, countryCode); if (ok) { alreadyHandled.add(ccInp); ccInp.style.outline = '2px solid #4ade80'; ccInp.classList.add('unimatch-filled'); sparkleField(ccInp); filledCount++; phoneSplitFilled = true; } }
          if (areaInp) { const ok = await fillInput(areaInp, areaCode); if (ok) { alreadyHandled.add(areaInp); areaInp.style.outline = '2px solid #4ade80'; areaInp.classList.add('unimatch-filled'); sparkleField(areaInp); filledCount++; phoneSplitFilled = true; } }
          if (numInp) { const ok = await fillInput(numInp, localNum); if (ok) { alreadyHandled.add(numInp); numInp.style.outline = '2px solid #4ade80'; numInp.classList.add('unimatch-filled'); sparkleField(numInp); filledCount++; phoneSplitFilled = true; } }
        }
      }
    }

    // ─── TIER 2.7: Education system radio-group scan ────────────
    // Detects radio groups whose OPTIONS contain FSc / O/A Level / DAE labels,
    // regardless of the group's name/id (handles unknown field names like NUST).
    if (ctx.profile?.education_system) {
      const eduVal = ctx.profile.education_system;
      // Collect all unique radio group names not yet handled
      const radioGroups = new Map(); // name → [radio, ...]
      for (const el of document.querySelectorAll('input[type="radio"]')) {
        if (alreadyHandled.has(el) || !el.name) continue;
        if (!radioGroups.has(el.name)) radioGroups.set(el.name, []);
        radioGroups.get(el.name).push(el);
      }
      for (const [, radios] of radioGroups) {
        // Check if any radio in this group has a label hinting at education system
        const allLabels = radios.map(r => {
          const lbl = r.labels?.[0]?.textContent || '';
          // Also check sibling label in same TD
          const cell = r.closest('td, li, span');
          const sibLbl = cell ? cell.textContent : '';
          return (lbl + ' ' + sibLbl).toLowerCase();
        });
        const EDU_LABEL_PAT = /fsc|f\.s\.c|intermediate|o\/a\s*level|o\s*&\s*a|a\s*level|olevel|alevel|dae|diploma.*engineer|hssc|matric/i;
        const looksLikeEduGroup = allLabels.some(l => EDU_LABEL_PAT.test(l));
        if (!looksLikeEduGroup) continue;
        // Fill using fillRadio on the first radio
        const filled = fillRadio(radios[0], eduVal);
        if (filled) {
          radios.forEach(r => {
            alreadyHandled.add(r);
            r.style.outline = '2px solid #4ade80';
            r.classList.add('unimatch-filled');
          });
          sparkleField(radios[0]);
          filledCount++;
          console.log(`[IlmSeUrooj] TIER 2.7 edu radio: ${eduVal}`);
        }
      }
    }

    // ─── TIER 2.8: Split CNIC/NIC group scan ──────────────────────
    // Detects table rows / containers where a CNIC label is adjacent to 2-3 short
    // inputs matching the 5+7+1 pattern used by ASP.NET portals (SZABIST, etc.).
    // Works for both student NIC and father NIC sections.
    if (ctx.profile.cnic) {
      const cnicParts = String(ctx.profile.cnic).split('-');
      if (cnicParts.length === 3) {
        const [cp1, cp2, cp3] = cnicParts;
        const CNIC_LABEL_PAT = /\bnic\b|cnic|national[\s_-]?id|identity[\s_-]?card|identity[\s_-]?no/i;
        for (const row of document.querySelectorAll('tr')) {
          const rowInputs = Array.from(row.querySelectorAll('input[type="text"], input:not([type])'))
            .filter(i => !alreadyHandled.has(i));
          if (rowInputs.length < 2 || rowInputs.length > 4) continue;
          const hasCNICLabel = CNIC_LABEL_PAT.test(row.textContent || '');
          if (!hasCNICLabel) continue;
          const inp5 = rowInputs.find(i => i.maxLength === 5);
          const inp7 = rowInputs.find(i => i.maxLength === 7);
          const inp1 = rowInputs.find(i => i.maxLength === 1);
          if (!inp5 || !inp7) continue; // Not a 5+7+1 pattern
          const isFatherRow = /father|guardian|parent/i.test(row.textContent || '');
          const fillVal1 = isFatherRow ? (ctx.profile.father_cnic || '').split('-')[0] || cp1 : cp1;
          const fillVal2 = isFatherRow ? (ctx.profile.father_cnic || '').split('-')[1] || cp2 : cp2;
          const fillVal3 = isFatherRow ? (ctx.profile.father_cnic || '').split('-')[2] || cp3 : cp3;
          if (!fillVal1 || !fillVal2) continue;
          for (const [inp, val] of [[inp5, fillVal1], [inp7, fillVal2], [inp1, fillVal3]]) {
            if (!inp || !val) continue;
            const ok = await fillInput(inp, val);
            if (ok) {
              inp.style.outline = '2px solid #4ade80';
              inp.style.outlineOffset = '2px';
              inp.classList.add('unimatch-filled');
              sparkleField(inp);
              filledCount++;
            }
            alreadyHandled.add(inp);
          }
        }
      }
    }

    // ─── TIER 3: Heuristic fallback for remaining fields ───────
    const allInputs = fillRemainingOnly ? collectRemainingFields() : collectAllFields();

    for (const input of allInputs) {
      if (alreadyHandled.has(input)) continue;
      if (fillRemainingOnly && input.classList.contains('unimatch-filled')) continue;
      tickProgress();

      // ── Credential fields: password, confirm-password, username/login ──────────────
      // These are excluded from generic heuristics but we handle them explicitly here.

      // Password fields — fill ALL password inputs (including confirm_password) with masterPassword
      if (input.type === 'password') {
        await fillInput(input, masterPassword);
        // Also fill any other password inputs in the same form (confirm password etc.)
        const pwForm = input.closest('form') || document;
        const pwConfirms = pwForm.querySelectorAll('input[type="password"]');
        if (pwConfirms.length > 1) {
          for (const cf of pwConfirms) {
            if (cf !== input) { await fillInput(cf, masterPassword); alreadyHandled.add(cf); sparkleField(cf); }
          }
        }
        input.style.outline = '2px solid #4ade80';
        input.style.outlineOffset = '2px';
        input.classList.add('unimatch-filled');
        sparkleField(input);
        filledCount++;
        alreadyHandled.add(input);
        continue;
      }

      // Username / Login ID / User ID fields — fill with CNIC (no dashes) or email prefix
      {
        const sig = buildFieldSignature(input);
        // Also apply ASP.NET prefix stripping to name/id so txtUserName, txtLoginId, etc. match
        const normName = normalizeSignal(input.name || '');
        const normId = normalizeSignal(input.id || '');
        const normSig = normName + ' ' + normId + ' ' + sig;

        const USERNAME_PATTERNS = [
          'username', 'user_name', 'login_id', 'user_id', 'loginid', 'userid',
          'applicant_id', 'student_id', 'reg_no', 'registration_no', 'login_name',
          'applicantid', 'studentid', 'regno', 'registrationno', 'loginname',
          'cnic_login', 'login_cnic', 'login_user', 'user_login',
          'account_id', 'accountid', 'account_no',
        ];
        const isUsernameField = USERNAME_PATTERNS.some(p => normSig.includes(p));

        if (isUsernameField) {
          const pt = detectPageType();
          const portalEmail = ctx.profile?.portal_email || ctx.profile?.email || '';

          // If the field's label/placeholder ALSO mentions "email", it's a "UserID (Email Address)"
          // style field — always fill with email, not full_name (email fields reject non-email values)
          const fieldLabelText = (() => {
            let lt = '';
            if (input.labels?.length) lt = input.labels[0].textContent || '';
            else if (input.id) { const lbl = document.querySelector(`label[for="${input.id}"]`); if (lbl) lt = lbl.textContent || ''; }
            if (!lt) {
              const cell = input.closest('td, th');
              if (cell) {
                const row = cell.parentElement;
                if (row) {
                  const cells = Array.from(row.children);
                  const myIdx = cells.indexOf(cell);
                  if (myIdx > 0 && !cells[myIdx - 1].querySelector('input, select, textarea')) lt = cells[myIdx - 1].textContent || '';
                }
              }
            }
            return lt.toLowerCase();
          })();
          const isEmailStyleUsername = fieldLabelText.includes('email') || fieldLabelText.includes('@')
            || input.type === 'email' || (input.getAttribute('placeholder') || '').toLowerCase().includes('email');

          let usernameValue;
          if (isEmailStyleUsername || pt === 'login') {
            // UserID (Email Address) style, or login page → always fill with email
            usernameValue = portalEmail;
          } else {
            // Register page, no email signal → use full name as display/account name
            usernameValue = ctx.profile?.full_name || portalEmail;
          }

          if (usernameValue) {
            await fillInput(input, usernameValue);
            input.style.outline = '2px solid #4ade80';
            input.style.outlineOffset = '2px';
            input.classList.add('unimatch-filled');
            sparkleField(input);
            filledCount++;
          } else {
            input.style.outline = '2px solid #fbbf24';
            input.style.outlineOffset = '2px';
            input.classList.add('unimatch-manual');
            manualCount++;
          }
          alreadyHandled.add(input);
          continue;
        }

        // Login email field — explicit email-login signals
        const LOGIN_EMAIL_PATTERNS = [
          'login_email', 'loginemail', 'sign_in_email', 'user_email', 'account_email',
          'signin_email', 'login_mail', 'loginmail',
        ];
        const isLoginEmailField = LOGIN_EMAIL_PATTERNS.some(p => normSig.includes(p))
          || (normSig.includes('login') && (input.type === 'email' || normSig.includes('email')));
        if (isLoginEmailField) {
          const emailValue = ctx.profile?.portal_email || ctx.profile?.email || '';
          if (emailValue) {
            await fillInput(input, emailValue);
            input.style.outline = '2px solid #4ade80';
            input.style.outlineOffset = '2px';
            input.classList.add('unimatch-filled');
            sparkleField(input);
            filledCount++;
          }
          alreadyHandled.add(input);
          continue;
        }
      }

      // Heuristic match
      const profileKey = matchFieldHeuristically(input);
      if (!profileKey) {
        if (input.required && !input.value) {
          input.style.outline = '2px solid #fbbf24';
          input.style.outlineOffset = '2px';
          input.classList.add('unimatch-manual');
          manualCount++;
        }
        alreadyHandled.add(input);
        continue;
      }

      // If this profileKey was already filled once, redirect phone → guardian_phone
      // so the second tel field (alternate number) gets the guardian number, not the student's.
      let resolvedKey = profileKey;
      if (profileKey === 'phone' && filledProfileKeyOnce.has('phone')) {
        resolvedKey = 'guardian_phone';
      }

      // Resolve value using profileValueFor helper
      let value = profileValueFor(resolvedKey, ctx.profile) ?? ctx.profile[resolvedKey];

      // Smart transforms — read field signals to determine exact format required
      value = applyFieldTransform(input, resolvedKey, value);
      if (profileKey === 'province' && (!value || value === '') && ctx.profile?.city) {
        value = CITY_TO_PROVINCE[String(ctx.profile.city).toLowerCase()] || '';
      }

      // Track conflicts (informational only — we still fill)
      if (input.value && input.value.trim() !== '' && value != null && value !== '') {
        const existNorm = String(input.value).toLowerCase().trim();
        const newNorm = String(value).toLowerCase().trim();
        if (existNorm !== newNorm) conflictCount++;
      }

      if (value == null || value === '') {
        // Debug: field was detected but profile has no value for it
        console.debug(`[IlmSeUrooj] Detected field "${profileKey}" (id="${input.id || ''}", name="${input.name || ''}") but profile.${profileKey} is empty — skipping.`);
        if (input.required && !input.value) {
          input.style.outline = '2px solid #fbbf24';
          input.style.outlineOffset = '2px';
          input.classList.add('unimatch-manual');
          manualCount++;
        }
        alreadyHandled.add(input);
        continue;
      }

      // Fill
      let filled = false;
      if (input.tagName === 'SELECT') {
        filled = fillSelect(input, String(value));
      } else if (input.tagName === 'DIV' &&
        (input.classList.contains('typeahead') || input.getAttribute('tabindex') !== null)) {
        filled = await fillTypeahead(input, String(value));
      } else if (resolvedKey === 'date_of_birth') {
        filled = await fillDateAdvanced(input, String(ctx.profile.date_of_birth));
      } else {
        filled = await fillInput(input, String(value));
      }

      if (filled) {
        // ── Post-fill verification ──────────────────────────────────────────
        // Wait for Angular/Vue/React to run their change detection cycle before
        // reading back. 150 ms covers debounceTime(100) validators and one
        // Angular tick. Slow AsyncValidators (network) are not waited for —
        // we only check presence/shape, not server-side validity.
        await new Promise(r => setTimeout(r, 150));
        const verified = verifyFilledField(input, value, resolvedKey);
        if (verified) {
          input.style.outline = '2px solid #4ade80';
          input.style.outlineOffset = '2px';
          input.classList.add('unimatch-filled');
          input.classList.remove('unimatch-conflict', 'unimatch-manual');
          sparkleField(input);
          playFillTone(filledCount, allInputs.length);
          filledCount++;
          filledProfileKeyOnce.add(resolvedKey);
          console.debug(`[IlmSeUrooj] ✓ verified: "${resolvedKey}" on ${input.id || input.name || input.tagName}`);
        } else {
          // Fill reported success but value didn't stick — mark amber
          input.style.outline = '2px solid #fbbf24';
          input.style.outlineOffset = '2px';
          input.classList.remove('unimatch-filled');
          input.classList.add('unimatch-manual');
          manualCount++;
          console.warn(`[IlmSeUrooj] ✗ verify failed: "${resolvedKey}" on ${input.id || input.name || input.tagName} — value may have been reset by framework`);
        }
      } else if (input.required && !input.value) {
        input.style.outline = '2px solid #fbbf24';
        input.style.outlineOffset = '2px';
        input.classList.add('unimatch-manual');
        manualCount++;
      }
      alreadyHandled.add(input);
    }

    // ─── TIER 4: AJAX-dependent dropdowns (e.g. District after Province) ───
    // After all fills, wait for any AJAX-loaded dependent selects to populate,
    // then retry filling them (district, tehsil, etc.)
    {
      const DEPENDENT_KEYS = ['district', 'tehsil', 'taluka', 'sub_district'];
      const DEPENDENT_LABEL = /district|tehsil|taluka|sub.?district/i;
      const hasDependentTargets = DEPENDENT_KEYS.some(k => profileValueFor(k, ctx.profile));
      if (hasDependentTargets) {
        await new Promise(r => setTimeout(r, 800));
        const allInputsT4 = collectAllFields();
        for (const input of allInputsT4) {
          if (input.tagName !== 'SELECT') continue;
          // Check if it looks like a district/tehsil field
          const sig = buildFieldSignature(input);
          if (!DEPENDENT_LABEL.test(sig) && !DEPENDENT_LABEL.test(input.name || '') && !DEPENDENT_LABEL.test(input.id || '')) continue;
          if (input.options.length <= 1) continue; // Still not loaded
          // Try to find the profile value (allow re-fill even if already handled, since options just loaded)
          const profileKey = matchFieldHeuristically(input);
          const pVal = profileKey ? profileValueFor(profileKey, ctx.profile) : null;
          const distVal = pVal || profileValueFor('district', ctx.profile) || profileValueFor('domicile_district', ctx.profile);
          if (!distVal) continue;
          const ok = fillSelect(input, distVal);
          if (ok) {
            await new Promise(r => setTimeout(r, 150));
            const verified = verifyFilledField(input, distVal, profileKey || 'district');
            if (verified) {
              alreadyHandled.add(input);
              input.style.outline = '2px solid #4ade80';
              input.classList.add('unimatch-filled');
              sparkleField(input);
              filledCount++;
              console.log(`[IlmSeUrooj] TIER 4 district fill verified: ${distVal}`);
            } else {
              input.style.outline = '2px solid #fbbf24';
              input.classList.add('unimatch-manual');
              manualCount++;
              console.warn(`[IlmSeUrooj] TIER 4 district verify failed: ${distVal}`);
            }
          }
        }
      }
    }

    // ─── TIER 5: Newly rendered fields (Angular *ngIf / Vue v-if) ────────────
    // After p-dropdown / select fills, frameworks re-render and may add fields
    // that weren't in the DOM when collectAllFields() ran (e.g. UET Taxila shows
    // CNIC + Mobile only after Gender and Residency are chosen).
    // One re-scan with a settle delay handles these without any university-specific code.
    {
      await new Promise(r => setTimeout(r, 400)); // let framework finish rendering
      const allInputsT5 = collectAllFields();
      const newInputs = allInputsT5.filter(el => !alreadyHandled.has(el));
      if (newInputs.length > 0) {
        console.log(`[IlmSeUrooj] TIER 5: ${newInputs.length} newly rendered field(s) found`);
        for (const input of newInputs) {
          if (input.type === 'password') continue;
          if (input.tagName === 'P-DROPDOWN') {
            const profileKey = matchFieldHeuristically(input);
            if (!profileKey) continue;
            const val = profileValueFor(profileKey, ctx.profile) ?? ctx.profile[profileKey];
            if (!val) continue;
            const ok = await fillPrimeNGDropdown(input, String(val));
            if (ok) {
              await new Promise(r => setTimeout(r, 150));
              const verified = verifyFilledField(input, val, profileKey);
              if (verified) {
                input.style.outline = '2px solid #4ade80'; input.classList.add('unimatch-filled'); sparkleField(input); filledCount++;
              } else {
                input.style.outline = '2px solid #fbbf24'; input.classList.add('unimatch-manual'); manualCount++;
              }
            }
            alreadyHandled.add(input);
            continue;
          }
          const profileKey = matchFieldHeuristically(input);
          if (!profileKey) continue;
          let val = profileValueFor(profileKey, ctx.profile) ?? ctx.profile[profileKey];
          if (val == null || val === '') continue;
          val = applyFieldTransform(input, profileKey, String(val));
          let ok = false;
          if (input.tagName === 'SELECT') {
            ok = fillSelect(input, val);
          } else if (profileKey === 'date_of_birth') {
            ok = await fillDateAdvanced(input, String(ctx.profile.date_of_birth));
          } else {
            ok = await fillInput(input, val);
          }
          if (ok) {
            await new Promise(r => setTimeout(r, 150));
            const verified = verifyFilledField(input, val, profileKey);
            if (verified) {
              input.style.outline = '2px solid #4ade80';
              input.style.outlineOffset = '2px';
              input.classList.add('unimatch-filled');
              sparkleField(input);
              filledCount++;
            } else {
              input.style.outline = '2px solid #fbbf24';
              input.style.outlineOffset = '2px';
              input.classList.add('unimatch-manual');
              manualCount++;
            }
          } else if (input.required) {
            input.style.outline = '2px solid #fbbf24';
            input.classList.add('unimatch-manual');
            manualCount++;
          }
          alreadyHandled.add(input);
        }
      }
    }

    // Update context
    ctx.filledFields = filledCount;
    ctx.manualFields = manualCount;
    ctx.conflictFields = conflictCount;
    ctx.filledSelectors = filledSelectors;
    ctx.manualSelectors = manualSelectors;
    ctx.generatedPassword = masterPassword;
    ctx.uniConfig = uniConfig;

    // Show results
    const _timeSaved = Math.round((Date.now() - _fillStart) / 1000 + filledCount * 3);
    if (filledCount > 0) {
      playSuccessFanfare();
      showAchievementToast(filledCount, manualCount, _timeSaved);
    }
    renderState(contentEl, 'filled', { filled: filledCount, manual: manualCount, conflicts: conflictCount });
    console.log(`[IlmSeUrooj] ✅ Autofill complete: ${filledCount} filled, ${manualCount} need input, ${conflictCount} conflicts`);

    // Report fill progress to dashboard (fire-and-forget)
    if (filledCount > 0 && ctx.university?.slug) {
      const fillPct = Math.round((filledCount / Math.max(filledCount + manualCount + skippedCount, 1)) * 100);
      chrome.runtime.sendMessage({
        type: 'REPORT_FILL_PROGRESS',
        slug: ctx.university.slug,
        fillPct,
        newStatus: 'form_filling',
      }).catch(() => { });
    }

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

// ─── Deadline / Calendar Detection ─────────────────────────────

const MONTH_MAP_DETECT = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
  april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
  august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};

function parseDetectedDate(str) {
  str = str.trim();
  let m;

  // DD-MM-YYYY or DD/MM/YYYY
  m = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) {
    const day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020) return { year, month, day };
  }

  // YYYY-MM-DD
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = parseInt(m[1]), month = parseInt(m[2]), day = parseInt(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020) return { year, month, day };
  }

  // DD Month YYYY or DD Mon YYYY (with optional ordinal)
  m = str.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})$/i);
  if (m) {
    const day = parseInt(m[1]), month = MONTH_MAP_DETECT[m[2].toLowerCase()], year = parseInt(m[3]);
    if (month && day >= 1 && day <= 31 && year >= 2020) return { year, month, day };
  }

  // Month DD, YYYY
  m = str.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i);
  if (m) {
    const month = MONTH_MAP_DETECT[m[1].toLowerCase()], day = parseInt(m[2]), year = parseInt(m[3]);
    if (month && day >= 1 && day <= 31 && year >= 2020) return { year, month, day };
  }

  return null;
}

function findDatesInText(text) {
  const results = [];
  const seen = new Set();
  const add = (d) => { if (!d) return; const k = `${d.year}-${d.month}-${d.day}`; if (!seen.has(k)) { seen.add(k); results.push(d); } };

  let m;

  // DD-MM-YYYY / DD/MM/YYYY
  const re1 = /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g;
  while ((m = re1.exec(text)) !== null) add(parseDetectedDate(m[0]));

  // YYYY-MM-DD
  const re2 = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((m = re2.exec(text)) !== null) add(parseDetectedDate(m[0]));

  // DD Month YYYY
  const re3 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi;
  while ((m = re3.exec(text)) !== null) add(parseDetectedDate(`${m[1]} ${m[2]} ${m[3]}`));

  // Month DD, YYYY
  const re4 = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi;
  while ((m = re4.exec(text)) !== null) add(parseDetectedDate(`${m[1]} ${m[2]} ${m[3]}`));

  // DD Mon YYYY (abbreviated month)
  const re5 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+(\d{4})\b/gi;
  while ((m = re5.exec(text)) !== null) add(parseDetectedDate(`${m[1]} ${m[2]} ${m[3]}`));

  return results;
}

function classifyDeadline(contextText) {
  const t = contextText.toLowerCase();

  // NET Series (Series I, Series 1, NET-Series II, etc.)
  let mm = t.match(/net\s*[-–]?\s*series\s*([ivxlc\d]+)/i) || t.match(/series\s*([ivx\d]+)/i);
  if (mm) return `NET Series ${romanOrNum(mm[1])}`;

  // Admission Rounds
  mm = t.match(/round\s*([ivx\d]+)/i);
  if (mm) return `Admission Round ${romanOrNum(mm[1])}`;

  if (/last\s*date|closing\s*date|deadline|apply\s*by|apply\s*before|application\s*due/.test(t)) return 'Application Deadline';
  if (/registration\s*open|open.*registration|start.*registration/.test(t)) return 'Registration Opens';
  if (/registration\s*clos|registration\s*last|close.*registration/.test(t)) return 'Registration Closes';
  if (/merit\s*list|final\s*merit|merit\s*announc|display.*merit/.test(t)) return 'Merit List';
  if (/entry\s*test|admission\s*test|test\s*date|test\s*schedul/.test(t)) return 'Entry Test';
  if (/interview/.test(t)) return 'Interview Date';
  if (/fee\s*deposit|fee\s*submission|fee\s*payment/.test(t)) return 'Fee Submission';
  if (/result\s*announc|result\s*declar|result\s*out/.test(t)) return 'Result Announcement';
  if (/class\s*comm|session\s*start|commencement/.test(t)) return 'Classes Commence';
  if (/document\s*verif/.test(t)) return 'Document Verification';

  return null;
}

function romanOrNum(s) {
  // Keep roman numerals uppercase, convert digit to ordinal label
  s = s.toUpperCase();
  if (/^[IVXLC]+$/.test(s)) return s;
  const n = parseInt(s);
  if (!isNaN(n)) return `${n}`;
  return s;
}

function makeGCalUrl(title, date, details) {
  const pad = (n) => String(n).padStart(2, '0');
  const d1 = `${date.year}${pad(date.month)}${pad(date.day)}`;
  const next = new Date(date.year, date.month - 1, date.day + 1);
  const d2 = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${d1}/${d2}`, details: details || title });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function formatDeadlineDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.day} ${months[d.month - 1]} ${d.year}`;
}

function daysUntil(d) {
  const target = new Date(d.year, d.month - 1, d.day);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/**
 * Scan the current page for admission-related dates (NET series, rounds, deadlines, etc.)
 */
function detectPageDeadlines() {
  const results = [];
  const seen = new Set();
  const add = (label, date, src) => {
    if (!label || !date) return;
    const k = `${label}|${date.year}-${date.month}-${date.day}`;
    if (!seen.has(k)) { seen.add(k); results.push({ label, date, src }); }
  };

  // ── Strategy 1: Tables ─────────────────────────────────────────
  // Uni portals often list schedules as: | Series | Open Date | Close Date |
  const tables = document.querySelectorAll('table');
  for (const table of tables) {
    // Get column headers from first row
    const headerRow = table.querySelector('thead tr, tr:first-child');
    const headers = headerRow
      ? Array.from(headerRow.querySelectorAll('th, td')).map(h => h.textContent.trim().toLowerCase())
      : [];

    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      if (row === headerRow) continue;
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (cells.length < 2) continue;

      const cellTexts = cells.map(c => c.textContent.trim());
      const rowText = cellTexts.join(' ');

      // Only process rows with admission-related keywords
      if (!/series|round|deadline|last\s*date|closing|registration|merit|entry\s*test|interview|result|fee|admission|schedule/i.test(rowText)) continue;

      // Identify which cells contain dates vs context
      const dateCols = []; // { idx, dates[] }
      const contextCols = [];

      cellTexts.forEach((txt, i) => {
        const dates = findDatesInText(txt);
        if (dates.length > 0) dateCols.push({ i, dates, header: headers[i] || '' });
        else if (txt.length > 2 && txt.length < 120) contextCols.push(txt);
      });

      if (dateCols.length === 0) continue;

      const contextText = contextCols.join(' ') + ' ' + rowText;
      const baseLabel = classifyDeadline(contextText) || contextCols[0] || cellTexts[0];

      if (dateCols.length === 1) {
        dateCols[0].dates.forEach(d => add(baseLabel, d, 'table'));
      } else {
        // Multiple date columns → label with column header
        dateCols.forEach(({ dates, header }) => {
          const colLabel = /open|start|from|begin/i.test(header) ? 'Opens'
            : /clos|end|last|due|deadline/i.test(header) ? 'Deadline'
              : header || '';
          const label = colLabel ? `${baseLabel} – ${colLabel}` : baseLabel;
          dates.forEach(d => add(label, d, 'table'));
        });
      }
    }
  }

  // ── Strategy 2: List items & paragraphs ───────────────────────
  const containers = document.querySelectorAll(
    'p, li, dt, dd, h2, h3, h4, h5, ' +
    '[class*="notice"], [class*="announce"], [class*="schedule"], [class*="deadline"], ' +
    '[class*="timeline"], [class*="admission"], [class*="alert"], [class*="info"]'
  );

  for (const el of containers) {
    if (el.closest('table')) continue; // already handled
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    const text = el.textContent.trim();
    if (text.length < 6 || text.length > 500) continue;

    const dates = findDatesInText(text);
    if (dates.length === 0) continue;

    if (!/series|round|deadline|last\s*date|closing|registration|merit|entry\s*test|interview|result|admission|apply/i.test(text)) continue;

    const label = classifyDeadline(text) ||
      text.replace(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2}/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 60);
    dates.forEach(d => add(label, d, 'text'));
  }

  // Sort by date ascending, past dates last
  results.sort((a, b) => {
    const da = new Date(a.date.year, a.date.month - 1, a.date.day);
    const db = new Date(b.date.year, b.date.month - 1, b.date.day);
    return da - db;
  });

  return results;
}

async function handleDeadlines(container) {
  const contentEl = container || document.getElementById('unimatch-content');
  if (!contentEl) return;

  contentEl.innerHTML = `<div style="padding:16px;text-align:center;color:#71717a;font-size:11px">🔍 Scanning page for dates…</div>`;

  const deadlines = detectPageDeadlines();
  const uni = detectUniversity();
  const uniName = uni?.name || window.location.hostname.replace(/^www\./, '');

  const goBack = async () => {
    const s = await chrome.storage.local.get(['unimatch_token', 'unimatch_profile']);
    renderState(contentEl, s.unimatch_token && s.unimatch_profile ? 'ready' : 'not_logged_in', { profile: s.unimatch_profile });
  };

  if (deadlines.length === 0) {
    contentEl.innerHTML = `
      <div style="padding:12px">
        <div style="font-size:11px;font-weight:600;color:#4ade80;margin-bottom:8px">📅 Admission Dates</div>
        <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:8px;padding:10px;font-size:11px;color:#fbbf24;margin-bottom:10px">
          No admission dates found on this page.<br>Try opening the portal's schedule or announcement page.
        </div>
        <button id="um-dl-back" style="width:100%;padding:8px;background:#27272a;color:#a1a1aa;border:none;border-radius:6px;font-size:11px;cursor:pointer">← Back</button>
      </div>
    `;
    document.getElementById('um-dl-back')?.addEventListener('click', goBack);
    return;
  }

  const items = deadlines.map(({ label, date }) => {
    const days = daysUntil(date);
    const isPast = days < 0;
    const isToday = days === 0;
    const isUrgent = days > 0 && days <= 7;
    const isSoon = days > 7 && days <= 30;
    const color = isPast ? '#52525b' : isToday ? '#f97316' : isUrgent ? '#ef4444' : isSoon ? '#fbbf24' : '#4ade80';
    const badge = isPast ? `${Math.abs(days)}d ago` : isToday ? 'Today!' : `${days}d left`;
    const gcalUrl = makeGCalUrl(`${uniName}: ${label}`, date, `Admission deadline – ${label}\n${window.location.href}`);

    return `
      <div style="background:rgba(255,255,255,0.03);border:1px solid #27272a;border-radius:8px;padding:8px;margin-bottom:6px${isPast ? ';opacity:0.45' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px">
          <div style="font-size:10px;font-weight:600;color:#e4e4e7;line-height:1.4;flex:1">${label}</div>
          <span style="font-size:9px;font-weight:700;color:${color};white-space:nowrap;background:${color}22;padding:2px 6px;border-radius:4px">${badge}</span>
        </div>
        <div style="font-size:11px;color:${color};margin-top:3px;font-weight:500">${formatDeadlineDate(date)}</div>
        ${!isPast ? `<a href="${gcalUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:5px;font-size:9px;color:#60a5fa;text-decoration:none;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);border-radius:4px;padding:2px 7px">+ Add to Google Calendar</a>` : ''}
      </div>
    `;
  }).join('');

  contentEl.innerHTML = `
    <div style="padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:11px;font-weight:600;color:#4ade80">📅 Dates Found (${deadlines.length})</div>
        <button id="um-dl-back" style="background:none;border:none;color:#71717a;font-size:10px;cursor:pointer;padding:0">← Back</button>
      </div>
      <div style="max-height:340px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#27272a transparent">
        ${items}
      </div>
      <div style="font-size:9px;color:#3f3f46;margin-top:6px;text-align:center">From current page · Verify on portal</div>
    </div>
  `;

  document.getElementById('um-dl-back')?.addEventListener('click', goBack);
}

// ─── Scan Fields (without filling) ─────────────────────────────

async function handleScanFields() {
  const statsEl = document.getElementById('unimatch-field-stats');
  if (!statsEl) return;

  const inputs = collectAllFields();
  const forms = document.querySelectorAll('form');

  const detectedFields = [];
  const unknownFields = [];

  for (const input of inputs) {
    if (input.type === 'password') {
      detectedFields.push({ label: 'Password', key: 'password', icon: '🔑' });
      continue;
    }
    const key = matchFieldHeuristically(input);
    const label = input.labels?.[0]?.textContent?.trim() ||
      input.getAttribute('placeholder') || input.name || input.id || '(unlabeled)';
    if (key) {
      detectedFields.push({ label: label.slice(0, 30), key, icon: '✓' });
    } else if (input.required) {
      unknownFields.push(label.slice(0, 30));
    }
  }

  const uniqueKeys = [...new Set(detectedFields.map(f => f.key))];
  const rows = uniqueKeys.slice(0, 8).map(k => {
    const f = detectedFields.find(x => x.key === k);
    return `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0">
      <span style="color:#a1a1aa">${f.label}</span>
      <span style="color:#4ade80">✓ can fill</span>
    </div>`;
  }).join('');

  statsEl.innerHTML = `
    <div style="font-size:11px;margin-bottom:4px;color:#71717a">
      ${inputs.length} fields · ${forms.length} form(s) · ${uniqueKeys.length} auto-fillable
    </div>
    ${rows}
    ${unknownFields.length ? `<div style="font-size:10px;color:#fbbf24;margin-top:4px">⚠ ${unknownFields.length} required field(s) need manual input</div>` : ''}
  `;
}

// ─── Answer Memory (Save Progress) ────────────────────────────

// Returns all fields on the current page that are considered "remaining" —
// i.e. empty and not already auto-filled by the extension in this session.
function collectRemainingFields() {
  return collectAllFields().filter(el => {
    if (el.classList.contains('unimatch-filled')) return false;
    if (el.tagName === 'SELECT') return !el.value || el.value === '';
    if (el.classList.contains('typeahead') || el.getAttribute('class')?.includes('typeahead')) {
      const trigger = el.querySelector('.typeahead-selected');
      const text = (trigger?.textContent || '').trim().toLowerCase();
      return !text || text === 'type or click to select';
    }
    const val = (el.value || '').trim();
    return val === '';
  });
}

function handleScanRemaining() {
  const contentEl = document.getElementById('unimatch-content');
  if (!contentEl) return;
  const remaining = collectRemainingFields();
  // Highlight remaining fields with a blue outline so user can see them
  remaining.forEach(el => {
    el.style.outline = '2px solid #60a5fa';
    el.style.outlineOffset = '2px';
  });
  // Update the scan count badge in the button
  const badge = document.getElementById('unimatch-scan-badge');
  if (badge) badge.textContent = remaining.length;
  // Flash feedback in the sidebar
  const note = document.getElementById('unimatch-scan-note');
  if (note) {
    note.textContent = remaining.length > 0
      ? `${remaining.length} unfilled field${remaining.length !== 1 ? 's' : ''} highlighted in blue`
      : 'No remaining fields found — form looks complete';
    note.style.color = remaining.length > 0 ? '#60a5fa' : '#4ade80';
  }
}

async function handleFillRemaining() {
  const contentEl = document.getElementById('unimatch-content');
  const ctx = window.__unimatch;
  if (!contentEl || !ctx) return;
  if (!isExtensionValid()) { showContextInvalidatedUI(contentEl); return; }

  // Run the full autofill but instruct it to skip already-filled fields.
  // We set a flag on window.__unimatch that handleAutofill checks.
  ctx._fillRemainingOnly = true;
  await handleAutofill();
  ctx._fillRemainingOnly = false;
}

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
      const sopBase = await getSiteUrl();
      const response = await fetch(`${sopBase}/api/sop-draft`, {
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

// ─── Inject Extension ID for site pages ────────────────────────
// Allows the profile page's "Connect Extension" button to pass the correct
// extension ID to /extension-auth without needing a URL param.
if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
  window.__unimatch_ext_id = chrome.runtime.id;
}

// ─── Message Listener (for popup + TRIGGER_AUTOFILL) ───────────

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRIGGER_AUTOFILL') {
      handleAutofill().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ error: e.message }));
      return true;
    }
    if (message.type === 'CHECK_UNIVERSITY') {
      const uni = detectUniversity();
      sendResponse({ university: uni || null });
      return false;
    }
    if (message.type === 'GET_FILL_STATUS') {
      const ctx = window.__unimatch;
      sendResponse({
        filled: ctx?.filledFields ?? 0,
        manual: ctx?.manualFields ?? 0,
        university: ctx?.university ?? null,
      });
      return false;
    }
  });
}

// ─── MutationObserver for SPA navigation / dynamic forms ───────

let _reinitTimer = null;
function debounceReinit() {
  // Suppress reinit while Bahria ApplyProgram fill is in progress (AJAX race condition)
  if (window.__unimatch?._bahriaApplyFilling) return;
  clearTimeout(_reinitTimer);
  _reinitTimer = setTimeout(() => {
    const university = detectUniversity();
    if (!university) return;
    // Re-setup SOP helper and password vault for newly loaded form sections
    setupSOPHelper();
    setupPasswordVault();
    // If sidebar is showing "ready" state, refresh the scan stats
    const statsEl = document.getElementById('unimatch-field-stats');
    if (statsEl) handleScanFields();
  }, 800);
}

function setupMutationObserver() {
  if (typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver((mutations) => {
    // Don't react to DOM mutations caused by our own AJAX fill sequence
    if (window.__unimatch?._bahriaApplyFilling) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        // Check if new content has form fields
        const hasFields = node.matches?.('input,select,textarea,form') ||
          node.querySelector?.('input:not([type=hidden]),select,textarea');
        if (hasFields) { debounceReinit(); return; }
      }
    }
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// ─── Initialize ────────────────────────────────────────────────

(function init() {
  const university = detectUniversity();
  if (!university) return;

  console.log(`[IlmSeUrooj] Detected: ${university.name} (${university.slug})`);
  injectSidebar(university);
  setupSubmissionDetection();
  setupMutationObserver();
  setupFloatingSuggestions();
  setupKeyboardShortcuts();

  // Phase 5 features — delayed to let page fully render
  setTimeout(() => {
    setupSOPHelper();
    setupPasswordVault();
  }, 2000);
})();

// ─── Keyboard Shortcuts ────────────────────────────────────────
// Alt+Shift+A   → Autofill entire form
// Alt+Shift+R   → Pre-submit review
// Alt+Shift+S   → Open/close sidebar
// Ctrl+Shift+4  → Fill the currently focused field only

// Track the last focused form field so Ctrl+Shift+4 knows what to fill
// even if focus briefly shifts when modifier keys are pressed.
let _lastFocusedField = null;

function setupKeyboardShortcuts() {
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el) return;
    const tag = el.tagName;
    // Track p-dropdown by its inner combobox input — resolve to the p-dropdown element itself
    if (tag === 'INPUT' && el.getAttribute('role') === 'combobox') {
      const pd = el.closest('p-dropdown');
      if (pd && !pd.closest('#unimatch-sidebar')) { _lastFocusedField = pd; return; }
    }
    // Track p-calendar by its inner text input — resolve to the p-calendar element itself
    if (tag === 'INPUT') {
      const pc = el.closest('p-calendar');
      if (pc && !pc.closest('#unimatch-sidebar')) { _lastFocusedField = pc; return; }
    }
    if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'P-DROPDOWN' || tag === 'P-CALENDAR') &&
        el.type !== 'password' && el.type !== 'hidden' &&
        !el.closest('#unimatch-sidebar')) {
      _lastFocusedField = el;
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    // ── Ctrl+Shift+4 — Fill focused field ──────────────────────
    // Use e.code ('Digit4') not e.key ('4'/'$') — Shift changes e.key on most keyboards.
    if (e.ctrlKey && e.shiftKey && e.code === 'Digit4') {
      e.preventDefault();
      handleFillFocusedField();
      return;
    }

    if (!e.altKey || !e.shiftKey) return;

    switch (e.key.toUpperCase()) {
      case 'A': {
        e.preventDefault();
        const sidebar = document.getElementById('unimatch-sidebar');
        const toggle = document.getElementById('unimatch-toggle');
        if (sidebar?.classList.contains('collapsed')) {
          sidebar.classList.remove('collapsed');
          toggle?.classList.add('sidebar-open');
        }
        handleAutofill();
        break;
      }
      case 'R': {
        e.preventDefault();
        handlePreSubmitCheck();
        break;
      }
      case 'S': {
        e.preventDefault();
        document.getElementById('unimatch-toggle')?.click();
        break;
      }
    }
  });
}

// ─── Fill Focused Field (Ctrl+Shift+4) ────────────────────────
// Fills only the field the user is currently focused/typing in.
async function handleFillFocusedField() {
  const ctx = window.__unimatch;
  if (!ctx?.profile) return;

  // Prefer _lastFocusedField — document.activeElement may have shifted when
  // Ctrl+Shift were pressed before the 4 key.
  const focused = _lastFocusedField || document.activeElement;
  if (!focused) return;
  const tag = focused.tagName;
  if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA' && tag !== 'P-DROPDOWN' && tag !== 'P-CALENDAR') return;
  if (focused.type === 'password' || focused.type === 'hidden') return;

  // Match this field to a profile key
  const profileKey = matchFieldHeuristically(focused);
  if (!profileKey) {
    showFieldShortcutFeedback(focused, 'No match found', '#fbbf24');
    return;
  }

  const uniConfig = (typeof getConfigForDomain === 'function')
    ? getConfigForDomain(window.location.hostname) : null;

  // Resolve value
  let value = profileValueFor(profileKey, ctx.profile) ?? ctx.profile?.[profileKey];
  if (value == null || value === '') {
    showFieldShortcutFeedback(focused, 'No data in profile', '#fbbf24');
    return;
  }

  // Apply transform if university config has one for this key
  const transformKey = uniConfig?.transforms?.[profileKey];
  if (transformKey && TRANSFORMS[transformKey] && !['first_name','last_name','middle_name'].includes(transformKey)) {
    try { value = TRANSFORMS[transformKey](value); } catch(e) { /* ignore transform error */ }
  }

  // Smart format inference — same logic as Tier 3 fill
  value = applyFieldTransform(focused, profileKey, value);

  // Fill
  let filled = false;
  if (tag === 'SELECT') {
    filled = fillSelectWithMapping(focused, String(value), uniConfig?.selectOptions?.[profileKey]);
  } else if (focused.type === 'radio') {
    filled = fillRadio(focused, String(value));
  } else if (profileKey === 'date_of_birth') {
    filled = await fillDateAdvanced(focused, String(value));
  } else {
    filled = await fillInput(focused, String(value));
  }

  if (filled) {
    await new Promise(r => setTimeout(r, 150));
    const verified = verifyFilledField(focused, value, profileKey);
    if (verified) {
      focused.style.outline = '2px solid #4ade80';
      focused.style.outlineOffset = '2px';
      focused.classList.add('unimatch-filled');
      focused.classList.remove('unimatch-manual');
      showFieldShortcutFeedback(focused, String(value), '#4ade80');
    } else {
      // Fill reported success but framework reset the value
      focused.style.outline = '2px solid #fbbf24';
      focused.style.outlineOffset = '2px';
      focused.classList.remove('unimatch-filled');
      focused.classList.add('unimatch-manual');
      showFieldShortcutFeedback(focused, 'Filled but reset by page — try again', '#fbbf24');
    }
  } else {
    showFieldShortcutFeedback(focused, 'Could not fill', '#fbbf24');
  }
}

// ─── Inline tooltip shown after Ctrl+Shift+4 fill ─────────────
function showFieldShortcutFeedback(el, text, color) {
  const existing = document.getElementById('um-field-shortcut-toast');
  if (existing) existing.remove();

  const rect = el.getBoundingClientRect();
  const toast = document.createElement('div');
  toast.id = 'um-field-shortcut-toast';
  toast.textContent = text;
  Object.assign(toast.style, {
    position: 'fixed',
    top: `${Math.max(4, rect.top - 32)}px`,
    left: `${rect.left}px`,
    background: '#18181b',
    color,
    border: `1px solid ${color}`,
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '11px',
    fontFamily: 'monospace',
    zIndex: '2147483647',
    pointerEvents: 'none',
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

