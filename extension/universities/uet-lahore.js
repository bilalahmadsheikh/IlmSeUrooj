/**
 * UET Lahore — University of Engineering & Technology
 * Portal: admission.uet.edu.pk
 * Type: Standard, with Spring 2026 admissions active
 */
const uet_lahore = {
    slug: 'uet-lahore',
    name: 'UET Lahore',
    fullName: 'University of Engineering & Technology Lahore',
    registrationUrl: 'https://admission.uet.edu.pk',
    loginUrl: 'https://admission.uet.edu.pk',
    portalDomains: ['admission.uet.edu.pk'],
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Spring 2026 admissions portal active. Has ECAT registration. Includes affiliated colleges. Portal accessible but requires registration.'
};

export default uet_lahore;
