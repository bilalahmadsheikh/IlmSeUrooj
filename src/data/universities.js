// Mock University Data for Pakistani Universities

export const universities = [
  {
    id: 1,
    name: "National University of Sciences & Technology (NUST)",
    shortName: "NUST",
    logo: "/logos/nust.png",
    city: "Islamabad",
    established: 1991,
    type: "Public",
    ranking: 1,
    fieldRankings: {
      "Pre-Engineering": 1,
      "Computer Science": 2,
      "Business": 3,
      "Medical": 5
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science", "Business", "Medical"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering"],
      "Computer Science": ["Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence"],
      "Business": ["Business Administration", "Accounting & Finance"],
      "Medical": ["MBBS", "BDS"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Top Engineering School", "Strong Research", "Industry Connections"],
    description: "Pakistan's leading STEM university with world-class facilities and research programs.",
    website: "https://nust.edu.pk",
    avgFee: "PKR 200,000 - 400,000 per semester",
    admissions: {
      deadline: "2026-01-25",
      testName: "NET Series II",
      testDate: "2026-01-31",
      applyUrl: "https://ugadmissions.nust.edu.pk"
    }
  },
  {
    id: 2,
    name: "Lahore University of Management Sciences (LUMS)",
    shortName: "LUMS",
    logo: "/logos/lums.png",
    city: "Lahore",
    established: 1985,
    type: "Private",
    ranking: 2,
    fieldRankings: {
      "Business": 1,
      "Computer Science": 3,
      "Pre-Engineering": 8
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Business", "Computer Science", "Pre-Engineering"],
    programs: {
      "Business": ["Business Administration", "Accounting & Finance", "Economics"],
      "Computer Science": ["Computer Science", "Electrical Engineering"],
      "Pre-Engineering": ["Electrical Engineering", "Computer Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Best Business School", "Need-Based Aid", "Diverse Community"],
    description: "Premier private university known for its business and computer science programs.",
    website: "https://lums.edu.pk",
    avgFee: "PKR 350,000 - 600,000 per semester",
    admissions: {
      deadline: "2026-01-27",
      testName: "LCAT",
      testDate: "2026-02-15",
      applyUrl: "https://admissions.lums.edu.pk"
    }
  },
  {
    id: 3,
    name: "FAST National University (FAST-NUCES)",
    shortName: "FAST",
    logo: "/logos/fast.png",
    city: "Islamabad",
    established: 2000,
    type: "Private",
    ranking: 3,
    fieldRankings: {
      "Computer Science": 1,
      "Pre-Engineering": 6,
      "Business": 8
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence", "Cyber Security"],
      "Pre-Engineering": ["Electrical Engineering", "Computer Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Top CS University", "Multiple Campuses", "Strong Alumni Network"],
    description: "Known for producing top software engineers with campuses across Pakistan.",
    website: "https://nu.edu.pk",
    avgFee: "PKR 180,000 - 280,000 per semester",
    admissions: {
      deadline: "2026-01-10",
      testName: "NAT/NTS",
      testDate: "2026-01-15",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },
  {
    id: 4,
    name: "COMSATS University Islamabad",
    shortName: "COMSATS",
    logo: "/logos/comsats.png",
    city: "Islamabad",
    established: 1998,
    type: "Public",
    ranking: 4,
    fieldRankings: {
      "Computer Science": 4,
      "Pre-Engineering": 7,
      "Business": 4
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Information Technology"],
      "Pre-Engineering": ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering"],
      "Business": ["Business Administration", "Accounting & Finance"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Affordable Fees", "Multiple Campuses", "Research Focus"],
    description: "Quality education at affordable prices with campuses in major cities.",
    website: "https://comsats.edu.pk",
    avgFee: "PKR 80,000 - 150,000 per semester",
    admissions: {
      deadline: "2026-01-12",
      testName: "Entry Test",
      testDate: "2026-01-21",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 5,
    name: "Institute of Business Administration (IBA)",
    shortName: "IBA",
    logo: "/logos/iba.png",
    city: "Karachi",
    established: 1955,
    type: "Public",
    ranking: 5,
    fieldRankings: {
      "Business": 2,
      "Computer Science": 5
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Business", "Computer Science"],
    programs: {
      "Business": ["Business Administration", "Accounting & Finance", "Economics", "Social Sciences"],
      "Computer Science": ["Computer Science", "Data Science"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Oldest Business School", "Strong Placement", "Merit Based"],
    description: "Asia's oldest business school with exceptional corporate connections.",
    website: "https://iba.edu.pk",
    avgFee: "PKR 250,000 - 450,000 per semester",
    admissions: {
      deadline: "2026-01-21",
      testName: "IBA Aptitude Test",
      testDate: "2026-02-01",
      applyUrl: "https://iba.edu.pk/admissions"
    }
  },
  {
    id: 6,
    name: "University of Engineering & Technology (UET)",
    shortName: "UET Lahore",
    logo: "/logos/uet.png",
    city: "Lahore",
    established: 1921,
    type: "Public",
    ranking: 6,
    fieldRankings: {
      "Pre-Engineering": 2
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Metallurgical Engineering", "Mining Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Historic Institution", "Engineering Excellence", "Affordable"],
    description: "Pakistan's oldest and most prestigious engineering institution.",
    website: "https://uet.edu.pk",
    avgFee: "PKR 50,000 - 100,000 per semester",
    admissions: {
      deadline: "2026-08-15",
      testName: "ECAT",
      testDate: "2026-08-20",
      applyUrl: "https://uet.edu.pk/admissions"
    }
  },
  {
    id: 7,
    name: "Ghulam Ishaq Khan Institute (GIKI)",
    shortName: "GIKI",
    logo: "/logos/giki.png",
    city: "Topi",
    established: 1993,
    type: "Private",
    ranking: 7,
    fieldRankings: {
      "Pre-Engineering": 3,
      "Computer Science": 6
    },
    campusType: "Strong Campus Life",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Engineering Sciences"],
      "Computer Science": ["Computer Science", "Computer Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Residential Campus", "Beautiful Location", "Strong Bonding"],
    description: "Elite engineering institute with a unique residential campus experience.",
    website: "https://giki.edu.pk",
    avgFee: "PKR 300,000 - 450,000 per semester",
    admissions: {
      deadline: "2026-06-30",
      testName: "GIKI Entry Test",
      testDate: "2026-07-10",
      applyUrl: "https://giki.edu.pk/admissions"
    }
  },
  {
    id: 8,
    name: "Pakistan Institute of Engineering & Applied Sciences (PIEAS)",
    shortName: "PIEAS",
    logo: "/logos/pieas.png",
    city: "Islamabad",
    established: 1967,
    type: "Public",
    ranking: 8,
    fieldRankings: {
      "Pre-Engineering": 4,
      "Computer Science": 7
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Nuclear Engineering", "Chemical Engineering"],
      "Computer Science": ["Computer Science", "Information Security"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Nuclear Research", "High Security", "Elite Faculty"],
    description: "Premier research institute focusing on nuclear and advanced engineering.",
    website: "https://pieas.edu.pk",
    avgFee: "PKR 100,000 - 200,000 per semester",
    admissions: {
      deadline: "2026-07-15",
      testName: "PIEAS Entry Test",
      testDate: "2026-07-25",
      applyUrl: "https://pieas.edu.pk/admissions"
    }
  },
  {
    id: 9,
    name: "Habib University",
    shortName: "Habib",
    logo: "/logos/habib.png",
    city: "Karachi",
    established: 2014,
    type: "Private",
    ranking: 9,
    fieldRankings: {
      "Computer Science": 8,
      "Pre-Engineering": 10,
      "Others": 1
    },
    campusType: "Strong Campus Life",
    hostelAvailability: "On-Campus without Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Others"],
    programs: {
      "Computer Science": ["Computer Science", "Electrical Engineering"],
      "Pre-Engineering": ["Electrical Engineering"],
      "Others": ["Social Development", "Communication & Design"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["Liberal Arts Focus", "Modern Campus", "Innovative Curriculum"],
    description: "Pakistan's first liberal arts university with a focus on innovation.",
    website: "https://habib.edu.pk",
    avgFee: "PKR 400,000 - 550,000 per semester",
    admissions: {
      deadline: "2026-03-15",
      testName: "Habib Test",
      testDate: "2026-03-25",
      applyUrl: "https://habib.edu.pk/admissions"
    }
  },
  {
    id: 10,
    name: "Aga Khan University",
    shortName: "AKU",
    logo: "/logos/aku.png",
    city: "Karachi",
    established: 1983,
    type: "Private",
    ranking: 10,
    fieldRankings: {
      "Medical": 1
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Medical"],
    programs: {
      "Medical": ["MBBS", "BScN Nursing", "Pharmacy"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Top Medical School", "International Recognition", "Research Excellence"],
    description: "Premier medical institution with world-class healthcare training.",
    website: "https://aku.edu",
    avgFee: "PKR 500,000 - 800,000 per semester",
    admissions: {
      deadline: "2026-02-28",
      testName: "AKU Test",
      testDate: "2026-03-10",
      applyUrl: "https://aku.edu/admissions"
    }
  },
  {
    id: 11,
    name: "NED University of Engineering & Technology",
    shortName: "NED",
    logo: "/logos/ned.png",
    city: "Karachi",
    established: 1922,
    type: "Public",
    ranking: 11,
    fieldRankings: {
      "Pre-Engineering": 5,
      "Computer Science": 9
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Petroleum Engineering"],
      "Computer Science": ["Computer Science", "Software Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Historic Excellence", "Affordable", "Strong Alumni"],
    description: "One of Pakistan's oldest engineering universities with strong legacy.",
    website: "https://neduet.edu.pk",
    avgFee: "PKR 60,000 - 120,000 per semester",
    admissions: {
      deadline: "2026-08-10",
      testName: "NED Entry Test",
      testDate: "2026-08-18",
      applyUrl: "https://neduet.edu.pk/admissions"
    }
  },
  {
    id: 12,
    name: "Bahria University",
    shortName: "Bahria",
    logo: "/logos/bahria.png",
    city: "Islamabad",
    established: 2000,
    type: "Private",
    ranking: 12,
    fieldRankings: {
      "Computer Science": 10,
      "Business": 5,
      "Pre-Engineering": 11
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business", "Pre-Engineering"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Artificial Intelligence"],
      "Business": ["Business Administration", "Accounting & Finance"],
      "Pre-Engineering": ["Electrical Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Navy Affiliated", "Multiple Campuses", "Disciplined Environment"],
    description: "Navy-affiliated university with strong discipline and quality education.",
    website: "https://bahria.edu.pk",
    avgFee: "PKR 150,000 - 250,000 per semester",
    admissions: {
      deadline: "2026-02-15",
      testName: "Bahria Test",
      testDate: "2026-02-25",
      applyUrl: "https://bahria.edu.pk/admissions"
    }
  },
  {
    id: 13,
    name: "Air University",
    shortName: "Air",
    logo: "/logos/air.png",
    city: "Islamabad",
    established: 2002,
    type: "Public",
    ranking: 13,
    fieldRankings: {
      "Pre-Engineering": 9,
      "Computer Science": 11,
      "Business": 7
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science", "Business"],
    programs: {
      "Pre-Engineering": ["Aerospace Engineering", "Mechanical Engineering", "Electrical Engineering"],
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Air Force Affiliated", "Aerospace Focus", "Modern Facilities"],
    description: "Air Force university excelling in aerospace and related fields.",
    website: "https://au.edu.pk",
    avgFee: "PKR 130,000 - 220,000 per semester",
    admissions: {
      deadline: "2026-07-20",
      testName: "Air University Test",
      testDate: "2026-07-28",
      applyUrl: "https://au.edu.pk/admissions"
    }
  },
  {
    id: 14,
    name: "SZABIST",
    shortName: "SZABIST",
    logo: "/logos/szabist.png",
    city: "Karachi",
    established: 1995,
    type: "Private",
    ranking: 14,
    fieldRankings: {
      "Computer Science": 12,
      "Business": 6,
      "Others": 2
    },
    campusType: "Industry-Focused",
    hostelAvailability: "Hybrid/Partially Online",
    fields: ["Computer Science", "Business", "Others"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration", "Media Sciences"],
      "Others": ["Media Sciences", "Social Sciences"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Flexible Programs", "Media Focus", "Industry Links"],
    description: "Known for business and media programs with industry connections.",
    website: "https://szabist.edu.pk",
    avgFee: "PKR 180,000 - 300,000 per semester",
    admissions: {
      deadline: "2026-02-20",
      testName: "SZABIST Test",
      testDate: "2026-03-01",
      applyUrl: "https://szabist.edu.pk/admissions"
    }
  },
  {
    id: 15,
    name: "Information Technology University (ITU)",
    shortName: "ITU",
    logo: "/logos/itu.png",
    city: "Lahore",
    established: 2012,
    type: "Public",
    ranking: 15,
    fieldRankings: {
      "Computer Science": 13,
      "Business": 9
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus without Hostel",
    fields: ["Computer Science", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Data Science", "Electrical Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Tech Focused", "Modern Curriculum", "Startup Culture"],
    description: "Modern IT-focused university promoting entrepreneurship and innovation.",
    website: "https://itu.edu.pk",
    avgFee: "PKR 200,000 - 350,000 per semester",
    admissions: {
      deadline: "2026-07-31",
      testName: "ITU Admission Test",
      testDate: "2026-08-05",
      applyUrl: "https://itu.edu.pk/admissions"
    }
  }
];

// Upcoming admission deadlines (sorted by date)
export const upcomingDeadlines = [
  {
    id: 1,
    university: "FAST",
    shortName: "FAST",
    program: "All Programs",
    field: "Computer Science",
    deadline: "2026-01-10",
    testName: "NAT/NTS",
    testDate: "2026-01-15",
    session: "Spring 2026",
    applyUrl: "https://nu.edu.pk/Admissions"
  },
  {
    id: 2,
    university: "COMSATS",
    shortName: "COMSATS",
    program: "All Programs (Wah Campus)",
    field: "Pre-Engineering",
    deadline: "2026-01-12",
    testName: "Entry Test",
    testDate: "2026-01-21",
    session: "Spring 2026",
    applyUrl: "https://admissions.comsats.edu.pk"
  },
  {
    id: 3,
    university: "IBA Karachi",
    shortName: "IBA",
    program: "BBA, BS Programs",
    field: "Business",
    deadline: "2026-01-21",
    testName: "IBA Aptitude Test",
    testDate: "2026-02-01",
    session: "Fall 2026 - Round 1",
    applyUrl: "https://iba.edu.pk/admissions"
  },
  {
    id: 4,
    university: "NUST",
    shortName: "NUST",
    program: "Engineering & CS",
    field: "Pre-Engineering",
    deadline: "2026-01-25",
    testName: "NET Series II",
    testDate: "2026-01-31",
    session: "Fall 2026",
    applyUrl: "https://ugadmissions.nust.edu.pk"
  },
  {
    id: 5,
    university: "LUMS",
    shortName: "LUMS",
    program: "Undergraduate",
    field: "Business",
    deadline: "2026-01-27",
    testName: "LCAT",
    testDate: "2026-02-15",
    session: "Fall 2026",
    applyUrl: "https://admissions.lums.edu.pk"
  },
  {
    id: 6,
    university: "Bahria University",
    shortName: "Bahria",
    program: "All Programs",
    field: "Business",
    deadline: "2026-02-15",
    testName: "Bahria Test",
    testDate: "2026-02-25",
    session: "Fall 2026",
    applyUrl: "https://bahria.edu.pk/admissions"
  },
  {
    id: 7,
    university: "SZABIST",
    shortName: "SZABIST",
    program: "All Programs",
    field: "Business",
    deadline: "2026-02-20",
    testName: "SZABIST Test",
    testDate: "2026-03-01",
    session: "Fall 2026",
    applyUrl: "https://szabist.edu.pk/admissions"
  },
  {
    id: 8,
    university: "Aga Khan University",
    shortName: "AKU",
    program: "MBBS, Nursing",
    field: "Medical",
    deadline: "2026-02-28",
    testName: "AKU Test",
    testDate: "2026-03-10",
    session: "Fall 2026",
    applyUrl: "https://aku.edu/admissions"
  }
];

// Filter options configuration
export const filterOptions = {
  fields: [
    { value: "Pre-Engineering", label: "Pre-Engineering" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Business", label: "Business" },
    { value: "Medical", label: "Medical" },
    { value: "Others", label: "Others" }
  ],

  degreeLevel: [
    { value: "Any", label: "Any Level" },
    { value: "Undergraduate", label: "Undergraduate" },
    { value: "Associate", label: "Associate Degree" }
  ],

  programs: {
    "Pre-Engineering": [
      { value: "Any", label: "Any Program" },
      { value: "Mechanical Engineering", label: "Mechanical Engineering" },
      { value: "Electrical Engineering", label: "Electrical Engineering" },
      { value: "Civil Engineering", label: "Civil Engineering" },
      { value: "Chemical Engineering", label: "Chemical Engineering" },
      { value: "Aerospace Engineering", label: "Aerospace Engineering" }
    ],
    "Computer Science": [
      { value: "Any", label: "Any Program" },
      { value: "Computer Science", label: "Computer Science" },
      { value: "Software Engineering", label: "Software Engineering" },
      { value: "Data Science", label: "Data Science" },
      { value: "Artificial Intelligence", label: "Artificial Intelligence" },
      { value: "Cyber Security", label: "Cyber Security" }
    ],
    "Business": [
      { value: "Any", label: "Any Program" },
      { value: "Business Administration", label: "Business Administration" },
      { value: "Accounting & Finance", label: "Accounting & Finance" },
      { value: "Economics", label: "Economics" }
    ],
    "Medical": [
      { value: "Any", label: "Any Program" },
      { value: "MBBS", label: "MBBS" },
      { value: "BDS", label: "BDS" },
      { value: "Pharmacy", label: "Pharmacy" },
      { value: "Nursing", label: "Nursing" }
    ],
    "Others": [
      { value: "Any", label: "Any Program" },
      { value: "Social Sciences", label: "Social Sciences" },
      { value: "Media Sciences", label: "Media Sciences" }
    ]
  },

  hostelAvailability: [
    { value: "Any", label: "Any" },
    { value: "On-Campus with Hostel", label: "On-Campus with Hostel" },
    { value: "On-Campus without Hostel", label: "On-Campus without Hostel" },
    { value: "Hybrid/Partially Online", label: "Hybrid/Online" }
  ],

  cities: [
    { value: "Any", label: "Any City" },
    { value: "Islamabad", label: "Islamabad" },
    { value: "Lahore", label: "Lahore" },
    { value: "Karachi", label: "Karachi" },
    { value: "Topi", label: "Topi" }
  ],

  campusType: [
    { value: "Any", label: "Any Focus" },
    { value: "Research-Oriented", label: "Research-Oriented" },
    { value: "Industry-Focused", label: "Industry-Focused" },
    { value: "Strong Campus Life", label: "Strong Campus Life" }
  ]
};
