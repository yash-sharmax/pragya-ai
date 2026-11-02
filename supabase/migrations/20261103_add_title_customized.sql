-- Migration: Add title_customized to conversations table
-- Protects manual user renames from being overwritten by delayed dynamic title generation

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title_customized BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_title_customized ON public.conversations(title_customized);
