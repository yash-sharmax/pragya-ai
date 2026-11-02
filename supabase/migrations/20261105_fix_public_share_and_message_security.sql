-- Pragya AI Forward-Only Migration
-- Fix SEC-01 (Public Conversation Enumeration) and SEC-02 (Cross-User Message Injection)
-- Timestamp: 20261105

-- ============================================================================
-- 1. SEC-01: Remove overly broad public SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view public conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can view messages of public conversations" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view attachments of public conversations" ON public.attachments;

-- Ensure owner-only policies remain intact for conversations, messages, and attachments
-- (conversations: "Users can view own conversations" USING (auth.uid() = user_id))
-- (messages: "Users can view own messages" USING (auth.uid() = user_id))
-- (attachments: "Users can view own attachments" USING (auth.uid() = user_id))

-- ============================================================================
-- 2. SEC-01 & SEC-03: Create restricted SECURITY DEFINER function for public shares
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_public_shared_conversation(lookup_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result jsonb;
BEGIN
    IF lookup_token IS NULL OR trim(lookup_token) = '' THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'conversation', jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'persona', c.persona,
            'created_at', c.created_at,
            'public_shared_at', c.public_shared_at
        ),
        'messages', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'role', m.role,
                    'content', m.content,
                    'sources', m.sources,
                    'created_at', m.created_at,
                    'response_time_ms', m.response_time_ms
                ) ORDER BY m.created_at ASC
            )
            FROM public.messages m
            WHERE m.conversation_id = c.id AND m.status = 'completed'
        ), '[]'::jsonb),
        'attachments', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'message_id', a.message_id,
                    'file_name', a.file_name,
                    'file_size', a.file_size,
                    'mime_type', a.mime_type,
                    'created_at', a.created_at
                )
            )
            FROM public.attachments a
            WHERE a.conversation_id = c.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM public.conversations c
    WHERE c.public_share_token = trim(lookup_token)
      AND c.is_public = true;

    RETURN result;
END;
$$;

-- Restrict function execution permissions: Revoke from PUBLIC, grant only to required roles
REVOKE ALL ON FUNCTION public.get_public_shared_conversation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_shared_conversation(text) TO anon, authenticated, service_role;

-- ============================================================================
-- 3. SEC-02: Hardened Row-Level Security for messages and attachments
-- Ensure users can only INSERT/UPDATE/DELETE records within conversations they OWN
-- ============================================================================

-- Messages INSERT policy
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Messages UPDATE policy
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Messages DELETE policy
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Attachments INSERT policy
DROP POLICY IF EXISTS "Users can insert own attachments" ON public.attachments;
CREATE POLICY "Users can insert own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        (conversation_id IS NULL OR EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = attachments.conversation_id AND user_id = auth.uid()
        ))
    );
