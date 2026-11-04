import { createBrowserClient } from "@supabase/ssr";
import { cleanEnv } from "../utils";

export function createClient() {
  // Fall back to harmless placeholders when env vars are missing, so that
  // `npm run build` and first local runs do not crash with
  // "Your project's URL and API key are required" — real values are
  // supplied through .env.local / the hosting platform in real use.
  const supabaseUrl =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://placeholder.supabase.co";
  const supabaseKey =
    cleanEnv(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
