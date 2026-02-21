# UniMatch Extension — Technical Overview

## What Is UniMatch?
A Chrome extension + Next.js backend that autofills Pakistani university application forms from a single student profile using AI field mapping via local Ollama (llama3).

**Core principle:** AI fills what it knows. Human fills what's unique. Human always submits.

## Architecture
```
Chrome Extension (MV3)  →  Next.js API Routes  →  Supabase (PostgreSQL + Auth)
  content.js                /api/profile             profiles (RLS)
  service-worker.js         /api/fieldmap            field_maps (public)
  popup                     /api/applications        applications (RLS)
  sidebar                   /api/sop-draft           remembered_answers (RLS)
                            /api/remembered-answers   student-documents bucket
```

## Key Features
| Feature | Phase | Description |
|---------|-------|-------------|
| Supabase Foundation | 1 | 4 tables, RLS, storage bucket, 5 API routes |
| Extension Shell | 2 | MV3, 28 uni detection, sidebar (6 states), popup |
| AI Field Mapping | 3 | Ollama maps forms, 11 transforms, answer memory |
| Pre-submit Review | 4 | CNIC/marks validation, submission detection |
| Manual Fields | 5 | Fill Gap modal, SOP AI draft, password vault |
| University Config | 6 | 28 uni configs, docs, polish |
| Heuristic Intelligence | 7 | Page type detection, consistent passwords, heuristic matching |
| Deterministic Autofill | 8 | 17 per-university configs, 3-tier engine |
| URL Corrections & Fixes | 9 | Verified apply URLs, name splitting, field exclusions |

## Supported Universities (28)
NUST, FAST, LUMS, COMSATS, IBA, GIKI, NED, Bahria, UET, PIEAS,
SZABIST, ITU, AKU, PUCIT, UoL, UCP, Riphah, QAU, IIUI, LSE,
UoS, BZU, UoP, UoB, MUET, SSUET, LUMHS, DUHS

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

## Security
- Supabase RLS on user-data tables
- Never auto-submits forms
- Never logs CNIC/passwords
