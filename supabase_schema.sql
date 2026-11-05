-- ====================================================================
-- SUPABASE SCHEMA: UNIFIED SURVEY BUILDER & TABULATION PLATFORM
-- Project: cxqjtzfghighnoaskgbc
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Surveys Table (Stores survey metadata, questions, and logic rules)
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'live', 'paused', 'closed'
    theme JSONB DEFAULT '{"primaryColor": "#4f46e5", "font": "Inter"}'::jsonb,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    logic_rules JSONB DEFAULT '[]'::jsonb,
    target_responses INTEGER DEFAULT 400,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by slug (e.g. when respondent visits /s/survey-slug)
CREATE INDEX IF NOT EXISTS idx_surveys_slug ON public.surveys(slug);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);

-- 3. Survey Responses Table (Stores real-time respondent answers and screening status)
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    respondent_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'qualified', -- 'qualified', 'screenout', 'quota_full', 'partial'
    screenout_reason TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration_seconds INTEGER DEFAULT 0,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast cross-tabulation and fieldwork monitoring
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON public.survey_responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_answers ON public.survey_responses USING gin(answers);

-- 4. Survey Quotas Table (Tracks real-time quota targets and limits)
CREATE TABLE IF NOT EXISTS public.survey_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_count INTEGER NOT NULL DEFAULT 100,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_full BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotas_survey_id ON public.survey_quotas(survey_id);

-- 5. Survey Drafts Table (Tracks real-time step-by-step progress & drop-offs)
CREATE TABLE IF NOT EXISTS public.survey_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    current_step INTEGER DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_survey_session UNIQUE (survey_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_drafts_survey_session ON public.survey_drafts(survey_id, session_id);
CREATE INDEX IF NOT EXISTS idx_responses_composite_status ON public.survey_responses(survey_id, status);
CREATE INDEX IF NOT EXISTS idx_responses_created_desc ON public.survey_responses(created_at DESC);

-- 6. Atomic Quota & Response Booking Function (Foolproof Concurrency Protection)
CREATE OR REPLACE FUNCTION public.submit_survey_atomic(
    p_survey_id UUID,
    p_respondent_id TEXT,
    p_answers JSONB,
    p_duration_seconds INTEGER DEFAULT 0,
    p_user_agent TEXT DEFAULT '',
    p_max_cap INTEGER DEFAULT 400
) RETURNS JSONB AS $$
DECLARE
    v_qualified_count INT;
    v_new_response_id UUID;
BEGIN
    -- Advisory transaction lock prevents concurrent quota races
    PERFORM pg_advisory_xact_lock(hashtext(p_survey_id::text));

    -- Fast atomic count of existing completes
    SELECT COUNT(*) INTO v_qualified_count
    FROM public.survey_responses
    WHERE survey_id = p_survey_id AND status = 'qualified';

    -- Check if overall capacity is reached
    IF v_qualified_count >= p_max_cap THEN
        INSERT INTO public.survey_responses (
            survey_id, respondent_id, status, screenout_reason, answers, duration_seconds, user_agent
        ) VALUES (
            p_survey_id, p_respondent_id, 'quota_full', 'Maximum survey capacity reached', p_answers, p_duration_seconds, p_user_agent
        ) RETURNING id INTO v_new_response_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'quota_full',
            'response_id', v_new_response_id,
            'message', 'Quota capacity reached'
        );
    END IF;

    -- Insert qualified record atomically
    INSERT INTO public.survey_responses (
        survey_id, respondent_id, status, answers, duration_seconds, user_agent
    ) VALUES (
        p_survey_id, p_respondent_id, 'qualified', p_answers, p_duration_seconds, p_user_agent
    ) RETURNING id INTO v_new_response_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'qualified',
        'response_id', v_new_response_id,
        'message', 'Response recorded successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_quotas ENABLE ROW LEVEL SECURITY;

-- Surveys policies:
-- Anyone (anon / public) can read live surveys to take the survey
CREATE POLICY "Public can view live surveys" 
ON public.surveys FOR SELECT 
TO anon, authenticated
USING (status = 'live');

-- Full access for service_role (studio backend & admin)
CREATE POLICY "Service role full access on surveys" 
ON public.surveys FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

-- Survey Responses policies:
-- Anyone can insert a response (anonymous respondent submission)
CREATE POLICY "Public can submit responses" 
ON public.survey_responses FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Public / anon can read responses if needed or restricted to service_role / authenticated
CREATE POLICY "Service role full access on responses" 
ON public.survey_responses FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow reading responses for tabulation" 
ON public.survey_responses FOR SELECT 
TO anon, authenticated
USING (true);

-- Survey Quotas policies:
CREATE POLICY "Service role full access on quotas" 
ON public.survey_quotas FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read quotas" 
ON public.survey_quotas FOR SELECT 
TO anon, authenticated
USING (true);

-- ====================================================================
-- SEED INITIAL SURVEY (Singapore Student Tuition & Enrichment Survey)
-- ====================================================================

INSERT INTO public.surveys (
    id,
    title,
    slug,
    description,
    status,
    target_responses,
    questions
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Singapore Student Tuition & Enrichment Study 2026',
    'singapore-tuition-2026',
    'Comprehensive national study evaluating secondary and junior college student tutoring trends, CSAT, NPS, and retention.',
    'live',
    400,
    '[
      {"id": "q1_age", "title": "How old are you?", "type": "single_choice", "options": ["13", "14", "15", "16", "17", "18", "19", "Under 13", "Over 19"]},
      {"id": "q2_country", "title": "Which country do you currently reside in?", "type": "single_choice", "options": ["Singapore", "Malaysia", "Indonesia", "Other"]},
      {"id": "q3_gender", "title": "What is your gender?", "type": "single_choice", "options": ["Male", "Female", "Prefer not to say"]},
      {"id": "q4_education", "title": "What level of education are you currently attending?", "type": "single_choice", "options": ["Secondary School", "Junior College / Pre-U", "University", "Polytechnic / ITE", "Other"]}
    ]'::jsonb
) ON CONFLICT (slug) DO NOTHING;
