/**
 * COMSATS — CUI Admission System
 * Portal: admissions.comsats.edu.pk
 * Type: Standard form with signup first
 * Signup fields discovered: Applying For (select), Name, Login, Email, Password
 */
const comsats = {
    slug: 'comsats',
    name: 'COMSATS',
    fullName: 'COMSATS University Islamabad',
    registrationUrl: 'https://admissions.comsats.edu.pk',
    loginUrl: 'https://admissions.comsats.edu.pk',
    portalDomains: ['admissions.comsats.edu.pk'],
    formType: 'requires_login_first',

    // Signup page fields (first step before full application)
    signupFieldMap: {
        full_name: '[name="Name"], [name="name"], #Name',
        email: '[name="Email"], [name="email"], [type="email"], #Email',
    },

    fieldMap: {
        full_name: '[name="Name"], [name="ApplicantName"], [name="name"], #Name, #ApplicantName',
        father_name: '[name="FatherName"], [name="fatherName"], #FatherName',
        cnic: '[name="CNIC"], [name="cnic"], #CNIC',
        date_of_birth: '[name="DOB"], [name="dob"], #DOB',
        gender: '[name="Gender"], [name="gender"], #Gender',
        email: '[name="Email"], [type="email"], #Email',
        phone: '[name="Mobile"], [name="Phone"], [name="ContactNo"], #Mobile, #Phone',
        address: '[name="Address"], [name="PermanentAddress"], #Address',
        city: '[name="City"], #City',
        province: '[name="Province"], #Province',
        postal_code: '[name="PostalCode"], #PostalCode',
        fsc_marks: '[name="HSSCMarks"], [name="FSCMarks"], #HSSCMarks',
        fsc_total: '[name="HSSCTotal"], [name="FSCTotal"], #HSSCTotal',
        matric_marks: '[name="SSCMarks"], [name="MatricMarks"], #SSCMarks',
        matric_total: '[name="SSCTotal"], [name="MatricTotal"], #SSCTotal',
        board_name: '[name="Board"], [name="BoardName"], #Board',
        passing_year: '[name="PassingYear"], #PassingYear',
        domicile_province: '[name="Domicile"], #Domicile',
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
        date_of_birth: 'date_dmy',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'Signup page has: Applying For (select), Name, Login, Email, Password fields. Full application form behind login. ASP.NET style PascalCase field names.'
};

export default comsats;
