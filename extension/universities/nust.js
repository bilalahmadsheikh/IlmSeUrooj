/**
 * NUST — National University of Sciences and Technology
 * Portal: ugadmissions.nust.edu.pk
 * Type: Login-first, multistep application
 */
const nust = {
    slug: 'nust',
    name: 'NUST',
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh',
            kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan',
            islamabad: 'Islamabad', gilgit_baltistan: 'Gilgit-Baltistan',
            azad_kashmir: 'Azad Jammu & Kashmir',
        }
    },

    transforms: {
        cnic: 'cnic_dashes',
        phone: 'phone_pak',
        date_of_birth: 'date_dmy',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Portal returns 403 from server — requires browser access. Login-first system. Selectors are common NUST patterns from past cycles; need browser verification when admissions open.'
};

export default nust;
