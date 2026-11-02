import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // 1. Search in conversation titles
  const { data: convMatches } = await supabase
    .from("conversations")
    .select("id, title, persona, updated_at")
    .eq("user_id", user.id)
    .ilike("title", `%${q}%`)
    .limit(10);

  // 2. Search in message content
  const { data: msgMatches } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      conversation_id,
      role,
      created_at,
      conversations (id, title, persona)
    `)
    .eq("user_id", user.id)
    .ilike("content", `%${q}%`)
    .limit(15);

  return NextResponse.json({
    conversations: convMatches || [],
    messages: msgMatches || [],
  });
}
