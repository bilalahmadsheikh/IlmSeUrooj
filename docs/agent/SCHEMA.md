# Database Schema
# Updated by agent after every database change.

## Status: ✅ LIVE — Phase 1 Complete (2026-02-21)

**Supabase Project:** `nqmvfierglxgjgqjmxmp` (ilmseurroj)  
**Region:** ap-northeast-2  
**URL:** https://nqmvfierglxgjgqjmxmp.supabase.co

---

## Tables

### `profiles` (RLS ✅)
Student master profile — one row per authenticated user.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID (PK) | ✗ | — | FK → auth.users(id), CASCADE |
| full_name | TEXT | ✗ | — | |
| father_name | TEXT | ✓ | — | |
| cnic | TEXT | ✓ | — | Format: XXXXX-XXXXXXX-X |
| date_of_birth | DATE | ✓ | — | |
| gender | TEXT | ✓ | — | CHECK: male/female/other |
| nationality | TEXT | ✓ | 'Pakistani' | |
| religion | TEXT | ✓ | — | |
| email | TEXT | ✗ | — | |
| phone | TEXT | ✓ | — | |
| whatsapp | TEXT | ✓ | — | |
| address | TEXT | ✓ | — | |
| city | TEXT | ✓ | — | |
| province | TEXT | ✓ | — | |
| postal_code | TEXT | ✓ | — | |
| fsc_marks | INTEGER | ✓ | — | |
| fsc_total | INTEGER | ✓ | 1100 | |
| fsc_percentage | DECIMAL(5,2) | ✓ | — | |
| matric_marks | INTEGER | ✓ | — | |
| matric_total | INTEGER | ✓ | 1050 | |
| matric_percentage | DECIMAL(5,2) | ✓ | — | |
| board_name | TEXT | ✓ | — | |
| passing_year | INTEGER | ✓ | — | |
| school_name | TEXT | ✓ | — | |
| photo_url | TEXT | ✓ | — | |
| cnic_url | TEXT | ✓ | — | |
| result_card_url | TEXT | ✓ | — | |
| profile_complete | BOOLEAN | ✓ | false | |
| created_at | TIMESTAMPTZ | ✓ | NOW() | |
| updated_at | TIMESTAMPTZ | ✓ | NOW() | |

**RLS Policy:** `own_profile_only` — `auth.uid() = id`

---

### `field_maps` (RLS ❌ — intentionally public)
AI form field mappings per university domain. Shared data, no user-specific content.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID (PK) | ✗ | gen_random_uuid() | |
| domain | TEXT (UNIQUE) | ✗ | — | e.g. admissions.nust.edu.pk |
| university_slug | TEXT | ✗ | — | e.g. nust |
| mapping | JSONB | ✗ | — | AI-generated field map |
| created_at | TIMESTAMPTZ | ✓ | NOW() | |
| last_verified | TIMESTAMPTZ | ✓ | NOW() | |
| verified_working | BOOLEAN | ✓ | true | |

---

### `applications` (RLS ✅)
Per-student application records for each university.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID (PK) | ✗ | gen_random_uuid() | |
| student_id | UUID (FK) | ✓ | — | FK → profiles(id), CASCADE |
| university_slug | TEXT | ✗ | — | |
| university_name | TEXT | ✗ | — | |
| portal_domain | TEXT | ✗ | — | |
| status | TEXT | ✓ | 'pending' | CHECK: pending/account_created/form_filling/awaiting_review/submitted/error/accepted/rejected/waitlisted |
| portal_username | TEXT | ✓ | — | |
| portal_password | TEXT | ✓ | — | Encrypted in Phase 5 |
| confirmation_number | TEXT | ✓ | — | |
| program_applied | TEXT | ✓ | — | |
| remembered_answers | JSONB | ✓ | '{}' | |
| error_message | TEXT | ✓ | — | |
| submitted_at | TIMESTAMPTZ | ✓ | — | |
| created_at | TIMESTAMPTZ | ✓ | NOW() | |
| updated_at | TIMESTAMPTZ | ✓ | NOW() | |

**RLS Policy:** `own_applications_only` — `auth.uid() = student_id`

---

### `remembered_answers` (RLS ✅)
Cross-university answer cache — remembers answers to manual fields.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID (PK) | ✗ | gen_random_uuid() | |
| student_id | UUID (FK) | ✓ | — | FK → profiles(id), CASCADE |
| field_label | TEXT | ✗ | — | UNIQUE with student_id |
| field_value | TEXT | ✗ | — | |
| last_used_at | TIMESTAMPTZ | ✓ | NOW() | |
| use_count | INTEGER | ✓ | 1 | |

**RLS Policy:** `own_answers_only` — `auth.uid() = student_id`  
**Unique Constraint:** `(student_id, field_label)`

---

## Storage Buckets

### `student-documents` (Private)
Stores CNIC scans, photos, result cards.

| Setting | Value |
|---------|-------|
| Public | ❌ |
| Max File Size | 10MB |
| Allowed MIME | image/jpeg, image/png, image/webp, image/gif, application/pdf |

**RLS Policies:**
- Users can upload to `{user_id}/*`
- Users can view their own `{user_id}/*`
- Users can update their own `{user_id}/*`
- Users can delete their own `{user_id}/*`
