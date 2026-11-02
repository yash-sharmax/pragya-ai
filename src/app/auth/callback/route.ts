import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const targetBase = isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`;
      return NextResponse.redirect(`${targetBase}${next}`);
    } else {
      console.error("Auth callback code exchange error:", error.message);
      if (next.startsWith("/reset-password")) {
        return NextResponse.redirect(`${origin}/reset-password?error=invalid_or_expired`);
      }
    }
  }

  // Return the user to an error page or login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
