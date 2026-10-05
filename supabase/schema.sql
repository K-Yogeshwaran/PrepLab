-- ====================================================================
-- PrepLab - Supabase PostgreSQL Schema & Security Policies
-- ====================================================================
-- This schema initializes all required tables, foreign keys, indexes,
-- Row-Level Security (RLS) policies, and seed data for PrepLab.
-- Run this in your Supabase SQL Editor to set up the database.
-- ====================================================================

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Test Attempts Table
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    question_count INTEGER NOT NULL CHECK (question_count > 0),
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    total_time_ms BIGINT NOT NULL CHECK (total_time_ms >= 0),
    average_time_ms BIGINT NOT NULL CHECK (average_time_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Question Attempts Table
CREATE TABLE IF NOT EXISTS question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number > 0),
    operation TEXT NOT NULL,
    question TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    user_answer INTEGER,
    is_correct BOOLEAN NOT NULL,
    time_taken_ms BIGINT NOT NULL CHECK (time_taken_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- Indexes for High Performance Queries
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_test_attempts_topic_id ON test_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON test_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_attempts_test_id ON question_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_test_number ON question_attempts(test_id, question_number);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- Designed for single-user personal aptitude practice without auth
-- ====================================================================
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Topics policies (allow read and initial seed/insert)
DROP POLICY IF EXISTS "Allow public read topics" ON topics;
CREATE POLICY "Allow public read topics" ON topics
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert topics" ON topics;
CREATE POLICY "Allow public insert topics" ON topics
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Test Attempts policies (allow read, insert, delete)
DROP POLICY IF EXISTS "Allow public read test_attempts" ON test_attempts;
CREATE POLICY "Allow public read test_attempts" ON test_attempts
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert test_attempts" ON test_attempts;
CREATE POLICY "Allow public insert test_attempts" ON test_attempts
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete test_attempts" ON test_attempts;
CREATE POLICY "Allow public delete test_attempts" ON test_attempts
    FOR DELETE TO anon, authenticated USING (true);

-- Question Attempts policies (allow read, insert, delete)
DROP POLICY IF EXISTS "Allow public read question_attempts" ON question_attempts;
CREATE POLICY "Allow public read question_attempts" ON question_attempts
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert question_attempts" ON question_attempts;
CREATE POLICY "Allow public insert question_attempts" ON question_attempts
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete question_attempts" ON question_attempts;
CREATE POLICY "Allow public delete question_attempts" ON question_attempts
    FOR DELETE TO anon, authenticated USING (true);

-- ====================================================================
-- Initial Seed Data
-- Only seeds the first fully implemented topic: Fast Addition & Subtraction
-- ====================================================================
INSERT INTO topics (id, name, category)
VALUES (
    'fast-addition-subtraction',
    'Fast Addition & Subtraction',
    'Speed Math'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category;
