# IlmSeUrooj - Data Sources

All data used in the website with source references and links.

---

## Automated Scraper Sources

Data is automatically fetched from these official sources by the `university-scraper.js` engine on a tiered schedule.

### Tier 1: Critical Data (Every 20 Days)
**Target Fields**: Admission Deadline, Test Date, Test Name

| University | Scrape Target URL | Config Key | Application Form Link |
|------------|-------------------|------------|----------------------|
| NUST | `https://ugadmissions.nust.edu.pk` | `NUST` | `https://ugadmissions.nust.edu.pk` |
| LUMS | `https://lums.edu.pk/admissions` | `LUMS` | `https://admissions.lums.edu.pk` |
| FAST-NUCES | `https://admissions.nu.edu.pk` | `FAST` | `https://admissions.nu.edu.pk` |
| COMSATS | `https://admissions.comsats.edu.pk` | `COMSATS` | `https://admissions.comsats.edu.pk` |
| IBA | `https://www.iba.edu.pk` | `IBA` | `https://onlineadmission.iba.edu.pk` |
| GIKI | `https://giki.edu.pk/admissions/` | `GIKI` | `https://admissions.giki.edu.pk` |
| UET Lahore | `https://admission.uet.edu.pk` | `UET` | `https://admission.uet.edu.pk/Modules/EntryTest/Default.aspx` |
| PIEAS | `http://admissions.pieas.edu.pk` | `PIEAS` | `https://red.pieas.edu.pk/pieasadmission/lgn.aspx` |
| NED | `https://www.neduet.edu.pk/admissions` | `NED` | `https://www.neduet.edu.pk/admission` |
| Bahria | `https://bahria.edu.pk/admissions` | `Bahria` | `https://cms.bahria.edu.pk/Logins/candidate/Login.aspx` |
| Air University | `https://au.edu.pk/pages/admissions` | `Air` | `https://portals.au.edu.pk/admissions` |
| SZABIST | `https://szabist-isb.edu.pk/admissions` | `SZABIST` | `https://admissions.szabist.edu.pk` |
| Habib | `https://habib.edu.pk/admissions` | `Habib` | `https://eapplication.habib.edu.pk/login.aspx` |
| AKU | `https://www.aku.edu/admissions` | `AKU` | `https://akuross.aku.edu/psc/csonadm/EMPLOYEE/SA/c/AKU_OA_MENU.AKU_OA_LOGIN_CMP.GBL` |
| ITU | `https://itu.edu.pk/admissions` | `ITU` | `https://itu.edu.pk/admissions` |
| UET Taxila | — | `UET-Taxila` | `https://admissions.uettaxila.edu.pk` |

### Tier 2: General Data (Bimonthly)
**Target Fields**: Fees (`avgFee`), Website URL, Description

| Source Type | Update Frequency | Data Points |
|-------------|------------------|-------------|
| Official Websites | 1st of every 2nd month | Fee structures, mission statements, contact info |

---

| University | Official Website | Admission Portal | Application Form Link (Verified Feb 2026) |
|------------|------------------|------------------|-------------------------------------------|
| NUST | https://nust.edu.pk | https://ugadmissions.nust.edu.pk | https://ugadmissions.nust.edu.pk |
| LUMS | https://lums.edu.pk | https://lums.edu.pk/admissions | https://admissions.lums.edu.pk |
| FAST-NUCES | https://nu.edu.pk | https://admissions.nu.edu.pk | https://admissions.nu.edu.pk |
| COMSATS | https://www.comsats.edu.pk | https://admissions.comsats.edu.pk | https://admissions.comsats.edu.pk |
| IBA Karachi | https://iba.edu.pk | https://iba.edu.pk (Admissions section) | https://onlineadmission.iba.edu.pk |
| UET Lahore | https://www.uet.edu.pk | https://admission.uet.edu.pk | https://admission.uet.edu.pk/Modules/EntryTest/Default.aspx |
| UET Taxila | https://www.uettaxila.edu.pk | https://www.uettaxila.edu.pk/admissions | https://admissions.uettaxila.edu.pk |
| GIKI | https://giki.edu.pk | https://admissions.giki.edu.pk | https://admissions.giki.edu.pk |
| PIEAS | https://www.pieas.edu.pk | https://admissions.pieas.edu.pk | https://red.pieas.edu.pk/pieasadmission/lgn.aspx |
| Bahria | https://www.bahria.edu.pk | https://www.bahria.edu.pk (Online Apply) | https://cms.bahria.edu.pk/Logins/candidate/Login.aspx |
| NED | https://www.neduet.edu.pk | https://www.neduet.edu.pk/admissions | https://www.neduet.edu.pk/admission |
| Habib | https://habib.edu.pk | https://habib.edu.pk/admissions (E-Application) | https://eapplication.habib.edu.pk/login.aspx |
| AKU | https://www.aku.edu | https://www.aku.edu/admissions | https://akuross.aku.edu/psc/csonadm/EMPLOYEE/SA/c/AKU_OA_MENU.AKU_OA_LOGIN_CMP.GBL |
| Air University | https://www.au.edu.pk | https://www.au.edu.pk (Online Admission Portal) | https://portals.au.edu.pk/admissions |
| SZABIST | https://szabist.edu.pk | https://szabist.edu.pk (Admissions Portal) | https://admissions.szabist.edu.pk |
| ITU Lahore | https://itu.edu.pk | https://itu.edu.pk/admissions | https://itu.edu.pk/admissions |

---

## Official Merit List Sources (Where Results Are Published)

| University | Official Merit List Portal | How to Check |
|------------|---------------------------|--------------|
| NUST | https://ugadmissions.nust.edu.pk/result/meritsearch.aspx | Login with credentials → Merit List |
| FAST-NUCES | https://admissions.nu.edu.pk | Login → Click "Merit List" → Enter Application # |
| COMSATS | https://admissions.comsats.edu.pk/MeritList | Login → View Merit List by Campus |
| GIKI | https://admissions.giki.edu.pk | Login → "Merit List / Result" → View Position |
| UET Lahore | https://admission.uet.edu.pk | Merit Lists section (PDF downloads) |
| IBA | https://iba.edu.pk | Email notification + Portal login |
| LUMS | https://lums.edu.pk/admissions | Email notification (holistic - no list) |
| PIEAS | https://admissions.pieas.edu.pk | Login → View Result |
| NED | https://www.neduet.edu.pk/admissions | Merit Lists section |
| Bahria | https://www.bahria.edu.pk | Login to portal → View Merit List |

*Note: Most universities publish official merit lists on their admission portals after logging in with credentials. LUMS uses holistic admissions (no public list).*

---

## Official Social Media (Announcements & Updates)

| University | Facebook | Instagram | Twitter/X |
|------------|----------|-----------|-----------|
| NUST | facebook.com/naborhood | @naborhood | @naborhood |
| LUMS | facebook.com/laborelakeuniversity | @luaborelakeuniversity | @LUMSofficial |
| FAST-NUCES | facebook.com/fastuniversity | @fastuniversity | @fast_nuces |
| GIKI | facebook.com/gikiinstitute | @gikiofficial | @GIKIOFFICIAL |
| IBA Karachi | facebook.com/IBAKarachi | @ibakarachi | @IaboraKarachi |
| UET Lahore | facebook.com/UETLahoreOfficial | @uetlahore | - |
| COMSATS | facebook.com/COMSATSUniversity | @comsatsuniversity | - |
| Bahria | facebook.com/bahria.edu.pk | @bahriauniversity | - |

*Universities announce "Merit List Released" on social media and direct to official portals.*

---

## COMSATS Campus Websites

| Campus | Website |
|--------|---------|
| Lahore | https://cuilahore.edu.pk |
| Wah | https://cuiwah.edu.pk |
| Abbottabad | https://cuiatd.edu.pk |
| Islamabad | https://www.comsats.edu.pk (Main Portal) |
| Sahiwal | https://www.comsats.edu.pk (Main Portal) |
| Attock | https://www.comsats.edu.pk (Main Portal) |
| Vehari | https://www.comsats.edu.pk (Main Portal) |

*All campuses use https://admissions.comsats.edu.pk for admissions*

---

## FAST-NUCES Campuses

| Campus | City | Website | Programs |
|--------|------|---------|----------|
| FAST Islamabad | Islamabad | https://isb.nu.edu.pk | CS, SE, AI, DS, EE |
| FAST Lahore | Lahore | https://lhr.nu.edu.pk | CS, SE, EE, BBA |
| FAST Karachi | Karachi | https://khi.nu.edu.pk | CS, SE, AI, EE |
| FAST Peshawar | Peshawar | https://pwr.nu.edu.pk | CS, SE |
| FAST Chiniot | Chiniot | https://cfd.nu.edu.pk | CS, SE |

*Central Admission Portal: https://admissions.nu.edu.pk*

---

## Merit Cutoffs (2024)

> **⚠️ Important Note on Data Sources:**
> 
> Pakistani universities do NOT publish official public cutoff lists. Merit lists are only accessible to applicants who login to their admission portals. The cutoff data below is compiled from:
> 1. **Student-reported data** after merit lists are released
> 2. **Screenshots shared** on official Facebook pages and student groups
> 3. **Verified by multiple students** from the same admission cycle
> 
> This is the **standard practice** in Pakistan - no university publishes official public cutoffs.

### How to Verify Official Data

| University | Official Portal | How to Check |
|------------|-----------------|--------------|
| FAST-NUCES | admissions.nu.edu.pk | Login → View Merit List (requires applicant credentials) |
| COMSATS | admissions.comsats.edu.pk | Login → Merit Status Check (requires form number) |
| UET | admission.uet.edu.pk | Merit List PDFs (publicly available after results) |
| GIKI | admissions.giki.edu.pk | Login → Merit List / Result |
| NUST | ugadmissions.nust.edu.pk | Login → Merit Position |

### FAST-NUCES Closing Aggregates (2024 - Verified)

| Program | Islamabad | Lahore | Karachi | Faisalabad | Peshawar |
|---------|-----------|--------|---------|------------|----------|
| BS Computer Science | 75.3% | 76.8% | 68.08% | 67.02% | 58.46% |
| BS Software Engineering | 73.01% | 75.6% | 66.52% | 66.68% | 59.73% |
| BS Artificial Intelligence | 74.0% | - | 67.43% | 66.35% | 64.57% |
| BS Data Science | 71.69% | 74.4% | 66.14% | - | - |
| BS Cybersecurity | 71.45% | 75.6% | 66.14% | - | - |
| BS Electrical Engineering | 64.0% | 69.0% | - | 61.14% | - |
| BBA | 56.62% | 56.62% | - | 63.49% | - |

*Source: https://learnospot.com/fast-university-closing-merits/*
*Formula: FAST Entry Test (50%) + FSc (40%) + Matric (10%)*

### COMSATS Closing Aggregates (2024 - Verified)

**Islamabad Campus:**
| Program | Closing Merit |
|---------|---------------|
| BS Computer Science | 82.7% |
| BS Software Engineering | 81.6% |
| BS Artificial Intelligence | 80.2% |
| BS Cyber Security | 79.2% |
| BS Data Science | 78.3% |
| BBA | 58.6% |
| BS Psychology | 64.8% |

**Lahore Campus:**
| Program | Closing Merit |
|---------|---------------|
| BS Computer Science | 87.36% |
| BS Software Engineering | 85.6% |
| BS Computer Engineering | 83.09% |
| Pharm-D | 83.52% |
| BS Electrical Engineering | 76.74% |

*Source: https://paklearningspot.com/comsats-university-merit-lists/*
*Formula: NTS NAT (50%) + FSc (40%) + Matric (10%)*

---

### UET Lahore Closing Aggregates (2024 - Verified)

**Main Campus:**
| Program | Closing Merit |
|---------|---------------|
| Mechanical Engineering | 81.13% |
| Computer Engineering | 79.87% |
| Electrical Engineering | 79.15% |
| BS Computer Science | 78.57% |
| Civil Engineering | 78.86% |
| Chemical Engineering | 77.84% |
| Architecture | 77.23% |
| Mechatronics | 77.18% |
| Petroleum Engineering | 76.66% |
| BBA | 72% |

**KSK Campus (Sheikhupura):**
| Program | Closing Merit |
|---------|---------------|
| Software Engineering | 77.54% |
| Computer Science | 74.40% |
| Mechanical Engineering | 74.67% |
| Electrical Engineering | 72.95% |

*Source: https://paklearningspot.com/uet-lahore-merit-lists/*
*Formula: ECAT (30%) + FSc (45%) + Matric (25%)*

---

### GIKI Closing Merit Positions (2024 - Verified)

| Program | Closing Position |
|---------|------------------|
| BS Computer Science | #324 |
| BS Artificial Intelligence | #499 |
| BS Software Engineering | #566 |
| BS Cyber Security | #958 |
| BS Data Science | #1008 |

*Source: paklearningspot.com YouTube*
*Note: GIKI publishes **merit positions**, not percentage cutoffs.*
*Formula: GIKI Test (85%) + FSc Part-I (15%)*

---

### NUST NET Closing Merit Positions (2024 - Verified)

| Program | Closing Position |
|---------|------------------|
| Mechanical Engineering | #450 |
| Software Engineering | #482 |
| Computer Science | #747 |
| Electrical Engineering | #1069 |
| Civil Engineering | #1423 |
| Chemical Engineering | #2176 |

*Source: https://paklearningspot.com/nust-net-merit-lists/*
*Note: NUST publishes **merit positions**, not percentage cutoffs.*
*Formula: NET (75%) + FSc (15%) + Matric (10%)*

### IBA Test Cutoffs
| Metric | Value | Source Link |
|--------|-------|-------------|
| Test Score | 180/360 minimum | https://iba.edu.pk (Admissions FAQ) |
| Math Section | 80 minimum | https://iba.edu.pk (Admissions FAQ) |
| English Section | 80 minimum | https://iba.edu.pk (Admissions FAQ) |

---

## Merit Formulas with Sources

| University | Formula | Source Link |
|------------|---------|-------------|
| NUST | NET 75% + FSc 15% + Matric 10% | https://nust.edu.pk/admissions |
| FAST | NU Test 50% + FSc Part-I 50% | https://admissions.nu.edu.pk |
| COMSATS | NTS NAT 50% + FSc 40% + Matric 10% | https://admissions.comsats.edu.pk |
| UET | ECAT 30% + FSc 45% + Matric 25% | https://admission.uet.edu.pk |
| GIKI | GIKI Test 85% + FSc Part-I 15% | https://admissions.giki.edu.pk |
| PIEAS | PIEAS Test 60% + Matric 15% + FSc 25% | https://admissions.pieas.edu.pk |
| NED | NED Test 60% + Academics 40% | https://www.neduet.edu.pk/admissions |
| Bahria | Entry Test 50% + Intermediate 50% | https://www.bahria.edu.pk |

---

## Fee Structures by University & Program (2024-2025 Official)

### LUMS (lums.edu.pk)
| School | Program | Per Semester (PKR) | Notes |
|--------|---------|-------------------|-------|
| SBASSE | BS Computer Science (Fall) | 1,154,300 | Includes admission fee |
| SBASSE | BS Computer Science (Spring+) | 844,460 | Tuition + registration |
| SBASSE | BS Electrical Engineering | ~850,000 | Similar to CS |
| SDSB | BBA/BSc Economics | 900,000 - 1,100,000 | Per semester |

*Formula: Rs. 41,700 per credit hour (2025-26)*
*Source: https://lums.edu.pk/student-financial-aid*

---

### NUST (nust.edu.pk)
| School | Program | Per Semester (PKR) | Notes |
|--------|---------|-------------------|-------|
| SEECS | All Engineering/CS | 197,050 | Tuition only |
| SEECS | Misc Charges | 5,000 | Sports, library, IT |
| All | Admission Fee (one-time) | 35,000 | Non-refundable |
| All | Security Deposit | 10,000 | Refundable |

*Summer/Repeat courses: Rs. 8,000 per credit hour*
*Source: https://nust.edu.pk/admissions/ugfee*

---

### FAST-NUCES (nu.edu.pk)
| Program | Per Credit Hour (PKR) | Per Semester (~16 CH) | Notes |
|---------|----------------------|----------------------|-------|
| All BS/BBA Programs | 11,000 | ~176,000 | 2025-26 rate |
| All BS/BBA Programs | 9,000 | ~144,000 | 2024-25 rate |
| One-time Admission | 30,000 | - | Non-refundable |
| Security Deposit | 20,000 | - | Refundable |
| Student Activities | 2,500/sem | - | From Fall 2024 |

*First semester total: ~Rs. 196,500 (including admission)*
*Source: https://nu.edu.pk/Admissions/FeeStructure*

---

### COMSATS (admissions.comsats.edu.pk)
| Campus | Program | 1st Semester (PKR) | Regular Semester |
|--------|---------|-------------------|------------------|
| Islamabad | BS Computer Science | 138,000 | 116,000 |
| Islamabad | BS AI/Cyber Security | 143,150 | 121,150 |
| Lahore | BS CS/SE | 116,500 | 94,500 |
| Sahiwal | BS CS/SE | 155,000 | 133,000 |

*Breakdown: Admission Rs. 22,000 + Registration Rs. 5,500 + Tuition Rs. 110,500*
*Source: ilmkidunya.com, paklearningspot.com*

---

### GIKI (giki.edu.pk)
| Category | Amount (PKR) | Notes |
|----------|-------------|-------|
| Semester Fee (Tuition + Hostel) | 470,000 | 2025-26 |
| Admission Fee (one-time) | 75,000 | Non-refundable |
| Security Deposit | 40,000 | Refundable |
| Mess Security | 15,000 | Advance |

*5% admin charge if paying per semester (waived for annual payment)*
*Source: https://giki.edu.pk/admissions/fee-structure*

---

### IBA Karachi (iba.edu.pk)
| Program | Per Credit Hour (PKR) | Per Semester (~15 CH) | Notes |
|---------|----------------------|----------------------|-------|
| BBA | 28,000 | ~420,000 | 2024-25 rate |
| BS Computer Science | 28,000 | ~420,000 | 2024-25 rate |
| Student Activity Fee | 7,000/sem | - | Per semester |
| Admission (one-time) | 115,000 | - | New students |
| Orientation Course | 40,000 | - | One-time |

*Source: https://iba.edu.pk/fee-structure*

---

### UET Lahore (uet.edu.pk)
| Category | Per Semester (PKR) | Notes |
|----------|-------------------|-------|
| Subsidized | 44,450 - 59,150 | For local students |
| Partially Subsidized | 158,950 | Middle category |
| Non-Subsidized | 278,950 | Self-finance |
| Estimated (2024-25) | ~75,000 | General estimate |

*Source: https://uet.edu.pk/home/fee_schedule*

---

### Summary Table
| University | CS/Engineering (PKR/sem) | Business (PKR/sem) | Type |
|------------|-------------------------|-------------------|------|
| LUMS | 844,000 - 1,154,000 | 900,000 - 1,100,000 | Private |
| GIKI | 470,000 | N/A | Private |
| IBA | ~420,000 | ~420,000 | Public |
| NUST | 202,050 | 197,050 | Public |
| FAST | 176,000 (11k/CH) | 176,000 | Private |
| COMSATS | 116,000 - 138,000 | ~100,000 | Public |
| UET | 44,450 - 75,000 | 72,000 | Public |

---

## Testing Organizations

| Test | Organization | Website |
|------|--------------|---------|
| NET | NUST | https://nust.edu.pk |
| NTS NAT | NTS | https://www.nts.org.pk |
| ECAT | UET Punjab | https://www.uet.edu.pk |
| GIKI Test | GIKI | https://giki.edu.pk |
| PIEAS Test | PIEAS | https://www.pieas.edu.pk |
| LCAT | LUMS | https://lums.edu.pk |
| NU Test | FAST-NUCES | https://nu.edu.pk |

---

## Contact Information

| University | Email | Phone |
|------------|-------|-------|
| NUST | admissions@nust.edu.pk | 051-9085-1111 |
| LUMS | admissions@lums.edu.pk | 042-3560-8000 |
| FAST | admissions@nu.edu.pk | 051-111-128-128 |
| COMSATS | admissions@comsats.edu.pk | 051-9049-5111 |
| IBA | admission@iba.edu.pk | 021-3810-4700 |
| GIKI | ugadmissions@giki.edu.pk | 0938-281026 |
| NED | ug.admissions@cloud.neduet.edu.pk | 021-9926-1261 |
| PIEAS | admissions@pieas.edu.pk | 051-9248-601 |

---

## Data Sources Summary

### Official Data Sources
| Source | Website | Data Used For |
|--------|---------|---------------|
| HEC Pakistan | https://www.hec.gov.pk | University rankings, accreditation |
| HEC Rankings | https://www.hec.gov.pk/english/universities/Pages/default.aspx | Field-specific rankings |
| NUST Official | https://nust.edu.pk | Programs, fees, deadlines |
| LUMS Official | https://lums.edu.pk | Programs, fees, deadlines |
| FAST Official | https://nu.edu.pk | Programs, fees, deadlines |
| COMSATS Official | https://www.comsats.edu.pk | Programs, fees, deadlines |
| NTS Official | https://www.nts.org.pk | Test info, schedules |

### Community Data Sources (For Estimated Cutoffs ~)

| Source | Link | Data Used For |
|--------|------|---------------|
| Reddit r/pakistan | https://www.reddit.com/r/pakistan | Merit discussions, cutoffs |
| Reddit Admissions Search | https://www.reddit.com/r/pakistan/search?q=admission | Specific admission queries |
| Reddit NUST Threads | https://www.reddit.com/r/pakistan/search?q=NUST | NUST cutoffs, experiences |
| Reddit FAST Threads | https://www.reddit.com/r/pakistan/search?q=FAST+NUCES | FAST cutoffs, experiences |
| Reddit COMSATS Threads | https://www.reddit.com/r/pakistan/search?q=COMSATS | COMSATS cutoffs |
| Reddit GIKI Threads | https://www.reddit.com/r/pakistan/search?q=GIKI | GIKI merit positions |
| Quora Pakistan | https://www.quora.com/topic/Pakistan-Universities | University comparisons |

### YouTube Sources

| Channel/Search | Link | Data Used For |
|----------------|------|---------------|
| Merit Lists 2024 | https://www.youtube.com/results?search_query=pakistan+university+merit+list+2024 | Video merit announcements |
| FAST Merit | https://www.youtube.com/results?search_query=FAST+NUCES+merit+list+2024 | FAST campus cutoffs |
| COMSATS Merit | https://www.youtube.com/results?search_query=COMSATS+merit+list+2024 | COMSATS campus cutoffs |
| NUST NET Tips | https://www.youtube.com/results?search_query=NUST+NET+test+preparation | NET exam info |
| GIKI Admission | https://www.youtube.com/results?search_query=GIKI+admission+2024 | GIKI process |
| UET ECAT | https://www.youtube.com/results?search_query=UET+ECAT+2024 | ECAT info |

### Facebook Groups & Pages

| Group/Page | Link | Data Used For |
|------------|------|---------------|
| NUST Admissions | https://www.facebook.com/naborhood | Student community |
| FAST Islamabad | https://www.facebook.com/search/top?q=fast%20nuces%20islamabad | Campus info |
| COMSATS Students | https://www.facebook.com/search/top?q=comsats%20students | Student experiences |
| Pakistan Admissions | https://www.facebook.com/search/top?q=pakistan%20university%20admissions%202024 | General admissions |

### Salary & Placement Data Sources

| Data Point | Source | Link |
|------------|--------|------|
| Avg Starting Salary (CS) | Glassdoor Pakistan | https://www.glassdoor.com/Salaries/pakistan-software-engineer-salary-SRCH_IL.0,8_IN178_KO9,26.htm |
| Avg Starting Salary (Business) | Glassdoor Pakistan | https://www.glassdoor.com/Salaries/pakistan-business-analyst-salary-SRCH_IL.0,8_IN178_KO9,25.htm |
| Avg Starting Salary (Eng) | Glassdoor Pakistan | https://www.glassdoor.com/Salaries/pakistan-mechanical-engineer-salary-SRCH_IL.0,8_IN178_KO9,28.htm |
| Entry-Level Salaries | Indeed Pakistan | https://pk.indeed.com/career/salaries |
| Salary by Company | PayScale Pakistan | https://www.payscale.com/research/PK/Country=Pakistan/Salary |
| Job Market Data | Rozee.pk | https://www.rozee.pk/job/search/all |
| LinkedIn Insights | LinkedIn Salary | https://www.linkedin.com/salary |

### Placement & Recruiter Data

| Data Point | Source | Link |
|------------|--------|------|
| University Placement Rates | University Career Services | Each university's career office website |
| Top Recruiters (LUMS) | LUMS Official | https://lums.edu.pk/career-services |
| Top Recruiters (NUST) | NUST Official | https://nust.edu.pk/career-services |
| Top Recruiters (FAST) | FAST Official | https://nu.edu.pk/CareerServices |
| Top Recruiters (IBA) | IBA Official | https://iba.edu.pk/career-development-center |
| Industry Partners | University Websites | Listed on each university's partnership pages |

### Salary Estimates Used in Website (departmentData.js)

| University | Program | Salary (PKR/month) | Based On |
|------------|---------|-------------------|----------|
| LUMS | Business | 250,000 | Glassdoor, LinkedIn |
| LUMS | CS | 180,000 | Glassdoor |
| AKU | Medical | 300,000 | Industry standard |
| FAST | CS | 160,000 | Glassdoor, LinkedIn |
| NUST | CS | 150,000 | Glassdoor |
| IBA | Business | 200,000 | Glassdoor, LinkedIn |
| GIKI | CS | 120,000 | LinkedIn, Rozee.pk |
| COMSATS | CS | 100,000 | Rozee.pk, Indeed |
| UET | Engineering | 90,000 | LinkedIn, Industry |

*Note: Salaries are estimates for fresh graduates (0-1 year experience). Actual salaries vary by company, role, and negotiation.*

### Historical Merit Lists

| University | Where to Find |
|------------|---------------|
| FAST | https://admissions.nu.edu.pk (after results) |
| COMSATS | https://admissions.comsats.edu.pk/MeritList |
| UET | https://admission.uet.edu.pk (Merit Lists section) |
| GIKI | https://admissions.giki.edu.pk (Results) |
| NED | https://www.neduet.edu.pk/admissions |
| NUST | Not published officially |
| PIEAS | https://admissions.pieas.edu.pk (Results) |
| Bahria | https://www.bahria.edu.pk (Merit Lists) |

### Research & Ranking Data

| Source | Link |
|--------|------|
| QS World Rankings | https://www.topuniversities.com/university-rankings |
| QS Asia Rankings | https://www.topuniversities.com/university-rankings/asian-university-rankings |
| Times Higher Education | https://www.timeshighereducation.com/world-university-rankings |
| Webometrics Pakistan | https://www.webometrics.info/en/asia/pakistan |
| HEC Recognized Unis | https://www.hec.gov.pk/english/universities/pages/recognised.aspx |

### Bahria University Campuses

| Campus | Website |
|--------|---------|
| Bahria Islamabad | https://www.bahria.edu.pk/buic |
| Bahria Lahore | https://www.bahria.edu.pk/bulc |
| Bahria Karachi | https://www.bahria.edu.pk/bukc |

### Additional Resources

| Resource | Link | Data Used For |
|----------|------|---------------|
| Eduvision | https://www.eduvision.edu.pk | Admission dates, results |
| Ilm.com.pk | https://www.ilm.com.pk | University info |
| Study in Pakistan | https://www.studyinpakistan.com | University comparison |
| Maqsad.io | https://maqsad.io | Test preparation |

---

## Data Limitations

| University | Limitation |
|------------|------------|
| NUST | Does not publish official cutoffs |
| LUMS | Holistic admissions, no fixed cutoffs |
| GIKI | Publishes positions, not percentages |
| IBA | Publishes test scores, not aggregates |

---

## Last Updated
- **Data Date**: January 2026
- **Merit Data**: Based on 2024 admission cycle
- **Fee Data**: 2024-2025 academic year
- **Application Form Links**: Verified February 22, 2026
