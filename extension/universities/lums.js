/**
 * LUMS — Lahore University of Management Sciences
 * Portal: admissions.lums.edu.pk
 * Type: Login-first, custom portal
 */
const lums = {
    slug: 'lums',
    name: 'LUMS',
    fullName: 'Lahore University of Management Sciences',
    registrationUrl: 'https://admissions.lums.edu.pk',
    loginUrl: 'https://admissions.lums.edu.pk',
    portalDomains: ['admissions.lums.edu.pk'],
    formType: 'requires_login_first',

    fieldMap: {
        first_name: '[name="firstName"], [name="first_name"], [name="fname"], #firstName',
        middle_name: '[name="middleName"], [name="middle_name"], [name="mname"], #middleName',
        last_name: '[name="lastName"], [name="last_name"], [name="surname"], [name="lname"], #lastName',
        full_name: '[name="fullName"], [name="name"], [name="applicantName"], #fullName',
        father_name: '[name="fatherName"], [name="father_name"], #fatherName',
        cnic: '[name="cnic"], [name="cnicNo"], [name="nic"], #cnic',
        date_of_birth: '[name="dob"], [name="dateOfBirth"], #dob',
        gender: '[name="gender"], #gender',
        nationality: '[name="nationality"], #nationality',
        email: '[name="email"], [type="email"], #email',
        phone: '[name="phone"], [name="mobile"], [name="contactNo"], #phone',
        address: '[name="address"], [name="permanentAddress"], #address',
        city: '[name="city"], #city',
        province: '[name="province"], #province',
        fsc_marks: '[name="hscMarks"], [name="fscMarks"], #hscMarks',
        fsc_total: '[name="hscTotal"], [name="fscTotal"], #hscTotal',
        fsc_percentage: '[name="hscPercentage"], [name="fscPercentage"], #hscPercentage',
        matric_marks: '[name="sscMarks"], [name="matricMarks"], #sscMarks',
        matric_total: '[name="sscTotal"], [name="matricTotal"], #sscTotal',
        board_name: '[name="board"], #board',
        passing_year: '[name="passingYear"], #passingYear',
        sat_score: '[name="satScore"], [name="sat"], #satScore',
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
        date_of_birth: 'date_ymd',
        first_name: 'first_name',
        last_name: 'last_name',
        middle_name: 'middle_name',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Portal timed out on fetch. Login-first system. SAT scores accepted. LCAT test scores may also have a field.'
};

export default lums;
