-- Migration: Add dynamic sources and response time to messages table
-- Additive and non-destructive. Preserves all existing conversations and messages.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Note on legacy tables:
-- `message_evidence` and `evidence_feedback` are no longer written to or depended on by the application.
-- To drop them after reviewing dependencies, run:
-- DROP TABLE IF EXISTS public.evidence_feedback CASCADE;
-- DROP TABLE IF EXISTS public.message_evidence CASCADE;
