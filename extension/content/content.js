/**
 * UniMatch Content Script
 * Detects university portals, injects the sidebar, manages autofill + answer memory.
 */

// ─── University Domain Registry ────────────────────────────────

const UNIVERSITY_DOMAINS = {
  // ── TEST ENTRIES — safe to keep, sidebar only shows with a profile logged in ──
  'localhost': { slug: 'test', name: '🧪 Test Portal' },
  '127.0.0.1': { slug: 'test', name: '🧪 Test Portal' },
  // ──────────────────────────────────────────────────────────────────────────────
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
  // ── Email ──────────────────────────────────────────────────────
  { match: ['email', 'e-mail', 'e_mail', 'emailaddress', 'email_address', 'email_id', 'emailid',
    'student_email', 'applicant_email', 'user_email', 'contact_email', 'email_contact',
    'email address', 'your email', 'applicantemail', 'emailid', 'mail_id', 'mailid'],
    profileKey: 'email', priority: 10 },

  // ── CNIC / National ID ─────────────────────────────────────────
  { match: ['cnic', 'nic', 'national_id', 'nationalid', 'id_card', 'idcard', 'cnic_no', 'cnic_number',
    'b_form', 'bform', 'nicop', 'identity_card', 'id_number', 'id_no', 'national_identity',
    'nadra', 'id_card_no', 'nic_number', 'form_b', 'form-b', 'nicno', 'id card', 'cnicno',
    'national id', 'national identity card', 'cnic/nicop', 'identity_no', 'id_no'],
    profileKey: 'cnic', priority: 9 },

  // ── CNIC (no dashes) — maps to 'cnic' so Tier 3 transform strips dashes ──
  { match: ['cnic_no_dash', 'cnicnodash', 'cnic_without_dash', 'cnic_nodash', 'nic_no_dash',
    'cnic_digits', 'cnic13', 'nadra_no', 'cnicno_dash'],
    profileKey: 'cnic', priority: 9 },

  // ── Phone ──────────────────────────────────────────────────────
  { match: ['phone', 'mobile', 'cell', 'tel', 'telephone', 'phone_number', 'mobileno', 'contact_no',
    'mob_no', 'cell_no', 'cellno', 'mobile_no', 'contact_number', 'mobile_number', 'phone_no',
    'cell_number', 'phone_num', 'mob_num', 'ph_no', 'phno', 'contact_cell',
    'mobile number', 'phone number', 'cell number', 'mobile no', 'phone no',
    'contact mobile', 'applicant_phone', 'student_phone', 'applicant_mobile',
    'contact_mob', 'mob', 'contact_phone', 'personal_phone', 'personal_mobile'],
    profileKey: 'phone', priority: 8 },

  // ── WhatsApp ──────────────────────────────────────────────────
  { match: ['whatsapp', 'whatsapp_no', 'whatsapp_number', 'whatsapp number', 'wp_no',
    'whatsapp_mob', 'whatsapp_mobile', 'wp_number', 'wapp_no'],
    profileKey: 'whatsapp', priority: 7 },

  // ── First / Last / Middle — MUST be before full_name ──────────
  { match: ['first_name', 'firstname', 'fname', 'f_name', 'given_name', 'givenname',
    'f_nm', 'frst_nm', 'first_nm', 'applicant_fname', 'student_fname', 'sfname',
    'first name', 'given name', 'name1', 'first-name', 'forename', 'fore_name',
    'name_first', 'applicant_first', 'candidate_first_name'],
    profileKey: 'first_name', priority: 11 },

  { match: ['last_name', 'lastname', 'lname', 'l_name', 'surname', 'family_name', 'familyname',
    'l_nm', 'lst_nm', 'last_nm', 'applicant_lname', 'slname', 'sur_name', 'surename',
    'last name', 'family name', 'name2', 'last-name', 'name_last', 'candidate_last_name'],
    profileKey: 'last_name', priority: 11 },

  { match: ['middle_name', 'middlename', 'mname', 'm_name', 'middle_nm', 'mid_name',
    'middle name', 'middle-name', 'middle_initial', 'mid_nm'],
    profileKey: 'middle_name', priority: 11 },

  // ── Full Name ──────────────────────────────────────────────────
  { match: ['full_name', 'fullname', 'applicant_name', 'student_name', 'candidatename',
    'candidate_name', 'name_of_applicant', 'name_of_student', 'complete_name', 'full_nm',
    'full name', 'complete name', 'applicant name', 'student name', 'name of applicant',
    'yourname', 'your_name', 'applicantname', 'name_complete', 'complete_nm'],
    profileKey: 'full_name', priority: 7 },

  // ── Father / Guardian ──────────────────────────────────────────
  { match: ['father', 'father_name', 'fathername', 'fathers_name', 'fathersname', 'father_nm',
    "father's name", 'fathers name', 'dad_name', 'father_first_name',
    'guardian', 'guardian_name', 'parent_name', 'parentname',
    'wali', 'wali_name', 'father_full_name', 'sarparest'],
    profileKey: 'father_name', priority: 7 },

  // ── Father CNIC ────────────────────────────────────────────────
  { match: ['father_cnic', 'fathercnic', 'guardian_cnic', 'parent_cnic', 'father_nic',
    'father_id', 'father_id_card', 'father cnic', "father's cnic", 'dad_cnic', 'fcnic'],
    profileKey: 'father_cnic', priority: 6 },

  // ── Mother's Name ──────────────────────────────────────────────
  { match: ['mother_name', 'mothername', 'mothers_name', "mother's name", 'mom_name', 'mname',
    'mother', 'mother_full_name'],
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
    'birth_dd', 'birth_mm', 'birth_yyyy'],
    profileKey: 'date_of_birth', priority: 6 },

  // ── Gender ──────────────────────────────────────────────────────
  { match: ['gender', 'sex', 'gender_id', 'applicant_gender', 'student_gender', 'male_female',
    'gender_type', 'applicant_sex', 'gen'],
    profileKey: 'gender', priority: 5 },

  // ── Blood Group ────────────────────────────────────────────────
  { match: ['blood_group', 'bloodgroup', 'blood_type', 'bloodtype', 'blood group', 'blood type',
    'blood_grp', 'bg'],
    profileKey: 'blood_group', priority: 4 },

  // ── City ───────────────────────────────────────────────────────
  { match: ['city', 'town', 'city_name', 'resident_city', 'current_city', 'home_city',
    'city of residence', 'city_residence', 'applicant_city', 'domicile_city',
    'city_of_residence', 'residence_city', 'student_city'],
    profileKey: 'city', priority: 5 },

  // ── Province / Domicile ────────────────────────────────────────
  { match: ['province', 'state', 'domicile', 'domicile_province', 'province_name', 'region',
    'home_province', 'applicant_province', 'province of domicile', 'prov',
    'domicile_prov', 'province_of_domicile', 'residence_province'],
    profileKey: 'province', priority: 5 },

  // ── District ───────────────────────────────────────────────────
  { match: ['district', 'district_name', 'domicile_district', 'home_district', 'tehsil',
    'zila', 'district_of_domicile', 'dist'],
    profileKey: 'district', priority: 4 },

  // ── Address ────────────────────────────────────────────────────
  { match: ['address', 'postal_address', 'mailing_address', 'residential_address',
    'permanent_address', 'home_address', 'current_address', 'present_address',
    'local_address', 'street_address', 'street', 'addr', 'full_address',
    'correspondence_address', 'home address', 'mailing address', 'residence address',
    'permanent address', 'perm_address', 'res_address', 'applicant_address'],
    profileKey: 'address', priority: 4 },

  // ── Postal Code ────────────────────────────────────────────────
  { match: ['postal_code', 'postalcode', 'zipcode', 'zip', 'zip_code', 'post_code', 'postcode',
    'area_code', 'pincode', 'pin_code', 'postal code', 'zip code'],
    profileKey: 'postal_code', priority: 3 },

  // ── Nationality / Religion ─────────────────────────────────────
  { match: ['nationality', 'citizenship', 'country_of_citizenship', 'country', 'citizen',
    'applicant_nationality', 'national_status'],
    profileKey: 'nationality', priority: 3 },
  { match: ['religion', 'faith', 'religion_name', 'mazhab', 'deen', 'religious_affiliation'],
    profileKey: 'religion', priority: 3 },

  // ── Board ──────────────────────────────────────────────────────
  { match: ['board', 'board_name', 'boardname', 'examination_board', 'exam_board',
    'board_of_inter', 'hssc_board', 'inter_board', 'fsc_board', 'matric_board',
    'ssc_board', 'bise', 'board of intermediate', 'board of education',
    'board_of_education', 'board_exam', 'inter_board_name'],
    profileKey: 'board_name', priority: 4 },

  // ── School / College ───────────────────────────────────────────
  { match: ['school', 'college', 'school_name', 'institution', 'school_college', 'college_name',
    'last_institution', 'previous_institution', 'last_school', 'institution_name',
    'last_attended', 'school_attended', 'name of college', 'college attended',
    'college_name', 'school_college_name', 'intermediate_college', 'fsc_college',
    'hssc_college', 'last_college', 'attended_school'],
    profileKey: 'school_name', priority: 4 },

  // ── Passing Year ───────────────────────────────────────────────
  { match: ['passing_year', 'passingyear', 'year_of_passing', 'grad_year', 'graduation_year',
    'pass_year', 'year_passed', 'completion_year', 'exam_year', 'inter_year',
    'fsc_year', 'hssc_year', 'year of passing', 'passing year', 'ssc_year',
    'matric_year', 'year_of_completion', 'passing_yr'],
    profileKey: 'passing_year', priority: 4 },

  // ── Roll Number ────────────────────────────────────────────────
  { match: ['roll_number', 'rollnumber', 'roll_no', 'rollno', 'roll', 'exam_roll',
    'matric_roll', 'inter_roll', 'ssc_roll', 'hssc_roll', 'candidate_roll',
    'board_roll', 'roll_num', 'roll number', 'board roll no', 'roll_no_inter',
    'inter_roll_no', 'fsc_roll_no', 'hssc_roll_no', 'roll_no_ssc', 'ssc_roll_no'],
    profileKey: 'roll_number', priority: 5 },

  // ── FSc Marks (obtained) ───────────────────────────────────────
  { match: ['fsc_marks', 'fscmarks', 'hssc_marks', 'inter_marks', 'intermediate_marks',
    'fsc_obtained', 'inter_obtained', 'hssc_obtained', 'inter_obt_marks',
    'f_sc_marks', 'fsc_obt', 'inter_obt', 'total_marks_inter',
    'marks_obtained_inter', 'hssc_marks_obtained', 'intermarks', 'marks_inter',
    'fsc obtained marks', 'inter obtained', 'hssc obtained', 'marks_intermediate',
    'hsc_marks', 'hscmarks', 'inter_marks_obtained', 'fsc_total_obtained'],
    profileKey: 'fsc_marks', priority: 6 },

  // ── FSc Total ──────────────────────────────────────────────────
  { match: ['fsc_total', 'fsctotal', 'hssc_total', 'inter_total', 'total_marks_fsc',
    'total_fsc', 'fsc_max', 'inter_max', 'hssc_max', 'total_inter',
    'inter total marks', 'fsc total', 'hsc_total', 'intermediate_total',
    'hssc_total_marks', 'fsc_total_marks'],
    profileKey: 'fsc_total', priority: 5 },

  // ── FSc Percentage ─────────────────────────────────────────────
  { match: ['fsc_percentage', 'fscpercentage', 'inter_percentage', 'hssc_percentage',
    'fsc_pct', 'inter_pct', 'percentage_fsc', 'hssc_pct', 'intermediate_percentage',
    'fsc_percent', 'inter_percent'],
    profileKey: 'fsc_percentage', priority: 5 },

  // ── FSc Part-I marks ───────────────────────────────────────────
  { match: ['part1_marks', 'part_1_marks', 'fsc_part1', 'part1_obtained', 'partone_marks',
    'part_i_marks', 'year1_marks', 'part 1 marks', 'part-1 marks', 'part1marks',
    'part_one_marks', 'yr1_marks'],
    profileKey: 'fsc_part1_marks', priority: 6 },

  // ── Matric Marks ───────────────────────────────────────────────
  { match: ['matric_marks', 'matricmarks', 'ssc_marks', 'matric_obtained', 'ssc_obtained',
    'matric_obt', 'ssc_obt', 'marks_obtained_matric', 'marks_matric',
    'matric_obtained_marks', 'ssc_marks_obtained', 'marks_ssc',
    'matriculation_marks', 'matric obtained', 'ssc obtained marks',
    'class_10_marks', 'grade_10_marks', 'secondary_marks', 'ssc_obt_marks'],
    profileKey: 'matric_marks', priority: 6 },

  // ── Matric Total ───────────────────────────────────────────────
  { match: ['matric_total', 'matrictotal', 'ssc_total', 'total_marks_matric',
    'total_matric', 'matric_max', 'ssc_max', 'total_ssc', 'matriculation_total',
    'matric total', 'ssc total marks', 'secondary_total', 'class_10_total'],
    profileKey: 'matric_total', priority: 5 },

  // ── Matric Percentage ──────────────────────────────────────────
  { match: ['matric_percentage', 'matricpercentage', 'ssc_percentage', 'matric_pct',
    'matric_percent', 'ssc_pct', 'secondary_percentage'],
    profileKey: 'matric_percentage', priority: 5 },

  // ── NET / NTS Score ────────────────────────────────────────────
  { match: ['net_score', 'net_marks', 'netscore', 'net', 'nts_score', 'nts_marks',
    'entry_test', 'entry_test_score', 'entrance_score', 'entrance_marks', 'admission_test',
    'test_score', 'test_marks', 'merit_score', 'aggregate_score', 'entry_test_marks',
    'aggregate_marks', 'test_percentile', 'merit_aggregate', 'admission_test_score'],
    profileKey: 'net_score', priority: 5 },

  // ── ECAT Score ─────────────────────────────────────────────────
  { match: ['ecat_score', 'ecat_marks', 'ecat', 'engineering_test', 'enet_score'],
    profileKey: 'ecat_score', priority: 6 },

  // ── MCAT/MDCAT Score ──────────────────────────────────────────
  { match: ['mcat_score', 'mcat', 'mcat_marks', 'mdcat_score', 'mdcat', 'mdcat_marks',
    'medical_test', 'uhs_score'],
    profileKey: 'net_score', priority: 6 },

  // ── SAT Score ─────────────────────────────────────────────────
  { match: ['sat_score', 'sat', 'sat_marks', 'sat1', 'sat2'],
    profileKey: 'sat_score', priority: 6 },

  // ── GAT/GRE ───────────────────────────────────────────────────
  { match: ['gat_score', 'gat', 'gre_score', 'gre', 'gmat_score', 'gmat', 'ielts', 'toefl'],
    profileKey: 'net_score', priority: 4 },

  // ── Statement of Purpose ───────────────────────────────────────
  { match: ['statement_of_purpose', 'sop', 'personal_statement', 'essay', 'motivation_letter',
    'statement', 'why_join', 'why_apply', 'about_yourself', 'motivation', 'cover_letter',
    'statement of purpose', 'personal statement', 'application essay'],
    profileKey: 'statement_of_purpose', priority: 3 },
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
  const combined = allSignals.join(' ');
  if (EXCLUDED_FIELD_PATTERNS.some(p => combined.includes(p))) return null;

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
 * Find a registration/signup link on a login page (legacy stub — delegates to new implementation below).
 */

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
  if (!value && value !== 0) return false;
  const val = String(value).toLowerCase().trim();
  const options = Array.from(el.options);

  // 1. Exact value match (case-insensitive)
  let match = options.find(o => o.value.toLowerCase() === val);
  // 2. Exact text match
  if (!match) match = options.find(o => o.text.toLowerCase().trim() === val);
  // 3. If numeric value, also try month name (handles month selects)
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
        options.find(o => o.value === String(numVal).padStart(2, '0'));
    }
  }
  // 4. Strip leading zeros and retry
  if (!match && val.startsWith('0')) {
    const stripped = val.replace(/^0+/, '');
    match = options.find(o => o.value.toLowerCase() === stripped) ||
            options.find(o => o.text.toLowerCase().trim() === stripped);
  }
  // 5. Partial text match (option text contains value or vice versa — only for longer strings)
  if (!match && val.length >= 3) {
    match = options.find(o => o.text.toLowerCase().includes(val) || val.includes(o.text.toLowerCase().trim()));
  }

  if (match) {
    el.value = match.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
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
  for (const s of selects) {
    const sig = (s.name + ' ' + s.id + ' ' + (s.className || '')).toLowerCase();
    if (/(^|_|-)day($|_|-)|^dd$|_dd$/.test(sig) && !daySel) { daySel = s; continue; }
    if (/(^|_|-)month($|_|-)|^mm$|_mm$/.test(sig) && !monthSel) { monthSel = s; continue; }
    if (/(^|_|-)year($|_|-)|^yy$|_yy$|yyyy/.test(sig) && !yearSel) { yearSel = s; continue; }
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
  });

  if (!isExtensionValid()) {
    showRefreshNeeded(contentEl);
    return;
  }

  // On the IlmSeUrooj site itself, silently pull the real Supabase session
  // from localStorage and send it to the background — zero manual steps.
  if (isOnIlmSeUroojSite()) {
    renderState(contentEl, 'loading');
    await tryAutoConnectFromSite();
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

// ─── Progress Bar Helper ───────────────────────────────────────

function buildProgressBar(container) {
  // renderState('loading') already includes the bar; just return the element
  if (!container) return null;
  return document.getElementById('unimatch-progress');
}

// ─── Inline Profile Editor ─────────────────────────────────────

function showProfileEditor(container) {
  container.innerHTML = `
    <div class="state-card" style="padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong style="color:#c084fc;font-size:13px">✏️ Enter Your Profile</strong>
        <button id="um-editor-back" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:18px">←</button>
      </div>
      <div style="display:grid;gap:6px;max-height:420px;overflow-y:auto;padding-right:4px">
        ${[
          ['full_name','Full Name','text','Muhammad Ali Khan'],
          ['father_name',"Father's Name",'text','Ahmad Ali Khan'],
          ['cnic','CNIC','text','35201-1234567-3'],
          ['date_of_birth','Date of Birth','date',''],
          ['gender','Gender','select:male,female',''],
          ['email','Email','email',''],
          ['phone','Phone','tel','03001234567'],
          ['city','City','text','Lahore'],
          ['province','Province','select:Punjab,Sindh,Khyber Pakhtunkhwa,Balochistan,Islamabad,Azad Kashmir,Gilgit-Baltistan',''],
          ['address','Address','text',''],
          ['postal_code','Postal Code','text',''],
          ['matric_marks','Matric Marks','number',''],
          ['matric_total','Matric Total','number','1050'],
          ['fsc_marks','FSc Marks','number',''],
          ['fsc_total','FSc Total','number','1100'],
          ['board_name','Board Name','text','FBISE'],
          ['passing_year','Passing Year','number','2024'],
          ['roll_number','Board Roll No','text',''],
          ['school_name','School/College','text',''],
          ['net_score','NET/Entry Test Score','number',''],
          ['blood_group','Blood Group','select:A+,A-,B+,B-,O+,O-,AB+,AB-',''],
          ['religion','Religion','text','Islam'],
          ['nationality','Nationality','text','Pakistani'],
        ].map(([key, label, type, placeholder]) => {
          const isSelect = type.startsWith('select:');
          const opts = isSelect ? type.slice(7).split(',') : [];
          return `<div style="display:grid;gap:2px">
            <label style="font-size:10px;color:#a1a1aa">${label}</label>
            ${isSelect
              ? `<select id="ume_${key}" style="background:#0c1a0d;border:1px solid #1f2a1c;color:#e4e4e7;border-radius:6px;padding:5px 8px;font-size:11px;width:100%">
                   <option value="">-- Select --</option>
                   ${opts.map(o => `<option value="${o}">${o}</option>`).join('')}
                 </select>`
              : `<input id="ume_${key}" type="${type}" placeholder="${placeholder}"
                   style="background:#0c1a0d;border:1px solid #1f2a1c;color:#e4e4e7;border-radius:6px;padding:5px 8px;font-size:11px;width:100%;box-sizing:border-box">`
            }
          </div>`;
        }).join('')}
      </div>
      <button id="um-editor-save" style="margin-top:10px;width:100%;padding:10px;background:linear-gradient(135deg,#16a34a,#4ade80);border:none;color:#fff;font-weight:700;border-radius:8px;cursor:pointer;font-size:12px">
        💾 Save & Autofill
      </button>
    </div>
  `;

  // Pre-fill with existing data if any
  chrome.storage.local.get('unimatch_profile').then(res => {
    const p = res.unimatch_profile || {};
    for (const [key] of [['full_name'],['father_name'],['cnic'],['date_of_birth'],['gender'],['email'],['phone'],['city'],['province'],['address'],['postal_code'],['matric_marks'],['matric_total'],['fsc_marks'],['fsc_total'],['board_name'],['passing_year'],['roll_number'],['school_name'],['net_score'],['blood_group'],['religion'],['nationality']]) {
      const el = document.getElementById(`ume_${key}`);
      if (el && p[key] != null) el.value = p[key];
    }
  }).catch(() => {});

  document.getElementById('um-editor-back')?.addEventListener('click', () => {
    renderState(container, 'not_logged_in');
  });

  document.getElementById('um-editor-save')?.addEventListener('click', async () => {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const getN = id => { const v = get(id); return v ? Number(v) : undefined; };

    const profile = {
      full_name: get('ume_full_name'),
      father_name: get('ume_father_name'),
      cnic: get('ume_cnic'),
      date_of_birth: get('ume_date_of_birth'),
      gender: get('ume_gender'),
      email: get('ume_email'),
      phone: get('ume_phone'),
      city: get('ume_city'),
      province: get('ume_province'),
      address: get('ume_address'),
      postal_code: get('ume_postal_code'),
      matric_marks: getN('ume_matric_marks'),
      matric_total: getN('ume_matric_total') || 1050,
      fsc_marks: getN('ume_fsc_marks'),
      fsc_total: getN('ume_fsc_total') || 1100,
      board_name: get('ume_board_name'),
      passing_year: getN('ume_passing_year'),
      roll_number: get('ume_roll_number'),
      school_name: get('ume_school_name'),
      net_score: getN('ume_net_score'),
      blood_group: get('ume_blood_group'),
      religion: get('ume_religion'),
      nationality: get('ume_nationality'),
      inter_status: 'complete',
      education_system: 'pakistan',
    };

    // Derive first/last names from full_name
    if (profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      profile.first_name = parts[0] || '';
      profile.last_name = parts.length > 1 ? parts[parts.length - 1] : '';
      profile.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
    }

    await chrome.storage.local.set({
      unimatch_token: 'real_token',
      token_expiry: Date.now() + 86400000 * 30,
      unimatch_profile: profile,
    });
    window.location.reload();
  });
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

    case 'not_logged_in': {
      const onSite = isOnIlmSeUroojSite();
      container.innerHTML = `
        <div class="state-card">
          <div class="state-icon">🔒</div>
          <h3>${onSite ? 'Connecting your profile…' : 'Sign in to autofill this form.'}</h3>
          <p>${onSite
            ? 'You\'re on the IlmSeUrooj website. Click below to connect your logged-in account.'
            : 'Connect your profile to autofill university applications.'}</p>
          ${onSite
            ? `<button class="btn-primary" id="unimatch-signin" style="background:#4ade80;color:#0c0e0b">
                 🔄 Connect My Real Profile
               </button>`
            : `<button class="btn-primary" id="unimatch-signin">Sign In to UniMatch</button>`
          }
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1f2a1c">
            <p style="font-size:11px;color:#52525b;margin-bottom:8px">— or enter profile directly —</p>
            <button class="btn-secondary" id="unimatch-load-demo" style="width:100%;font-size:11px;padding:8px;margin-bottom:6px">
              ⚡ Load Demo Profile
            </button>
            <button class="btn-secondary" id="unimatch-open-editor" style="width:100%;font-size:11px;padding:8px;background:rgba(168,85,247,0.1);border-color:rgba(168,85,247,0.3);color:#c084fc">
              ✏️ Enter My Real Profile
            </button>
          </div>
        </div>
      `;
      document.getElementById('unimatch-signin')?.addEventListener('click', async () => {
        if (isOnIlmSeUroojSite()) {
          // Try direct auto-connect first (reads localStorage Supabase session)
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
      document.getElementById('unimatch-load-demo')?.addEventListener('click', async () => {
        await chrome.storage.local.set({
          unimatch_token: 'demo_token',
          token_expiry: Date.now() + 86400000 * 30,
          unimatch_profile: {
            full_name: 'Muhammad Ali Khan',
            first_name: 'Muhammad',
            last_name: 'Khan',
            middle_name: 'Ali',
            father_name: 'Ahmad Ali Khan',
            mother_name: 'Ayesha Begum',
            cnic: '35201-1234567-3',
            father_cnic: '35201-7654321-5',
            date_of_birth: '2003-05-15',
            gender: 'male',
            blood_group: 'O+',
            religion: 'Islam',
            nationality: 'Pakistani',
            email: 'muhammad.ali.khan@gmail.com',
            phone: '03001234567',
            whatsapp: '03001234567',
            city: 'Lahore',
            district: 'Lahore',
            province: 'Punjab',
            domicile_province: 'Punjab',
            postal_code: '54000',
            address: 'House 12, Street 4, Gulberg III, Lahore',
            matric_marks: 980,
            matric_total: 1050,
            matric_percentage: '93.3',
            fsc_marks: 1020,
            fsc_total: 1100,
            fsc_percentage: '92.7',
            board_name: 'FBISE',
            passing_year: 2024,
            roll_number: 'F-123456',
            school_name: 'F.G. Degree College H-9, Islamabad',
            net_score: 185,
            ecat_score: 780,
            sat_score: 1320,
            profile_completion: 95,
            inter_status: 'complete',
            education_system: 'pakistan',
            statement_of_purpose: 'I am a passionate and dedicated student with a strong academic record. I believe that higher education is the key to personal and professional growth. I have always excelled in mathematics and sciences, and I am eager to pursue my degree at this prestigious institution. My goal is to contribute meaningfully to Pakistan\'s technological advancement by applying the knowledge and skills I acquire here.'
          }
        });
        window.location.reload();
      });
      document.getElementById('unimatch-open-editor')?.addEventListener('click', () => {
        showProfileEditor(container);
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
          <div style="font-size:13px;font-weight:600;color:#e4e4e7;margin-bottom:10px">⚡ Filling form...</div>
          <div style="height:4px;background:#1f2a1c;border-radius:2px;overflow:hidden;margin-bottom:12px">
            <div id="unimatch-progress" style="height:100%;width:0%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:2px;transition:width 0.2s ease"></div>
          </div>
          <p style="font-size:11px;color:#71717a">Detecting and filling all form fields...</p>
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

      // ── Profile quick-view rows (what WILL actually be filled) ──
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
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#a1a1aa">${r.icon} ${r.label}</span>
          <span style="color:${hasVal ? '#e4e4e7' : '#52525b'};font-family:monospace;font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${display}</span>
        </div>`;
      }).join('');

      // ── Gap warnings (profile fields missing that form likely needs) ──
      const gaps = PROFILE_ROWS.filter(r => !profile?.[r.key]).map(r => r.label);
      const gapHTML = gaps.length
        ? `<div style="margin-top:8px;padding:6px 8px;background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.2);border-radius:6px;font-size:10px;color:#fbbf24">
            ⚠ Missing: ${gaps.join(' · ')}
           </div>`
        : '';

      // ── Marks warning ────────────────────────────────────────────
      const marksWarning = isProjected
        ? '<div style="font-size:10px;color:#fbbf24;margin-top:6px;padding:4px 8px;background:rgba(251,191,36,0.08);border-radius:6px">⚠ Using projected marks from Part-I</div>'
        : isCambridge
        ? '<div style="font-size:10px;color:#60a5fa;margin-top:6px;padding:4px 8px;background:rgba(96,165,250,0.08);border-radius:6px">ℹ Using IBCC equivalence %</div>'
        : '';

      // ── Login/Register page context card ────────────────────────
      const portalEmail   = profile?.portal_email || profile?.email || '';
      const portalUser    = generatePortalUsername(profile);
      const regLink       = findRegisterLink();

      const loginRegisterCard = (pageType === 'login') ? `
        <div style="background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#4ade80;margin-bottom:8px">🔑 Login Page — Credentials Ready</div>
          <div style="font-size:10px;color:#a1a1aa;margin-bottom:6px">UniMatch will fill these when you click Autofill:</div>
          <div style="font-size:11px;background:#0c0e0b;border-radius:6px;padding:8px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="color:#71717a">Username/Email:</span>
              <span style="color:#e4e4e7;font-family:monospace;max-width:140px;overflow:hidden;text-overflow:ellipsis">${portalEmail || portalUser}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:#71717a">Password:</span>
              <span style="color:#4ade80">●●●●●●●●●● (saved)</span>
            </div>
          </div>
          ${regLink
            ? `<button id="unimatch-goto-register" style="width:100%;padding:7px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:7px;color:#4ade80;font-size:11px;cursor:pointer;font-family:inherit">📝 No account yet? Create Account →</button>`
            : `<button id="unimatch-goto-register" style="width:100%;padding:7px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:7px;color:#4ade80;font-size:11px;cursor:pointer;font-family:inherit">📝 Find Registration Page →</button>`
          }
        </div>
      ` : (pageType === 'register') ? `
        <div style="background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:6px">📝 Registration Page — Ready to Create Account</div>
          <div style="font-size:10px;color:#a1a1aa;margin-bottom:6px">UniMatch will fill your complete profile including:</div>
          <div style="font-size:10px;color:#e4e4e7;line-height:1.7">
            ✓ Full name, CNIC, DOB, gender<br>
            ✓ Email: <span style="color:#4ade80;font-family:monospace">${portalEmail}</span><br>
            ✓ Username: <span style="color:#4ade80;font-family:monospace">${portalUser}</span><br>
            ✓ Password + Confirm Password (same)<br>
            ✓ Phone, address, marks, test scores
          </div>
        </div>
      ` : '';

      container.innerHTML = `
        <div class="state-card">
          <div class="profile-info" style="margin-bottom:10px">
            <div class="avatar" style="flex-shrink:0">${displayName.charAt(0).toUpperCase()}</div>
            <div style="flex:1;min-width:0">
              <strong style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${displayName}</strong>
              <span class="profile-pct">${completeness}% profile complete</span>
            </div>
            <div style="flex-shrink:0">
              <svg width="28" height="28" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1f2a1c" stroke-width="3"/>
                <circle cx="18" cy="18" r="15" fill="none" stroke="#4ade80" stroke-width="3"
                  stroke-dasharray="${(completeness / 100) * 94.2} 94.2"
                  stroke-linecap="round" transform="rotate(-90 18 18)"/>
                <text x="18" y="22" text-anchor="middle" font-size="9" fill="#4ade80" font-family="monospace">${completeness}%</text>
              </svg>
            </div>
          </div>

          ${loginRegisterCard}

          ${program ? `<div style="font-size:10px;color:#a855f7;padding:4px 8px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:6px;margin-bottom:8px">📋 ${program}</div>` : ''}

          <details style="margin-bottom:8px">
            <summary style="font-size:11px;color:#71717a;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;padding:4px 0">
              <span>Profile preview</span>
              <span style="color:#4ade80;font-size:9px">▼ expand</span>
            </summary>
            <div style="margin-top:6px;padding:4px 0">${previewRows}</div>
          </details>

          ${gapHTML}
          ${marksWarning}

          <div id="unimatch-suggestions" style="margin-top:8px"></div>

          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn-secondary" id="unimatch-refresh-profile" style="flex:1;font-size:10px;padding:5px">🔄 Refresh Profile</button>
            <button class="btn-secondary" id="unimatch-edit-profile" style="flex:1;font-size:10px;padding:5px">✏️ Edit Profile</button>
          </div>

          <button class="btn-primary btn-autofill" id="unimatch-autofill" style="margin-top:10px;position:relative;overflow:hidden">
            <span style="position:relative;z-index:1">&#9889; Autofill Now</span>
            <span style="position:relative;z-index:1;font-size:9px;opacity:0.5;margin-left:6px">Alt+Shift+A</span>
          </button>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
            <button class="btn-secondary" id="unimatch-scan" style="font-size:11px">&#128269; Scan</button>
            <button class="btn-secondary" id="unimatch-review-btn" style="font-size:11px">&#128203; Review</button>
          </div>
          <button class="btn-secondary" id="unimatch-timeline-btn" style="font-size:11px;width:100%;margin-top:6px">&#128197; View Timeline</button>
          <div style="margin-top:8px;padding:6px 8px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.1);border-radius:6px;font-size:9px;color:#52525b;text-align:center;line-height:1.4">
            &#128274; Never auto-submits &middot; Only you submit
          </div>
        </div>
      `;

      // Smart suggestions
      const suggestions = buildSmartSuggestions(pageType, data.university);
      const suggestionsEl = document.getElementById('unimatch-suggestions');
      if (suggestionsEl && suggestions.length > 0) {
        suggestionsEl.innerHTML = suggestions.map(s => `
          <div style="padding:7px 10px;margin-bottom:5px;background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.12);border-radius:7px;font-size:11px;line-height:1.4">
            <span>${s.icon}</span> ${s.text}
            ${s.sub ? `<div style="margin-top:2px;font-size:10px;color:#a1a1aa">${s.sub}</div>` : ''}
          </div>
        `).join('');
      }

      document.getElementById('unimatch-autofill')?.addEventListener('click', handleAutofill);
      document.getElementById('unimatch-scan')?.addEventListener('click', handleScanFields);
      document.getElementById('unimatch-review-btn')?.addEventListener('click', handlePreSubmitCheck);
      document.getElementById('unimatch-goto-register')?.addEventListener('click', handleGoToRegister);

      document.getElementById('unimatch-timeline-btn')?.addEventListener('click', async () => {
        try {
          const base = await chrome.runtime.sendMessage({ type: 'GET_SITE_BASE' });
          window.open((base?.url || 'http://localhost:3000') + '/timeline', '_blank');
        } catch { window.open('http://localhost:3000/timeline', '_blank'); }
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

      document.getElementById('unimatch-edit-profile')?.addEventListener('click', () => {
        showProfileEditor(container);
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
      const portalUser2    = generatePortalUsername(filledProfile);
      const filledPassword = data.password || ctx2?.generatedPassword || '';

      // Show credential summary on login/register pages so user knows what was filled
      const credSummary = (pageType === 'login' || pageType === 'register') ? `
        <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:10px;margin-top:10px;font-size:10px">
          <div style="font-weight:600;color:#4ade80;margin-bottom:6px">📋 ${pageType === 'register' ? 'Account Created With:' : 'Filled Credentials:'}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="color:#71717a">${pageType === 'register' ? 'Username:' : 'Email/User:'}</span>
            <span style="color:#e4e4e7;font-family:monospace;max-width:160px;overflow:hidden;text-overflow:ellipsis">${pageType === 'register' ? portalUser2 : (portalEmail2 || portalUser2)}</span>
          </div>
          ${portalEmail2 && pageType === 'register' ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#71717a">Email:</span><span style="color:#e4e4e7;font-family:monospace;max-width:160px;overflow:hidden;text-overflow:ellipsis">${portalEmail2}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#71717a">Password:</span>
            <div style="display:flex;gap:4px;align-items:center">
              <span id="pw-display" style="color:#e4e4e7;font-family:monospace;font-size:9px">●●●●●●●●</span>
              <button id="pw-reveal" style="background:none;border:none;color:#4ade80;font-size:9px;cursor:pointer;padding:0">Show</button>
              <button id="pw-copy" style="background:none;border:none;color:#60a5fa;font-size:9px;cursor:pointer;padding:0">Copy</button>
            </div>
          </div>
        </div>
        ${pageType === 'register' ? `<div style="margin-top:8px;padding:6px 8px;background:rgba(251,191,36,0.06);border-radius:6px;font-size:9px;color:#fbbf24">⚠ Save these credentials! You need them to log back in later.</div>` : ''}
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
            ${data.conflicts > 0 ? `<div class="stat-row" style="margin-top:2px">
              <span style="width:8px;height:8px;border-radius:50%;background:#60a5fa;display:inline-block;margin-right:6px;flex-shrink:0"></span>
              <span style="color:#60a5fa"><strong>${data.conflicts}</strong> conflicts skipped</span>
            </div>` : ''}
          </div>
          ${credSummary}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
            <button class="btn-secondary" id="unimatch-save-progress" style="font-size:11px">💾 Save</button>
            <button class="btn-secondary" id="unimatch-refill" style="font-size:11px">🔄 Re-fill</button>
          </div>
          <button class="btn-primary btn-review" id="unimatch-review" style="margin-top:6px;width:100%">📋 Pre-submit Check</button>
          <p style="font-size:9px;color:#52525b;text-align:center;margin-top:8px">Alt+Shift+A to re-fill · Alt+Shift+R for review</p>
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
          // Resolve value — virtual keys derive from profile fields
          let rawValue;
          if (['first_name', 'last_name', 'middle_name'].includes(profileKey)) {
            const fullName = ctx.profile?.full_name;
            rawValue = fullName ? TRANSFORMS[profileKey](fullName) : '';
          } else if (profileKey === 'portal_password') {
            rawValue = masterPassword; // Always use the consistent master password
          } else if (profileKey === 'portal_username') {
            rawValue = generatePortalUsername(ctx.profile);
          } else {
            rawValue = ctx.profile?.[profileKey];
            // For portal_email, fall back to email if not set
            if (profileKey === 'portal_email' && !rawValue) rawValue = ctx.profile?.email;
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

    // ─── TIER 2.5: Explicit three-part date group scan ─────────
    // Guaranteed fill for .date-group containers regardless of name heuristics
    if (ctx.profile.date_of_birth) {
      const dateGrps = document.querySelectorAll(
        '.date-group, .dob-group, [class*="date-group"], [class*="dob-group"],' +
        '[class*="date-field"], [class*="dob-field"], [class*="birth-date"]'
      );
      for (const grp of dateGrps) {
        const grpSelects = grp.querySelectorAll('select');
        if (grpSelects.length >= 2) {
          const dDate = new Date(ctx.profile.date_of_birth + 'T00:00:00');
          if (!isNaN(dDate.getTime())) {
            const grpFilled = await tryThreePartSelects(grp, dDate.getDate(), dDate.getMonth() + 1, dDate.getFullYear());
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

      // Username / Login ID / User ID fields — fill with CNIC (no dashes) or email
      {
        const sig = buildFieldSignature(input);
        const isUsernameField = /\b(username|user_?name|login_?id|user_?id|loginid|userid|applicant_?id|student_?id|reg_?no|registration_?no|login_?name)\b/.test(sig);
        if (isUsernameField) {
          const usernameValue = generatePortalUsername(ctx.profile);
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

        // Login email field (on login pages: input that looks like an email/login field)
        const isLoginEmailField = /\b(login|sign_?in_?email|user_?email|account_?email)\b/.test(sig);
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

      // Resolve value
      let value;
      if (['first_name', 'last_name', 'middle_name'].includes(profileKey)) {
        const fullName = ctx.profile.full_name;
        value = fullName ? TRANSFORMS[profileKey](fullName) : '';
      } else {
        value = ctx.profile[profileKey];
      }

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
