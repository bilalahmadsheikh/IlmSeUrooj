/**
 * GIKI — Ghulam Ishaq Khan Institute
 * Portal: giki.edu.pk/admissions
 * Type: Info page then separate application portal
 */
const giki = {
    slug: 'giki',
    name: 'GIKI',
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: {
        cnic: 'cnic_dashes',
        phone: 'phone_pak',
        date_of_birth: 'date_dmy',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Main page is info page. Application form likely on separate portal during admissions season. GIKI conducts its own entry test.'
};

export default giki;
