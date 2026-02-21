/**
 * Bahria University
 * Portal: www.bahria.edu.pk/admissions
 * Type: CMS-based info page, separate CMS admission system
 */
const bahria = {
    slug: 'bahria',
    name: 'Bahria University',
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
        province: {
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'Khyber Pakhtunkhwa',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Main page is admissions info. Multiple campuses: Islamabad E-8, H-11, Karachi, Lahore. CMS portal likely at cms.bahria.edu.pk.'
};

export default bahria;
