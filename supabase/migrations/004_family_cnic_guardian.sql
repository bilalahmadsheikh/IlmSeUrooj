-- ============================================================
-- Migration: Father CNIC, Mother CNIC, Guardian Phone
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS father_cnic    TEXT,
    ADD COLUMN IF NOT EXISTS mother_cnic    TEXT,
    ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
