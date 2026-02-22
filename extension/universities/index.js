/**
 * Ilm Se Urooj — University Config Registry
 * 
 * Imports all per-university configs and provides domain-based lookup.
 * Note: Using plain objects (not ES modules) since Chrome MV3 content scripts
 * don't support ES module imports. This file is loaded as a regular script.
 */

// All university configs — each has: slug, name, portalDomains, fieldMap, etc.
const ALL_UNIVERSITIES = [];

// ─── University Configurations ─────────────────────────────────────
// Each config is inlined here since Chrome content scripts don't support imports.

ALL_UNIVERSITIES.push({
    slug: 'nust', name: 'NUST',
    fullName: 'National University of Sciences and Technology',
    registrationUrl: 'https://ugadmissions.nust.edu.pk',
    loginUrl: 'https://ugadmissions.nust.edu.pk',
    portalDomains: ['ugadmissions.nust.edu.pk', 'pgadmission.nust.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="applicant_name"], [name="fullName"], #applicant_name, #fullName',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic, #cnic_no',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="mobile"], [name="phone"], [name="cell"], #mobile, #phone',
        address: '[name="address"], [name="permanent_address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], [name="domicile"], #province',
        postal_code: '[name="postal_code"], [name="zip"], #postal_code',
        fsc_marks: '[name="fsc_marks"], [name="hssc_marks"], #fsc_marks',
        fsc_total: '[name="fsc_total"], [name="hssc_total"], #fsc_total',
        matric_marks: '[name="matric_marks"], [name="ssc_marks"], #matric_marks',
        matric_total: '[name="matric_total"], [name="ssc_total"], #matric_total',
        board_name: '[name="board"], [name="board_name"], #board',
        passing_year: '[name="passing_year"], [name="year"], #passing_year',
        net_score: '[name="net_score"], [name="test_score"], #net_score',
        domicile_province: '[name="domicile"], [name="domicile_province"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad', gilgit_baltistan: 'Gilgit-Baltistan', azad_kashmir: 'Azad Jammu & Kashmir' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Portal returns 403. Login-first system.'
});

ALL_UNIVERSITIES.push({
    slug: 'fast', name: 'FAST-NU',
    fullName: 'National University of Computer and Emerging Sciences',
    registrationUrl: 'https://admissions.nu.edu.pk',
    loginUrl: 'https://admissions.nu.edu.pk',
    portalDomains: ['admissions.nu.edu.pk', 'nu.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="applicantName"], [name="fullName"], #name, #applicantName',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="mobile"], [name="phone"], [name="cellNo"], #mobile, #phone',
        address: '[name="address"], [name="permanentAddress"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], [name="fscTotal"], #hscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], [name="matricTotal"], #sscTotal',
        board_name: '[name="board"], [name="boardName"], #board',
        passing_year: '[name="passingYear"], [name="year"], #passingYear',
        sat_score: '[name="satScore"], [name="sat"], #satScore',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'React-based login portal. Native setter + events critical.'
});

ALL_UNIVERSITIES.push({
    slug: 'comsats', name: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    registrationUrl: 'https://admissions.comsats.edu.pk',
    loginUrl: 'https://admissions.comsats.edu.pk',
    portalDomains: ['admissions.comsats.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="Name"], [name="ApplicantName"], [name="name"], #Name, #ApplicantName',
        father_name: '[name="FatherName"], [name="fatherName"], #FatherName',
        cnic: '[name="CNIC"], [name="cnic"], #CNIC',
        date_of_birth: '[name="DOB"], [name="dob"], #DOB',
        gender: '[name="Gender"], [name="gender"], #Gender',
        email: '[name="Email"], [type="email"], #Email',
        phone: '[name="Mobile"], [name="Phone"], [name="ContactNo"], #Mobile, #Phone',
        address: '[name="Address"], [name="PermanentAddress"], #Address',
        city: '[name="City"], #City',
        province: '[name="Province"], #Province',
        postal_code: '[name="PostalCode"], #PostalCode',
        fsc_marks: '[name="HSSCMarks"], [name="FSCMarks"], #HSSCMarks',
        fsc_total: '[name="HSSCTotal"], [name="FSCTotal"], #HSSCTotal',
        matric_marks: '[name="SSCMarks"], [name="MatricMarks"], #SSCMarks',
        matric_total: '[name="SSCTotal"], [name="MatricTotal"], #SSCTotal',
        board_name: '[name="Board"], [name="BoardName"], #Board',
        passing_year: '[name="PassingYear"], #PassingYear',
        domicile_province: '[name="Domicile"], #Domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'ASP.NET style PascalCase field names. Signup has Name, Email, Password.'
});

ALL_UNIVERSITIES.push({
    slug: 'lums', name: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    registrationUrl: 'https://admissions.lums.edu.pk',
    loginUrl: 'https://admissions.lums.edu.pk',
    portalDomains: ['admissions.lums.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="fullName"], [name="name"], [name="applicantName"], #fullName',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="contactNo"], #phone',
        address: '[name="address"], [name="permanentAddress"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], [name="fscTotal"], #hscTotal',
        fsc_percentage: '[name="hscPercentage"], [name="fscPercentage"], #hscPercentage',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], [name="matricTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        sat_score: '[name="satScore"], [name="sat"], #satScore',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'SAT scores accepted. LCAT test scores may have additional field.'
});

ALL_UNIVERSITIES.push({
    slug: 'iba', name: 'IBA',
    fullName: 'Institute of Business Administration',
    registrationUrl: 'https://onlineadmission.iba.edu.pk',
    loginUrl: 'https://onlineadmission.iba.edu.pk',
    portalDomains: ['onlineadmission.iba.edu.pk', 'admissions.iba.edu.pk', 'iba.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="full_name"], [name="name"], [name="applicant_name"], #full_name, #name',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="contact_no"], #phone, #mobile',
        address: '[name="address"], [name="permanent_address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hssc_marks"], [name="fsc_marks"], #hssc_marks',
        fsc_total: '[name="hssc_total"], [name="fsc_total"], #hssc_total',
        matric_marks: '[name="ssc_marks"], [name="matric_marks"], #ssc_marks',
        matric_total: '[name="ssc_total"], [name="matric_total"], #ssc_total',
        board_name: '[name="board"], [name="board_name"], #board',
        passing_year: '[name="passing_year"], #passing_year',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Apply Online links to onlineadmission.iba.edu.pk.'
});

ALL_UNIVERSITIES.push({
    slug: 'giki', name: 'GIKI',
    fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    registrationUrl: 'https://giki.edu.pk/admissions',
    loginUrl: null,
    portalDomains: ['giki.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="full_name"], [name="applicant_name"], #name',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fsc_marks"], [name="hssc_marks"], #fsc_marks',
        fsc_total: '[name="fsc_total"], [name="hssc_total"], #fsc_total',
        matric_marks: '[name="matric_marks"], [name="ssc_marks"], #matric_marks',
        matric_total: '[name="matric_total"], [name="ssc_total"], #matric_total',
        board_name: '[name="board"], #board',
        passing_year: '[name="passing_year"], #passing_year',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Info page. Application form on separate portal during season.'
});

ALL_UNIVERSITIES.push({
    slug: 'pieas', name: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    registrationUrl: 'https://red.pieas.edu.pk/pieasadmission/lgn.aspx',
    loginUrl: 'https://red.pieas.edu.pk/pieasadmission/lgn.aspx',
    portalDomains: ['red.pieas.edu.pk', 'pieas.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name$="txtName"], [name$="txtFullName"], [id$="txtName"]',
        father_name: '[name$="txtFatherName"], [id$="txtFatherName"]',
        cnic: '#txtRegNo, [name$="txtCNIC"], [name$="txtCnic"], [id$="txtCNIC"]',
        date_of_birth: '[name$="txtDOB"], [id$="txtDOB"]',
        gender: '[name$="ddlGender"], [id$="ddlGender"]',
        email: '[name$="txtEmail"], [id$="txtEmail"], [type="email"]',
        phone: '[name$="txtMobile"], [name$="txtPhone"], [id$="txtMobile"]',
        address: '[name$="txtAddress"], [id$="txtAddress"]',
        city: '[name$="txtCity"], [name$="ddlCity"], [id$="txtCity"]',
        province: '[name$="ddlProvince"], [id$="ddlProvince"]',
        fsc_marks: '[name$="txtFSCMarks"], [name$="txtHSSCMarks"], [id$="txtFSCMarks"]',
        fsc_total: '[name$="txtFSCTotal"], [id$="txtFSCTotal"]',
        matric_marks: '[name$="txtSSCMarks"], [name$="txtMatricMarks"], [id$="txtSSCMarks"]',
        matric_total: '[name$="txtSSCTotal"], [id$="txtSSCTotal"]',
        board_name: '[name$="ddlBoard"], [id$="ddlBoard"]',
        passing_year: '[name$="txtPassingYear"], [name$="ddlPassingYear"], [id$="txtPassingYear"]',
        domicile_province: '[name$="ddlDomicile"], [id$="ddlDomicile"]',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'ASP.NET WebForms. Uses $-suffix selectors for dynamic IDs.'
});

ALL_UNIVERSITIES.push({
    slug: 'ned', name: 'NED',
    fullName: 'NED University of Engineering & Technology',
    registrationUrl: 'https://www.neduet.edu.pk/admission',
    loginUrl: null,
    portalDomains: ['neduet.edu.pk', 'admission.neduet.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="full_name"], [name="applicant_name"], #name',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="contact"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hssc_marks"], [name="fsc_marks"], #hssc_marks',
        fsc_total: '[name="hssc_total"], [name="fsc_total"], #hssc_total',
        matric_marks: '[name="ssc_marks"], [name="matric_marks"], #ssc_marks',
        matric_total: '[name="ssc_total"], [name="matric_total"], #ssc_total',
        board_name: '[name="board"], #board',
        passing_year: '[name="passing_year"], #passing_year',
        ecat_score: '[name="ecat_score"], [name="test_score"], #ecat_score',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Portal opens in April. NED conducts own entry test.'
});

ALL_UNIVERSITIES.push({
    slug: 'habib', name: 'Habib University',
    fullName: 'Habib University',
    registrationUrl: 'https://eapplication.habib.edu.pk/Description.html',
    loginUrl: 'https://eapplication.habib.edu.pk',
    portalDomains: ['eapplication.habib.edu.pk', 'habib.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="applicant_name"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], #hscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        sat_score: '[name="satScore"], #satScore',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Login page accessible. Create Account at /Description.html. Fee 7500 PKR.'
});

ALL_UNIVERSITIES.push({
    slug: 'aku', name: 'AKU',
    fullName: 'The Aga Khan University',
    registrationUrl: 'https://www.aku.edu/admissions',
    loginUrl: null,
    portalDomains: ['aku.edu', 'www.aku.edu', 'akuross.aku.edu'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="applicantName"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], #hscTotal',
        matric_marks: '[name="sscMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'SharePoint-based. Application may use PeopleSoft.'
});

ALL_UNIVERSITIES.push({
    slug: 'airuni', name: 'Air University',
    fullName: 'Air University',
    registrationUrl: 'https://portals.au.edu.pk/admissions/Accounts/SignUp',
    loginUrl: 'https://portals.au.edu.pk/admissions',
    portalDomains: ['portals.au.edu.pk', 'au.edu.pk', 'webdata.au.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="FullName"], [name="Name"], [name="ApplicantName"], #FullName, #Name',
        father_name: '[name="FatherName"], [name="Father_Name"], #FatherName',
        cnic: '[name="CNIC"], [name="Cnic"], #CNIC',
        date_of_birth: '[name="DOB"], [name="DateOfBirth"], #DOB',
        gender: '[name="Gender"], #Gender',
        email: '[name="Email"], [type="email"], #Email',
        phone: '[name="Phone"], [name="Mobile"], [name="ContactNo"], #Phone, #Mobile',
        address: '[name="Address"], [name="PermanentAddress"], #Address',
        city: '[name="City"], #City',
        province: '[name="Province"], #Province',
        postal_code: '[name="PostalCode"], #PostalCode',
        fsc_marks: '[name="FSCMarks"], [name="HSSCMarks"], #FSCMarks',
        fsc_total: '[name="FSCTotal"], [name="HSSCTotal"], #FSCTotal',
        matric_marks: '[name="MatricMarks"], [name="SSCMarks"], #MatricMarks',
        matric_total: '[name="MatricTotal"], [name="SSCTotal"], #MatricTotal',
        board_name: '[name="Board"], [name="BoardName"], #Board',
        passing_year: '[name="PassingYear"], #PassingYear',
        domicile_province: '[name="Domicile"], #Domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'ASP.NET MVC. Signup accessible. Required: Academic Certs + CNIC + Father CNIC.'
});

ALL_UNIVERSITIES.push({
    slug: 'szabist-isb', name: 'SZABIST Islamabad',
    fullName: 'SZABIST — Islamabad Campus',
    registrationUrl: 'https://admissions.szabist-isb.edu.pk',
    loginUrl: 'https://admissions.szabist-isb.edu.pk',
    portalDomains: ['admissions.szabist-isb.edu.pk', 'szabist-isb.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="ApplicantName"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="CNIC"], #cnic',
        date_of_birth: '[name="dob"], [name="DOB"], #dob',
        gender: '[name="gender"], [name="Gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fscMarks"], [name="hscMarks"], #fscMarks',
        fsc_total: '[name="fscTotal"], #fscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'KPK', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Spring 2026 admissions open.'
});

ALL_UNIVERSITIES.push({
    slug: 'szabist-khi', name: 'SZABIST Karachi',
    fullName: 'SZABIST — Karachi Campus',
    registrationUrl: 'https://admissions.szabist.edu.pk',
    loginUrl: 'https://admissions.szabist.edu.pk',
    portalDomains: ['admissions.szabist.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="ApplicantName"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="CNIC"], #cnic',
        date_of_birth: '[name="dob"], [name="DOB"], #dob',
        gender: '[name="gender"], [name="Gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fscMarks"], [name="hscMarks"], #fscMarks',
        fsc_total: '[name="fscTotal"], #fscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'KPK', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Same system as Islamabad campus.'
});

ALL_UNIVERSITIES.push({
    slug: 'itu', name: 'ITU',
    fullName: 'Information Technology University',
    registrationUrl: 'https://itu.edu.pk/admissions',
    loginUrl: null,
    portalDomains: ['itu.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="applicantName"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], #cnic',
        date_of_birth: '[name="dob"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fscMarks"], [name="hscMarks"], #fscMarks',
        fsc_total: '[name="fscTotal"], #fscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Application portal opens during admissions season.'
});

ALL_UNIVERSITIES.push({
    slug: 'bahria', name: 'Bahria University',
    fullName: 'Bahria University',
    registrationUrl: 'https://www.bahria.edu.pk/admissions',
    loginUrl: null,
    portalDomains: ['bahria.edu.pk', 'www.bahria.edu.pk', 'cms.bahria.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="ApplicantName"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="CNIC"], #cnic',
        date_of_birth: '[name="dob"], [name="DOB"], #dob',
        gender: '[name="gender"], [name="Gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fscMarks"], [name="hscMarks"], #fscMarks',
        fsc_total: '[name="fscTotal"], #fscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Multiple campuses. CMS portal may be at cms.bahria.edu.pk.'
});

ALL_UNIVERSITIES.push({
    slug: 'uet-lahore', name: 'UET Lahore',
    fullName: 'University of Engineering & Technology Lahore',
    registrationUrl: 'https://admission.uet.edu.pk',
    loginUrl: 'https://admission.uet.edu.pk',
    portalDomains: ['admission.uet.edu.pk', 'uet.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="full_name"], [name="applicant_name"], #name, #applicant_name',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="cell_no"], #phone, #mobile',
        address: '[name="address"], [name="permanent_address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        postal_code: '[name="postal_code"], #postal_code',
        fsc_marks: '[name="fsc_marks"], [name="hssc_marks"], #fsc_marks',
        fsc_total: '[name="fsc_total"], [name="hssc_total"], #fsc_total',
        matric_marks: '[name="matric_marks"], [name="ssc_marks"], #matric_marks',
        matric_total: '[name="matric_total"], [name="ssc_total"], #matric_total',
        board_name: '[name="board"], [name="board_name"], #board',
        passing_year: '[name="passing_year"], #passing_year',
        ecat_score: '[name="ecat_score"], [name="test_score"], #ecat_score',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Spring 2026 admissions portal active. Has ECAT registration.'
});

ALL_UNIVERSITIES.push({
    slug: 'uet-taxila', name: 'UET Taxila',
    fullName: 'University of Engineering & Technology Taxila',
    registrationUrl: 'https://admission.uettaxila.edu.pk',
    loginUrl: 'https://admission.uettaxila.edu.pk',
    portalDomains: ['admissions.uettaxila.edu.pk', 'admission.uettaxila.edu.pk', 'uettaxila.edu.pk'],
    formType: 'requires_login_first',
    fieldMap: {
        full_name: '[name="name"], [name="full_name"], [name="applicant_name"], #name',
        father_name: '[name="father_name"], [name="fatherName"], #father_name',
        cnic: '[name="cnic"], [name="cnic_no"], #cnic',
        date_of_birth: '[name="dob"], [name="date_of_birth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="cell_no"], #phone',
        address: '[name="address"], [name="permanent_address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="fsc_marks"], [name="hssc_marks"], #fsc_marks',
        fsc_total: '[name="fsc_total"], [name="hssc_total"], #fsc_total',
        matric_marks: '[name="matric_marks"], [name="ssc_marks"], #matric_marks',
        matric_total: '[name="matric_total"], [name="ssc_total"], #matric_total',
        board_name: '[name="board"], #board',
        passing_year: '[name="passing_year"], #passing_year',
        ecat_score: '[name="ecat_score"], [name="test_score"], #ecat_score',
        domicile_province: '[name="domicile"], #domicile',
    },
    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: { punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan', islamabad: 'Islamabad' }
    },
    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },
    verified: false, lastVerified: '2026-02-21',
    notes: 'Separate from UET Lahore. Similar portal structure.'
});


// ─── Domain Lookup ─────────────────────────────────────────────────

/**
 * Find a university config by the current page's hostname
 */
function getConfigForDomain(hostname) {
    return ALL_UNIVERSITIES.find(u =>
        u.portalDomains.some(d =>
            hostname === d ||
            hostname.endsWith('.' + d) ||
            hostname.includes(d)
        )
    ) || null;
}

/**
 * Get a flat list of all portal domains for manifest.json host_permissions
 */
function getAllPortalDomains() {
    const domains = new Set();
    ALL_UNIVERSITIES.forEach(u => {
        u.portalDomains.forEach(d => domains.add(d));
    });
    return [...domains];
}

// ─── Education System Helpers ──────────────────────────────────────
// These branch on education_system and inter_status to return the
// correct marks/percentage for autofilling university forms.

/**
 * Get effective intermediate marks for autofilling.
 * Cambridge students use IBCC equivalence. Part-I students use projected marks.
 */
function getInterMarks(profile) {
    if (!profile) return null;
    if (profile.education_system === 'cambridge') {
        return profile.ibcc_equivalent_inter || null;
    }
    switch (profile.inter_status) {
        case 'not_started':
            return null;
        case 'part1_only':
        case 'appearing':
            if (profile.fsc_projected_marks) return profile.fsc_projected_marks;
            if (profile.fsc_part1_marks && profile.fsc_part1_total) {
                return Math.round(
                    (profile.fsc_part1_marks / profile.fsc_part1_total) *
                    (profile.fsc_total || 1100)
                );
            }
            return null;
        case 'result_awaited':
        case 'complete':
        default:
            return profile.fsc_marks || null;
    }
}

/**
 * Get effective intermediate total marks.
 */
function getInterTotal(profile) {
    if (!profile) return null;
    if (profile.education_system === 'cambridge') return 100;
    switch (profile.inter_status) {
        case 'not_started': return null;
        case 'part1_only':
        case 'appearing':
            return profile.fsc_total || 1100;
        default:
            return profile.fsc_total || 1100;
    }
}

/**
 * Get effective intermediate percentage.
 */
function getInterPercentage(profile) {
    if (!profile) return null;
    if (profile.education_system === 'cambridge') {
        return profile.ibcc_equivalent_inter || null;
    }
    switch (profile.inter_status) {
        case 'not_started':
            return null;
        case 'part1_only':
        case 'appearing':
            return profile.fsc_projected_percentage ||
                profile.fsc_part1_percentage || null;
        default:
            return profile.fsc_percentage || null;
    }
}

/**
 * Get effective matric percentage.
 */
function getMatricPercentage(profile) {
    if (!profile) return null;
    if (profile.education_system === 'cambridge') {
        return profile.ibcc_equivalent_matric || null;
    }
    return profile.matric_percentage || null;
}
