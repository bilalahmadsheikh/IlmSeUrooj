# IlmSeUrooj (UniMatch) Documentation

## About the Project

**IlmSeUrooj** (علم سے عروج - "Rise through Knowledge") is a comprehensive Pakistani university discovery platform designed to help students find their perfect university match. The platform uses a modern Tinder-like swipe interface combined with detailed admission data, merit calculators, and comparison tools.

### Target Audience
- Pakistani students preparing for university admissions (FSc/A-Level)
- Students comparing different campuses of the same university
- Parents and counselors helping students make informed decisions

### Key Differentiators
- **Campus-Specific Data**: Unlike other platforms, we treat each campus separately (e.g., FAST Islamabad vs FAST Peshawar have different cutoffs)
- **Swipe Interface**: Intuitive Tinder-like experience for browsing universities
- **Real Merit Data**: Researched cutoffs from official merit lists and student forums
- **Visual Theme**: Unique treasure map theme representing the "journey to knowledge"

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Component structure, data flow, and technical decisions |
| [CHANGELOG](./CHANGELOG.md) | Complete development history with all iterations |
| [Iteration 1](./iteration-1.md) | Swipe interface, filters, initial 15 universities |
| [Iteration 2](./iteration-2.md) | University list, rankings, admission deadlines |
| [Iteration 3](./iteration-3.md) | Theme system, decorative backgrounds, comparison tool |
| [Iteration 4](./iteration-4.md) | Campus-specific data, 28 universities, merit positions |

---

## Quick Statistics

| Metric | Value |
|--------|-------|
| Total Universities | 28 (campus-specific entries) |
| Multi-Campus Universities | FAST (5), COMSATS (7), Bahria (3), UET (2) |
| Major Components | 12 |
| Theme Modes | 3 (Dark, Light, Treasure Map) |
| Data Points per University | 15+ attributes |

---

## University Coverage

### Single Campus Universities
NUST, LUMS, IBA, GIKI, PIEAS, NED, Habib, AKU, Air University, SZABIST, ITU

### Multi-Campus Universities

**FAST-NUCES (5 Campuses)**
| Campus | City | CS Cutoff (2024) |
|--------|------|------------------|
| FAST Islamabad | Islamabad | 73% |
| FAST Lahore | Lahore | 70% |
| FAST Karachi | Karachi | 69% |
| FAST Peshawar | Peshawar | ~53% |
| FAST Chiniot | Chiniot | ~54% |

**COMSATS (7 Campuses)**
| Campus | City | CS Cutoff (2024) |
|--------|------|------------------|
| COMSATS Islamabad | Islamabad | 87.1% |
| COMSATS Lahore | Lahore | 87.5% |
| COMSATS Wah | Wah Cantt | ~80% |
| COMSATS Abbottabad | Abbottabad | 78.2% |
| COMSATS Sahiwal | Sahiwal | ~68% |
| COMSATS Attock | Attock | ~62% |
| COMSATS Vehari | Vehari | ~58% |

**Bahria University (3 Campuses)**
| Campus | City | CS Cutoff (2024) |
|--------|------|------------------|
| Bahria Islamabad | Islamabad | >80% |
| Bahria Lahore | Lahore | ~72% |
| Bahria Karachi | Karachi | ~68% |

**UET (2 Campuses)**
| Campus | City | ME Cutoff (2024) |
|--------|------|------------------|
| UET Lahore | Lahore | 81.65% |
| UET Taxila | Taxila | ~75% |

---

## Technical Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: CSS Modules with custom design system
- **State Management**: React useState + Context API
- **Persistence**: localStorage for saved universities
- **Design**: Mobile-first responsive, treasure map theme

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` to see the application.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for educational purposes.
