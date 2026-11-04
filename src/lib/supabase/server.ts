import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cleanEnv } from "../utils";

export function createClient() {
  const cookieStore = cookies();

  // Placeholder fallbacks keep builds and local runs from crashing when
  // env vars are not set yet (see client.ts). Real values come from
  // .env.local / the hosting platform.
  const supabaseUrl =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://placeholder.supabase.co";
  const supabaseKey =
    cleanEnv(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}
