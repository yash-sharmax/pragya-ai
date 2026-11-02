import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateConversationTitle } from "@/lib/ai/title";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = params.id;

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Verify ownership and check current title and customization status
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id, title, title_customized")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conv.title_customized) {
      // User has manually customized the title; preserve it
      return NextResponse.json({ title: conv.title, customized: true });
    }

    // Generate concise title (bounded prompt length)
    const cleanPrompt = String(prompt).slice(0, 500);
    const generatedTitle = await generateConversationTitle(cleanPrompt);

    // Save to database only if title_customized is still false
    const { data: updated, error: updateErr } = await supabase
      .from("conversations")
      .update({
        title: generatedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .eq("title_customized", false)
      .select("title")
      .single();

    if (updateErr || !updated) {
      // If concurrent manual rename occurred, return current title
      return NextResponse.json({ title: conv.title, customized: true });
    }

    return NextResponse.json({ title: updated.title });
  } catch (err: any) {
    console.error("Title generation endpoint error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
