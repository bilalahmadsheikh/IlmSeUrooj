-- ============================================================
-- Anqa — University Reviews & Alumni Connect
-- Migration 006: Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. University Email Domains ────────────────────────────
-- Maps each university ID to its official student/alumni email domain(s).
-- Used server-side to validate that a submitted edu email belongs to the
-- claimed university before sending a verification OTP.
CREATE TABLE IF NOT EXISTS university_email_domains (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id TEXT   NOT NULL,
    domain        TEXT   NOT NULL,
    label         TEXT,                           -- e.g. "Student", "Alumni"
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(university_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_email_domains_uni ON university_email_domains(university_id);

-- Seed Pakistani university email domains
INSERT INTO university_email_domains (university_id, domain, label) VALUES
  ('1',  'stud.nust.edu.pk',        'Student'),
  ('1',  'nust.edu.pk',             'Alumni/Faculty'),
  ('2',  'lums.edu.pk',             'Student/Alumni'),
  ('3',  'nu.edu.pk',               'Student/Alumni'),
  ('3',  'cfd.nu.edu.pk',           'Student'),
  ('3',  'isb.nu.edu.pk',           'Student'),
  ('3',  'khi.nu.edu.pk',           'Student'),
  ('3',  'lhr.nu.edu.pk',           'Student'),
  ('4',  'giki.edu.pk',             'Student/Alumni'),
  ('5',  'uet.edu.pk',              'Student/Alumni'),
  ('5',  'student.uet.edu.pk',      'Student'),
  ('6',  'students.comsats.edu.pk', 'Student'),
  ('6',  'comsats.edu.pk',          'Alumni/Faculty'),
  ('7',  'iiu.edu.pk',              'Student/Alumni'),
  ('8',  'iba.edu.pk',              'Student/Alumni'),
  ('9',  'pu.edu.pk',               'Student/Alumni'),
  ('10', 'szabist.edu.pk',          'Student/Alumni'),
  ('11', 'aku.edu',                 'Student/Alumni'),
  ('12', 'ucp.edu.pk',              'Student/Alumni'),
  ('13', 'umt.edu.pk',              'Student/Alumni'),
  ('14', 'bnu.edu.pk',              'Student/Alumni'),
  ('15', 'iqra.edu.pk',             'Student/Alumni'),
  ('16', 'uog.edu.pk',              'Student/Alumni'),
  ('17', 'uos.edu.pk',              'Student/Alumni'),
  ('18', 'bzu.edu.pk',              'Student/Alumni'),
  ('19', 'qau.edu.pk',              'Student/Alumni'),
  ('20', 'aiou.edu.pk',             'Student/Alumni'),
  ('21', 'bahria.edu.pk',           'Student/Alumni'),
  ('22', 'superior.edu.pk',         'Student/Alumni'),
  ('23', 'paf-iast.edu.pk',         'Student/Alumni'),
  ('24', 'duet.edu.pk',             'Student/Alumni'),
  ('25', 'muet.edu.pk',             'Student/Alumni'),
  ('26', 'hitecuni.edu.pk',         'Student/Alumni'),
  ('27', 'cui.edu.pk',              'Student/Alumni'),
  ('28', 'pucit.edu.pk',            'Student/Alumni')
ON CONFLICT DO NOTHING;

-- ─── 2. University Reviews ───────────────────────────────────
CREATE TABLE IF NOT EXISTS university_reviews (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id         TEXT        NOT NULL,
    user_id               UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Reviewer classification
    reviewer_type         TEXT        NOT NULL CHECK (reviewer_type IN ('current_student', 'alumni')),

    -- Ratings (1–5 stars)
    overall_rating        SMALLINT    NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    academics_rating      SMALLINT    CHECK (academics_rating BETWEEN 1 AND 5),
    facilities_rating     SMALLINT    CHECK (facilities_rating BETWEEN 1 AND 5),
    faculty_rating        SMALLINT    CHECK (faculty_rating BETWEEN 1 AND 5),
    campus_life_rating    SMALLINT    CHECK (campus_life_rating BETWEEN 1 AND 5),
    value_rating          SMALLINT    CHECK (value_rating BETWEEN 1 AND 5),

    -- Review content
    title                 VARCHAR(150) NOT NULL CHECK (char_length(title) >= 5),
    body                  TEXT         NOT NULL CHECK (char_length(body) >= 50 AND char_length(body) <= 2000),
    pros                  TEXT         CHECK (char_length(pros) <= 500),
    cons                  TEXT         CHECK (char_length(cons) <= 500),

    -- Academic context
    program               VARCHAR(150),
    batch_year            SMALLINT     CHECK (batch_year BETWEEN 1990 AND 2030),
    graduation_year       SMALLINT     CHECK (graduation_year BETWEEN 1990 AND 2035),

    -- Verification
    is_verified           BOOLEAN      DEFAULT FALSE,
    edu_email             TEXT,                               -- stored hashed after verification
    edu_email_domain      TEXT,                               -- e.g. "lums.edu.pk"
    edu_email_verified_at TIMESTAMPTZ,

    -- Moderation
    status                TEXT         DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'flagged', 'removed')),

    -- Engagement
    helpful_count         INTEGER      DEFAULT 0,

    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),

    -- One review per user per university (reviewers can edit, not re-post)
    CONSTRAINT unique_review_per_user_uni UNIQUE (user_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_university   ON university_reviews(university_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user         ON university_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified     ON university_reviews(is_verified, status);
CREATE INDEX IF NOT EXISTS idx_reviews_created      ON university_reviews(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON university_reviews;
CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON university_reviews
    FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

-- ─── 3. Review Verification Tokens ──────────────────────────
-- OTP-based verification. Token is stored as a SHA-256 hex digest
-- so the plaintext OTP never persists in the database.
CREATE TABLE IF NOT EXISTS review_verification_tokens (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id TEXT        NOT NULL,
    edu_email     TEXT        NOT NULL,
    token_hash    TEXT        NOT NULL,  -- SHA-256(otp + salt)
    token_salt    TEXT        NOT NULL,  -- random salt per token
    expires_at    TIMESTAMPTZ NOT NULL,
    used_at       TIMESTAMPTZ,
    attempts      SMALLINT    DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verify_tokens_user ON review_verification_tokens(user_id, university_id);

-- ─── 4. Review Helpful Votes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id  UUID REFERENCES university_reviews(id) ON DELETE CASCADE NOT NULL,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_helpful_review ON review_helpful_votes(review_id);

-- ─── 5. Alumni Connections ───────────────────────────────────
-- Students can request to connect with verified alumni of the same university.
CREATE TABLE IF NOT EXISTS alumni_connections (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_user_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_user_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id    TEXT        NOT NULL,
    message          TEXT        CHECK (char_length(message) <= 500),
    status           TEXT        DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alumni_user_id, student_user_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_alumni   ON alumni_connections(alumni_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_student  ON alumni_connections(student_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_uni      ON alumni_connections(university_id);

CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_connections_updated_at ON alumni_connections;
CREATE TRIGGER trg_connections_updated_at
    BEFORE UPDATE ON alumni_connections
    FOR EACH ROW EXECUTE FUNCTION update_connections_updated_at();

-- ─── 6. Row Level Security ───────────────────────────────────

-- university_email_domains: public read, no writes from client
ALTER TABLE university_email_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read email domains"
    ON university_email_domains FOR SELECT USING (true);

-- university_reviews
ALTER TABLE university_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews (verified or not)
CREATE POLICY "public read approved reviews"
    ON university_reviews FOR SELECT
    USING (status IN ('approved', 'pending'));

-- Authenticated users can insert their own review
CREATE POLICY "users insert own review"
    ON university_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews (cannot change user_id or verification fields via client)
CREATE POLICY "users update own review"
    ON university_reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "users delete own review"
    ON university_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- review_verification_tokens: users manage their own
ALTER TABLE review_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own tokens"
    ON review_verification_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- review_helpful_votes
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read helpful votes"
    ON review_helpful_votes FOR SELECT USING (true);
CREATE POLICY "users manage own votes"
    ON review_helpful_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own votes"
    ON review_helpful_votes FOR DELETE
    USING (auth.uid() = user_id);

-- alumni_connections
ALTER TABLE alumni_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties see own connections"
    ON alumni_connections FOR SELECT
    USING (auth.uid() = alumni_user_id OR auth.uid() = student_user_id);
CREATE POLICY "students create connection requests"
    ON alumni_connections FOR INSERT
    WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "alumni manage their requests"
    ON alumni_connections FOR UPDATE
    USING (auth.uid() = alumni_user_id OR auth.uid() = student_user_id)
    WITH CHECK (auth.uid() = alumni_user_id OR auth.uid() = student_user_id);
CREATE POLICY "parties delete own connections"
    ON alumni_connections FOR DELETE
    USING (auth.uid() = alumni_user_id OR auth.uid() = student_user_id);
