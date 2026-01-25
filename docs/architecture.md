# Component Architecture

## Overview

IlmSeUrooj follows a component-based architecture with clear separation of concerns. The application is built with Next.js 14+ using the App Router pattern.

---

## Directory Structure

```
ilmseurroj/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout with ThemeProvider
│   │   ├── page.js            # Main homepage
│   │   └── globals.css        # Global styles and CSS variables
│   │
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.js              # Navigation bar with logo and theme toggle
│   │   │   └── Header.module.css
│   │   │
│   │   ├── FilterSection/
│   │   │   ├── FilterSection.js       # 6 filter dropdowns container
│   │   │   └── FilterSection.module.css
│   │   │
│   │   ├── SwipeCard/
│   │   │   ├── SwipeCard.js           # Tinder-style swipeable card
│   │   │   └── SwipeCard.module.css   # Card flip, drag animations
│   │   │
│   │   ├── SavedList/
│   │   │   ├── SavedList.js           # Saved universities sidebar panel
│   │   │   └── SavedList.module.css
│   │   │
│   │   ├── SearchableSelect/
│   │   │   ├── SearchableSelect.js    # Reusable dropdown with search
│   │   │   └── SearchableSelect.module.css
│   │   │
│   │   ├── UniversityList/
│   │   │   ├── UniversityList.js      # Expandable university cards list
│   │   │   └── UniversityList.module.css
│   │   │
│   │   ├── UniversityComparison/
│   │   │   ├── UniversityComparison.js    # Side-by-side comparison (3 unis)
│   │   │   └── UniversityComparison.module.css
│   │   │
│   │   ├── AdmissionPredictor/
│   │   │   ├── AdmissionPredictor.js      # Merit calculator with formulas
│   │   │   └── AdmissionPredictor.module.css
│   │   │
│   │   ├── AdmissionsDeadlines/
│   │   │   ├── AdmissionsDeadlines.js     # Deadline tracker with countdown
│   │   │   └── AdmissionsDeadlines.module.css
│   │   │
│   │   ├── Background/
│   │   │   ├── DecorativeImages.js        # Theme-aware decorative elements
│   │   │   ├── DecorativeImages.module.css
│   │   │   ├── SectionBackground.js       # Section-specific backgrounds
│   │   │   └── SectionBackground.module.css
│   │   │
│   │   └── ThemeToggle/
│   │       ├── ThemeToggle.js             # Dark/Light mode switch
│   │       └── ThemeToggle.module.css
│   │
│   ├── context/
│   │   └── ThemeContext.js    # Theme state management (dark/light/treasure)
│   │
│   └── data/
│       ├── universities.js    # 28 universities with all attributes
│       └── departmentData.js  # Department-specific comparison data
│
├── public/
│   ├── logos/                 # University logo images
│   └── backgrounds/           # Theme background images
│
└── docs/                      # This documentation folder
```

---

## Component Details

### Header (`components/Header/`)
- Logo and branding
- Theme toggle button (sun/moon icon)
- Mobile-responsive hamburger menu

### FilterSection (`components/FilterSection/`)
6 dropdown filters with smart defaults:
| Filter | Options | Default |
|--------|---------|---------|
| Field | Pre-Engineering, CS, Business, Medical, Others | Pre-Engineering |
| Degree Level | Any, Undergraduate, Associate | Any |
| Program | Dynamic based on field | Any |
| Hostel | Any, On-Campus with Hostel, without, Hybrid | Any |
| City | Any, Islamabad, Lahore, Karachi, + 10 more | Any |
| Campus Type | Any, Research-Oriented, Industry-Focused, Strong Campus Life | Any |

### SwipeCard (`components/SwipeCard/`)
- Drag-to-swipe gesture handling
- Card flip animation for details view
- Save (💚) and Skip (✕) buttons
- Match percentage display
- Color overlay feedback (green = save, red = skip)

### SavedList (`components/SavedList/`)
- Sidebar panel showing saved universities
- Remove functionality
- Persistent via localStorage
- Collapse/expand toggle

### SearchableSelect (`components/SearchableSelect/`)
Reusable dropdown component with:
- Search/filter functionality
- Keyboard navigation
- Click-outside-to-close
- Proper z-index stacking
- Used in: FilterSection, AdmissionPredictor, UniversityComparison

### UniversityList (`components/UniversityList/`)
- Expandable "View More" (5 → 10 → 15 → All)
- Field-specific ranking badges
- Expandable card details
- Program and facility tags

### UniversityComparison (`components/UniversityComparison/`)
- Compare up to 3 universities side-by-side
- Department filter dropdown
- 5 comparison criteria modes:
  - Overall Performance
  - Industry & Placements
  - Career Opportunities
  - Research & Faculty
  - Facilities & Resources
- "Best" badges for top performers

### AdmissionPredictor (`components/AdmissionPredictor/`)
Campus-specific merit calculator:
- Sliders for FSc, Matric, Expected Test Score
- Education status (FSc/A-Level Complete/Incomplete)
- University-specific formulas (NET, ECAT, NTS NAT, etc.)
- Historical merit data (2023-2024)
- Campus-specific tips and advice
- 22 universities with full criteria data

### AdmissionsDeadlines (`components/AdmissionsDeadlines/`)
- Upcoming/Elapsed toggle
- Field filter (CS, Engineering, Business, Medical)
- Countdown timers (days remaining)
- Urgency badges (red < 3 days, orange < 7 days)
- "View More" expansion
- Apply Now links to official portals

### Background Components (`components/Background/`)
**DecorativeImages.js**
- Theme-aware decorative elements
- Compass, books, graduation cap images
- Position-based placement
- Lazy loading for performance

**SectionBackground.js**
- Full-page map backgrounds for treasure theme
- Section-specific gradients

---

## Data Layer

### universities.js
28 university entries with attributes:
```javascript
{
  id: Number,
  name: String,           // Full university name
  shortName: String,      // Abbreviated (e.g., "FAST Isb")
  logo: String,           // Path to logo image
  city: String,           // Campus city
  established: Number,    // Year founded
  type: String,           // "Public" or "Private"
  ranking: Number,        // Overall ranking (1-28)
  fieldRankings: Object,  // Field-specific rankings
  campusType: String,     // Research/Industry/Campus Life
  hostelAvailability: String,
  fields: Array,          // Offered fields
  programs: Object,       // Programs by field
  degreeLevel: Array,     // Undergrad, Grad, PhD
  highlights: Array,      // 3 key features
  description: String,    // Short description
  website: String,        // Official URL
  avgFee: String,         // Fee range
  admissions: Object      // Deadline, test info, apply URL
}
```

### departmentData.js
Department-specific metrics for comparison:
- Rankings by department
- Faculty strength ratings
- Research output metrics
- Placement rates
- Average starting salaries
- Industry partners
- Key facilities

---

## State Management

| State | Location | Persistence |
|-------|----------|-------------|
| Filter selections | page.js useState | None (resets on reload) |
| Saved universities | page.js useState | localStorage |
| Theme mode | ThemeContext | localStorage |
| Current card index | SwipeCard useState | None |

---

## Data Flow

```
┌─────────────────┐
│  User Input     │
│  (Filters)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Filter State   │
│  Updates        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Ranking        │
│  Algorithm      │
│  (Priority      │
│   Scoring)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Universities   │
│  Sorted         │
└────────┬────────┘
         ▼
┌─────────────────┐      ┌─────────────────┐
│  SwipeCard      │──────▶│  SavedList     │
│  Rendered       │      │  (localStorage) │
└─────────────────┘      └─────────────────┘
```

---

## Styling System

### CSS Variables (globals.css)
```css
/* Dark Theme (default) */
--bg-primary: #0a0f0a;
--bg-secondary: #1a2f1a;
--accent: #2d5a3d;
--text-primary: #e8f5e9;

/* Light Theme */
--bg-primary: #f8f5e9;
--bg-secondary: #fff8e7;
--accent: #2d5a3d;
--text-primary: #1a2f1a;
```

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
