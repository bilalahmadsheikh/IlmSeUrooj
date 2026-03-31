// Entry Test data for Pakistani universities
// Based on official 2025 admission data

export const entryTests = [
    {
        id: "net",
        name: "NET (NUST Entry Test)",
        fullName: "NUST Entry Test",
        conductor: "NUST",
        frequency: "Multiple series (I, II, III) per year",
        format: "MCQ-based",
        totalMarks: 200,
        duration: "3 hours",
        subjects: ["English", "Mathematics", "Physics", "Chemistry", "Intelligence"],
        website: "https://ugadmissions.nust.edu.pk",
        universities: [
            {
                name: "NUST",
                shortName: "NUST",
                weightage: "NET: 75%, FSc: 15%, Matric: 10%",
                cutoffs: {
                    "Software Engineering": "74%",
                    "Computer Science": "73%",
                    "Electrical Engineering": "72%",
                    "Mechanical Engineering": "71%",
                    "AI": "72%",
                    "BBA": "65%"
                }
            }
        ]
    },
    {
        id: "ecat",
        name: "ECAT",
        fullName: "Engineering College Admission Test",
        conductor: "UET System",
        frequency: "Once per year (July-Aug)",
        format: "MCQ-based, 400 total marks",
        totalMarks: 400,
        duration: "2 hours",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        website: "https://uet.edu.pk",
        universities: [
            {
                name: "UET Lahore",
                shortName: "UET Lahore",
                weightage: "ECAT: 20%, Matric: 25%, FSc: 45%",
                cutoffs: {
                    "Mechanical Engineering": "81%",
                    "Computer Science": "79%",
                    "Electrical Engineering": "78%",
                    "Civil Engineering": "75%",
                    "Software Engineering": "82%"
                }
            },
            {
                name: "UET Taxila",
                shortName: "UET Taxila",
                weightage: "ECAT: 20%, Matric: 25%, FSc: 45%",
                cutoffs: {
                    "Software Engineering": "78%",
                    "Mechanical Engineering": "74%",
                    "Electrical Engineering": "72%",
                    "Civil Engineering": "70%"
                }
            }
        ]
    },
    {
        id: "sat",
        name: "SAT",
        fullName: "Scholastic Assessment Test",
        conductor: "College Board (USA)",
        frequency: "7 times per year",
        format: "Digital, Reading/Writing + Math",
        totalMarks: 1600,
        duration: "2 hours 14 minutes",
        subjects: ["Reading & Writing", "Mathematics"],
        website: "https://satsuite.collegeboard.org",
        universities: [
            {
                name: "LUMS",
                shortName: "LUMS",
                weightage: "Holistic (SAT replaces LCAT for SBASSE)",
                cutoffs: {
                    "Business (SDSB)": "1350+",
                    "Computer Science (SBASSE)": "1400+",
                    "Economics (SAHSOL)": "1300+",
                    "Scholarships": "1400+"
                }
            },
            {
                name: "IBA Karachi",
                shortName: "IBA",
                weightage: "SAT bypasses IBA Aptitude Test",
                cutoffs: {
                    "BBA (Round 1)": "1470",
                    "BSCS (Round 1)": "1440",
                    "BBA (Round 2)": "1450",
                    "General Competitive": "1300+"
                }
            },
            {
                name: "Habib University",
                shortName: "Habib",
                weightage: "SAT replaces Habib Entrance Exam",
                cutoffs: {
                    "Computer Science": "1200+",
                    "Electrical Engineering": "1200+",
                    "Social Development": "1150+"
                }
            },
            {
                name: "NUST (Business)",
                shortName: "NUST",
                weightage: "SAT 1200+ can waive NET for NUST Business",
                cutoffs: {
                    "Business (NUST)": "1200+",
                    "Engineering": "1300+"
                }
            }
        ]
    },
    {
        id: "fast-test",
        name: "FAST NU Test",
        fullName: "FAST National University Entry Test",
        conductor: "FAST-NUCES",
        frequency: "Once per year (June-July)",
        format: "MCQ + Subjective",
        totalMarks: 100,
        duration: "2 hours",
        subjects: ["English", "Mathematics", "Analytical/IQ"],
        website: "https://nu.edu.pk/Admissions",
        universities: [
            {
                name: "FAST Islamabad",
                shortName: "FAST Isb",
                weightage: "Test: 50%, FSc: 35%, Matric: 15%",
                cutoffs: {
                    "Computer Science": "73%",
                    "Software Engineering": "72%",
                    "Electrical Engineering": "65%",
                    "AI": "70%"
                }
            },
            {
                name: "FAST Lahore",
                shortName: "FAST Lhr",
                weightage: "Test: 50%, FSc: 35%, Matric: 15%",
                cutoffs: {
                    "Computer Science": "71%",
                    "Software Engineering": "70%",
                    "Electrical Engineering": "63%"
                }
            },
            {
                name: "FAST Karachi",
                shortName: "FAST Khi",
                weightage: "Test: 50%, FSc: 35%, Matric: 15%",
                cutoffs: {
                    "Computer Science": "68%",
                    "Cyber Security": "66%",
                    "Software Engineering": "67%",
                    "Electrical Engineering": "60%"
                }
            },
            {
                name: "FAST Peshawar",
                shortName: "FAST Psh",
                weightage: "Test: 50%, FSc: 35%, Matric: 15%",
                cutoffs: {
                    "Computer Science": "58%",
                    "Software Engineering": "60%"
                }
            },
            {
                name: "FAST Chiniot-Faisalabad",
                shortName: "FAST CFD",
                weightage: "Test: 50%, FSc: 35%, Matric: 15%",
                cutoffs: {
                    "Computer Science": "67%",
                    "Software Engineering": "67%"
                }
            }
        ]
    },
    {
        id: "nts-nat",
        name: "NTS NAT",
        fullName: "National Aptitude Test",
        conductor: "National Testing Service (NTS)",
        frequency: "Multiple times per year",
        format: "MCQ, 90 questions, 100 marks (percentile)",
        totalMarks: 100,
        duration: "2 hours",
        subjects: ["English", "Analytical", "Quantitative", "Subject-specific"],
        website: "https://nts.org.pk",
        universities: [
            {
                name: "COMSATS Islamabad",
                shortName: "COMSATS Isb",
                weightage: "NAT: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "83%",
                    "Software Engineering": "82%",
                    "Electrical Engineering": "78%",
                    "AI": "80%"
                }
            },
            {
                name: "COMSATS Lahore",
                shortName: "COMSATS Lhr",
                weightage: "NAT: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "79%",
                    "Software Engineering": "78%",
                    "Electrical Engineering": "73%"
                }
            },
            {
                name: "COMSATS Wah",
                shortName: "COMSATS Wah",
                weightage: "NAT: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "80%",
                    "Software Engineering": "78%"
                }
            },
            {
                name: "COMSATS Abbottabad",
                shortName: "COMSATS Abb",
                weightage: "NAT: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "78%",
                    "Software Engineering": "76%"
                }
            },
            {
                name: "COMSATS Sahiwal",
                shortName: "COMSATS Sah",
                weightage: "NAT: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "68%",
                    "Business Administration": "65%"
                }
            }
        ]
    },
    {
        id: "giki-test",
        name: "GIKI Entry Test",
        fullName: "GIKI Admission Test",
        conductor: "GIKI",
        frequency: "Once per year (July)",
        format: "MCQ + Subjective, 200 marks",
        totalMarks: 200,
        duration: "3 hours",
        subjects: ["Mathematics", "Physics", "English", "Intelligence"],
        website: "https://giki.edu.pk/admissions/admissions-undergraduates/",
        universities: [
            {
                name: "GIKI",
                shortName: "GIKI",
                weightage: "Test: 85%, FSc Part-I: 15%",
                cutoffs: {
                    "Computer Science": "70%",
                    "Mechanical Engineering": "68%",
                    "Electrical Engineering": "65%",
                    "Engineering Sciences": "60%"
                }
            }
        ]
    },
    {
        id: "iba-test",
        name: "IBA Aptitude Test",
        fullName: "IBA Admission Test",
        conductor: "IBA Karachi",
        frequency: "Twice per year (Feb, Jul)",
        format: "MCQ-based",
        totalMarks: 100,
        duration: "2.5 hours",
        subjects: ["English", "Mathematics", "Analytical Reasoning"],
        website: "https://iba.edu.pk/admissions",
        universities: [
            {
                name: "IBA Karachi",
                shortName: "IBA",
                weightage: "Test + Academic Record (Holistic)",
                cutoffs: {
                    "BBA": "78%",
                    "BS Computer Science": "76%",
                    "BS Economics": "72%",
                    "BS Accounting & Finance": "74%"
                }
            }
        ]
    },
    {
        id: "lcat",
        name: "LCAT",
        fullName: "LUMS Common Admission Test",
        conductor: "LUMS",
        frequency: "Once per year (Feb-Mar)",
        format: "MCQ + Writing",
        totalMarks: 100,
        duration: "2.5 hours",
        subjects: ["English", "Mathematics", "Analytical Writing"],
        website: "https://admissions.lums.edu.pk",
        universities: [
            {
                name: "LUMS",
                shortName: "LUMS",
                weightage: "LCAT + Academic Record + Interview",
                cutoffs: {
                    "Business (SDSB)": "75%",
                    "Law (SAHSOL)": "72%",
                    "Social Sciences (MGSHSS)": "70%"
                }
            }
        ]
    },
    {
        id: "pieas-test",
        name: "PIEAS Written Test",
        fullName: "PIEAS Admission Test",
        conductor: "PIEAS",
        frequency: "Once per year (April)",
        format: "MCQ + Descriptive",
        totalMarks: 200,
        duration: "3 hours",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        website: "https://admissions.pieas.edu.pk",
        universities: [
            {
                name: "PIEAS",
                shortName: "PIEAS",
                weightage: "Test: 85%, FSc: 15%",
                cutoffs: {
                    "Nuclear Engineering": "78%",
                    "Computer Science": "72%",
                    "Electrical Engineering": "75%",
                    "Mechanical Engineering": "73%"
                }
            }
        ]
    },
    {
        id: "ned-test",
        name: "NED Entry Test",
        fullName: "NED University Admission Test",
        conductor: "NED University",
        frequency: "Once per year (July)",
        format: "MCQ-based",
        totalMarks: 200,
        duration: "2 hours",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        website: "https://www.neduet.edu.pk",
        universities: [
            {
                name: "NED University",
                shortName: "NED",
                weightage: "Test: 30%, FSc: 50%, Matric: 20%",
                cutoffs: {
                    "Software Engineering": "87%",
                    "Computer Science": "84%",
                    "Electrical Engineering": "80%",
                    "Civil Engineering": "75%"
                }
            }
        ]
    },
    {
        id: "bahria-test",
        name: "BUET",
        fullName: "Bahria University Entry Test",
        conductor: "Bahria University",
        frequency: "Once per year (June-July)",
        format: "MCQ-based",
        totalMarks: 100,
        duration: "1.5 hours",
        subjects: ["English", "Mathematics", "Physics", "General Knowledge"],
        website: "https://bahria.edu.pk",
        universities: [
            {
                name: "Bahria Islamabad",
                shortName: "Bahria Isb",
                weightage: "Test: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "80%",
                    "Software Engineering": "78%",
                    "Business Administration": "72%"
                }
            },
            {
                name: "Bahria Lahore",
                shortName: "Bahria Lhr",
                weightage: "Test: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "73%",
                    "Business Administration": "68%"
                }
            },
            {
                name: "Bahria Karachi",
                shortName: "Bahria Khi",
                weightage: "Test: 50%, FSc: 40%, Matric: 10%",
                cutoffs: {
                    "Computer Science": "68%",
                    "Business Administration": "65%"
                }
            }
        ]
    },
    {
        id: "air-test",
        name: "Air University Entry Test",
        fullName: "Air University Admission Test",
        conductor: "Air University",
        frequency: "Once per year (June-July)",
        format: "MCQ-based",
        totalMarks: 100,
        duration: "1.5 hours",
        subjects: ["English", "Mathematics", "Physics", "General"],
        website: "https://au.edu.pk",
        universities: [
            {
                name: "Air University",
                shortName: "Air",
                weightage: "Test: 50%, FSc: 30%, Matric: 20%",
                cutoffs: {
                    "Aerospace Engineering": "75%",
                    "Computer Science": "72%",
                    "Software Engineering": "70%",
                    "Electrical Engineering": "68%"
                }
            }
        ]
    }
];

// Compact display data used by EntryTests component (icon, period, acceptedBy)
// Single source of truth — import from here, do NOT duplicate inline in components
export const entryTestsDisplay = [
    { id: "net",        name: "NET (NUST Entry Test)",      conductor: "NUST",                    icon: "", period: "Jan – Jul (Series I, II, III, IV)",          description: "NUST's own entry test covering English, Maths, Physics, Chemistry & Intelligence. Required for all NUST engineering, computing, and business programs. 200 marks, 3 hours.",         acceptedBy: ["NUST"],                                              website: "https://ugadmissions.nust.edu.pk" },
    { id: "ecat",       name: "ECAT",                       conductor: "UET System",               icon: "", period: "July – August (annually)",                    description: "Engineering College Admission Test for all public engineering universities in Punjab. Covers Maths, Physics, Chemistry & English. 400 total marks, 2 hours.",                         acceptedBy: ["UET Lahore", "UET Taxila", "Other Punjab Engineering Unis"],  website: "https://uet.edu.pk" },
    { id: "sat",        name: "SAT",                        conductor: "College Board (USA)",      icon: "", period: "7 dates per year (Mar, May, Jun, Aug, Oct, Nov, Dec)", description: "International standardized test accepted by top Pakistani universities. Digital format, 2h 14min. Covers Reading/Writing and Mathematics.",                                 acceptedBy: ["LUMS", "IBA", "NUST (Business)", "Habib", "Bahria", "FAST"], website: "https://satsuite.collegeboard.org" },
    { id: "fast-test",  name: "FAST NU Test",               conductor: "FAST-NUCES",              icon: "", period: "June – July (annually)",                      description: "FAST's admission test for CS, Software Engineering, AI, and Business programs across all campuses. MCQ + Subjective format, 100 marks, 2 hours.",                              acceptedBy: ["FAST Isb", "FAST Lhr", "FAST Khi", "FAST Psh", "FAST CFD"],  website: "https://nu.edu.pk/Admissions" },
    { id: "nts-nat",    name: "NTS NAT",                    conductor: "National Testing Service", icon: "", period: "Multiple times per year (check NTS schedule)", description: "National Aptitude Test used by COMSATS and other NTS-affiliated universities. 90 MCQs, 100 marks (percentile), 2 hours. No negative marking. Valid for 1 year.",              acceptedBy: ["COMSATS (all campuses)", "Other NTS-affiliated unis"],        website: "https://nts.org.pk" },
    { id: "giki-test",  name: "GIKI Entry Test",            conductor: "GIKI",                    icon: "", period: "July (annually)",                              description: "GIKI's own admission test for engineering and CS programs. MCQ + Subjective, 200 marks, 3 hours. Covers Maths, Physics, English & Intelligence. Test weight: 85%.",           acceptedBy: ["GIKI"],                                              website: "https://giki.edu.pk/admissions/admissions-undergraduates/" },
    { id: "iba-test",   name: "IBA Aptitude Test",          conductor: "IBA Karachi",             icon: "", period: "February & July (twice yearly)",               description: "IBA's admission test for BBA, BS CS, Economics, and Accounting programs. MCQ-based covering English, Maths & Analytical Reasoning. 100 marks, 2.5 hours.",                   acceptedBy: ["IBA Karachi"],                                       website: "https://iba.edu.pk/admissions" },
    { id: "lcat",       name: "LCAT",                       conductor: "LUMS",                    icon: "", period: "February – March (annually)",                  description: "LUMS Common Admission Test for Business, Law, and Social Sciences programs. MCQ + Analytical Writing, 100 marks, 2.5 hours. SBASSE requires SAT instead.",                 acceptedBy: ["LUMS"],                                              website: "https://admissions.lums.edu.pk" },
    { id: "pieas-test", name: "PIEAS Written Test",         conductor: "PIEAS",                   icon: "", period: "April (annually)",                              description: "PIEAS admission test for Nuclear, Mechanical, Electrical, CS, and Chemical Engineering. MCQ + Descriptive, 200 marks, 3 hours. Test weight: 85%.",                            acceptedBy: ["PIEAS"],                                             website: "https://admissions.pieas.edu.pk" },
    { id: "ned-test",   name: "NED Entry Test",             conductor: "NED University",          icon: "", period: "July (annually)",                              description: "NED University's admission test for engineering programs in Karachi. MCQ-based covering Maths, Physics, Chemistry & English. 200 marks, 2 hours.",                             acceptedBy: ["NED University"],                                    website: "https://www.neduet.edu.pk" },
    { id: "bahria-test",name: "BUET (Bahria Entry Test)",   conductor: "Bahria University",       icon: "", period: "June – July (annually)",                      description: "Bahria University's admission test for CS, SE, Business, and Medical programs across all campuses. MCQ-based, 100 marks, 1.5 hours.",                                        acceptedBy: ["Bahria Isb", "Bahria Lhr", "Bahria Khi"],            website: "https://bahria.edu.pk" },
    { id: "air-test",   name: "Air University Entry Test",  conductor: "Air University",          icon: "", period: "June – July (annually)",                      description: "Air University's admission test for Aerospace, CS, SE, EE, and Business programs. MCQ-based, 100 marks, 1.5 hours. Air Force affiliated.",                                    acceptedBy: ["Air University"],                                    website: "https://au.edu.pk" },
];

export const testCategories = [
    { value: "all", label: "All Tests" },
    { value: "university-specific", label: "University-Specific" },
    { value: "standardized", label: "Standardized (SAT/NTS)" },
    { value: "engineering", label: "Engineering Focus" }
];

export const getTestCategory = (test) => {
    if (["sat", "nts-nat"].includes(test.id)) return "standardized";
    if (["ecat", "net", "pieas-test", "ned-test", "giki-test"].includes(test.id)) return "engineering";
    return "university-specific";
};
