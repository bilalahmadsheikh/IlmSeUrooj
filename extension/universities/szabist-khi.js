/**
 * SZABIST Karachi
 * Portal: admissions.szabist.edu.pk
 * Type: Login-first
 */
const szabist_khi = {
    slug: 'szabist-khi',
    name: 'SZABIST Karachi',
    fullName: 'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology — Karachi',
    registrationUrl: 'https://admissions.szabist.edu.pk',
    loginUrl: 'https://admissions.szabist.edu.pk',
    portalDomains: ['admissions.szabist.edu.pk', 'szabist.edu.pk'],
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
            punjab: 'Punjab', sindh: 'Sindh', kpk: 'KPK',
            balochistan: 'Balochistan', islamabad: 'Islamabad',
        }
    },

    transforms: { cnic: 'cnic_dashes', phone: 'phone_pak', date_of_birth: 'date_dmy' },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Karachi campus. Same system as Islamabad. Login-first system.'
};

export default szabist_khi;
