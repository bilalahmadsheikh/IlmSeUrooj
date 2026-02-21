/**
 * Habib University
 * Portal: eapplication.habib.edu.pk
 * Type: Login-first, custom web application
 */
const habib = {
    slug: 'habib',
    name: 'Habib University',
    fullName: 'Habib University',
    registrationUrl: 'https://eapplication.habib.edu.pk/Description.html',
    loginUrl: 'https://eapplication.habib.edu.pk',
    portalDomains: ['eapplication.habib.edu.pk', 'habib.edu.pk'],
    formType: 'requires_login_first',

    fieldMap: {
        full_name: '[name="name"], [name="fullName"], [name="applicant_name"], #name',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], #phone',
        address: '[name="address"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], #hscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        sat_score: '[name="satScore"], #satScore',
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
    notes: 'Login page accessible. "Create Account" at /Description.html. Application fee 7500 PKR. Holistic admissions process with interviews.'
};

export default habib;
