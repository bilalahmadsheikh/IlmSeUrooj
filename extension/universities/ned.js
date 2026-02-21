/**
 * NED — NED University of Engineering and Technology
 * Portal: neduet.edu.pk/admission
 * Type: Standard form, seasonal portal
 */
const ned = {
    slug: 'ned',
    name: 'NED',
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'DNS resolution failed. Online application portal opens in April. NED conducts its own entry test.'
};

export default ned;
