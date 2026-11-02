-- Pragya AI Schema Migration
-- Initial Schema & Row Level Security Policies

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT NOT NULL DEFAULT 'en', -- 'en' | 'hi' | 'hinglish'
  theme TEXT NOT NULL DEFAULT 'system', -- 'light' | 'dark' | 'system'
  default_persona TEXT NOT NULL DEFAULT 'veda', -- 'veda' | 'neeti' | 'ganita' | 'sarathi'
  save_chat_history BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  persona TEXT NOT NULL, -- 'veda' | 'neeti' | 'ganita' | 'sarathi'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Message Evidence Table (Live Internet Search verification metadata)
CREATE TABLE IF NOT EXISTS public.message_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sanskrit_passage TEXT,
  transliteration TEXT,
  granth_name TEXT,
  verse_reference TEXT,
  translation TEXT,
  translator_details TEXT,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  access_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_score NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (verification_score >= 0 AND verification_score <= 99.0),
  verification_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  checks_performed TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Evidence Feedback Table (Like/Dislike)
CREATE TABLE IF NOT EXISTS public.evidence_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.message_evidence(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (evidence_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_message ON public.message_evidence(message_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON public.message_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_feedback ON public.evidence_feedback(evidence_id, user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = user_id);

-- Attachments Policies
DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;
CREATE POLICY "Users can view own attachments" ON public.attachments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attachments" ON public.attachments;
CREATE POLICY "Users can insert own attachments" ON public.attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments" ON public.attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Message Evidence Policies
DROP POLICY IF EXISTS "Users can view own message evidence" ON public.message_evidence;
CREATE POLICY "Users can view own message evidence" ON public.message_evidence
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own message evidence" ON public.message_evidence;
CREATE POLICY "Users can insert own message evidence" ON public.message_evidence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own message evidence" ON public.message_evidence;
CREATE POLICY "Users can delete own message evidence" ON public.message_evidence
  FOR DELETE USING (auth.uid() = user_id);

-- Evidence Feedback Policies
DROP POLICY IF EXISTS "Users can view own feedback" ON public.evidence_feedback;
CREATE POLICY "Users can view own feedback" ON public.evidence_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.evidence_feedback;
CREATE POLICY "Users can insert own feedback" ON public.evidence_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.evidence_feedback;
CREATE POLICY "Users can update own feedback" ON public.evidence_feedback
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedback" ON public.evidence_feedback;
CREATE POLICY "Users can delete own feedback" ON public.evidence_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Automatic Profile & Settings Creation on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage RLS Policies for user-uploads, user-avatars, public-assets
-- Check if storage.objects exists before applying policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    -- user-uploads: Users can only upload and read files in their own user_id directory
    DROP POLICY IF EXISTS "Allow authenticated user upload to user-uploads" ON storage.objects;
    CREATE POLICY "Allow authenticated user upload to user-uploads" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

    DROP POLICY IF EXISTS "Allow authenticated user read own user-uploads" ON storage.objects;
    CREATE POLICY "Allow authenticated user read own user-uploads" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

    DROP POLICY IF EXISTS "Allow authenticated user delete own user-uploads" ON storage.objects;
    CREATE POLICY "Allow authenticated user delete own user-uploads" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- user-avatars: Users can only upload, read and update their own avatar
    DROP POLICY IF EXISTS "Allow authenticated user upload to user-avatars" ON storage.objects;
    CREATE POLICY "Allow authenticated user upload to user-avatars" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    DROP POLICY IF EXISTS "Allow authenticated user read own user-avatars" ON storage.objects;
    CREATE POLICY "Allow authenticated user read own user-avatars" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- public-assets: Public read access
    DROP POLICY IF EXISTS "Allow public read on public-assets" ON storage.objects;
    CREATE POLICY "Allow public read on public-assets" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'public-assets');
  END IF;
END $$;
