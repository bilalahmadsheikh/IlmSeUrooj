// Mock University Data for Pakistani Universities - Campus-Specific Entries

export const universities = [
  // === NUST (Single Campus) ===
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
    avgFee: "PKR 170,000 - 202,050 per semester (varies by school)",
    admissions: {
      deadline: "2026-01-25",
      testName: "NET Series II",
      testDate: "2026-01-31",
      applyUrl: "https://ugadmissions.nust.edu.pk"
    }
  },

  // === LUMS (Single Campus) ===
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
    avgFee: "PKR 850,000 - 1,200,000 per semester (Rs. 41,700/CH)",
    admissions: {
      deadline: "2026-01-27",
      testName: "LCAT",
      testDate: "2026-02-15",
      applyUrl: "https://admissions.lums.edu.pk"
    }
  },

  // === FAST-NUCES Campuses ===
  {
    id: 3,
    name: "FAST-NUCES Islamabad Campus",
    shortName: "FAST Isb",
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
    highlights: ["#1 CS University", "Highest Cutoffs", "Strong Alumni Network"],
    description: "FAST Islamabad - Most competitive campus with highest merit cutoffs (CS: 75.3%, SE: 73%).",
    website: "https://isb.nu.edu.pk",
    avgFee: "PKR 176,000 per semester (Rs. 11,000/CH)",
    admissions: {
      deadline: "2026-07-04",
      testName: "FAST NU Test",
      testDate: "2026-07-07",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },
  {
    id: 4,
    name: "FAST-NUCES Lahore Campus",
    shortName: "FAST Lhr",
    logo: "/logos/fast.png",
    city: "Lahore",
    established: 2000,
    type: "Private",
    ranking: 4,
    fieldRankings: {
      "Computer Science": 4,
      "Pre-Engineering": 9
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence"],
      "Pre-Engineering": ["Electrical Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Strong CS Program", "Lahore Hub", "Industry Connections"],
    description: "FAST Lahore - Second most competitive campus (CS: 76.8%, SE: 75.6%).",
    website: "https://lhr.nu.edu.pk",
    avgFee: "PKR 176,000 per semester (Rs. 11,000/CH)",
    admissions: {
      deadline: "2026-07-04",
      testName: "FAST NU Test",
      testDate: "2026-07-07",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },
  {
    id: 5,
    name: "FAST-NUCES Karachi Campus",
    shortName: "FAST Khi",
    logo: "/logos/fast.png",
    city: "Karachi",
    established: 2000,
    type: "Private",
    ranking: 5,
    fieldRankings: {
      "Computer Science": 6,
      "Pre-Engineering": 12
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus without Hostel",
    fields: ["Computer Science", "Pre-Engineering"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Data Science"],
      "Pre-Engineering": ["Electrical Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Karachi Tech Hub", "Industry Links", "Affordable"],
    description: "FAST Karachi - Good program quality with moderate cutoffs (CS: 68.08%, SE: 66.52%).",
    website: "https://khi.nu.edu.pk",
    avgFee: "PKR 176,000 per semester (Rs. 11,000/CH)",
    admissions: {
      deadline: "2026-07-04",
      testName: "FAST NU Test",
      testDate: "2026-07-07",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },
  {
    id: 6,
    name: "FAST-NUCES Peshawar Campus",
    shortName: "FAST Psh",
    logo: "/logos/fast.png",
    city: "Peshawar",
    established: 2004,
    type: "Private",
    ranking: 14,
    fieldRankings: {
      "Computer Science": 15
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["Lowest Cutoffs", "Easy Admission", "Growing Campus"],
    description: "FAST Peshawar - Lower cutoffs campus (CS: 58.46%, SE: 59.73%).",
    website: "https://pwr.nu.edu.pk",
    avgFee: "PKR 176,000 per semester (Rs. 11,000/CH)",
    admissions: {
      deadline: "2026-07-04",
      testName: "FAST NU Test",
      testDate: "2026-07-07",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },
  {
    id: 7,
    name: "FAST-NUCES Chiniot-Faisalabad Campus",
    shortName: "FAST CFD",
    logo: "/logos/fast.png",
    city: "Chiniot",
    established: 2012,
    type: "Private",
    ranking: 15,
    fieldRankings: {
      "Computer Science": 16
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["New Campus", "Low Cutoffs", "Affordable"],
    description: "FAST Chiniot-Faisalabad - Lowest cutoffs in FAST (CS: 67.02%, SE: 66.68%).",
    website: "https://cfd.nu.edu.pk",
    avgFee: "PKR 176,000 per semester (Rs. 11,000/CH)",
    admissions: {
      deadline: "2026-07-04",
      testName: "FAST NU Test",
      testDate: "2026-07-07",
      applyUrl: "https://nu.edu.pk/Admissions"
    }
  },

  // === COMSATS Campuses ===
  {
    id: 8,
    name: "COMSATS University Islamabad (Main Campus)",
    shortName: "COMSATS Isb",
    logo: "/logos/comsats.png",
    city: "Islamabad",
    established: 1998,
    type: "Public",
    ranking: 6,
    fieldRankings: {
      "Computer Science": 5,
      "Pre-Engineering": 7,
      "Business": 4
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Artificial Intelligence", "Cyber Security", "Data Science"],
      "Pre-Engineering": ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering"],
      "Business": ["Business Administration", "Accounting & Finance"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Affordable Federal", "High Cutoffs (CS: 82.7%)", "Research Focus"],
    description: "COMSATS Islamabad - Flagship campus with high CS cutoffs (82.7%, SE: 81.6%).",
    website: "https://islamabad.comsats.edu.pk",
    avgFee: "PKR 180,000 - 220,000 per semester (CS/Engineering)",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 9,
    name: "COMSATS University Lahore Campus",
    shortName: "COMSATS Lhr",
    logo: "/logos/comsats.png",
    city: "Lahore",
    established: 2002,
    type: "Public",
    ranking: 7,
    fieldRankings: {
      "Computer Science": 7,
      "Pre-Engineering": 10,
      "Business": 6
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Artificial Intelligence"],
      "Pre-Engineering": ["Electrical Engineering", "Chemical Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Higher CS Cutoff than Isb!", "Lahore Location", "Pharm-D Strong"],
    description: "COMSATS Lahore - Highest CS cutoffs in COMSATS (87.36%, SE: 85.6%)!",
    website: "https://lahore.comsats.edu.pk",
    avgFee: "PKR 120,000 - 190,000 per semester",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 10,
    name: "COMSATS University Wah Campus",
    shortName: "COMSATS Wah",
    logo: "/logos/comsats.png",
    city: "Wah Cantt",
    established: 2001,
    type: "Public",
    ranking: 12,
    fieldRankings: {
      "Computer Science": 11,
      "Pre-Engineering": 14
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering", "Artificial Intelligence"],
      "Pre-Engineering": ["Electrical Engineering", "Mechanical Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Moderate Cutoffs (~80%)", "Near Islamabad", "Good Value"],
    description: "COMSATS Wah - Good middle-ground option with ~80% CS cutoffs.",
    website: "https://wah.comsats.edu.pk",
    avgFee: "PKR 96,000 - 140,000 per semester (Rs. 6,000/CH)",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 11,
    name: "COMSATS University Abbottabad Campus",
    shortName: "COMSATS Abbottabad",
    logo: "/logos/comsats.png",
    city: "Abbottabad",
    established: 2001,
    type: "Public",
    ranking: 13,
    fieldRankings: {
      "Computer Science": 12,
      "Pre-Engineering": 15
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Pre-Engineering", "Medical"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Pre-Engineering": ["Electrical Engineering", "Civil Engineering"],
      "Medical": ["Pharm-D"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Beautiful Location", "CS: 78%", "Strong Pharm-D"],
    description: "COMSATS Abbottabad - Scenic campus with CS cutoffs around 78%.",
    website: "https://abbottabad.comsats.edu.pk",
    avgFee: "PKR 75,000 - 140,000 per semester",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 12,
    name: "COMSATS University Sahiwal Campus",
    shortName: "COMSATS Sahiwal",
    logo: "/logos/comsats.png",
    city: "Sahiwal",
    established: 2007,
    type: "Public",
    ranking: 18,
    fieldRankings: {
      "Computer Science": 18,
      "Business": 12
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["Low Cutoffs (~68%)", "Affordable", "Easy Admission"],
    description: "COMSATS Sahiwal - Lower cutoffs around 68%, easier admission.",
    website: "https://sahiwal.comsats.edu.pk",
    avgFee: "PKR 155,000 (1st sem) / PKR 133,000 (regular)",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 13,
    name: "COMSATS University Attock Campus",
    shortName: "COMSATS Attock",
    logo: "/logos/comsats.png",
    city: "Attock",
    established: 2004,
    type: "Public",
    ranking: 20,
    fieldRankings: {
      "Computer Science": 20,
      "Business": 14
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["Very Low Cutoffs (~62%)", "Near Islamabad", "Easiest COMSATS"],
    description: "COMSATS Attock - One of the easiest COMSATS campuses (~60-65%).",
    website: "https://attock.comsats.edu.pk",
    avgFee: "PKR 70,000 - 130,000 per semester",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },
  {
    id: 14,
    name: "COMSATS University Vehari Campus",
    shortName: "COMSATS Vehari",
    logo: "/logos/comsats.png",
    city: "Vehari",
    established: 2008,
    type: "Public",
    ranking: 22,
    fieldRankings: {
      "Computer Science": 22,
      "Business": 16
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business"],
    programs: {
      "Computer Science": ["Computer Science"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate"],
    highlights: ["Lowest COMSATS Cutoffs", "Very Easy Admission", "Growing"],
    description: "COMSATS Vehari - Lowest cutoffs in COMSATS system (~55-60%).",
    website: "https://vehari.comsats.edu.pk",
    avgFee: "PKR 65,000 - 120,000 per semester",
    admissions: {
      deadline: "2026-07-20",
      testName: "NTS NAT",
      testDate: "2026-07-30",
      applyUrl: "https://admissions.comsats.edu.pk"
    }
  },

  // === IBA (Single Campus) ===
  {
    id: 15,
    name: "Institute of Business Administration (IBA)",
    shortName: "IBA",
    logo: "/logos/iba.png",
    city: "Karachi",
    established: 1955,
    type: "Public",
    ranking: 8,
    fieldRankings: {
      "Business": 2,
      "Computer Science": 8
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
    avgFee: "PKR 200,000 - 240,000 per semester (Rs. 29,400/CH)",
    admissions: {
      deadline: "2026-01-21",
      testName: "IBA Aptitude Test",
      testDate: "2026-02-01",
      applyUrl: "https://iba.edu.pk/admissions"
    }
  },

  // === UET Campuses ===
  {
    id: 16,
    name: "University of Engineering & Technology Lahore",
    shortName: "UET Lahore",
    logo: "/logos/uet.png",
    city: "Lahore",
    established: 1921,
    type: "Public",
    ranking: 9,
    fieldRankings: {
      "Pre-Engineering": 2
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Computer Science"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Historic Institution", "Highest UET Merit", "Very Affordable"],
    description: "UET Lahore - Flagship campus with highest cutoffs (ME: 81.13%, CS: 78.57%).",
    website: "https://uet.edu.pk",
    avgFee: "PKR 150,000 - 250,000 per year (subsidized)",
    admissions: {
      deadline: "2026-03-22",
      testName: "ECAT",
      testDate: "2026-03-30",
      applyUrl: "https://uet.edu.pk/admissions"
    }
  },
  {
    id: 17,
    name: "University of Engineering & Technology Taxila",
    shortName: "UET Taxila",
    logo: "/logos/uet.png",
    city: "Taxila",
    established: 1975,
    type: "Public",
    ranking: 11,
    fieldRankings: {
      "Pre-Engineering": 5
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Software Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Near Islamabad", "Lower than Lahore", "Good Value"],
    description: "UET Taxila - Slightly lower cutoffs than Lahore, near Islamabad.",
    website: "https://uettaxila.edu.pk",
    avgFee: "PKR 150,000 - 250,000 per year (subsidized)",
    admissions: {
      deadline: "2026-03-22",
      testName: "ECAT",
      testDate: "2026-03-30",
      applyUrl: "https://uettaxila.edu.pk/admissions"
    }
  },

  // === GIKI (Single Campus) ===
  {
    id: 18,
    name: "Ghulam Ishaq Khan Institute (GIKI)",
    shortName: "GIKI",
    logo: "/logos/giki.png",
    city: "Topi",
    established: 1993,
    type: "Private",
    ranking: 10,
    fieldRankings: {
      "Pre-Engineering": 3,
      "Computer Science": 9
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
    description: "Elite engineering institute with unique residential campus (CS: #324, AI: #499).",
    website: "https://giki.edu.pk",
    avgFee: "PKR 427,500 per semester (tuition + accommodation)",
    admissions: {
      deadline: "2026-06-16",
      testName: "GIKI Entry Test",
      testDate: "2026-07-09",
      applyUrl: "https://giki.edu.pk/admissions"
    }
  },

  // === PIEAS (Single Campus) ===
  {
    id: 19,
    name: "Pakistan Institute of Engineering & Applied Sciences (PIEAS)",
    shortName: "PIEAS",
    logo: "/logos/pieas.png",
    city: "Islamabad",
    established: 1967,
    type: "Public",
    ranking: 14,
    fieldRankings: {
      "Pre-Engineering": 4,
      "Computer Science": 10
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
    avgFee: "PKR 63,000 - 100,000 per semester (heavily subsidized)",
    admissions: {
      deadline: "2026-03-05",
      testName: "PIEAS Written Test",
      testDate: "2026-04-12",
      applyUrl: "https://pieas.edu.pk/admissions"
    }
  },

  // === Bahria Campuses ===
  {
    id: 20,
    name: "Bahria University Islamabad Campus",
    shortName: "Bahria Isb",
    logo: "/logos/bahria.png",
    city: "Islamabad",
    established: 2000,
    type: "Private",
    ranking: 16,
    fieldRankings: {
      "Computer Science": 13,
      "Business": 7,
      "Pre-Engineering": 16
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
    highlights: ["Navy Affiliated", "High Cutoffs (CS: >80%)", "Disciplined"],
    description: "Bahria Islamabad - Most competitive campus (CS/SE: >80%).",
    website: "https://bahria.edu.pk/islamabad",
    avgFee: "PKR 85,000 - 145,000 per semester",
    admissions: {
      deadline: "2026-06-15",
      testName: "BUET (Bahria Entry Test)",
      testDate: "2026-07-10",
      applyUrl: "https://bahria.edu.pk/admissions"
    }
  },
  {
    id: 21,
    name: "Bahria University Lahore Campus",
    shortName: "Bahria Lhr",
    logo: "/logos/bahria.png",
    city: "Lahore",
    established: 2008,
    type: "Private",
    ranking: 19,
    fieldRankings: {
      "Computer Science": 17,
      "Business": 10
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Lower than Islamabad", "Growing Campus", "Good Value"],
    description: "Bahria Lahore - Moderate cutoffs around 70-75%.",
    website: "https://bahria.edu.pk/lahore",
    avgFee: "PKR 85,000 - 145,000 per semester",
    admissions: {
      deadline: "2026-06-22",
      testName: "BUET (Bahria Entry Test)",
      testDate: "2026-07-10",
      applyUrl: "https://bahria.edu.pk/admissions"
    }
  },
  {
    id: 22,
    name: "Bahria University Karachi Campus",
    shortName: "Bahria Khi",
    logo: "/logos/bahria.png",
    city: "Karachi",
    established: 2004,
    type: "Private",
    ranking: 21,
    fieldRankings: {
      "Computer Science": 19,
      "Business": 11,
      "Medical": 6
    },
    campusType: "Industry-Focused",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Computer Science", "Business", "Medical"],
    programs: {
      "Computer Science": ["Computer Science", "Software Engineering"],
      "Business": ["Business Administration"],
      "Medical": ["MBBS", "BDS"]
    },
    degreeLevel: ["Undergraduate", "Graduate"],
    highlights: ["Medical Programs", "Karachi Location", "Easier Admission"],
    description: "Bahria Karachi - Lower cutoffs (~65-70%), has medical programs.",
    website: "https://bahria.edu.pk/karachi",
    avgFee: "PKR 85,000 - 145,000 per semester",
    admissions: {
      deadline: "2026-06-15",
      testName: "BUET (Bahria Entry Test)",
      testDate: "2026-07-10",
      applyUrl: "https://bahria.edu.pk/admissions"
    }
  },

  // === Other Single-Campus Universities ===
  {
    id: 23,
    name: "Habib University",
    shortName: "Habib",
    logo: "/logos/habib.png",
    city: "Karachi",
    established: 2014,
    type: "Private",
    ranking: 17,
    fieldRankings: {
      "Computer Science": 14,
      "Pre-Engineering": 17,
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
    avgFee: "PKR 335,000 - 395,000 per semester (Engineering)",
    admissions: {
      deadline: "2026-02-19",
      testName: "Habib Entrance Exam",
      testDate: "2026-02-23",
      applyUrl: "https://habib.edu.pk/apply"
    }
  },
  {
    id: 24,
    name: "Aga Khan University",
    shortName: "AKU",
    logo: "/logos/aku.png",
    city: "Karachi",
    established: 1983,
    type: "Private",
    ranking: 23,
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
    avgFee: "PKR 927,000 per semester (MBBS, ~PKR 1,854,000/year)",
    admissions: {
      deadline: "2026-03-15",
      testName: "AKU Entry Test",
      testDate: "2026-06-15",
      applyUrl: "https://aku.edu/admissions"
    }
  },
  {
    id: 25,
    name: "NED University of Engineering & Technology",
    shortName: "NED",
    logo: "/logos/ned.png",
    city: "Karachi",
    established: 1922,
    type: "Public",
    ranking: 24,
    fieldRankings: {
      "Pre-Engineering": 6,
      "Computer Science": 21
    },
    campusType: "Research-Oriented",
    hostelAvailability: "On-Campus with Hostel",
    fields: ["Pre-Engineering", "Computer Science"],
    programs: {
      "Pre-Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Petroleum Engineering"],
      "Computer Science": ["Computer Science", "Software Engineering"]
    },
    degreeLevel: ["Undergraduate", "Graduate", "PhD"],
    highlights: ["Historic Excellence", "Very Affordable", "SE: 87% Cutoff"],
    description: "Historic Karachi engineering university. Software Eng is most competitive (87%).",
    website: "https://neduet.edu.pk",
    avgFee: "PKR 55,000 - 65,000 per semester (subsidized)",
    admissions: {
      deadline: "2026-07-15",
      testName: "NED Entry Test",
      testDate: "2026-07-20",
      applyUrl: "https://neduet.edu.pk/admissions"
    }
  },
  {
    id: 26,
    name: "Air University",
    shortName: "Air",
    logo: "/logos/air.png",
    city: "Islamabad",
    established: 2002,
    type: "Public",
    ranking: 25,
    fieldRankings: {
      "Pre-Engineering": 11,
      "Computer Science": 23,
      "Business": 13
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
    avgFee: "PKR 86,000 - 115,000 per semester (per credit hour)",
    admissions: {
      deadline: "2026-06-20",
      testName: "Air University Entry Test",
      testDate: "2026-07-05",
      applyUrl: "https://au.edu.pk/admissions"
    }
  },
  {
    id: 27,
    name: "SZABIST Karachi",
    shortName: "SZABIST",
    logo: "/logos/szabist.png",
    city: "Karachi",
    established: 1995,
    type: "Private",
    ranking: 26,
    fieldRankings: {
      "Computer Science": 24,
      "Business": 8,
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
    avgFee: "PKR 120,000 - 165,000 per semester",
    admissions: {
      deadline: "2026-02-12",
      testName: "SZABIST Admission Test",
      testDate: "2026-02-14",
      applyUrl: "https://szabist.edu.pk/admissions"
    }
  },
  {
    id: 28,
    name: "Information Technology University (ITU)",
    shortName: "ITU",
    logo: "/logos/itu.png",
    city: "Lahore",
    established: 2012,
    type: "Public",
    ranking: 27,
    fieldRankings: {
      "Computer Science": 25,
      "Business": 15
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
    avgFee: "PKR 80,000 - 175,000 per semester (Rs. 6,000/CH)",
    admissions: {
      deadline: "2026-06-18",
      testName: "ITU Admission Test",
      testDate: "2026-07-01",
      applyUrl: "https://itu.edu.pk/admissions"
    }
  }
];

// Upcoming admission deadlines (sorted by date) - Campus Specific
export const upcomingDeadlines = [
  {
    id: 1,
    university: "IBA Karachi",
    shortName: "IBA",
    program: "BBA, BS Programs",
    field: "Business",
    deadline: "2026-01-21",
    testName: "IBA Aptitude Test",
    testDate: "2026-02-01",
    session: "Fall 2026 - Round 1",
    applyUrl: "https://iba.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 3,
    university: "LUMS",
    shortName: "LUMS",
    program: "Undergraduate",
    field: "Business",
    deadline: "2026-01-27",
    testName: "LCAT",
    testDate: "2026-02-15",
    session: "Fall 2026",
    applyUrl: "https://admissions.lums.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 4,
    university: "SZABIST Karachi",
    shortName: "SZABIST",
    program: "All Programs",
    field: "Business",
    deadline: "2026-02-12",
    testName: "SZABIST Test",
    testDate: "2026-02-22",
    session: "Fall 2026",
    applyUrl: "https://szabist.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 6,
    university: "Habib University",
    shortName: "Habib",
    program: "All Programs",
    field: "Computer Science",
    deadline: "2026-02-19",
    testName: "Habib Entrance Test",
    testDate: "2026-03-01",
    session: "Fall 2026",
    applyUrl: "https://habib.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 5,
    university: "Aga Khan University",
    shortName: "AKU",
    program: "MBBS, Nursing",
    field: "Medical",
    deadline: "2026-02-28",
    testName: "AKU Test",
    testDate: "2026-03-10",
    session: "Fall 2026",
    applyUrl: "https://aku.edu/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 12,
    university: "PIEAS",
    shortName: "PIEAS",
    program: "Engineering & CS",
    field: "Pre-Engineering",
    deadline: "2026-03-05",
    testName: "PIEAS Written Test",
    testDate: "2026-04-12",
    session: "Fall 2026",
    applyUrl: "https://pieas.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 122,
    university: "UET Lahore",
    shortName: "UET Lahore",
    program: "Engineering (ME: 81.6%)",
    field: "Pre-Engineering",
    deadline: "2026-03-22",
    testName: "ECAT",
    testDate: "2026-03-30",
    session: "Fall 2026",
    applyUrl: "https://uet.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 2,
    university: "NUST",
    shortName: "NUST",
    program: "Engineering & CS",
    field: "Pre-Engineering",
    deadline: "2026-03-30",
    testName: "NET Series III",
    testDate: "2026-04-04",
    session: "Fall 2026",
    applyUrl: "https://ugadmissions.nust.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 13,
    university: "Bahria Islamabad",
    shortName: "Bahria Isb",
    program: "CS, SE, BBA",
    field: "Computer Science",
    deadline: "2026-04-02",
    testName: "Bahria CBT (BUET)",
    testDate: "2026-04-04",
    session: "Fall 2026",
    applyUrl: "https://bahria.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 14,
    university: "Bahria Lahore",
    shortName: "Bahria Lhr",
    program: "CS, SE, BBA",
    field: "Computer Science",
    deadline: "2026-04-02",
    testName: "Bahria CBT (BUET)",
    testDate: "2026-04-04",
    session: "Fall 2026",
    applyUrl: "https://bahria.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 11,
    university: "GIKI",
    shortName: "GIKI",
    program: "Engineering & CS",
    field: "Pre-Engineering",
    deadline: "2026-06-16",
    testName: "GIKI Entry Test",
    testDate: "2026-07-09",
    session: "Fall 2026",
    applyUrl: "https://giki.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 7,
    university: "FAST Islamabad",
    shortName: "FAST Isb",
    program: "CS, SE, AI, DS",
    field: "Computer Science",
    deadline: "2026-07-04",
    testName: "FAST NU Test",
    testDate: "2026-07-07",
    session: "Fall 2026",
    applyUrl: "https://nu.edu.pk/Admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 8,
    university: "FAST Lahore",
    shortName: "FAST Lhr",
    program: "CS, SE, AI",
    field: "Computer Science",
    deadline: "2026-07-04",
    testName: "FAST NU Test",
    testDate: "2026-07-07",
    session: "Fall 2026",
    applyUrl: "https://nu.edu.pk/Admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 9,
    university: "FAST Karachi",
    shortName: "FAST Khi",
    program: "CS, SE",
    field: "Computer Science",
    deadline: "2026-07-04",
    testName: "FAST NU Test",
    testDate: "2026-07-07",
    session: "Fall 2026",
    applyUrl: "https://nu.edu.pk/Admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 10,
    university: "FAST Peshawar",
    shortName: "FAST Psh",
    program: "CS, SE",
    field: "Computer Science",
    deadline: "2026-07-04",
    testName: "FAST NU Test",
    testDate: "2026-07-07",
    session: "Fall 2026",
    applyUrl: "https://nu.edu.pk/Admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 19,
    university: "Air University",
    shortName: "Air",
    program: "Aerospace, CS",
    field: "Pre-Engineering",
    deadline: "2026-07-15",
    testName: "Air University CBT",
    testDate: "2026-07-18",
    session: "Fall 2026",
    applyUrl: "https://au.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 123,
    university: "UET Taxila",
    shortName: "UET Taxila",
    program: "Engineering",
    field: "Pre-Engineering",
    deadline: "2026-07-15",
    testName: "ECAT",
    testDate: "2026-07-20",
    session: "Fall 2026",
    applyUrl: "https://uettaxila.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 15,
    university: "COMSATS Islamabad",
    shortName: "COMSATS Isb",
    program: "CS, SE, AI (87% Cutoff)",
    field: "Computer Science",
    deadline: "2026-07-20",
    testName: "NTS NAT",
    testDate: "2026-07-30",
    session: "Fall 2026",
    applyUrl: "https://admissions.comsats.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 16,
    university: "COMSATS Lahore",
    shortName: "COMSATS Lhr",
    program: "CS, SE, AI (87.5% Cutoff)",
    field: "Computer Science",
    deadline: "2026-07-20",
    testName: "NTS NAT",
    testDate: "2026-07-30",
    session: "Fall 2026",
    applyUrl: "https://admissions.comsats.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 17,
    university: "COMSATS Wah",
    shortName: "COMSATS Wah",
    program: "CS, SE, AI (~80% Cutoff)",
    field: "Computer Science",
    deadline: "2026-07-20",
    testName: "NTS NAT",
    testDate: "2026-07-30",
    session: "Fall 2026",
    applyUrl: "https://admissions.comsats.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 18,
    university: "COMSATS Abbottabad",
    shortName: "COMSATS Abbottabad",
    program: "CS, SE, Pharm-D",
    field: "Computer Science",
    deadline: "2026-07-20",
    testName: "NTS NAT",
    testDate: "2026-07-30",
    session: "Fall 2026",
    applyUrl: "https://admissions.comsats.edu.pk",
    lastVerified: "2026-02-19"
  },
  {
    id: 20,
    university: "ITU Lahore",
    shortName: "ITU",
    program: "CS, Data Science",
    field: "Computer Science",
    deadline: "2026-07-31",
    testName: "ITU Admission Test",
    testDate: "2026-08-05",
    session: "Fall 2026",
    applyUrl: "https://itu.edu.pk/admissions",
    lastVerified: "2026-02-19"
  },
  {
    id: 121,
    university: "NED Karachi",
    shortName: "NED",
    program: "Engineering (SE: 87%)",
    field: "Pre-Engineering",
    deadline: "2026-08-10",
    testName: "NED Entry Test",
    testDate: "2026-08-18",
    session: "Fall 2026",
    applyUrl: "https://neduet.edu.pk/admissions",
    lastVerified: "2026-02-19"
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
      { value: "Aerospace Engineering", label: "Aerospace Engineering" },
      { value: "Software Engineering", label: "Software Engineering" }
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
      { value: "Pharm-D", label: "Pharm-D" },
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
    { value: "Peshawar", label: "Peshawar" },
    { value: "Chiniot", label: "Chiniot" },
    { value: "Wah Cantt", label: "Wah Cantt" },
    { value: "Abbottabad", label: "Abbottabad" },
    { value: "Sahiwal", label: "Sahiwal" },
    { value: "Attock", label: "Attock" },
    { value: "Vehari", label: "Vehari" },
    { value: "Taxila", label: "Taxila" },
    { value: "Topi", label: "Topi" }
  ],

  campusType: [
    { value: "Any", label: "Any Focus" },
    { value: "Research-Oriented", label: "Research-Oriented" },
    { value: "Industry-Focused", label: "Industry-Focused" },
    { value: "Strong Campus Life", label: "Strong Campus Life" }
  ]
};
