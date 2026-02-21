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

    // Combined fields for both signup and main application
    fieldMap: {
        full_name: '[name*="Name" i], [id*="Name" i], [name*="ApplicantName" i], [name*="Login" i], [id*="Login" i], #Name',
        father_name: '[name*="FatherName" i], [id*="FatherName" i]',
        cnic: '[name*="CNIC" i], [id*="CNIC" i]',
        date_of_birth: '[name*="DOB" i], [id*="DOB" i], [name*="dateofbirth" i]',
        gender: '[name*="Gender" i], [id*="Gender" i]',
        email: '[name*="Email" i], [id*="Email" i], [type="email"]',
        phone: '[name*="Mobile" i], [id*="Mobile" i], [name*="Phone" i], [id*="Phone" i], [name*="ContactNo" i]',
        address: '[name*="Address" i], [id*="Address" i], [name*="PermanentAddress" i]',
        city: '[name*="City" i], [id*="City" i]',
        province: '[name*="Province" i], [id*="Province" i]',
        postal_code: '[name*="PostalCode" i], [id*="PostalCode" i]',
        fsc_marks: '[name*="HSSCMarks" i], [id*="HSSCMarks" i], [name*="FSCMarks" i]',
        fsc_total: '[name*="HSSCTotal" i], [id*="HSSCTotal" i], [name*="FSCTotal" i]',
        matric_marks: '[name*="SSCMarks" i], [id*="SSCMarks" i], [name*="MatricMarks" i]',
        matric_total: '[name*="SSCTotal" i], [id*="SSCTotal" i], [name*="MatricTotal" i]',
        board_name: '[name*="Board" i], [id*="Board" i]',
        passing_year: '[name*="PassingYear" i], [id*="PassingYear" i]',
        domicile_province: '[name*="Domicile" i], [id*="Domicile" i]',
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
