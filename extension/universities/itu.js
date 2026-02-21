/**
 * ITU — Information Technology University
 * Portal: itu.edu.pk/admissions
 * Type: Info page, separate application portal during admissions
 */
const itu = {
    slug: 'itu',
    name: 'ITU',
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Main page is admissions info. Actual application portal opens during admissions season. Punjab-based university.'
};

export default itu;
