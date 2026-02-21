/**
 * Air University
 * Portal: portals.au.edu.pk/admissions
 * Type: ASP.NET MVC, signup then login
 */
const airuni = {
    slug: 'airuni',
    name: 'Air University',
    fullName: 'Air University',
    registrationUrl: 'https://portals.au.edu.pk/admissions/Accounts/SignUp',
    loginUrl: 'https://portals.au.edu.pk/admissions',
    portalDomains: ['portals.au.edu.pk', 'au.edu.pk'],
    formType: 'requires_login_first',

    fieldMap: {
        full_name: '[name="FullName"], [name="Name"], [name="ApplicantName"], #FullName, #Name',
        father_name: '[name="FatherName"], [name="Father_Name"], #FatherName',
        cnic: '[name="CNIC"], [name="Cnic"], #CNIC',
        date_of_birth: '[name="DOB"], [name="DateOfBirth"], #DOB',
        gender: '[name="Gender"], #Gender',
        email: '[name="Email"], [type="email"], #Email',
        phone: '[name="Phone"], [name="Mobile"], [name="ContactNo"], #Phone, #Mobile',
        address: '[name="Address"], [name="PermanentAddress"], #Address',
        city: '[name="City"], #City',
        province: '[name="Province"], #Province',
        postal_code: '[name="PostalCode"], #PostalCode',
        fsc_marks: '[name="FSCMarks"], [name="HSSCMarks"], #FSCMarks',
        fsc_total: '[name="FSCTotal"], [name="HSSCTotal"], #FSCTotal',
        matric_marks: '[name="MatricMarks"], [name="SSCMarks"], #MatricMarks',
        matric_total: '[name="MatricTotal"], [name="SSCTotal"], #MatricTotal',
        board_name: '[name="Board"], [name="BoardName"], #Board',
        passing_year: '[name="PassingYear"], #PassingYear',
        domicile_province: '[name="Domicile"], #Domicile',
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
    notes: 'ASP.NET MVC portal. Signup page accessible. Required docs: Academic Certificates + CNIC/B-Form + Father CNIC. Fee payable at Bank Al-Habib.'
};

export default airuni;
