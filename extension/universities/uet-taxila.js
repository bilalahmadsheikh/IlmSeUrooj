/**
 * UET Taxila — University of Engineering & Technology Taxila
 * Portal: admission.uettaxila.edu.pk
 * Type: Standard, login-first
 */
const uet_taxila = {
    slug: 'uet-taxila',
    name: 'UET Taxila',
    fullName: 'University of Engineering & Technology Taxila',
    registrationUrl: 'https://admission.uettaxila.edu.pk',
    loginUrl: 'https://admission.uettaxila.edu.pk',
    portalDomains: ['admission.uettaxila.edu.pk', 'uettaxila.edu.pk'],
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Separate from UET Lahore. Similar portal structure. Login-first system.'
};

export default uet_taxila;
