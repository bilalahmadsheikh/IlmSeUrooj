/**
 * PIEAS — Pakistan Institute of Engineering and Applied Sciences
 * Portal: red.pieas.edu.pk/pieasadmission/lgn.aspx
 * Type: ASP.NET, login-first
 */
const pieas = {
    slug: 'pieas',
    name: 'PIEAS',
    fullName: 'Pakistan Institute of Engineering and Applied Sciences',
    registrationUrl: 'https://red.pieas.edu.pk/pieasadmission/lgn.aspx',
    loginUrl: 'https://red.pieas.edu.pk/pieasadmission/lgn.aspx',
    portalDomains: ['red.pieas.edu.pk', 'pieas.edu.pk'],
    formType: 'requires_login_first',

    fieldMap: {
        full_name: '[name$="txtName"], [name$="txtFullName"], [id$="txtName"]',
        father_name: '[name$="txtFatherName"], [id$="txtFatherName"]',
        cnic: '#txtRegNo, [name$="txtCNIC"], [name$="txtCnic"], [id$="txtCNIC"]',
        date_of_birth: '[name$="txtDOB"], [id$="txtDOB"]',
        gender: '[name$="ddlGender"], [id$="ddlGender"]',
        email: '[name$="txtEmail"], [id$="txtEmail"], [type="email"]',
        phone: '[name$="txtMobile"], [name$="txtPhone"], [id$="txtMobile"]',
        address: '[name$="txtAddress"], [id$="txtAddress"]',
        city: '[name$="txtCity"], [name$="ddlCity"], [id$="txtCity"]',
        province: '[name$="ddlProvince"], [id$="ddlProvince"]',
        fsc_marks: '[name$="txtFSCMarks"], [name$="txtHSSCMarks"], [id$="txtFSCMarks"]',
        fsc_total: '[name$="txtFSCTotal"], [id$="txtFSCTotal"]',
        matric_marks: '[name$="txtSSCMarks"], [name$="txtMatricMarks"], [id$="txtSSCMarks"]',
        matric_total: '[name$="txtSSCTotal"], [id$="txtSSCTotal"]',
        board_name: '[name$="ddlBoard"], [id$="ddlBoard"]',
        passing_year: '[name$="txtPassingYear"], [name$="ddlPassingYear"], [id$="txtPassingYear"]',
        domicile_province: '[name$="ddlDomicile"], [id$="ddlDomicile"]',
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
        date_of_birth: 'date_dmy',
    },

    verified: false,
    lastVerified: '2026-02-21',
    notes: 'ASP.NET WebForms portal. Uses $-suffix selectors for dynamically generated IDs. Registration uses CNIC as username. TLS handshake timed out on fetch.'
};

export default pieas;
