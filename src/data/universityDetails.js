/**
 * University Enriched Details
 * Supplementary data for the university detail page — sourced from official websites
 * Only verified/confirmed facts are included.
 *
 * Keys map to university IDs in universities.js
 * FAST campuses (3–7) and COMSATS campuses (8–14) share the same base data.
 */

const fastBase = {
  qsWorldRank: "Top 500 CS globally (QS Subject)",
  qsSubjectRankings: {
    "Computer Science & IT": "#1 in Pakistan (HEC 2020)",
  },
  acceptanceRate: "~13%",
  enrollmentStats: {
    students: "6 campuses nationwide",
    faculty: "ORIC at each campus",
  },
  financialAid: {
    percentOnAid: "2,000+ students receive aid annually",
    topScholarships: ["Honhaar Scholarship", "HEC Need-Based", "PEEF", "Interest-Free Loans", "KP/Sindh Endowment Board"],
    keyFact: "PKR 60M internal + PKR 40M external donors annually in scholarships",
  },
  placementRate: "High — top CS recruiting ground",
  topRecruiters: ["10Pearls", "Arbisoft", "Systems Ltd", "NetSol", "Netsol", "Uber", "Silicon Valley companies"],
  notableAlumni: [
    { name: "Usman Asif", role: "CEO & Founder, Devsinc (Pakistan/US)", achievement: "Built one of Pakistan's top software development companies" },
    { name: "Miriam Mehdi", role: "Head of Marketplace, Southern Europe — Uber", achievement: "Senior leadership at Uber from FAST-NUCES alumna" },
  ],
  researchCenters: [
    "ORIC (Office of Research, Innovation & Commercialization) at each campus",
    "Competitive programming and hackathon culture",
    "Career Services Office (CSO) at every campus",
  ],
  uniqueFeatures: [
    "#1 Computer Science university in Pakistan (HEC ranking)",
    "6 campuses nationwide — widest CS university reach in Pakistan",
    "Tech industry's preferred recruiting ground; intense industry-aligned curriculum",
  ],
  careerPathGuide: "CS/SE graduates are among the most employable in Pakistan. Paths include local tech product companies (Careem, Bykea, Airlift), outsourcing giants (10Pearls, Arbisoft, Systems Ltd), and international tech (Silicon Valley, UK, UAE). EE graduates go to telecom (Jazz, Zong, PTCL) and power sector. Business graduates enter banking and consulting.",
  admissionTestDetails: {
    name: "FAT (FAST Admission Test)",
    subjects: ["Mathematics", "English", "Analytical Reasoning"],
    totalMarks: null,
    duration: "Approx. 2–3 hours",
    negativeMarking: "Not confirmed on official site",
    meritFormula: "50% Intermediate marks + 50% FAT score",
    safeScore: "70%+ aggregate for top programs",
    syllabusNote: "Mathematics-heavy: algebra, calculus, statistics; English comprehension and grammar; IQ/analytical reasoning. For engineering programs, Physics is included.",
    syllabusLink: "https://www.nu.edu.pk/Admissions",
  },
};

const comsatsBase = {
  qsWorldRank: "#664 (QS 2026)",
  qsSubjectRankings: {
    "Overall": "#664 globally (QS 2026)",
    "THE Ranking": "#601–800 (THE 2025)",
  },
  acceptanceRate: "30–39%",
  enrollmentStats: {
    students: "One of Pakistan's largest university systems",
    faculty: "Multiple campuses; 7 campuses nationwide",
  },
  financialAid: {
    percentOnAid: "Merit + need-based available",
    topScholarships: ["PEEF", "Shahbaz Sharif Merit Scholarship (SSMS)", "HEC Need-Based", "Qarz-e-Hasna (interest-free loan)", "PEC Scholarship (engineering)"],
    keyFact: "Rs. 6,000/CH — most affordable quality STEM education at a top-10 Pakistani university",
  },
  placementRate: "Solid across campuses",
  topRecruiters: ["Jazz", "Telenor", "PTCL", "Banks", "Government organizations", "Software companies"],
  notableAlumni: [],
  researchCenters: [
    "AI, Data Science, and Cybersecurity research groups (Islamabad campus)",
    "Collaborations with COMSATS intergovernmental science organization globally",
    "Virtual Campus for distance learning",
  ],
  uniqueFeatures: [
    "Most affordable quality education at a top-10 Pakistani university (Rs. 6,000/CH)",
    "97 degree programs across 7 campuses — broadest portfolio of any public STEM university",
    "7 campuses nationwide with shared fee structure — equal quality across Pakistan",
  ],
  careerPathGuide: "CS/SE graduates go to local and multinational tech firms. Engineering graduates enter telecom, power, and civil sectors. Business graduates join banking, FMCG, and government. The affordable fee structure makes COMSATS a strong value choice for students seeking quality education at accessible cost.",
  admissionTestDetails: {
    name: "COMSATS Admission Test (NTS NAT for most programs)",
    subjects: ["Mathematics", "English", "Analytical Reasoning", "Physics (for Engineering)"],
    totalMarks: null,
    duration: "Varies by program",
    negativeMarking: "Per NTS guidelines",
    meritFormula: "Academic merit + test score (varies by program and campus)",
    safeScore: "Moderate — 30–39% acceptance rate makes it accessible",
    syllabusNote: "NTS NAT covers English, Analytical Reasoning, and subject-specific content (Mathematics/Physics for engineering, Commerce for BBA). Self-prepared students have a strong chance.",
    syllabusLink: "https://admissions.comsats.edu.pk",
  },
};

export const universityDetails = {
  // ============================================================
  // 1 — NUST
  // ============================================================
  1: {
    qsWorldRank: "#371 (QS 2026)",
    qsSubjectRankings: {
      "Engineering & Technology": "#127 globally (#1 in Pakistan)",
      "Computer Science": "#401–450 globally",
      "Petroleum Engineering": "#51–100 globally",
      "Electrical Engineering": "#201–250 globally",
      "Mechanical Engineering": "#251–300 globally",
    },
    acceptanceRate: "~7.6% (subsidized seats)",
    enrollmentStats: {
      students: "7,000+",
      faculty: "675 full-time",
      internationalStudents: "102 from 33 countries",
    },
    financialAid: {
      percentOnAid: "Merit + need-based (robust program)",
      topScholarships: ["HEC Need-Based Scholarship", "NUST Merit Scholarship", "Ehsaas Undergraduate Scholarship", "USAID-funded programs"],
      keyFact: "One of Pakistan's most robust need-based scholarship programs; students with genuine financial need are strongly supported",
    },
    placementRate: "78%+ within 6 months",
    topRecruiters: ["NESCOM", "PAEC", "Systems Ltd", "FWO", "Google", "Microsoft", "IBM", "Jazz", "Nestle", "SUPARCO"],
    notableAlumni: [
      { name: "NUST SEECS Alumnus", role: "AI Company Founder", achievement: "Forbes 30 Under 30 — AI company acquired by Meta/Facebook" },
      { name: "CSS Toppers", role: "Civil Service of Pakistan", achievement: "Consistently among Pakistan's top CSS exam performers" },
      { name: "1,300+ Alumni", role: "Working in USA", achievement: "Strong diaspora in American tech, academia, and engineering sectors" },
    ],
    researchCenters: [
      "TechOne / Technology Incubation Centre — Pakistan's first university tech incubator (est. 2005, 33,000 sq ft)",
      "Center for Innovation & Entrepreneurship (CIE)",
      "19 specialized research centers across engineering, energy, AI, and environment",
      "National Expansion Plan incubation network (MoIT & PITB partnership)",
    ],
    uniqueFeatures: [
      "Pakistan's highest globally ranked university (#371 QS 2026)",
      "#1 in Pakistan for Engineering & Technology (QS Subject Rankings)",
      "Home to Pakistan's first university technology incubator (TechOne, 2005)",
    ],
    careerPathGuide: "Engineering graduates go to NESCOM, PAEC, FWO, SUPARCO (defense/nuclear/aerospace) and multinational engineering firms. CS/SE graduates join Google, Microsoft, IBM, and Pakistan's top tech companies. Business graduates enter Jazz, Nestle, Unilever, and major banks. NUST also feeds Pakistan's public service — consistently strong CSS performers.",
    admissionTestDetails: {
      name: "NET (NUST Entry Test)",
      subjects: ["Mathematics", "Physics", "English", "Chemistry", "Intelligence/IQ"],
      totalMarks: 200,
      duration: "3 hours",
      negativeMarking: "Yes — negative marking applies",
      meritFormula: "NET 75% + FSc 15% + Matric 10%",
      safeScore: "140+/200 for top Engineering/CS programs (SE: 74%, CS: 73% aggregate)",
      syllabusNote: "FSc-level Mathematics, Physics, Chemistry. English grammar, comprehension, and vocabulary. Intelligence/Analytical reasoning (IQ-style pattern questions). Tests conceptual understanding — not just formula recall.",
      syllabusLink: "https://ugadmissions.nust.edu.pk",
    },
  },

  // ============================================================
  // 2 — LUMS
  // ============================================================
  2: {
    qsWorldRank: "#555 (QS 2026)",
    qsSubjectRankings: {
      "Business & Management": "Top 400 globally",
      "Mathematics": "Top 400 globally",
    },
    acceptanceRate: "Highly selective — own LCAT + holistic review",
    enrollmentStats: {
      students: "5,457",
      faculty: "300+",
      internationalStudents: "Global faculty and exchange students",
    },
    financialAid: {
      percentOnAid: "1 in 4 students receive some form of financial support",
      topScholarships: [
        "100 Annual Merit Scholarships (full/partial tuition)",
        "National Outreach Programme (NOP) — full support from 145+ cities",
        "LUMS Interest-Free Loan (20–100% tuition)",
        "HEC Need-Based Scholarship",
        "External donor scholarships",
      ],
      keyFact: "PKR 13.3 billion disbursed in financial aid since LUMS was founded — 1,625 students from underrepresented communities supported through NOP",
    },
    placementRate: "94% within months of graduation",
    topRecruiters: ["McKinsey", "BCG", "Goldman Sachs", "P&G", "Careem", "10Pearls", "Arbisoft", "Google", "L'Oréal", "Unilever"],
    notableAlumni: [
      { name: "Junaid Murtaza", role: "President & CEO, L'Oréal Indonesia", achievement: "Youngest CEO in L'Oréal Groupe history (BSc 2008)" },
      { name: "Khadija Bakhtiyar", role: "CEO, Teach for Pakistan", achievement: "Leading Pakistan's flagship education-equity organization (BSc 2007)" },
      { name: "Aniqa Afzal", role: "Managing Director, Liberty Global", achievement: "Founder of JazzCash; MD at international telecom group (MBA 2000)" },
    ],
    researchCenters: [
      "Center for Economic Research in Pakistan (CERP)",
      "MGSHSS Research Centre — Social Sciences & Humanities",
      "SBASSE Research Labs — Computer Science, Physics, Chemistry, Biology",
      "Career Development & startup ecosystem support",
      "Career Fair: 204 organizations from 38 sectors (2025)",
    ],
    uniqueFeatures: [
      "Pakistan's only university with 5 fully developed schools including Law and Education",
      "94% placement rate — strongest career outcome of any Pakistani university",
      "National Outreach Programme (NOP): elite education accessible from 145+ cities across Pakistan",
    ],
    careerPathGuide: "Business graduates enter McKinsey, BCG, Goldman Sachs, P&G, and leading Pakistani corporations. CS graduates join Careem, 10Pearls, Arbisoft, Google, and tech startups. Law graduates go to top law firms and government. Social Sciences graduates enter policy, NGOs, academia, and international organizations. 6% become entrepreneurs — LUMS is one of Pakistan's top sources of startup founders.",
    admissionTestDetails: {
      name: "LCAT (LUMS Common Admission Test)",
      subjects: ["Quantitative Reasoning", "Verbal Reasoning", "Analytical Writing"],
      totalMarks: null,
      duration: "Approx. 3–4 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Holistic review: LCAT score + academic record + essays + interview (for some programs)",
      safeScore: "High — extremely competitive; strong academics + test required",
      syllabusNote: "SAT/GRE style reasoning test. Quantitative section covers algebra, arithmetic, geometry, data interpretation. Verbal covers reading comprehension, critical reasoning, vocabulary. LUMS also accepts SAT (March test) and ACT scores.",
      syllabusLink: "https://admissions.lums.edu.pk",
    },
  },

  // ============================================================
  // 3–7 — FAST-NUCES (all campuses share same data)
  // ============================================================
  3: { ...fastBase },
  4: { ...fastBase },
  5: { ...fastBase },
  6: { ...fastBase },
  7: { ...fastBase },

  // ============================================================
  // 8–14 — COMSATS (all campuses share same data)
  // ============================================================
  8:  { ...comsatsBase },
  9:  { ...comsatsBase },
  10: { ...comsatsBase },
  11: { ...comsatsBase },
  12: { ...comsatsBase },
  13: { ...comsatsBase },
  14: { ...comsatsBase },

  // ============================================================
  // 15 — IBA Karachi
  // ============================================================
  15: {
    qsWorldRank: "#291 (QS Asia Rankings)",
    qsSubjectRankings: {
      "Business & Management Studies": "#351 globally (QS Subject)",
      "MBA": "#251 globally (QS Global MBA Rankings)",
    },
    acceptanceRate: "~15–18%",
    enrollmentStats: {
      students: "20,000+ alumni network",
      faculty: "70% of faculty hold PhDs",
    },
    financialAid: {
      percentOnAid: "41% of students received financial assistance (AY 2023–24)",
      topScholarships: [
        "Top 10 IBA test scorers: 50% tuition concession for entire program",
        "Need-based aid: up to 50% tuition concession",
        "PEEF (Punjab Educational Endowment Fund)",
        "SEEF (Sindh Educational Endowment Fund)",
      ],
      keyFact: "41% of IBA students received financial aid in 2023–24 — the assumption that IBA is only for the wealthy is a myth",
    },
    placementRate: "Very high — alumni at top MNCs and government",
    topRecruiters: ["Unilever Pakistan", "P&G", "Shell", "McKinsey", "HBL", "UBL", "PSO", "Lucky Motors", "Engro Corporation"],
    notableAlumni: [
      { name: "Shaukat Aziz", role: "Former Prime Minister of Pakistan", achievement: "Ran Pakistan's government; former Citibank executive" },
      { name: "Mamnoon Hussain", role: "Former President of Pakistan (2013–2018)", achievement: "Pakistan's 12th President; IBA BBA alumnus" },
      { name: "Asad Umar", role: "Former Federal Finance Minister; ex-CEO Engro Corporation", achievement: "One of Pakistan's most prominent business and political leaders" },
    ],
    researchCenters: [
      "Center for Business and Economic Research (CBER)",
      "Office of Research, Innovation & Commercialization (ORIC)",
      "High-Performance Computing (HPC) Cluster",
      "International Resource Center (IRC)",
    ],
    uniqueFeatures: [
      "Oldest business school outside North America (established 1955 — 70+ years)",
      "Merit-only admissions — no quotas, no connections; purely test + interview + academics",
      "QS-ranked for Business & Management (only Pakistani business school in QS subject rankings)",
    ],
    careerPathGuide: "BBA/MBA graduates dominate Pakistan's corporate sector — CEOs and senior executives at Unilever, P&G, Shell, HBL, PSO, Lucky Motors, and MCB are IBA alumni. CS graduates join tech firms and startups. Economics graduates go to the State Bank, academia, World Bank, and IMF. IBA is the single most powerful brand for Pakistani corporate careers.",
    admissionTestDetails: {
      name: "IBA Aptitude Test (own test)",
      subjects: ["Quantitative Ability / Mathematics", "Verbal Ability / English", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Approx. 2.5–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Fully merit-based: IBA Test + Interview + Academic record (no fixed formula published)",
      safeScore: "Competitive — top 10 scorers get 50% scholarship; test is notoriously challenging",
      syllabusNote: "Quantitative: arithmetic, algebra, geometry, data interpretation (SAT/GMAT style). Verbal: critical reading, sentence correction, vocabulary. Analytical: logical reasoning and argument analysis. Interview shortlists are based on test performance.",
      syllabusLink: "https://admissions.iba.edu.pk",
    },
  },

  // ============================================================
  // 16 — UET Lahore
  // ============================================================
  16: {
    qsWorldRank: "#801–850 (QS 2026)",
    qsSubjectRankings: {
      "Petroleum Engineering": "#51–100 globally",
      "Electrical Engineering": "#201–250 globally",
      "Mechanical Engineering": "#251–300 globally",
      "Computer Science": "#401–450 globally",
    },
    acceptanceRate: "~7.6% (subsidized/open-merit seats)",
    enrollmentStats: {
      students: "40,000+ applicants; ~3,045 subsidized seats",
      faculty: "5 campuses; 24 research departments",
      internationalStudents: "Available",
    },
    financialAid: {
      percentOnAid: "Merit + need-based; government subsidy covers most of tuition for merit students",
      topScholarships: ["HEC Need-Based Scholarship", "Merit-based scholarships", "PEEF", "USAID-funded programs", "Position-holder scholarships"],
      keyFact: "Open-merit students pay only PKR 70,000–88,000/semester — most affordable quality engineering in Pakistan; self-finance option also available",
    },
    placementRate: "High — largest engineering alumni network in Pakistan",
    topRecruiters: ["WAPDA", "PTCL", "Oil & Gas Development Company", "Engro", "Descon", "NESPAK", "Pakistan Railways", "Government departments"],
    notableAlumni: [
      { name: "Adil Najam", role: "Dean, Pardee School of Global Studies — Boston University", achievement: "Former VC of LUMS; former President, WWF-Pakistan (EE alumnus)" },
    ],
    researchCenters: [
      "19 dedicated research centers in engineering, energy, environment, and AI",
      "Active research in Petroleum Engineering (Pakistan-specific expertise)",
      "Largest engineering alumni network in Pakistan for industry connections",
    ],
    uniqueFeatures: [
      "100+ year history — oldest engineering university in Pakistan (est. 1921)",
      "Most affordable quality engineering for merit students (PKR 70K–88K/semester)",
      "Globally recognized subject ranks: Petroleum Engineering #51–100 globally",
    ],
    careerPathGuide: "Engineering graduates dominate Pakistan's infrastructure, energy, and manufacturing sectors. Petroleum/Chemical engineers go to OGDCL, PPL, and international oil companies. Electrical engineers join WAPDA, telecom, and power plants. Civil engineers build Pakistan's roads, dams, and buildings. CS/SE graduates join tech companies. UET Lahore has the broadest and deepest alumni network in Pakistan engineering.",
    admissionTestDetails: {
      name: "ECAT (Engineering College Admission Test)",
      subjects: ["Mathematics (100 marks)", "Physics (100 marks)", "Chemistry (100 marks)", "English (100 marks)"],
      totalMarks: 400,
      duration: "2 hours",
      negativeMarking: "Yes — negative marking applies",
      meritFormula: "ECAT 20% + Matric 25% + FSc 45% + Hafiz-e-Quran bonus (if applicable)",
      safeScore: "Closing merit: SE 82%, CS 79%, EE 78%, Civil 75% (aggregate including Matric + FSc + ECAT)",
      syllabusNote: "FSc Pre-Engineering syllabus: Math (calculus, algebra, trigonometry), Physics (mechanics, optics, electricity), Chemistry (organic, inorganic, physical). English comprehension and grammar. Approximately 100 MCQs per subject.",
      syllabusLink: "https://uet.edu.pk/admissions",
    },
  },

  // ============================================================
  // 17 — UET Taxila
  // ============================================================
  17: {
    qsWorldRank: "Listed under UET system",
    qsSubjectRankings: {
      "Engineering": "Strong subject presence",
    },
    acceptanceRate: "Slightly higher than UET Lahore",
    enrollmentStats: {
      students: "Near Islamabad location",
      faculty: "Strong engineering faculty",
    },
    financialAid: {
      percentOnAid: "Merit + need-based via ECAT",
      topScholarships: ["HEC Need-Based", "Merit scholarships", "PEEF"],
      keyFact: "Subsidized seats: PKR 88,000/semester; self-finance: PKR 161,000/semester — very affordable for merit students",
    },
    placementRate: "Strong in Islamabad/Rawalpindi industrial corridor",
    topRecruiters: ["Heavy Mechanical Complex (HMC)", "Pakistan Ordnance Factories", "Telecom sector", "Civil sector", "Government engineering departments"],
    notableAlumni: [],
    researchCenters: [
      "Engineering research labs",
      "Industrial connections to Wah and Islamabad industrial corridor",
    ],
    uniqueFeatures: [
      "Close proximity to Islamabad/Rawalpindi — great for job placement in the capital",
      "Slightly lower cutoffs than UET Lahore — accessible quality engineering",
      "Strong Mechanical and Civil Engineering programs",
    ],
    careerPathGuide: "Mechanical engineers join HMC, POF, and defense manufacturing. Electrical engineers go to telecom and power sectors. Civil engineers work on Islamabad's infrastructure projects. CS graduates join local tech firms in Islamabad.",
    admissionTestDetails: {
      name: "ECAT (Engineering College Admission Test) — same as UET Lahore",
      subjects: ["Mathematics (100 marks)", "Physics (100 marks)", "Chemistry (100 marks)", "English (100 marks)"],
      totalMarks: 400,
      duration: "2 hours",
      negativeMarking: "Yes",
      meritFormula: "ECAT 20% + Matric 25% + FSc 45%",
      safeScore: "SE ~78%, EE ~72%, Civil ~70% aggregate",
      syllabusNote: "Same ECAT syllabus as UET Lahore — FSc Pre-Engineering level Math, Physics, Chemistry, and English.",
      syllabusLink: "https://uettaxila.edu.pk/admissions",
    },
  },

  // ============================================================
  // 25 — NED UET
  // ============================================================
  25: {
    qsWorldRank: "Not in top global overall ranking",
    qsSubjectRankings: {
      "Engineering (QS Subject 2025)": "#101–150 globally",
    },
    acceptanceRate: "40–49%",
    enrollmentStats: {
      students: "8,000–8,999",
      faculty: "28 departments",
    },
    financialAid: {
      percentOnAid: "Merit + need-based; public subsidized fees",
      topScholarships: ["Ma'Jee Scholarship Endowment Fund", "HEC Need-Based", "Sindh Government scholarships", "NED internal scholarships"],
      keyFact: "One of the lowest-cost engineering universities in Karachi — heavily subsidized as a public Sindh university",
    },
    placementRate: "Strong — employment offers before final result in many cases",
    topRecruiters: ["Karachi Port Trust", "KE (K-Electric)", "PSO", "PTCL", "Civil engineering firms", "Textile industry", "Oil & Gas companies"],
    notableAlumni: [],
    researchCenters: [
      "National Center for Cyber Security (NCCS)",
      "National Center for Robotics & Automation (NCRA)",
      "National Center for AI (NCAI)",
      "National Center for Big Data & Cloud Computing (NCBC)",
      "Computational Astrophysics & Space Science Lab",
      "NED Academy: 20+ years of professional development programs",
    ],
    uniqueFeatures: [
      "QS Subject rank #101–150 in Engineering globally — far stronger than overall rank suggests",
      "5 national government research centers on one campus — unique concentration in Pakistan",
      "Largest and oldest engineering university serving Karachi and Sindh",
    ],
    careerPathGuide: "Karachi is Pakistan's industrial capital — NED graduates are the backbone of Karachi's engineering economy. Civil engineers build Karachi's infrastructure. Electrical engineers work at K-Electric, PTCL, and telecom. Petroleum engineers join PSO and oil refineries. CS graduates enter Karachi's IT sector. Architecture graduates join design firms.",
    admissionTestDetails: {
      name: "NED Entry Test (Sindh Board / NED own test)",
      subjects: ["Mathematics", "Physics", "Chemistry", "English"],
      totalMarks: null,
      duration: "Approx. 2 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Academic merit + entry test score (Sindh-based formula)",
      safeScore: "40–49% acceptance rate — moderately accessible",
      syllabusNote: "FSc Pre-Engineering level content: Math, Physics, Chemistry, and English. ISO 9001:2015 certified admission process. Both Sindh board students and out-of-province candidates can apply.",
      syllabusLink: "https://www.neduet.edu.pk/admissions",
    },
  },

  // ============================================================
  // 18 — GIKI
  // ============================================================
  18: {
    qsWorldRank: "QS Subject listed",
    qsSubjectRankings: {
      "Engineering (QS Subject 2025)": "#401–450 globally",
    },
    acceptanceRate: "<9% (extremely selective)",
    enrollmentStats: {
      students: "Fully residential — all students live on campus",
      faculty: "High-caliber engineering faculty",
    },
    financialAid: {
      percentOnAid: "Need-based + merit fee waivers",
      topScholarships: ["GIKI Need-Based Scholarship", "Merit Fee Waiver (per semester)", "Government scholarships (PEEF, HEC)", "External donor scholarships"],
      keyFact: "PKR 200M+ distributed in financial aid annually — semester fee includes residential accommodation (all-inclusive)",
    },
    placementRate: "90%+ — 300+ students placed per year at 100+ organizations",
    topRecruiters: ["Apple", "AWS (Amazon)", "Microsoft", "Google", "HBL", "Engro", "NESCOM", "PAEC", "Tesla (alumni)"],
    notableAlumni: [
      { name: "Ahmar Khan", role: "Senior Engineering Manager — Apple Pay", achievement: "Co-inventor of Apple Pay — only Pakistani among the 7 Apple Pay pioneers" },
      { name: "Amir Rao", role: "Director of Product Management (5G & EC2 Edge) — AWS Amazon", achievement: "Leading cloud infrastructure product at Amazon Web Services" },
      { name: "Muhammad Aurangzeb", role: "CEO, HBL (Habib Bank Limited)", achievement: "Heads Pakistan's largest private bank; GIKI engineering alumnus" },
    ],
    researchCenters: [
      "State-of-the-art engineering laboratories",
      "Mechanical, Electrical, Chemical, and CS research facilities",
      "Fully residential campus enables intensive collaborative research environment",
    ],
    uniqueFeatures: [
      "Fully residential campus — mandatory on-campus living creates Pakistan's strongest peer network",
      "Own concept-based entry test (does NOT accept ECAT) — filters for deep thinkers, not rote learners",
      "Exceptional alumni at global tech giants: Apple Pay co-inventor, AWS Director, Microsoft Architect",
    ],
    careerPathGuide: "GIKI's alumni network is one of the most globally dispersed from any Pakistani university. CS/CE graduates go to Apple, Amazon, Microsoft, Google, and top tech startups. Engineering graduates enter oil & gas, manufacturing, defense, and international engineering firms. The fully residential model creates deep professional bonds — GIKI alumni hire each other aggressively.",
    admissionTestDetails: {
      name: "GIKI Entry Test (own test — NOT ECAT)",
      subjects: ["Mathematics", "Physics", "English"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "GIKI test score + academic record; GIKI test carries most weight",
      safeScore: "<9% acceptance — one of Pakistan's hardest admission processes",
      syllabusNote: "Concept-based, NOT formula-memorization. Tests deep understanding of Physics and Math principles. Questions require logical reasoning and application — students who only memorize formulas perform poorly. English section tests comprehension. Preparation requires understanding WHY formulas work, not just WHAT they are.",
      syllabusLink: "https://giki.edu.pk/admissions",
    },
  },

  // ============================================================
  // 20 — Bahria Islamabad
  // ============================================================
  20: {
    qsWorldRank: "Listed in global rankings",
    qsSubjectRankings: {},
    acceptanceRate: "Moderate — own BUET test",
    enrollmentStats: {
      students: "21,000+ total across 3 campuses",
      faculty: "55,000+ alumni",
    },
    financialAid: {
      percentOnAid: "Merit + need-based",
      topScholarships: ["Top 3 university-wide: 100% tuition waiver", "CGPA 3.5+: continuing scholarship", "Ehsaas Undergraduate Scholarship", "PEEF (Masters level)"],
      keyFact: "PKR 535M+ in total scholarships granted to date; top 3 students each batch get 100% tuition waiver",
    },
    placementRate: "Solid — strong in defense, tech, and maritime sectors",
    topRecruiters: ["Pakistan Navy", "Pakistan Air Force", "Jazz", "Telenor", "Banks (HBL, UBL, MCB)", "Tech companies"],
    notableAlumni: [],
    researchCenters: [
      "National Institute of Maritime Affairs",
      "Maritime Science & Technology Park",
      "Bahria Innovative Sciences & Technologies (BIST)",
      "Business Incubation Center",
    ],
    uniqueFeatures: [
      "Pakistan Navy-backed — disciplined environment; strong defense sector placement",
      "Most diverse program portfolio: Engineering + MBBS/BDS (Karachi) + Law + Maritime + Psychology",
      "75+ international institutional linkages; strong defense/government employment pipeline",
    ],
    careerPathGuide: "CS/SE graduates join tech companies and startups. Engineering graduates enter the defense sector, telecom, and civil industry. Business graduates go into banking and FMCG. Bahria's Pakistan Navy affiliation gives a strong edge for defense-sector placements. Islamabad campus has the highest CS/SE cutoffs (>80%).",
    admissionTestDetails: {
      name: "BUET (Bahria University Entry Test)",
      subjects: ["Mathematics", "English", "Physics (for Engineering)", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Academic merit + BUET score",
      safeScore: "Moderate — accessible with good FSc marks and test preparation",
      syllabusNote: "FSc-level Mathematics, Physics (engineering programs), and English. Analytical and logical reasoning section included. Multiple test series offered during admission season.",
      syllabusLink: "https://bahria.edu.pk/admissions",
    },
  },

  // ============================================================
  // 21 — Bahria Lahore
  // ============================================================
  21: {
    qsWorldRank: "Listed in global rankings",
    qsSubjectRankings: {},
    acceptanceRate: "Moderate",
    enrollmentStats: { students: "Part of 21,000+ Bahria system", faculty: "Shared Bahria faculty network" },
    financialAid: {
      percentOnAid: "Merit + need-based",
      topScholarships: ["Top 3 university-wide: 100% tuition waiver", "Ehsaas Undergraduate Scholarship", "CGPA-based continuing scholarships"],
      keyFact: "PKR 535M+ total scholarships across Bahria system",
    },
    placementRate: "Good — Lahore tech and banking market",
    topRecruiters: ["Tech companies (Lahore)", "Banks", "FMCG", "Telecom"],
    notableAlumni: [],
    researchCenters: ["Business Incubation Center", "Bahria Innovative Sciences & Technologies (BIST)"],
    uniqueFeatures: [
      "Lower cutoffs than Bahria Islamabad — more accessible for Lahore students (~70–75%)",
      "Growing campus with improving industry connections in Lahore's tech ecosystem",
      "Pakistan Navy backing provides stability and discipline culture",
    ],
    careerPathGuide: "CS/SE graduates enter Lahore's thriving tech outsourcing and product startup scene. Business graduates go into Lahore's banking and FMCG market. Engineering graduates enter local industrial firms.",
    admissionTestDetails: {
      name: "BUET (Bahria University Entry Test)",
      subjects: ["Mathematics", "English", "Physics (Engineering)", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed",
      meritFormula: "Academic merit + BUET score",
      safeScore: "Moderate — cutoffs ~70–75% aggregate",
      syllabusNote: "Same BUET format as Bahria Islamabad. FSc-level content with analytical reasoning.",
      syllabusLink: "https://bahria.edu.pk/admissions",
    },
  },

  // ============================================================
  // 22 — Bahria Karachi
  // ============================================================
  22: {
    qsWorldRank: "Listed in global rankings",
    qsSubjectRankings: {},
    acceptanceRate: "Moderate",
    enrollmentStats: { students: "Part of 21,000+ Bahria system; has constituent medical college", faculty: "Medical + Engineering faculty" },
    financialAid: {
      percentOnAid: "Merit + need-based",
      topScholarships: ["Top 3 university-wide: 100% tuition waiver", "Ehsaas Undergraduate Scholarship", "MDCAT-linked aid for medical students"],
      keyFact: "Only top-tier engineering university in Pakistan that also offers MBBS/BDS at the same campus (Karachi)",
    },
    placementRate: "Good — Karachi industrial and medical market",
    topRecruiters: ["Karachi hospitals (MBBS/BDS)", "PTCL", "Banks", "Tech companies", "PSO"],
    notableAlumni: [],
    researchCenters: ["Bahria University Medical & Dental College (BUMDC)", "Maritime Sciences research"],
    uniqueFeatures: [
      "ONLY top-tier engineering university in Pakistan with MBBS + BDS at the same campus",
      "Maritime Sciences and Oceanography programs — rare nationally",
      "Lower CS cutoffs (~65–70%) than Islamabad campus — more accessible",
    ],
    careerPathGuide: "Medical students (MBBS/BDS) go to hospitals and clinics in Karachi and abroad. CS/SE graduates enter Karachi's IT sector. Engineering graduates join Karachi's industrial economy. Maritime graduates pursue naval and shipping careers.",
    admissionTestDetails: {
      name: "BUET for engineering/CS; MDCAT for MBBS/BDS",
      subjects: ["Mathematics", "English", "Physics/Chemistry (by program)", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Approx. 2–3 hours (BUET)",
      negativeMarking: "Not confirmed",
      meritFormula: "Academic merit + BUET/MDCAT score",
      safeScore: "Moderate (~65–70% aggregate for CS/Engineering)",
      syllabusNote: "Engineering/CS: BUET format. Medical programs: MDCAT (national medical test). Karachi campus lower cutoffs than Islamabad — accessible for Karachi-region students.",
      syllabusLink: "https://bahria.edu.pk/admissions",
    },
  },

  // ============================================================
  // 23 — Habib University
  // ============================================================
  23: {
    qsWorldRank: "Listed on QS (growing reputation)",
    qsSubjectRankings: {
      "Accreditation": "PEC Level II (CE & EE); NCEAC accredited (CS)",
    },
    acceptanceRate: "Moderate-high selectivity — own HUAT + essays + interview",
    enrollmentStats: {
      students: "Small cohort — highest faculty-to-student ratio in Pakistan",
      faculty: "International faculty drawn from global institutions",
    },
    financialAid: {
      percentOnAid: "Extensive — multiple full-scholarship tiers",
      topScholarships: [
        "Habib Yohsin Scholarship: 100% tuition + lab fees (exceptional students)",
        "HU TOPS Scholarship: 100% support for full 4-year program",
        "Habib Excellence Scholarship: 60–80% of tuition + lab fees",
        "Habib Merit Scholarship: up to 50% of tuition + lab fees",
        "High Academic Achievement: additional 10% per semester for top performers",
      ],
      keyFact: "100% full-scholarship options exist — Habib University is not only for wealthy families; merit-based full funding is available",
    },
    placementRate: "Strong — many alumni at top global graduate schools",
    topRecruiters: ["MIT (graduate school)", "Stanford (graduate school)", "McKinsey", "Google", "Local tech firms", "International development organizations"],
    notableAlumni: [],
    researchCenters: [
      "Yohsin Habib School of Science & Engineering (SSE) labs",
      "Arif Habib School of Arts, Humanities & Social Sciences (AHSS)",
      "Cross-disciplinary research encouraged by liberal arts model",
    ],
    uniqueFeatures: [
      "Pakistan's ONLY liberal arts university — mandatory cross-disciplinary education for all students",
      "Smallest batch size = most personalized education in Pakistan; world-class international faculty",
      "100% full scholarships available — some of the most generous in Pakistan",
    ],
    careerPathGuide: "CS/CE/EE graduates go to top global tech companies and graduate schools (MIT, Stanford, CMU). Communication Design graduates enter advertising, media, and UX design. Social Development & Policy graduates work in NGOs, government, and international development. Comparative Humanities graduates enter academia, writing, and cultural organizations. Habib's liberal arts model produces unusually versatile graduates.",
    admissionTestDetails: {
      name: "HUAT (Habib University Admission Test)",
      subjects: ["Analytical Reasoning", "Quantitative Reasoning", "Verbal / English"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Holistic review: HUAT score + essays + interview; academic record also considered",
      safeScore: "Competitive — Engineering min 60%, CS min 65%, Arts/Social Sciences min 55% academic eligibility",
      syllabusNote: "Tests analytical thinking, quantitative reasoning, and verbal ability. Essay component assesses writing clarity and critical thinking. Interview assesses intellectual curiosity and fit with liberal arts model. NOT a typical rote-memorization test — original thinking is rewarded.",
      syllabusLink: "https://admissions.habib.edu.pk",
    },
  },

  // ============================================================
  // 19 — PIEAS
  // ============================================================
  19: {
    qsWorldRank: "#721–730 (QS 2026)",
    qsSubjectRankings: {
      "QS 50 Under 50": "Listed (top universities under 50 years old)",
      "HEC Engineering & Technology": "#1 in Pakistan (2006, 2012, 2013)",
      "PEC Ranking": "#1 in Pakistan (2018)",
    },
    acceptanceRate: "~1–2% for BS (hardest engineering admission in Pakistan)",
    enrollmentStats: {
      students: "Small, highly selective cohort",
      faculty: "World-class nuclear and engineering faculty",
    },
    financialAid: {
      percentOnAid: "PAEC sponsorships available; HEC and Ehsaas scholarships",
      topScholarships: [
        "PAEC Sponsorship (bond to work for PAEC post-graduation)",
        "HEC Indigenous Scholarship",
        "Ehsaas Undergraduate Scholarship",
      ],
      keyFact: "Education is heavily subsidized by Pakistan Atomic Energy Commission (PAEC) — some students on full PAEC sponsorship with a service bond",
    },
    placementRate: "90%+ within 6 months — most graduates absorbed directly by PAEC",
    topRecruiters: ["PAEC (Pakistan Atomic Energy Commission)", "NESCOM", "NCA", "Nuclear Power Plants (KANUPP, CHASNUPP)", "Defense Research organizations"],
    notableAlumni: [
      { name: "1,300+ MS Nuclear Graduates", role: "Pakistan Atomic Energy Commission (PAEC)", achievement: "Form the backbone of Pakistan's nuclear power and research program" },
      { name: "Decorated Scientists", role: "PAEC Researchers", achievement: "~2% of MS graduates decorated with Pakistan's highest civil awards: Nishan-i-Imtiaz, Hilal-i-Imtiaz, Sitara-i-Imtiaz" },
    ],
    researchCenters: [
      "KINPOE — Karachi Institute of Power Engineering",
      "NILOP — National Institute of Lasers & Optronics",
      "NIAB — Nuclear Institute for Agriculture & Biology",
      "NIBGE — National Institute of Biotechnology & Genetic Engineering",
    ],
    uniqueFeatures: [
      "Most selective engineering university in Pakistan (~1–2% BS acceptance rate)",
      "Historically #1 Engineering university in Pakistan (HEC and PEC rankings)",
      "Almost guaranteed employment at PAEC — unique pipeline to Pakistan's nuclear sector",
    ],
    careerPathGuide: "PIEAS is for students who want to serve Pakistan's nuclear, defense, and energy sector. Almost all BS graduates are absorbed into PAEC, nuclear power plants, or defense research organizations. MS Nuclear Engineering graduates form the backbone of Pakistan's energy independence program. This is not a university for students seeking private sector IT careers — it is for those dedicated to Pakistan's strategic national programs.",
    admissionTestDetails: {
      name: "PIEAS Admission Test (own national test)",
      subjects: ["Mathematics", "Physics", "English", "Chemistry (for Chemical Engineering)"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "PIEAS Test 60% + Matric 15% + FSc/A-Level 25%",
      safeScore: "Extremely competitive — ~1–2% acceptance; test alone is not enough; need strong academics",
      syllabusNote: "FSc Pre-Engineering level Mathematics and Physics (deep conceptual understanding required). English comprehension. Success rate approximately 1–2% for BS programs. Preparation must be thorough — this is Pakistan's most selective engineering entrance test.",
      syllabusLink: "https://admissions.pieas.edu.pk",
    },
  },

  // ============================================================
  // 26 — Air University
  // ============================================================
  26: {
    qsWorldRank: "#1,009 (US News Best Global Universities)",
    qsSubjectRankings: {
      "QS Sustainability": "#1101–1150 (2026)",
      "National": "2nd position (per Air University)",
    },
    acceptanceRate: "Moderate — own CBT test",
    enrollmentStats: {
      students: "14,500+",
      faculty: "530+",
      internationalStudents: "7+ campuses across Pakistan",
    },
    financialAid: {
      percentOnAid: "Position holders: 100% tuition waiver first semester",
      topScholarships: [
        "Position holders (any board): 100% tuition waiver in first semester",
        "PAF-sponsored scholarships for PAF personnel's children",
        "Merit-based scholarships per semester",
        "Need-based financial support",
      ],
      keyFact: "Board position holders get 100% first-semester tuition waiver — strong incentive for high achievers",
    },
    placementRate: "Strong — especially in aerospace, defense, and IT",
    topRecruiters: ["Pakistan Air Force", "PIA (Pakistan International Airlines)", "Avionics industry", "Jazz", "Telenor", "Banks", "Tech companies"],
    notableAlumni: [
      { name: "Mehvish Anwar", role: "PIA's first female flying spanner engineer", achievement: "Pioneer in Pakistan's aviation engineering sector" },
      { name: "Maryam Nisar", role: "Commercial Director, Jazz (15+ years)", achievement: "Senior commercial leadership at Pakistan's largest telecom" },
    ],
    researchCenters: [
      "National Center for Cyber Security (NCCS) — co-hosted with NED, UET",
      "Center of Excellence for CPEC (China-Pakistan Economic Corridor)",
      "Erasmus+ international academic partnerships",
      "Academic journals: Business & Economics, Linguistics, Corpus Linguistics",
    ],
    uniqueFeatures: [
      "Strong aerospace/avionics programs with direct Pakistan Air Force industry linkage — unique nationally",
      "Aviation Management degree (rare in Pakistan) — pathway to airline management careers",
      "CPEC Center of Excellence — strategic research in China-Pakistan economic projects",
    ],
    careerPathGuide: "Aerospace/Avionics graduates enter Pakistan Air Force and aviation industry. Aviation Management graduates join PIA and airline management. CS/AI/SE graduates go into Islamabad's growing tech sector. Business graduates enter banking, FMCG, and corporate Pakistan. The PAF affiliation gives Air University graduates a distinctive edge in defense-adjacent careers.",
    admissionTestDetails: {
      name: "CBT (Computer-Based Test) — Air University own test",
      subjects: ["Mathematics", "Physics (Engineering)", "English", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Computer-based format; approx. 2 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Academic merit + CBT score; minimum 50% in CBT required for eligibility",
      safeScore: "Moderate — minimum 50% in CBT to qualify; position holders automatically receive tuition waiver",
      syllabusNote: "Computer-based MCQ test. Mathematics and Physics (FSc level) for engineering programs. English and analytical reasoning. Multiple test sessions offered. CBT format means immediate results and standardized testing.",
      syllabusLink: "https://www.au.edu.pk/pages/Admissions/",
    },
  },

  // ============================================================
  // 27 — SZABIST
  // ============================================================
  27: {
    qsWorldRank: "Listed in international rankings",
    qsSubjectRankings: {
      "Business Schools (Asia Inc./CNN-Time Asiaweek)": "Top 15 in South Asia",
      "UNESCO Innovation Award 2024": "Silver Category — only Pakistani university among 2,000+ submissions from 60+ countries",
    },
    acceptanceRate: "Moderate",
    enrollmentStats: {
      students: "16,500+ graduates to date",
      faculty: "5 Pakistan campuses + 1 Dubai campus",
    },
    financialAid: {
      percentOnAid: "Merit-based from 2nd semester; external HEC-USAID and JICA",
      topScholarships: [
        "HEC-USAID MBA Scholarship: full tuition + books + monthly stipend",
        "JICA Need-Based Scholarship: tuition + books + transport + lodging",
        "Merit-based: 25% tuition fee of next semester from 2nd semester onward",
      ],
      keyFact: "HEC-USAID MBA scholarship is among Pakistan's most generous MBA funding — covers full tuition, books, and monthly living stipend",
    },
    placementRate: "Strong — especially in Karachi's business market",
    topRecruiters: ["Karachi corporate sector", "Media industry (TV/Film)", "Pharmaceutical companies", "Tech companies", "Dubai-based employers (Dubai campus)"],
    notableAlumni: [],
    researchCenters: [
      "UNESCO-recognized innovation programs",
      "Active HEC, JICA, USAID research partnerships",
      "Graduate Directory for alumni networking",
    ],
    uniqueFeatures: [
      "Only major Pakistani university with a Dubai campus — direct pathway to Gulf job market",
      "Best Media Sciences program in Pakistan (Film & TV Production, Advertising, Journalism tracks)",
      "UNESCO 2024 Silver Award for innovation — only Pakistani university in the global competition",
    ],
    careerPathGuide: "BBA/MBA graduates dominate Karachi's corporate and financial sector. Media Sciences graduates enter TV production, advertising agencies, and journalism. Biotechnology graduates join pharmaceutical companies and research labs. CS graduates enter Karachi's IT sector. The Dubai campus gives SZABIST graduates a unique competitive advantage for Gulf-market employment.",
    admissionTestDetails: {
      name: "SZABIST Admission Test (own test + interview)",
      subjects: ["Mathematics / Quantitative Reasoning", "English / Verbal Reasoning", "Analytical Reasoning"],
      totalMarks: null,
      duration: "Approx. 2 hours + interview",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "Admission test score + interview + academic record",
      safeScore: "Moderate — accessible with strong academics and reasonable test preparation",
      syllabusNote: "Quantitative reasoning (math, statistics), verbal ability (English comprehension, vocabulary), and analytical reasoning. Interview assesses communication skills and program fit. Spring 2026 intake: test in early February.",
      syllabusLink: "https://szabist.edu.pk/admissions",
    },
  },

  // ============================================================
  // 28 — ITU (Information Technology University)
  // ============================================================
  28: {
    qsWorldRank: "Listed internationally (growing reputation)",
    qsSubjectRankings: {},
    acceptanceRate: "Competitive — own test + academic record",
    enrollmentStats: {
      students: "Located at Arfa Karim Tower, Lahore (Pakistan's iconic tech hub)",
      faculty: "Government of Punjab-backed; IBM and EdX partnership faculty",
    },
    financialAid: {
      percentOnAid: "Merit-based + government Punjab scholarships",
      topScholarships: ["Merit scholarships for clean academic record + full load + no W/F grades", "HEC Scholarships", "Ehsaas Undergraduate Scholarship", "Punjab Government need-based support"],
      keyFact: "Rs. 8,000/CH — quality tech education at less than half the cost of comparable private universities in Lahore",
    },
    placementRate: "Strong — direct startup incubator access",
    topRecruiters: ["ITU Startup Incubator (own)", "Lahore tech companies", "IBM-affiliated organizations", "Government of Punjab tech projects"],
    notableAlumni: [],
    researchCenters: [
      "Pakistan's LARGEST startup incubator — co-located at Arfa Karim Tower",
      "IBM Partnership for curriculum and industry projects",
      "EdX partnership for online learning integration",
      "US State Department academic partnerships",
    ],
    uniqueFeatures: [
      "Pakistan's largest startup incubator on campus — entrepreneurship is embedded in the culture",
      "Unique programs nationally: BS Economics with Data Science; BS English with Digital Humanities",
      "Lowest-cost quality tech education in Lahore — Government of Punjab backing ensures affordability",
    ],
    careerPathGuide: "CS/SE/AI graduates enter Lahore's thriving tech sector and the on-campus startup incubator. Economics with Data Science graduates go into fintech, data analytics, and economic research. Management & Technology graduates pursue tech management and consulting. English with Digital Humanities graduates enter content, UX writing, and digital media. For students with startup ambitions, ITU's incubator is Pakistan's best platform.",
    admissionTestDetails: {
      name: "ITU Admission Test (own test; SAT-I scores also accepted)",
      subjects: ["Quantitative Reasoning / Mathematics", "Verbal / Analytical Reasoning", "English"],
      totalMarks: null,
      duration: "Approx. 2–3 hours",
      negativeMarking: "Not confirmed on official site",
      meritFormula: "50% Academic record (15% Matric + 35% Intermediate/A-Level) + 50% Admission Test score",
      safeScore: "Competitive — minimum 50% required in both Matric and Inter; test score carries 50% weight",
      syllabusNote: "SAT-I style: quantitative reasoning, verbal reasoning, analytical reasoning. ITU also accepts valid SAT-I scores in lieu of own test. Graduate admissions (MS/MPhil): minimum 55% or 2.5 CGPA + 60% in ITU Graduate Admissions Test.",
      syllabusLink: "https://itu.edu.pk/admissions",
    },
  },
};

/**
 * Helper: get enriched details for a university ID
 * Returns null if no details available
 */
export function getUniversityDetails(uniId) {
  return universityDetails[uniId] || null;
}

export { universityDetails as default };
