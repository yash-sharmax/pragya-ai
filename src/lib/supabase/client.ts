import { createBrowserClient } from "@supabase/ssr";
import { cleanEnv } from "../utils";

export function createClient() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return createBrowserClient(supabaseUrl, supabaseKey);
}
