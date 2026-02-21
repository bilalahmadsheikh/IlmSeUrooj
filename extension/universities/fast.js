/**
 * FAST-NU — Foundation for Advancement of Science and Technology
 * Portal: admissions.nu.edu.pk
 * Type: Login-first React application
 */
const fast = {
    slug: 'fast',
    name: 'FAST-NU',
    fullName: 'National University of Computer and Emerging Sciences',
    registrationUrl: 'https://admissions.nu.edu.pk',
    loginUrl: 'https://admissions.nu.edu.pk',
    portalDomains: ['admissions.nu.edu.pk'],
    formType: 'requires_login_first',

    fieldMap: {
        full_name: '[name="name"], [name="applicantName"], [name="fullName"], #name, #applicantName',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="mobile"], [name="phone"], [name="cellNo"], #mobile, #phone',
        address: '[name="address"], [name="permanentAddress"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], [name="fscTotal"], #hscTotal',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], [name="matricTotal"], #sscTotal',
        board_name: '[name="board"], [name="boardName"], #board',
        passing_year: '[name="passingYear"], [name="year"], #passingYear',
        sat_score: '[name="satScore"], [name="sat"], #satScore',
        domicile_province: '[name="domicile"], #domicile',
    },

    selectOptions: {
        gender: { male: 'Male', female: 'Female' },
        province: {
            punjab: 'Punjab', sindh: 'Sindh',
            kpk: 'Khyber Pakhtunkhwa', balochistan: 'Balochistan',
            islamabad: 'Islamabad',
        }
    },

    transforms: {
        cnic: 'cnic_dashes',
        phone: 'phone_pak',
        date_of_birth: 'date_ymd',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'React-based login portal. Requires account creation first. Uses React state so native setter + event dispatch is critical. Selectors are common FAST patterns.'
};

export default fast;
