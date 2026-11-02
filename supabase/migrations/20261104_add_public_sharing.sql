-- Migration: Add public sharing columns and RLS policies to conversations table
-- Enables secure, unguessable public sharing of conversations and their messages

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_share_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS public_shared_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_public_share_token 
  ON public.conversations(public_share_token) 
  WHERE is_public = true;

-- Public RLS Policies for Shared Conversations
DROP POLICY IF EXISTS "Anyone can view public conversations" ON public.conversations;
CREATE POLICY "Anyone can view public conversations" ON public.conversations
  FOR SELECT USING (is_public = true AND public_share_token IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view messages of public conversations" ON public.messages;
CREATE POLICY "Anyone can view messages of public conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.is_public = true
        AND public.conversations.public_share_token IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Anyone can view attachments of public conversations" ON public.attachments;
CREATE POLICY "Anyone can view attachments of public conversations" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.attachments.conversation_id
        AND public.conversations.is_public = true
        AND public.conversations.public_share_token IS NOT NULL
    )
  );
