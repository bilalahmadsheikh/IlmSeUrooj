# Database Schema
# Updated by agent after every database change.

## Status: ✅ LIVE — Phase 10 Complete (2026-02-22)

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
| mother_name | TEXT | ✓ | — | |
| cnic | TEXT | ✓ | — | Format: XXXXX-XXXXXXX-X |
| date_of_birth | DATE | ✓ | — | |
| gender | TEXT | ✓ | — | CHECK: male/female/other |
| nationality | TEXT | ✓ | 'Pakistani' | |
| religion | TEXT | ✓ | — | |
| blood_group | TEXT | ✓ | — | |
| email | TEXT | ✗ | — | |
| phone | TEXT | ✓ | — | |
| whatsapp | TEXT | ✓ | — | |
| address | TEXT | ✓ | — | |
| city | TEXT | ✓ | — | |
| province | TEXT | ✓ | — | |
| postal_code | TEXT | ✓ | — | |
| domicile_province | TEXT | ✓ | — | |
| domicile_district | TEXT | ✓ | — | |
| education_system | TEXT | ✓ | 'pakistani' | CHECK: pakistani/cambridge |
| inter_type | TEXT | ✓ | — | CHECK: fsc/a_level/ics/icom/fa |
| inter_status | TEXT | ✓ | 'complete' | CHECK: not_started/part1_only/appearing/result_awaited/complete |
| secondary_type | TEXT | ✓ | — | CHECK: matric/o_level |
| fsc_stream | TEXT | ✓ | — | CHECK: pre_engineering/pre_medical/computer_science/commerce/arts/general |
| fsc_marks | INTEGER | ✓ | — | |
| fsc_total | INTEGER | ✓ | 1100 | |
| fsc_percentage | DECIMAL(5,2) | ✓ | — | Auto-calculated |
| fsc_year | INTEGER | ✓ | — | |
| fsc_board | TEXT | ✓ | — | |
| fsc_roll_no | TEXT | ✓ | — | |
| fsc_school | TEXT | ✓ | — | |
| fsc_part1_marks | INTEGER | ✓ | — | Part-I only applicants |
| fsc_part1_total | INTEGER | ✓ | 550 | |
| fsc_part1_percentage | DECIMAL(5,2) | ✓ | — | |
| fsc_projected_marks | INTEGER | ✓ | — | (part1/part1_total) × fsc_total |
| fsc_projected_percentage | DECIMAL(5,2) | ✓ | — | |
| alevel_board | TEXT | ✓ | — | CHECK: cambridge/edexcel/ib/other |
| alevel_subjects | JSONB | ✓ | — | [{subject, as_grade, a2_grade, as_marks, a2_marks, predicted}] |
| alevel_predicted | BOOLEAN | ✓ | false | |
| ibcc_equivalent_inter | DECIMAL(5,2) | ✓ | — | IBCC equivalent % for FSc |
| ibcc_certificate_url | TEXT | ✓ | — | |
| ibcc_equivalent_matric | DECIMAL(5,2) | ✓ | — | IBCC equivalent % for Matric |
| matric_marks | INTEGER | ✓ | — | |
| matric_total | INTEGER | ✓ | 1050 | |
| matric_percentage | DECIMAL(5,2) | ✓ | — | Auto-calculated |
| matric_year | INTEGER | ✓ | — | |
| matric_board | TEXT | ✓ | — | |
| matric_roll_no | TEXT | ✓ | — | |
| matric_school | TEXT | ✓ | — | |
| olevel_board | TEXT | ✓ | — | CHECK: cambridge/edexcel/other |
| olevel_subjects | JSONB | ✓ | — | [{subject, grade, marks}] |
| board_name | TEXT | ✓ | — | Legacy — use fsc_board/matric_board |
| passing_year | INTEGER | ✓ | — | Legacy — use fsc_year |
| school_name | TEXT | ✓ | — | Legacy — use fsc_school |
| net_score | DECIMAL(5,2) | ✓ | — | NUST NET /200 |
| net_year | INTEGER | ✓ | — | |
| sat_score | INTEGER | ✓ | — | SAT I /1600 |
| sat_subject_score | INTEGER | ✓ | — | SAT II /800 |
| ecat_score | DECIMAL(5,2) | ✓ | — | % |
| mdcat_score | DECIMAL(5,2) | ✓ | — | % |
| nmdcat_score | DECIMAL(5,2) | ✓ | — | % |
| lcat_score | DECIMAL(5,2) | ✓ | — | LUMS LCAT /100 |
| gat_score | DECIMAL(5,2) | ✓ | — | GAT General /100 |
| father_cnic | TEXT | ✓ | — | |
| father_occupation | TEXT | ✓ | — | |
| guardian_phone | TEXT | ✓ | — | |
| portal_email | TEXT | ✓ | — | For university portal accounts |
| portal_password | TEXT | ✓ | — | Auto-generated on first load |
| preferred_field | TEXT | ✓ | — | |
| preferred_cities | TEXT[] | ✓ | — | |
| preferred_degree | TEXT | ✓ | 'BS' | |
| profile_completion | INTEGER | ✓ | 0 | Calculated on save |
| photo_url | TEXT | ✓ | — | |
| cnic_url | TEXT | ✓ | — | |
| result_card_url | TEXT | ✓ | — | |
| profile_complete | BOOLEAN | ✓ | false | Legacy |
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
