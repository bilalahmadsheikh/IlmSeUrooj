# IlmSeUrooj - Complete Development History

All iterations of the IlmSeUrooj (UniMatch) project documented in one place.

---

## Project Timeline

| Iteration | Date | Focus Area |
|-----------|------|------------|
| 1 | 2026-01-12 | Core swipe interface, filters, 15 universities |
| 2 | 2026-01-12 | University list, rankings, deadlines |
| 3 | 2026-01-23 | Theme system, backgrounds, comparison tool |
| 4 | 2026-01-25 | Campus-specific data, 28 universities |

---

## Iteration 1: Homepage with Tinder-Style Swiping
**Date**: 2026-01-12 | **Status**: ✅ Complete

### Overview
Built the core swipe-based university browsing interface with intelligent filtering and ranking.

### Features Implemented

#### Filter System (6 Filters)
| Filter | Purpose | Options |
|--------|---------|---------|
| Field/Category | Main study area | Pre-Engineering, CS, Business, Medical, Others |
| Degree Level | Academic level | Any, Undergraduate, Associate |
| Program | Specific major | Dynamic based on field selection |
| Hostel/Campus | Accommodation | On-Campus with Hostel, without, Hybrid |
| City/Location | Geographic | Islamabad, Lahore, Karachi, Topi, etc. |
| Campus Type | Culture focus | Research-Oriented, Industry-Focused, Strong Campus Life |

#### Swipe Interface
- **Drag Gestures**: Touch/mouse drag left or right
- **Buttons**: Save (💚) and Skip (✕) for click-based interaction
- **Visual Feedback**: Color overlays during swipe
- **Match Percentage**: Calculated based on filter compatibility

#### Smart Ranking Algorithm
Priority-based scoring system:
| Criterion | Points |
|-----------|--------|
| Exact Program Match | 40 pts |
| Field Category Match | 30 pts |
| Campus/Hostel Match | 15 pts |
| City Match | 10 pts |
| Campus Type Match | 5 pts |

#### Initial University Data (15 Universities)
NUST, LUMS, FAST, COMSATS, IBA, UET, GIKI, PIEAS, Habib, AKU, NED, Bahria, Air University, SZABIST, ITU

### Technical Decisions
- **Framework**: Next.js 14+ with App Router for modern React features
- **Styling**: Vanilla CSS with CSS Modules for scoped styles
- **Design**: Glass-morphism effects, mobile-first responsive
- **State**: React hooks (useState) for simplicity

---

## Iteration 2: University List & Admissions Deadlines
**Date**: 2026-01-12 | **Status**: ✅ Complete

### Overview
Added comprehensive university listing with field-specific rankings and real admission deadline data.

### Features Implemented

#### University List Section
- Complete scrollable list below swipe area
- Expandable cards with full details
- Field-specific ranking badges (#1 in Pre-Eng, etc.)
- "View Details" expand/collapse functionality
- Programs, facilities, and fee information

#### Field-Specific Rankings
Different ranking order based on selected field:

**Pre-Engineering Rankings**:
1. NUST → 2. UET → 3. GIKI → 4. PIEAS → 5. NED

**Business Rankings**:
1. LUMS → 2. IBA → 3. NUST → 4. COMSATS → 5. Bahria

**Computer Science Rankings**:
1. FAST → 2. NUST → 3. LUMS → 4. COMSATS → 5. IBA

#### Admission Deadlines
Real 2026 data from official university websites:
- **Countdown Timers**: Days remaining until deadline
- **Urgency Badges**: Red (< 3 days), Orange (< 7 days), Yellow (< 14 days)
- **Apply Now Links**: Direct links to official admission portals
- **Field Filter**: Filter deadlines by field of study
- **Test Information**: Test names and dates

### Data Sources
Official university admission portals:
- NUST: nust.edu.pk, ugadmissions.nust.edu.pk
- LUMS: lums.edu.pk, admissions.lums.edu.pk
- IBA: iba.edu.pk
- FAST: nu.edu.pk
- COMSATS: comsats.edu.pk, admissions.comsats.edu.pk

### Technical Changes
- Added `fieldRankings` object to each university entry
- Added `upcomingDeadlines` array with structured deadline data
- Created `UniversityList` component with expand/collapse
- Created `AdmissionsDeadlines` component with countdown logic

---

## Iteration 3: Theme System & Enhanced Comparison
**Date**: 2026-01-23 | **Status**: ✅ Complete

### Overview
Implemented a comprehensive multi-theme system and completely rebuilt the university comparison tool with department-specific data.

### Features Implemented

#### Multi-Theme System
Three distinct visual themes with seamless switching:

| Theme | Primary Color | Background | Use Case |
|-------|---------------|------------|----------|
| Dark Mode | Forest Green (#2d5a3d) | Deep green (#0a0f0a) | Default, eye-friendly |
| Light Mode | Forest Green (#2d5a3d) | Cream (#f8f5e9) | Bright environments |
| Treasure Map | Brown/Sepia | Parchment textures | Thematic experience |

#### Decorative Background Images
- **Position-based Decorations**: Compass, books, graduation cap
- **Full-page Map Backgrounds**: For treasure theme sections
- **Circular Patterns**: Linked-list style repeating backgrounds
- **Performance**: Lazy loading, optimized images

#### Enhanced University Comparison Tool
Major upgrade with department-specific comparison:

**New Filter Dropdowns**:
- Department Filter: CS, Pre-Engineering, Business, Medical
- Comparison Criteria: 5 modes

**Comparison Criteria Modes**:
| Mode | Metrics Compared |
|------|------------------|
| Overall Performance | Rankings, ratings, placements |
| Industry & Placements | Placement rate, salary, recruiters |
| Career Opportunities | Graduate outcomes, industry partners |
| Research & Faculty | PhD %, research papers, faculty strength |
| Facilities & Resources | Labs, equipment, resources |

**Department-Specific Data (15 Universities)**:
- Department rankings within field
- Faculty strength ratings (1-5)
- Research output metrics
- Placement rates (%)
- Average starting salaries (PKR)
- Top industry recruiters
- Key facilities and labs
- PhD faculty percentage

### Technical Changes

#### New Files Created
| File | Purpose |
|------|---------|
| `src/data/departmentData.js` | Department metrics for all universities |
| `src/components/Background/DecorativeImages.js` | Theme-aware decorations |
| `src/components/Background/DecorativeImages.module.css` | Decoration styling |
| `src/components/Background/SectionBackground.js` | Section backgrounds |
| `src/components/ThemeToggle/ThemeToggle.js` | Theme switch component |
| `src/context/ThemeContext.js` | Theme state management |

#### Modified Files
- `src/app/globals.css`: Added light mode color palette
- `src/components/UniversityComparison/`: Complete rewrite

---

## Iteration 4: Campus-Specific Data & Refinements
**Date**: 2026-01-25 | **Status**: ✅ Complete

### Overview
Split multi-campus universities into individual entries and added campus-specific admission data, expanding from 15 to 28 university entries.

### Features Implemented

#### Campus-Specific University Entries
Universities with multiple campuses now have separate entries:

**FAST-NUCES (5 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| FAST Islamabad | Islamabad | 73% | Most competitive |
| FAST Lahore | Lahore | 70% | Second highest |
| FAST Karachi | Karachi | 69% | Moderate |
| FAST Peshawar | Peshawar | ~53% | Easiest |
| FAST Chiniot | Chiniot | ~54% | New campus |

**COMSATS (7 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| COMSATS Lahore | Lahore | 87.5% | Highest (surprising!) |
| COMSATS Islamabad | Islamabad | 87.1% | Main campus |
| COMSATS Wah | Wah Cantt | ~80% | Near Islamabad |
| COMSATS Abbottabad | Abbottabad | 78.2% | Scenic location |
| COMSATS Sahiwal | Sahiwal | ~68% | Easy admission |
| COMSATS Attock | Attock | ~62% | Easy admission |
| COMSATS Vehari | Vehari | ~58% | Easiest |

**Bahria University (3 Campuses)**:
| Campus | City | CS Cutoff | Notes |
|--------|------|-----------|-------|
| Bahria Islamabad | Islamabad | >80% | Most competitive |
| Bahria Lahore | Lahore | ~72% | Moderate |
| Bahria Karachi | Karachi | ~68% | Has medical programs |

**UET (2 Campuses)**:
| Campus | City | ME Cutoff | Notes |
|--------|------|-----------|-------|
| UET Lahore | Lahore | 81.65% | Flagship campus |
| UET Taxila | Taxila | ~75% | Near Islamabad |

#### GIKI Merit Position Data
Changed from total seat counts to **closing merit positions**:
- **CS**: Closed at position #326 (2024)
- **ME**: Closed at position #1400+
- **EE**: Closed at position #2000+

This means: The last student admitted to CS was ranked #326 overall.

#### Campus-Specific Admission Predictor
Each campus entry now has individual:
- Merit formula breakdown
- Campus-specific cutoff percentages
- Historical merit data (2023-2024)
- Tailored tips and advice

#### UI Refinements
- **Emoji Removal**: Removed all emojis except 💚 in save buttons
- **Deadline Toggle**: Added Upcoming/Elapsed switch
- **Facility Tags**: Improved visibility and styling

### Technical Changes

#### Modified Files
| File | Change |
|------|--------|
| `src/data/universities.js` | Expanded from 15 to 28 entries |
| `src/components/AdmissionPredictor/AdmissionPredictor.js` | 22 campus-specific criteria entries |
| `src/components/AdmissionsDeadlines/AdmissionsDeadlines.js` | Added toggle feature |
| Multiple components | Emoji removal |

### Data Sources
Campus cutoff data researched from:
- Official university merit lists (2024)
- HEC Pakistan rankings
- Student forums (Reddit r/pakistan, Maqsad.io)
- University admission portals
- YouTube admission result videos

---

## Current Project Stats

| Metric | Value |
|--------|-------|
| Total Universities | 28 (campus-specific) |
| Single Campus Unis | 11 |
| Multi-Campus Unis | 4 (17 campuses total) |
| Major Components | 12 |
| Theme Modes | 3 |
| Admission Criteria Entries | 22 |
| Data Points per Uni | 15+ |
| Lines of Code | ~8,000+ |

---

## Future Roadmap (Planned)

- [ ] User accounts and saved preferences
- [ ] More universities (medical colleges, smaller unis)
- [ ] Mobile app (React Native)
- [ ] AI-powered university recommendations
- [ ] Scholarship information database
- [ ] University reviews from students
