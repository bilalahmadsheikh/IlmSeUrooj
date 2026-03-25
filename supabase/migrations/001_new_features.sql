-- ============================================================
-- IlmSeUrooj Feature Foundation Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. UNIVERSITY DEADLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS university_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id TEXT NOT NULL,
    university_name TEXT NOT NULL,
    program TEXT,
    deadline_type TEXT NOT NULL CHECK (deadline_type IN ('application', 'entry_test', 'merit_list', 'fee_submission', 'document', 'interview', 'other')),
    deadline_date DATE NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_university ON university_deadlines(university_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_date ON university_deadlines(deadline_date);

-- ============================================================
-- 2. UNIVERSITY FEES
-- ============================================================
CREATE TABLE IF NOT EXISTS university_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id TEXT NOT NULL,
    university_name TEXT NOT NULL,
    program TEXT NOT NULL,
    degree_level TEXT CHECK (degree_level IN ('undergraduate', 'graduate', 'postgraduate')),
    semester_fee NUMERIC(10,2),
    annual_fee NUMERIC(10,2),
    admission_fee NUMERIC(10,2),
    security_deposit NUMERIC(10,2),
    hostel_fee NUMERIC(10,2),
    transport_fee NUMERIC(10,2),
    miscellaneous_fee NUMERIC(10,2),
    total_estimated_fee NUMERIC(10,2),
    currency TEXT DEFAULT 'PKR',
    academic_year TEXT,
    notes TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_university ON university_fees(university_id);

ALTER TABLE university_fees ENABLE ROW LEVEL SECURITY;

-- Public read — fee data is not sensitive
CREATE POLICY "Public read university_fees"
    ON university_fees FOR SELECT
    USING (true);

-- Only service_role can write (no INSERT/UPDATE/DELETE policy for anon/authenticated)

-- ============================================================
-- 3. USER DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'cnic', 'cnic_parent', 'matric_certificate', 'matric_dmc',
        'intermediate_certificate', 'intermediate_dmc', 'domicile',
        'character_certificate', 'passport_photo', 'migration_certificate',
        'hafiz_certificate', 'disability_certificate', 'other'
    )),
    document_name TEXT NOT NULL,
    file_url TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
    ON user_documents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_docs_user ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON user_documents(document_type);

-- ============================================================
-- 4. UNIVERSITY DOCUMENT REQUIREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS university_doc_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id TEXT NOT NULL,
    university_name TEXT NOT NULL,
    program TEXT,
    document_type TEXT NOT NULL,
    document_label TEXT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_req_university ON university_doc_requirements(university_id);

-- ============================================================
-- 5. PAYMENT TRACKER
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id TEXT NOT NULL,
    university_name TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN (
        'application_fee', 'admission_fee', 'semester_fee',
        'hostel_fee', 'transport_fee', 'security_deposit', 'other'
    )),
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    paid_at DATE,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'online', 'cash', 'cheque', 'other')),
    reference_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    receipt_url TEXT,
    notes TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payments"
    ON payment_tracker FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_university ON payment_tracker(university_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_tracker(status);

-- ============================================================
-- 6. REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'active', 'rewarded')),
    reward_points INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrer sees referrals they sent; referred user sees their own; any authenticated user
-- can see unclaimed referrals (needed to validate a code during registration)
CREATE POLICY "Users can see relevant referrals"
    ON referrals FOR SELECT
    USING (
        auth.uid() = referrer_id
        OR auth.uid() = referred_id
        OR (referred_id IS NULL AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- Authenticated users can claim an unclaimed referral (setting themselves as referred_id)
CREATE POLICY "Users can claim unclaimed referrals"
    ON referrals FOR UPDATE
    USING (referred_id IS NULL AND auth.uid() != referrer_id)
    WITH CHECK (auth.uid() = referred_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ============================================================
-- 7. NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_number TEXT,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT TRUE,
    deadline_alerts BOOLEAN DEFAULT TRUE,
    deadline_alert_days INTEGER[] DEFAULT ARRAY[30, 14, 7, 3, 1],
    payment_alerts BOOLEAN DEFAULT TRUE,
    merit_list_alerts BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. ADMISSION DECISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS admission_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id TEXT NOT NULL,
    university_name TEXT NOT NULL,
    program TEXT NOT NULL,
    decision_status TEXT NOT NULL CHECK (decision_status IN (
        'applied', 'test_scheduled', 'test_given', 'awaiting_merit',
        'selected', 'waitlisted', 'rejected', 'accepted', 'declined', 'enrolled'
    )),
    merit_position INTEGER,
    offer_letter_url TEXT,
    deadline_to_respond DATE,
    financial_aid_offered BOOLEAN DEFAULT FALSE,
    financial_aid_amount NUMERIC(10,2),
    notes TEXT,
    is_final_choice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admission_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own decisions"
    ON admission_decisions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_decisions_user ON admission_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_university ON admission_decisions(university_id);

-- ============================================================
-- 9. USER TIMELINE TASKS (for Strategy Planner)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_timeline_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id TEXT,
    university_name TEXT,
    task_title TEXT NOT NULL,
    task_category TEXT CHECK (task_category IN (
        'document', 'test_prep', 'application', 'fee_payment',
        'interview', 'follow_up', 'personal', 'other'
    )),
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
    ON user_timeline_tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON user_timeline_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON user_timeline_tasks(due_date);

-- ============================================================
-- Update profiles table with new fields (if they don't exist)
-- ============================================================
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS portal_email TEXT,
    ADD COLUMN IF NOT EXISTS portal_password TEXT,
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS target_universities TEXT[],
    ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS can_afford_hostel BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS scholarship_needed BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Storage bucket for documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Seed data: COMSATS deadlines and fees (example)
-- ============================================================
INSERT INTO university_deadlines (university_id, university_name, program, deadline_type, deadline_date, notes) VALUES
('comsats', 'COMSATS University Islamabad', 'All Programs', 'application', '2025-05-31', 'Spring 2025 admissions'),
('comsats', 'COMSATS University Islamabad', 'Engineering', 'entry_test', '2025-04-15', 'NTS/SAT II accepted'),
('nust', 'NUST', 'Engineering', 'entry_test', '2025-03-30', 'NET-1 2025'),
('uet', 'UET Lahore', 'Engineering', 'application', '2025-06-15', 'Annual admissions'),
('pu', 'University of Punjab', 'All Programs', 'application', '2025-05-20', 'Spring semester')
ON CONFLICT DO NOTHING;

INSERT INTO university_fees (university_id, university_name, program, degree_level, semester_fee, admission_fee, total_estimated_fee, academic_year) VALUES
('comsats', 'COMSATS University Islamabad', 'Computer Science', 'undergraduate', 85000, 15000, 800000, '2024-25'),
('comsats', 'COMSATS University Islamabad', 'Electrical Engineering', 'undergraduate', 90000, 15000, 850000, '2024-25'),
('nust', 'NUST', 'Computer Science', 'undergraduate', 120000, 20000, 1100000, '2024-25'),
('nust', 'NUST', 'Mechanical Engineering', 'undergraduate', 115000, 20000, 1050000, '2024-25'),
('uet', 'UET Lahore', 'Computer Science', 'undergraduate', 45000, 10000, 400000, '2024-25'),
('pu', 'University of Punjab', 'Computer Science', 'undergraduate', 35000, 8000, 320000, '2024-25')
ON CONFLICT DO NOTHING;

INSERT INTO university_doc_requirements (university_id, university_name, program, document_type, document_label, is_required, quantity) VALUES
('comsats', 'COMSATS University Islamabad', 'All Programs', 'matric_dmc', 'Matric DMC (Attested)', TRUE, 2),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'intermediate_dmc', 'Intermediate DMC (Attested)', TRUE, 2),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'cnic', 'CNIC Copy', TRUE, 2),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'cnic_parent', 'Parent CNIC Copy', TRUE, 1),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'passport_photo', 'Passport Photos', TRUE, 4),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'domicile', 'Domicile Certificate', TRUE, 1),
('comsats', 'COMSATS University Islamabad', 'All Programs', 'character_certificate', 'Character Certificate', TRUE, 1),
('nust', 'NUST', 'All Programs', 'matric_dmc', 'Matric DMC (Attested)', TRUE, 2),
('nust', 'NUST', 'All Programs', 'intermediate_dmc', 'Intermediate DMC (Attested)', TRUE, 2),
('nust', 'NUST', 'All Programs', 'cnic', 'CNIC Copy', TRUE, 2),
('nust', 'NUST', 'All Programs', 'passport_photo', 'Passport Photos', TRUE, 6),
('nust', 'NUST', 'All Programs', 'domicile', 'Domicile Certificate', TRUE, 1)
ON CONFLICT DO NOTHING;
