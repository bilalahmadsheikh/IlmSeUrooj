# UniMatch - University Discovery Platform for Pakistan 🎓

A UCAS-like platform that makes finding the right university in Pakistan fun and engaging through a Tinder-style swiping interface.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── Background/      # Animated & decorative backgrounds
│   ├── ThemeToggle/     # Dark/Light/Treasure theme switcher
│   ├── SwipeCard/       # Tinder-style university cards
│   ├── UniversityComparison/  # Side-by-side comparison tool
│   └── ...
├── context/            # React Context (Theme management)
├── data/               # University & department data
└── utils/              # Utility functions (ranking, etc.)
docs/                    # Project documentation
```

## Features

### Core Features
- 🎯 Smart filter system with 6 dropdowns
- 👆 Tinder-style swipe cards for universities
- 📊 Intelligent ranking based on preferences
- 💾 Save universities for later
- 📅 Real admission deadlines with countdown timers

### University Comparison Tool
- ⚖️ Compare up to 3 universities side-by-side
- 🎓 Filter by department (CS, Engineering, Business, Medical)
- 📋 5 comparison criteria modes
- 💼 Industry connections & placement data
- 🏢 Top recruiters for each university
- 🔬 Research output & faculty metrics

### Theme System
- 🌙 **Dark Mode** - Forest green theme (default)
- ☀️ **Light Mode** - Warm streetlight yellow/cream
- 🗺️ **Treasure Map Mode** - Vintage parchment with map backgrounds

## Tech Stack

- Next.js 16+ (App Router)
- Vanilla CSS (Design System)
- React Hooks & Context for state management

## Documentation

See `/docs` folder:
- `iteration-1.md` - Core swipe functionality
- `iteration-2.md` - University list & deadlines
- `iteration-3.md` - Themes, backgrounds & enhanced comparison
