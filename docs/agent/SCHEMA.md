# UniMatch — Database Schema
**Source of truth:** Supabase project `nqmvfierglxgjgqjmxmp`
Last verified: 2026-02-22

---

## Table: profiles
**Purpose:** Stores all student personal, academic, and portal information.
**RLS:** Enabled — students can only read/write their own row (`auth.uid() = id`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | — | Primary key, matches auth.users.id |
| full_name | text | NO | — | Student's full name |
| father_name | text | YES | — | Father's name |
| cnic | text | YES | — | CNIC number (XXXXX-XXXXXXX-X) |
| date_of_birth | date | YES | — | Date of birth |
| gender | text | YES | — | Male/Female/Other |
| nationality | text | YES | 'Pakistani' | Nationality |
| religion | text | YES | — | Religion |
| email | text | NO | — | Primary email (from auth) |
| phone | text | YES | — | Mobile number |
| whatsapp | text | YES | — | WhatsApp number |
| address | text | YES | — | Street address |
| city | text | YES | — | City |
| province | text | YES | — | Province |
| postal_code | text | YES | — | Postal code |
| education_system | text | YES | 'pakistani' | 'pakistani' or 'cambridge' |
| inter_type | text | YES | — | FSc Pre-Engineering, Pre-Medical, ICS, etc. |
| inter_status | text | YES | 'complete' | not_started, part1_only, appearing, result_awaited, complete |
| secondary_type | text | YES | — | Matric Science, Matric Arts, etc. |
| fsc_marks | integer | YES | — | FSc total marks obtained (complete) |
| fsc_total | integer | YES | 1100 | FSc total possible marks |
| fsc_percentage | numeric | YES | — | FSc percentage |
| fsc_stream | text | YES | — | FSc group/stream |
| fsc_year | integer | YES | — | FSc passing year |
| fsc_board | text | YES | — | FSc board name |
| fsc_roll_no | text | YES | — | FSc roll number |
| fsc_school | text | YES | — | FSc college/school name |
| fsc_part1_marks | integer | YES | — | FSc Part-I marks obtained |
| fsc_part1_total | integer | YES | 550 | FSc Part-I total marks |
| fsc_part1_percentage | numeric | YES | — | FSc Part-I percentage |
| fsc_projected_marks | integer | YES | — | Projected full FSc marks (Part1 × 2) |
| fsc_projected_percentage | numeric | YES | — | Projected FSc percentage |
| matric_marks | integer | YES | — | Matric marks obtained |
| matric_total | integer | YES | 1050 | Matric total marks |
| matric_percentage | numeric | YES | — | Matric percentage |
| matric_year | integer | YES | — | Matric passing year |
| matric_board | text | YES | — | Matric board name |
| matric_roll_no | text | YES | — | Matric roll number |
| matric_school | text | YES | — | Matric school name |
| board_name | text | YES | — | General board name (legacy) |
| passing_year | integer | YES | — | General passing year (legacy) |
| school_name | text | YES | — | General school name (legacy) |
| alevel_board | text | YES | — | A-Level exam board (CIE, Edexcel, etc.) |
| alevel_subjects | jsonb | YES | — | A-Level subjects with grades `[{subject, grade}]` |
| alevel_predicted | boolean | YES | false | Whether A-Level grades are predicted |
| ibcc_equivalent_inter | numeric | YES | — | IBCC equivalent intermediate percentage |
| ibcc_certificate_url | text | YES | — | IBCC certificate file URL |
| ibcc_equivalent_matric | numeric | YES | — | IBCC equivalent matric percentage |
| olevel_board | text | YES | — | O-Level exam board |
| olevel_subjects | jsonb | YES | — | O-Level subjects with grades `[{subject, grade}]` |
| net_score | numeric | YES | — | NET entrance test score |
| net_year | integer | YES | — | NET test year |
| sat_score | integer | YES | — | SAT total score |
| sat_subject_score | integer | YES | — | SAT subject test score |
| ecat_score | numeric | YES | — | ECAT score |
| mdcat_score | numeric | YES | — | MDCAT score |
| nmdcat_score | numeric | YES | — | National MDCAT score |
| lcat_score | numeric | YES | — | LCAT score |
| gat_score | numeric | YES | — | GAT score |
| mother_name | text | YES | — | Mother's name |
| domicile_province | text | YES | — | Domicile province |
| domicile_district | text | YES | — | Domicile district |
| blood_group | text | YES | — | Blood group |
| father_cnic | text | YES | — | Father's CNIC |
| father_occupation | text | YES | — | Father's occupation |
| guardian_phone | text | YES | — | Guardian's phone number |
| portal_email | text | YES | — | Consistent email for university portals |
| portal_password | text | YES | — | Consistent password for university portals |
| preferred_field | text | YES | — | Preferred field of study |
| preferred_cities | text[] | YES | — | Preferred cities for university |
| preferred_degree | text | YES | 'BS' | Preferred degree level |
| profile_completion | integer | YES | 0 | Profile completion percentage (0-100) |
| photo_url | text | YES | — | Student photo file URL |
| cnic_url | text | YES | — | CNIC scan file URL |
| result_card_url | text | YES | — | Result card file URL |
| profile_complete | boolean | YES | false | Legacy completion flag |
| created_at | timestamptz | YES | now() | Row creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

---

## Table: applications
**Purpose:** Tracks each university application through its lifecycle.
**RLS:** Enabled — students can only read/write their own applications (`auth.uid() = student_id`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | — | Foreign key → profiles.id |
| university_slug | text | NO | — | University identifier |
| university_name | text | NO | — | University display name |
| portal_domain | text | NO | — | Portal hostname |
| status | text | YES | 'pending' | pending, saved, account_created, form_filling, awaiting_review, submitted, accepted, rejected, waitlisted |
| portal_username | text | YES | — | Username used on this portal |
| portal_password | text | YES | — | Password used on this portal |
| confirmation_number | text | YES | — | Submission confirmation number |
| program_applied | text | YES | — | Program applied to |
| remembered_answers | jsonb | YES | '{}' | Portal-specific remembered answers |
| error_message | text | YES | — | Last error message |
| notes | text | YES | — | Student's notes about this application |
| submitted_at | timestamptz | YES | — | When the application was submitted |
| created_at | timestamptz | YES | now() | Row creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

---

## Table: field_maps
**Purpose:** Caches AI-generated field mappings per university portal domain. Shared across all users.
**RLS:** Disabled — shared resource, no student-specific data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| domain | text | NO | — | Portal hostname |
| university_slug | text | NO | — | University identifier |
| mapping | jsonb | NO | — | AI-generated field → profile key mapping |
| created_at | timestamptz | YES | now() | When mapping was created |
| last_verified | timestamptz | YES | now() | Last verification date |
| verified_working | boolean | YES | true | Whether mapping is confirmed working |

---

## Table: remembered_answers
**Purpose:** Stores student's answers to university-specific questions for reuse across portals.
**RLS:** Enabled — students can only read/write their own answers (`auth.uid() = student_id`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | — | Foreign key → profiles.id |
| field_label | text | NO | — | The question/field label |
| field_value | text | NO | — | The student's answer |
| last_used_at | timestamptz | YES | now() | When this answer was last used |
| use_count | integer | YES | 1 | How many times this answer has been used |

---

## Relationships
- `profiles` (1) → (many) `applications` via `student_id` foreign key
- `profiles` (1) → (many) `remembered_answers` via `student_id` foreign key
- `field_maps`: standalone, shared across all users (no student link)

## Storage Bucket: student-documents
- **Access:** Private (RLS enforced)
- **Path pattern:** `{user_id}/{document_type}`
- **Document types:** photo, cnic, result_card, ibcc, matric_cert
- **Max size:** 10MB per file
- **Allowed MIME:** image/*, application/pdf
