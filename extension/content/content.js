/**
 * UniMatch Content Script
 * Detects university portals, injects the sidebar, manages autofill + answer memory.
 */

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
    case 'matric_total':
      return profile.matric_total || '1100';
    case 'fsc_marks':
    case 'inter_marks':
    case 'hssc_marks':
      if (typeof getInterMarks === 'function') return getInterMarks(profile);
      return profile.fsc_marks || profile.inter_marks || profile.inter_obtained;
    case 'fsc_total':
    case 'inter_total':
    case 'hssc_total':
      if (typeof getInterTotal === 'function') return getInterTotal(profile);
      return profile.fsc_total || profile.inter_total || '1100';
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
    // ── Father / Mother status, income, profession ─────────────
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
  { match: ['email', 'e-mail', 'e_mail', 'emailaddress', 'email_address', 'email_id', 'emailid',
    'student_email', 'applicant_email', 'user_email', 'contact_email', 'email_contact',
    'email address', 'your email', 'applicantemail', 'mail_id', 'mailid',
    // Pakistani portal variants
    'email_addr', 'email_input', 'applicant_mail', 'student_mail', 'reg_email',
    'registration_email', 'primary_email', 'alternate_email', 'alt_email',
    'personal_email', 'official_email', 'institutional_email',
    // ASP.NET style (after prefix stripping: txtEmail → email, but keep for label match)
    'email address *', 'email *', 'your email address'],
    profileKey: 'email', priority: 10 },

  // ── CNIC / National ID ─────────────────────────────────────────
  { match: ['cnic', 'nic', 'national_id', 'nationalid', 'id_card', 'idcard', 'cnic_no', 'cnic_number',
    'b_form', 'bform', 'nicop', 'identity_card', 'id_number', 'id_no', 'national_identity',
    'nadra', 'id_card_no', 'nic_number', 'form_b', 'form-b', 'nicno', 'id card', 'cnicno',
    'national id', 'national identity card', 'cnic/nicop', 'identity_no',
    // Pakistani portal variants
    'cnic_num', 'nadra_id', 'national_id_card', 'applicant_cnic', 'student_cnic',
    'applicant_nic', 'father_id_proof', 'cnic_or_nicop', 'nic_no', 'id_proof',
    'identity_number', 'national_identity_number', 'cnic_nicop', 'applicantcnic',
    'cnic / b-form', 'cnic / b form', 'b-form', 'bform_no', 'form_b_no'],
    profileKey: 'cnic', priority: 9 },

  // ── CNIC (no dashes) ──────────────────────────────────────────
  { match: ['cnic_no_dash', 'cnicnodash', 'cnic_without_dash', 'cnic_nodash', 'nic_no_dash',
    'cnic_digits', 'cnic13', 'nadra_no', 'cnicno_dash', 'cnic_plain', 'cnic_raw'],
    profileKey: 'cnic', priority: 9 },

  // ── Phone ──────────────────────────────────────────────────────
  { match: ['phone', 'mobile', 'cell', 'tel', 'telephone', 'phone_number', 'mobileno', 'contact_no',
    'mob_no', 'cell_no', 'cellno', 'mobile_no', 'contact_number', 'mobile_number', 'phone_no',
    'cell_number', 'phone_num', 'mob_num', 'ph_no', 'phno', 'contact_cell',
    'mobile number', 'phone number', 'cell number', 'mobile no', 'phone no',
    'contact mobile', 'applicant_phone', 'student_phone', 'applicant_mobile',
    'contact_mob', 'mob', 'contact_phone', 'personal_phone', 'personal_mobile',
    // Pakistani portal variants
    'phone_no', 'mob_number', 'cell_phone', 'applicant_cell', 'student_cell',
    'home_phone', 'res_phone', 'contact_no_cell', 'mobile_ph', 'phone_mob',
    'applicant_contact', 'student_contact', 'emergency_contact', 'guardian_phone',
    'father_phone', 'father_mobile', 'father_cell', 'parent_phone', 'parent_mobile',
    'alternate_phone', 'alt_phone', 'other_phone', 'secondary_phone',
    'phone (with country code)', 'mobile (pakistan)', 'cell (pk)'],
    profileKey: 'phone', priority: 8 },

  // ── WhatsApp ──────────────────────────────────────────────────
  { match: ['whatsapp', 'whatsapp_no', 'whatsapp_number', 'whatsapp number', 'wp_no',
    'whatsapp_mob', 'whatsapp_mobile', 'wp_number', 'wapp_no', 'whatsapp_cell'],
    profileKey: 'whatsapp', priority: 7 },

  // ── First / Last / Middle — MUST be before full_name ──────────
  { match: ['first_name', 'firstname', 'fname', 'f_name', 'given_name', 'givenname',
    'f_nm', 'frst_nm', 'first_nm', 'applicant_fname', 'student_fname', 'sfname',
    'first name', 'given name', 'name1', 'first-name', 'forename', 'fore_name',
    'name_first', 'applicant_first', 'candidate_first_name',
    // Pakistani portal variants
    'first_name_eng', 'fname_en', 'first_name_en', 'applicant_first_name',
    'student_first_name', 'name_en_first', 'fname_english'],
    profileKey: 'first_name', priority: 11 },

  { match: ['last_name', 'lastname', 'lname', 'l_name', 'surname', 'family_name', 'familyname',
    'l_nm', 'lst_nm', 'last_nm', 'applicant_lname', 'slname', 'sur_name', 'surename',
    'last name', 'family name', 'name2', 'last-name', 'name_last', 'candidate_last_name',
    'lname_en', 'last_name_en', 'surname_en', 'applicant_last_name', 'student_last_name'],
    profileKey: 'last_name', priority: 11 },

  { match: ['middle_name', 'middlename', 'mname', 'm_name', 'middle_nm', 'mid_name',
    'middle name', 'middle-name', 'middle_initial', 'mid_nm', 'middle_name_en'],
    profileKey: 'middle_name', priority: 11 },

  // ── Full Name ──────────────────────────────────────────────────
  { match: ['full_name', 'fullname', 'applicant_name', 'student_name', 'candidatename',
    'candidate_name', 'name_of_applicant', 'name_of_student', 'complete_name', 'full_nm',
    'full name', 'complete name', 'applicant name', 'student name', 'name of applicant',
    'yourname', 'your_name', 'applicantname', 'name_complete', 'complete_nm',
    // Pakistani portal variants
    'full_name_eng', 'name_en', 'name_english', 'fullname_en', 'applicant_full_name',
    'student_full_name', 'name_as_on_cnic', 'name_on_cnic', 'name_cnic',
    'applicant_name_en', 'name_in_english', 'full_name_english',
    'name_urdu', 'full_name_urdu', 'name_in_urdu',
    'name_as_matric', 'name_as_per_matric'],
    profileKey: 'full_name', priority: 7 },

  // ── Father / Guardian ──────────────────────────────────────────
  { match: ['father', 'father_name', 'fathername', 'fathers_name', 'fathersname', 'father_nm',
    "father's name", 'fathers name', 'dad_name', 'father_first_name',
    'guardian', 'guardian_name', 'parent_name', 'parentname',
    'wali', 'wali_name', 'father_full_name', 'sarparest',
    // Pakistani portal variants
    'father_name_en', 'father_name_urdu', 'fname_father', 'father_nm_en',
    'father_or_guardian', 'father_guardian_name', 'guardian_father_name',
    'applicant_father_name', 'student_father_name', 'father_s_name',
    "father / guardian's name", 'fathers_full_name', 'guardians_name',
    'parent_guardian_name', 'father_name_as_cnic', 'father_name_on_cnic'],
    profileKey: 'father_name', priority: 7 },

  // ── Father CNIC ────────────────────────────────────────────────
  { match: ['father_cnic', 'fathercnic', 'guardian_cnic', 'parent_cnic', 'father_nic',
    'father_id', 'father_id_card', 'father cnic', "father's cnic", 'dad_cnic', 'fcnic',
    'father_cnic_no', 'guardian_nic', 'wali_cnic', 'father_nadra', 'parent_nic'],
    profileKey: 'father_cnic', priority: 6 },

  // ── Mother's Name ──────────────────────────────────────────────
  { match: ['mother_name', 'mothername', 'mothers_name', "mother's name", 'mom_name',
    'mother', 'mother_full_name', 'mname', 'mother_nm', 'mother_name_en',
    'applicant_mother_name', 'student_mother_name'],
    profileKey: 'mother_name', priority: 5 },

  // ── Date of Birth ──────────────────────────────────────────────
  { match: ['dob', 'date_of_birth', 'dateofbirth', 'birthdate', 'birth_date', 'birth_dt',
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
    profileKey: 'date_of_birth', priority: 6 },

  // ── Gender ──────────────────────────────────────────────────────
  { match: ['gender', 'sex', 'gender_id', 'applicant_gender', 'student_gender', 'male_female',
    'gender_type', 'applicant_sex', 'gen',
    'gender_select', 'sex_type', 'gender_code', 'applicant_sex_type'],
    profileKey: 'gender', priority: 5 },

  // ── Blood Group ────────────────────────────────────────────────
  { match: ['blood_group', 'bloodgroup', 'blood_type', 'bloodtype', 'blood group', 'blood type',
    'blood_grp', 'bg', 'blood_group_type', 'applicant_blood_group', 'student_blood_group'],
    profileKey: 'blood_group', priority: 4 },

  // ── City ───────────────────────────────────────────────────────
  { match: ['city', 'town', 'city_name', 'resident_city', 'current_city', 'home_city',
    'city of residence', 'city_residence', 'applicant_city', 'domicile_city',
    'city_of_residence', 'residence_city', 'student_city',
    // Pakistani portal variants
    'city_id', 'city_code', 'permanent_city', 'perm_city', 'local_city',
    'domicile_city_name', 'birth_city', 'city_birth', 'mailing_city',
    'correspondence_city', 'applicant_city_name'],
    profileKey: 'city', priority: 5 },

  // ── Province / Domicile ────────────────────────────────────────
  { match: ['province', 'state', 'domicile', 'domicile_province', 'province_name', 'region',
    'home_province', 'applicant_province', 'province of domicile', 'prov',
    'domicile_prov', 'province_of_domicile', 'residence_province',
    // Pakistani portal variants
    'province_id', 'province_code', 'domicile_id', 'domicile_code',
    'prov_name', 'domicile_name', 'permanent_province', 'perm_province',
    'applicant_domicile', 'student_domicile', 'domicile_certificate',
    'domicile_prov_name', 'province of origin', 'province_of_origin'],
    profileKey: 'province', priority: 5 },

  // ── District ───────────────────────────────────────────────────
  { match: ['district', 'district_name', 'domicile_district', 'home_district', 'tehsil',
    'zila', 'district_of_domicile', 'dist',
    'district_id', 'domicile_district_name', 'perm_district', 'district_code'],
    profileKey: 'district', priority: 4 },

  // ── Address ────────────────────────────────────────────────────
  { match: ['address', 'postal_address', 'mailing_address', 'residential_address',
    'permanent_address', 'home_address', 'current_address', 'present_address',
    'local_address', 'street_address', 'street', 'addr', 'full_address',
    'correspondence_address', 'home address', 'mailing address', 'residence address',
    'permanent address', 'perm_address', 'res_address', 'applicant_address',
    // Pakistani portal variants
    'address1', 'address_line1', 'address_line_1', 'address_line2',
    'permanent_addr', 'perm_addr', 'home_addr', 'local_addr', 'curr_address',
    'applicant_addr', 'student_address', 'correspondence_addr', 'corr_address',
    'contact_address', 'resident_address', 'house_address', 'house_no_street'],
    profileKey: 'address', priority: 4 },

  // ── Postal Code ────────────────────────────────────────────────
  { match: ['postal_code', 'postalcode', 'zipcode', 'zip', 'zip_code', 'post_code', 'postcode',
    'area_code', 'pincode', 'pin_code', 'postal code', 'zip code',
    'postal_zip', 'zip_postal', 'post_zip', 'area_postal_code'],
    profileKey: 'postal_code', priority: 3 },

  // ── Nationality / Religion ─────────────────────────────────────
  { match: ['nationality', 'citizenship', 'country_of_citizenship', 'country', 'citizen',
    'applicant_nationality', 'national_status', 'nationality_id', 'citizenship_status',
    'country_of_origin', 'national_origin'],
    profileKey: 'nationality', priority: 3 },
  { match: ['religion', 'faith', 'religion_name', 'mazhab', 'deen', 'religious_affiliation',
    'religion_id', 'religion_code', 'applicant_religion', 'student_religion'],
    profileKey: 'religion', priority: 3 },

  // ── Board ──────────────────────────────────────────────────────
  { match: ['board', 'board_name', 'boardname', 'examination_board', 'exam_board',
    'board_of_inter', 'hssc_board', 'inter_board', 'fsc_board', 'matric_board',
    'ssc_board', 'bise', 'board of intermediate', 'board of education',
    'board_of_education', 'board_exam', 'inter_board_name',
    // Pakistani portal variants
    'board_id', 'board_code', 'bise_board', 'board_inter', 'board_matric',
    'inter_exam_board', 'ssc_exam_board', 'hssc_exam_board',
    'board_of_intermediate_education', 'board_of_secondary_education',
    'matric_board_name', 'inter_board_name', 'bise_name', 'bise_id'],
    profileKey: 'board_name', priority: 4 },

  // ── School / College ───────────────────────────────────────────
  { match: ['school', 'college', 'school_name', 'institution', 'school_college', 'college_name',
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
    profileKey: 'school_name', priority: 4 },

  // ── Passing Year ───────────────────────────────────────────────
  { match: ['passing_year', 'passingyear', 'year_of_passing', 'grad_year', 'graduation_year',
    'pass_year', 'year_passed', 'completion_year', 'exam_year', 'inter_year',
    'fsc_year', 'hssc_year', 'year of passing', 'passing year', 'ssc_year',
    'matric_year', 'year_of_completion', 'passing_yr',
    // Pakistani portal variants
    'year_of_pass', 'exam_passing_year', 'fsc_passing_year', 'inter_passing_year',
    'matric_passing_year', 'ssc_passing_year', 'hssc_passing_year',
    'year_exam', 'pass_yr', 'year_completion', 'graduation_yr', 'exam_yr'],
    profileKey: 'passing_year', priority: 4 },

  // ── Roll Number ────────────────────────────────────────────────
  { match: ['roll_number', 'rollnumber', 'roll_no', 'rollno', 'roll', 'exam_roll',
    'matric_roll', 'inter_roll', 'ssc_roll', 'hssc_roll', 'candidate_roll',
    'board_roll', 'roll_num', 'roll number', 'board roll no', 'roll_no_inter',
    'inter_roll_no', 'fsc_roll_no', 'hssc_roll_no', 'roll_no_ssc', 'ssc_roll_no',
    // Pakistani portal variants
    'roll_no_matric', 'roll_no_fsc', 'examination_roll_no', 'board_roll_no',
    'matric_roll_no', 'inter_roll_number', 'fsc_roll_number', 'ssc_roll_number',
    'hssc_roll_number', 'rollno_inter', 'rollno_matric', 'exam_rollno'],
    profileKey: 'roll_number', priority: 5 },

  // ── FSc Marks (obtained) ───────────────────────────────────────
  { match: ['fsc_marks', 'fscmarks', 'hssc_marks', 'inter_marks', 'intermediate_marks',
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
    profileKey: 'fsc_marks', priority: 6 },

  // ── FSc Total ──────────────────────────────────────────────────
  { match: ['fsc_total', 'fsctotal', 'hssc_total', 'inter_total', 'total_marks_fsc',
    'total_fsc', 'fsc_max', 'inter_max', 'hssc_max', 'total_inter',
    'inter total marks', 'fsc total', 'hsc_total', 'intermediate_total',
    'hssc_total_marks', 'fsc_total_marks',
    'inter_total_marks', 'fsc_max_marks', 'inter_max_marks', 'hssc_max_marks',
    'class_12_total', 'grade_12_total', 'fsc_full_marks'],
    profileKey: 'fsc_total', priority: 5 },

  // ── FSc Percentage ─────────────────────────────────────────────
  { match: ['fsc_percentage', 'fscpercentage', 'inter_percentage', 'hssc_percentage',
    'fsc_pct', 'inter_pct', 'percentage_fsc', 'hssc_pct', 'intermediate_percentage',
    'fsc_percent', 'inter_percent',
    'inter_pct_age', 'hssc_pct_age', 'fsc_pct_age', 'intermediate_pct',
    'class_12_percentage', 'grade_12_percentage', 'inter_score_pct'],
    profileKey: 'fsc_percentage', priority: 5 },

  // ── FSc Part-I marks ───────────────────────────────────────────
  { match: ['part1_marks', 'part_1_marks', 'fsc_part1', 'part1_obtained', 'partone_marks',
    'part_i_marks', 'year1_marks', 'part 1 marks', 'part-1 marks', 'part1marks',
    'part_one_marks', 'yr1_marks', 'inter_part1', 'hssc_part1', 'fsc_part_1'],
    profileKey: 'fsc_part1_marks', priority: 6 },

  // ── Matric Marks ───────────────────────────────────────────────
  { match: ['matric_marks', 'matricmarks', 'ssc_marks', 'matric_obtained', 'ssc_obtained',
    'matric_obt', 'ssc_obt', 'marks_obtained_matric', 'marks_matric',
    'matric_obtained_marks', 'ssc_marks_obtained', 'marks_ssc',
    'matriculation_marks', 'matric obtained', 'ssc obtained marks',
    'class_10_marks', 'grade_10_marks', 'secondary_marks', 'ssc_obt_marks',
    // Pakistani portal variants
    'matric_obt_marks', 'ssc_obtained_marks', 'matric_marks_obtained',
    'ssc_marks_obt', 'matriculation_obtained', 'class_9_10_marks',
    'secondary_school_marks', 'matric_score'],
    profileKey: 'matric_marks', priority: 6 },

  // ── Matric Total ───────────────────────────────────────────────
  { match: ['matric_total', 'matrictotal', 'ssc_total', 'total_marks_matric',
    'total_matric', 'matric_max', 'ssc_max', 'total_ssc', 'matriculation_total',
    'matric total', 'ssc total marks', 'secondary_total', 'class_10_total',
    'matric_total_marks', 'ssc_total_marks', 'matric_max_marks', 'ssc_max_marks',
    'matric_full_marks', 'class_10_total_marks'],
    profileKey: 'matric_total', priority: 5 },

  // ── Matric Percentage ──────────────────────────────────────────
  { match: ['matric_percentage', 'matricpercentage', 'ssc_percentage', 'matric_pct',
    'matric_percent', 'ssc_pct', 'secondary_percentage',
    'class_10_percentage', 'grade_10_percentage', 'matric_score_pct',
    'ssc_pct_age', 'matric_pct_age'],
    profileKey: 'matric_percentage', priority: 5 },

  // ── NET / NTS Score ────────────────────────────────────────────
  { match: ['net_score', 'net_marks', 'netscore', 'net', 'nts_score', 'nts_marks',
    'entry_test', 'entry_test_score', 'entrance_score', 'entrance_marks', 'admission_test',
    'test_score', 'test_marks', 'merit_score', 'aggregate_score', 'entry_test_marks',
    'aggregate_marks', 'test_percentile', 'merit_aggregate', 'admission_test_score',
    // Pakistani portal variants
    'nts_marks_obtained', 'net_marks_obtained', 'nts_test_score', 'entry_test_result',
    'admission_test_marks', 'university_test_score', 'uni_test_score',
    'hat_score', 'hat_marks', 'lcat_score', 'ncat_score', 'step_score',
    'paf_test_score', 'navy_test_score', 'army_test_score'],
    profileKey: 'net_score', priority: 5 },

  // ── ECAT Score ─────────────────────────────────────────────────
  { match: ['ecat_score', 'ecat_marks', 'ecat', 'engineering_test', 'enet_score',
    'ecat_result', 'ecat_marks_obtained', 'engineering_admission_test'],
    profileKey: 'ecat_score', priority: 6 },

  // ── MCAT/MDCAT Score ──────────────────────────────────────────
  { match: ['mcat_score', 'mcat', 'mcat_marks', 'mdcat_score', 'mdcat', 'mdcat_marks',
    'medical_test', 'uhs_score', 'mdcat_result', 'mcat_result', 'uhs_test_score'],
    profileKey: 'net_score', priority: 6 },

  // ── SAT Score ─────────────────────────────────────────────────
  { match: ['sat_score', 'sat', 'sat_marks', 'sat1', 'sat2', 'sat_result', 'sat_total'],
    profileKey: 'sat_score', priority: 6 },

  // ── GAT/GRE ───────────────────────────────────────────────────
  { match: ['gat_score', 'gat', 'gre_score', 'gre', 'gmat_score', 'gmat', 'ielts', 'toefl',
    'ielts_score', 'toefl_score', 'gat_general', 'gat_subject'],
    profileKey: 'net_score', priority: 4 },

  // ── Statement of Purpose ───────────────────────────────────────
  { match: ['statement_of_purpose', 'sop', 'personal_statement', 'essay', 'motivation_letter',
    'statement', 'why_join', 'why_apply', 'about_yourself', 'motivation', 'cover_letter',
    'statement of purpose', 'personal statement', 'application essay',
    'sop_text', 'personal_essay', 'motivation_statement', 'letter_of_intent',
    'why_this_university', 'why_apply_here'],
    profileKey: 'statement_of_purpose', priority: 3 },

  // ── Father Occupation / Profession ────────────────────────────
  { match: ['father_profession', 'father_occupation', 'fathers_profession', 'fathers_occupation',
    "father's profession", "father's occupation", 'father_job', 'father_work',
    'dad_profession', 'dad_occupation', 'father_employment', 'father_business',
    'guardian_occupation', 'guardian_profession', 'parent_occupation',
    'father profession', 'father occupation', 'father job',
    'fathers_employment', 'father_vocation', 'father_trade',
    // Pakistani portal variants
    'father_prof', 'father_occ', 'father_emp', 'father_designation',
    'guardian_job', 'guardian_work', 'wali_occupation', 'wali_profession'],
    profileKey: 'father_occupation', priority: 7 },

  // ── Father Status (alive / deceased / shaheed) ─────────────────
  { match: ['father_status', 'father_alive', 'is_father_alive', 'father_living',
    "father's status", 'father_vital_status', 'father_life_status', 'father_condition',
    'father status', 'father alive', 'is father alive', 'father living',
    // Pakistani portal variants
    'father_state', 'father_condition', 'father_health', 'wali_status'],
    profileKey: 'father_status', priority: 6 },

  // ── Father Income ─────────────────────────────────────────────
  { match: ['father_income', 'fathers_income', "father's income", 'father_monthly_income',
    'father income', 'guardian_income', 'parent_income', 'father_salary',
    'family_income', 'household_income', 'monthly_income', 'annual_income',
    // Pakistani portal variants
    'father_earn', 'wali_income', 'father_earnings', 'guardian_salary',
    'father_monthly_salary', 'income_father'],
    profileKey: 'father_income', priority: 5 },

  // ── Mother Profession ──────────────────────────────────────────
  { match: ['mother_profession', 'mother_occupation', 'mothers_profession', 'mothers_occupation',
    "mother's profession", "mother's occupation", 'mother_job', 'mother_work',
    'mom_profession', 'mom_occupation', 'mother_employment', 'mother_business',
    'mother profession', 'mother occupation', 'mother job',
    // Pakistani portal variants
    'mother_prof', 'mother_occ', 'mother_emp', 'mother_vocation'],
    profileKey: 'mother_profession', priority: 6 },

  // ── Mother Status ─────────────────────────────────────────────
  { match: ['mother_status', 'mother_alive', 'is_mother_alive', 'mother_living',
    "mother's status", 'mother_vital_status', 'mother_life_status', 'mother_condition',
    'mother status', 'mother alive', 'is mother alive', 'mother living',
    'mother_state', 'mother_health'],
    profileKey: 'mother_status', priority: 6 },

  // ── Mother Income ─────────────────────────────────────────────
  { match: ['mother_income', 'mothers_income', "mother's income", 'mother_monthly_income',
    'mother income', 'mother_salary', 'mother_earnings', 'mother_monthly_salary',
    'income_mother'],
    profileKey: 'mother_income', priority: 5 },

  // ── Phone Country Code ────────────────────────────────────────
  { match: ['country_code', 'phone_country', 'country_code_phone', 'country_calling_code',
    'intl_code', 'phone_prefix', 'phone_country_code', 'calling_code',
    'international_code', 'dial_code', 'phone_dial_code', 'country dialing code',
    'country code', 'phone country code', 'code_phone'],
    profileKey: 'phone_country_code', priority: 9 },

  // ── Phone Area Code ───────────────────────────────────────────
  { match: ['area_code', 'std_code', 'operator_code', 'network_code', 'phone_area',
    'local_exchange', 'city_code', 'exchange_code', 'phone_area_code',
    'area code', 'network code', 'operator code', 'mobile_code',
    'network_prefix', 'phone_exchange'],
    profileKey: 'phone_area_code', priority: 8 },

  // ── Phone Local Number ────────────────────────────────────────
  { match: ['subscriber_number', 'local_number', 'phone_number_part', 'line_number',
    'extension_number', 'phone_local', 'phone_subscriber', 'local_phone',
    'subscriber number', 'local number', 'phone number', 'number_only',
    'phone_no_number', 'mobile_number_only'],
    profileKey: 'phone_local_number', priority: 7 },

  // ── Education System / Academic Background ─────────────────────
  { match: ['education_system', 'academic_background', 'academic_system', 'qualification_type',
    'education_type', 'schooling_system', 'board_type', 'academic_qualification',
    'education system', 'academic background', 'qualification type',
    'previous_education', 'pre_education_type', 'inter_system', 'fsc_or_alevel',
    // Pakistani portal variants
    'edu_sys', 'academic_sys', 'study_system', 'education_category',
    'qualification_category', 'academic_category', 'inter_type_qualification'],
    profileKey: 'education_system', priority: 6 },
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
  const normPlaceholder = (rawPlaceholder).toLowerCase().trim();
  const normAriaLabel = (rawAriaLabel).toLowerCase().trim();
  const normLabel = (labelText).toLowerCase().trim().replace(/[*:]+$/, '').trim();
  const normData = (rawDataLabel).toLowerCase().trim();
  const normAC = (rawAutocomplete).toLowerCase().trim();

  // All signals as array (primary ones first for priority ordering)
  const primarySignals = [normName, normId].filter(Boolean);
  const secondarySignals = [normLabel, normAriaLabel, normPlaceholder, normData, normAC].filter(Boolean);
  const allSignals = [...primarySignals, ...secondarySignals];

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
  if (el.type === 'email') return 'email';
  if (el.type === 'tel') return 'phone';
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

  // ── First / Last / Middle before generic name ───────────────────
  if (allSignals.some(s => /\bfirst[_\s-]?name\b/.test(s) || /\bgiven[_\s-]?name\b/.test(s) ||
      s === 'fname' || s === 'first_name' || s === 'firstname' || s === 'f_name' ||
      s === 'f_nm' || s === 'frst_nm' || s === 'sfname')) return 'first_name';

  if (allSignals.some(s => /\blast[_\s-]?name\b/.test(s) || /\bsurname\b/.test(s) ||
      /\bfamily[_\s-]?name\b/.test(s) || s === 'lname' || s === 'last_name' ||
      s === 'lastname' || s === 'l_name' || s === 'l_nm' || s === 'slname')) return 'last_name';

  if (allSignals.some(s => /\bmiddle[_\s-]?name\b/.test(s) || s === 'mname' ||
      s === 'middle_name' || s === 'middlename' || s === 'm_name')) return 'middle_name';

  // ── Generic "name" → full_name (excluding first/last/middle/login/user/roll/father/mother) ──
  if (allSignals.some(s => {
    if (!/\bname\b/.test(s)) return false;
    if (/\b(first|last|middle|login|user|sur|father|mother|roll|school|college|board|institution|guardian|parent)\b/.test(s)) return false;
    // Also exclude if signal itself contains 'mother' or 'father' substring
    if (s.includes('mother') || s.includes('father') || s.includes('guardian') || s.includes('parent')) return false;
    return true;
  })) return 'full_name';

  // ── Heuristic table scan ────────────────────────────────────────
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

        if (sig === normKw || sig === normKw.replace(/_/g, '')) {
          // Exact match
          score = h.priority + 10 + bonus;
        } else if (sig.startsWith(normKw) || sig.endsWith(normKw)) {
          // Prefix/suffix match
          score = h.priority + 6 + bonus;
        } else if (sig.includes(normKw) || normKw.includes(sig)) {
          // Contains match (only if sig is long enough to be meaningful)
          if (sig.length >= 3) score = h.priority + bonus;
        }

        if (score > bestScore) {
          bestScore = score;
          bestKey = h.profileKey;
        }
      }
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
  const SELECTOR = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea';

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
  const day   = d.getDate();
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const dd    = String(day).padStart(2, '0');
  const mm    = String(month).padStart(2, '0');
  const yyyy  = String(year);
  const mon   = MONTH_NAMES[month - 1].charAt(0).toUpperCase() + MONTH_NAMES[month - 1].slice(1, 3); // "Jan"
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

  // Small random delay to avoid bot detection
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  return true;
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
      'sindh': ['sindh board', 'bsek'],
      'punjab': ['punjab board'],
      // Education system
      'cambridge': ['o level', 'a level', 'olevel', 'alevel', 'o/a level', 'o & a level', 'cambridge', 'cambridge system'],
      'pakistani': ['fsc', 'matric', 'bise', 'intermediate', 'hssc/ssc', 'matric/fsc', 'local board', 'pakistan'],
      // Father/mother status
      'alive': ['alive', 'living', 'present', 'yes'],
      'deceased': ['deceased', 'dead', 'passed', 'no', 'late', 'marhoom'],
      'shaheed': ['shaheed', 'martyr'],
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
  // 7. Levenshtein distance fallback for close matches (typos in option values)
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

  if (match) {
    el.value = match.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
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
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0));
  return dp[m][n];
}

function fillRadio(el, value) {
  const val = String(value).toLowerCase().trim();
  // Find all radios with the same name
  const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);

  // Alias groups — maps profile values to all the strings that might appear in form radio labels/values
  const RADIO_ALIASES = {
    'cambridge':  ['cambridge', 'o level', 'a level', 'o_level', 'a_level', 'olevel', 'alevel',
                   'o-level', 'a-level', 'o/a level', 'o / a level', 'o&a level', 'cambridge system'],
    'pakistani':  ['fsc', 'matric', 'pakistani', 'fssc', 'bise', 'intermediate', 'intermediate/matric',
                   'pak', 'pakistan', 'local', 'local board', 'sssc/hssc', 'ssc/hssc', 'matric/fsc'],
    'male':       ['male', 'm', 'boy'],
    'female':     ['female', 'f', 'girl', 'woman'],
    'alive':      ['alive', 'living', 'present', 'yes', 'active'],
    'deceased':   ['deceased', 'dead', 'passed away', 'late', 'no', 'marhoom', 'not alive'],
    'shaheed':    ['shaheed', 'martyr', 'شہید'],
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
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
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
  } catch {}
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
  } catch {}
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
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];
const MONTH_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

/**
 * Master date-fill function. Tries every strategy in order.
 */
async function fillDateAdvanced(el, isoDate) {
  if (!isoDate || !el) return false;
  const d = new Date(isoDate + 'T00:00:00'); // force local midnight
  if (isNaN(d.getTime())) return false;

  const day   = d.getDate();
  const month = d.getMonth() + 1; // 1-based
  const year  = d.getFullYear();
  const mm    = String(month).padStart(2, '0');
  const dd    = String(day).padStart(2, '0');
  const yyyy  = String(year);

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
  const mn  = MONTH_NAMES[month - 1];        // 'january'
  const ms  = MONTH_SHORT[month - 1];        // 'jan'
  const mUp = mn.charAt(0).toUpperCase() + mn.slice(1); // 'January'
  const mm  = String(month).padStart(2, '0'); // '05'
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

  const targetDay   = date.getDate();
  const targetMonth = date.getMonth(); // 0-based
  const targetYear  = date.getFullYear();

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
  const yearSel  = calendar.querySelector('select.ui-datepicker-year, [class*="year-select"], select[aria-label*="year" i]');
  const monthSel = calendar.querySelector('select.ui-datepicker-month, [class*="month-select"], select[aria-label*="month" i]');

  if (yearSel)  { fillSelect(yearSel,  String(targetYear));  await sleep(80); }
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
      const curYear  = curYearM ? parseInt(curYearM[0]) : null;

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
    const txt  = (cell.textContent || '').trim();
    const dDay = cell.getAttribute('data-day') || cell.getAttribute('data-date') ||
                 cell.getAttribute('aria-label')?.match(/\d+/)?.[0];

    if (txt === String(targetDay) ||
        (dDay && (dDay === String(targetDay) || dDay.startsWith(String(targetYear) + '-' + String(targetMonth + 1).padStart(2,'0') + '-' + String(targetDay).padStart(2,'0'))))) {
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
    <span style="color:#4ade80;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${profileKey.replace(/_/g,' ')}</span>
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
      await fillInput(el, String(value));
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
    chrome.storage.local.set({ unimatch_sidebar_open: !isNowCollapsed }).catch(() => {});
  });

  sidebarInstance = sidebar;

  // Restore saved open/closed state
  chrome.storage.local.get('unimatch_sidebar_open').then(stored => {
    if (stored.unimatch_sidebar_open === true) {
      sidebar.classList.remove('collapsed');
      toggle.classList.add('sidebar-open');
    }
  }).catch(() => {});

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
    chrome.storage.local.set({ unimatch_sidebar_open: false }).catch(() => {});
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
      });
      document.getElementById('unimatch-goto-site')?.addEventListener('click', async () => {
        const base = await getSiteUrl();
        window.open(`${base}/${onSite ? 'profile' : 'profile'}`, '_blank');
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
        { key: 'full_name',    icon: '👤', label: 'Name' },
        { key: 'father_name',  icon: '👨', label: 'Father' },
        { key: 'cnic',         icon: '🪪', label: 'CNIC' },
        { key: 'email',        icon: '✉️',  label: 'Email' },
        { key: 'phone',        icon: '📱', label: 'Phone' },
        { key: 'date_of_birth',icon: '🎂', label: 'DOB' },
        { key: 'city',         icon: '📍', label: 'City' },
        { key: 'fsc_marks',    icon: '📊', label: 'FSc marks' },
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
      const portalEmail2   = filledProfile?.portal_email || filledProfile?.email || '';
      const displayFullName2 = filledProfile?.full_name || portalEmail2 || '';
      const filledPassword = data.password || ctx2?.generatedPassword || '';

      const uniCfgFilled = (typeof getConfigForDomain === 'function') ? getConfigForDomain(window.location.hostname) : null;
      const isEmailSentCredFilled = uniCfgFilled?.credentialSystem === 'email_sent';

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
          <div class="um-btn-grid">
            <button class="btn-secondary" id="unimatch-save-progress">💾 Save</button>
            <button class="btn-secondary" id="unimatch-refill">🔄 Re-fill</button>
          </div>
          <button class="btn-primary um-btn-full-row" id="unimatch-review">📋 Pre-submit Check</button>
          <div class="um-safety-note">Alt+Shift+A to re-fill · Alt+Shift+R for review</div>
        </div>
      `;
      document.getElementById('unimatch-review')?.addEventListener('click', handlePreSubmitCheck);
      document.getElementById('unimatch-refill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-save-progress')?.addEventListener('click', handleSaveProgress);
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
    const masterPassword = await getConsistentPassword();

    // Animated progress bar
    const progressBar = buildProgressBar(contentEl);
    const totalFields = collectAllFields().length || 1;
    let processedFields = 0;
    const tickProgress = () => {
      processedFields++;
      if (progressBar) progressBar.style.width = `${Math.min(100, (processedFields / totalFields) * 100)}%`;
    };

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
          areaCode  = phoneStr.slice(2, 5);
          localNum  = phoneStr.slice(5);
        } else if (phoneStr.startsWith('0') && phoneStr.length >= 4) {
          areaCode  = phoneStr.slice(1, 4);
          localNum  = phoneStr.slice(4);
        } else {
          areaCode  = phoneStr.slice(0, 3);
          localNum  = phoneStr.slice(3);
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
            numInp  = tInputs[1];
            ccInp   = null;
          }

          let phoneSplitFilled = false;
          if (ccInp) { const ok = await fillInput(ccInp, countryCode); if (ok) { alreadyHandled.add(ccInp); ccInp.style.outline = '2px solid #4ade80'; ccInp.classList.add('unimatch-filled'); sparkleField(ccInp); filledCount++; phoneSplitFilled = true; } }
          if (areaInp) { const ok = await fillInput(areaInp, areaCode); if (ok) { alreadyHandled.add(areaInp); areaInp.style.outline = '2px solid #4ade80'; areaInp.classList.add('unimatch-filled'); sparkleField(areaInp); filledCount++; phoneSplitFilled = true; } }
          if (numInp) { const ok = await fillInput(numInp, localNum); if (ok) { alreadyHandled.add(numInp); numInp.style.outline = '2px solid #4ade80'; numInp.classList.add('unimatch-filled'); sparkleField(numInp); filledCount++; phoneSplitFilled = true; } }
        }
      }
    }

    // ─── TIER 3: Heuristic fallback for remaining fields ───────
    const allInputs = collectAllFields();

    for (const input of allInputs) {
      if (alreadyHandled.has(input)) continue;
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
        const normId   = normalizeSignal(input.id || '');
        const normSig  = normName + ' ' + normId + ' ' + sig;

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

      // Resolve value using profileValueFor helper
      let value = profileValueFor(profileKey, ctx.profile) ?? ctx.profile[profileKey];

      // Smart transforms
      if (profileKey === 'cnic' && value) {
        const cnicSig = ((input.name || '') + ' ' + (input.id || '') + ' ' + (input.className || '')).toLowerCase();
        const noDash = (input.maxLength === 13 ||
          cnicSig.includes('nodash') || cnicSig.includes('no_dash') ||
          cnicSig.includes('nondash') || cnicSig.includes('without_dash') ||
          cnicSig.includes('digits') || cnicSig.includes('cnic13'));
        value = noDash ? TRANSFORMS.cnic_no_dashes(value) : TRANSFORMS.cnic_dashes(value);
      }
      if ((profileKey === 'phone' || profileKey === 'whatsapp') && value) {
        value = TRANSFORMS.phone_pak(value);
      }
      if (profileKey === 'province' && (!value || value === '') && ctx.profile?.city) {
        value = CITY_TO_PROVINCE[String(ctx.profile.city).toLowerCase()] || '';
      }

      // Track conflicts (informational only — we still fill)
      if (input.value && input.value.trim() !== '' && value != null && value !== '') {
        const existNorm = String(input.value).toLowerCase().trim();
        const newNorm   = String(value).toLowerCase().trim();
        if (existNorm !== newNorm) conflictCount++;
      }

      if (value == null || value === '') {
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
      } else if (profileKey === 'date_of_birth') {
        filled = await fillDateAdvanced(input, String(ctx.profile.date_of_birth));
      } else {
        filled = await fillInput(input, String(value));
      }

      if (filled) {
        input.style.outline = '2px solid #4ade80';
        input.style.outlineOffset = '2px';
        input.classList.add('unimatch-filled');
        input.classList.remove('unimatch-conflict', 'unimatch-manual');
        sparkleField(input);
        playFillTone(filledCount, allInputs.length);
        filledCount++;
      } else if (input.required && !input.value) {
        input.style.outline = '2px solid #fbbf24';
        input.style.outlineOffset = '2px';
        input.classList.add('unimatch-manual');
        manualCount++;
      }
      alreadyHandled.add(input);
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
      }).catch(() => {});
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
  january:1, jan:1, february:2, feb:2, march:3, mar:3,
  april:4, apr:4, may:5, june:6, jun:6, july:7, jul:7,
  august:8, aug:8, september:9, sep:9, sept:9,
  october:10, oct:10, november:11, nov:11, december:12, dec:12,
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
  const d2 = `${next.getFullYear()}${pad(next.getMonth()+1)}${pad(next.getDate())}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${d1}/${d2}`, details: details || title });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function formatDeadlineDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
// Alt+Shift+A → Autofill | Alt+Shift+R → Pre-submit review
// Alt+Shift+S → Open/close sidebar

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey) return;

    switch (e.key.toUpperCase()) {
      case 'A': {
        e.preventDefault();
        // Open sidebar if collapsed
        const sidebar = document.getElementById('unimatch-sidebar');
        const toggle  = document.getElementById('unimatch-toggle');
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
