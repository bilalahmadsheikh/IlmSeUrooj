# Component Architecture

## Overview

UniMatch follows a component-based architecture with clear separation of concerns.

## Component Structure

```
src/components/
├── Header/
│   └── Header.js              # Navigation and branding
├── FilterSection/
│   ├── FilterSection.js       # Container for all filters
│   └── FilterSection.module.css
├── SwipeCard/
│   ├── SwipeCard.js           # Individual swipeable card
│   └── SwipeCard.module.css
└── SavedList/
    ├── SavedList.js           # Saved universities panel
    └── SavedList.module.css
```

## Data Flow

```
User Selects Filters
       ↓
Filter State Updates
       ↓
Ranking Algorithm Runs
       ↓
Universities Sorted
       ↓
Cards Rendered in Order
       ↓
User Swipes Card
       ↓
Saved/Skipped State Updates
```

## State Management

- **Filter State**: React useState in page component
- **Universities**: Imported from data/universities.js
- **Saved List**: React useState with localStorage persistence
