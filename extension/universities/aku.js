/**
 * AKU — The Aga Khan University
 * Portal: www.aku.edu/admissions (SharePoint-based)
 * Type: SharePoint CMS, separate application system
 */
const aku = {
    slug: 'aku',
    name: 'AKU',
    fullName: 'The Aga Khan University',
    registrationUrl: 'https://www.aku.edu/admissions',
    loginUrl: null,
    portalDomains: ['aku.edu', 'www.aku.edu'],
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_ymd' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'SharePoint-based main site. Actual application may use PeopleSoft or external system. Merit-based admissions.'
};

export default aku;
