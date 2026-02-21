/**
 * IBA — Institute of Business Administration
 * Portal: onlineadmission.iba.edu.pk
 * Type: Login-first, standard application form
 */
const iba = {
    slug: 'iba',
    name: 'IBA',
    fullName: 'Institute of Business Administration',
    registrationUrl: 'https://onlineadmission.iba.edu.pk',
    loginUrl: 'https://onlineadmission.iba.edu.pk',
    portalDomains: ['onlineadmission.iba.edu.pk', 'admissions.iba.edu.pk'],
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
    notes: 'Apply Online links to onlineadmission.iba.edu.pk. Login-first system. IBA Talent Hunt test scores may have additional fields.'
};

export default iba;
