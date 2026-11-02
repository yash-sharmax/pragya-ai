import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(conversationId)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // 1. Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // 2. Fetch messages with sources, response_time_ms, and attachments
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select(`
      id,
      role,
      content,
      status,
      sources,
      response_time_ms,
      error_message,
      created_at,
      attachments (id, file_name, file_path, file_size, mime_type)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ conversation, messages });
}

export async function PATCH(
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(conversationId)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Valid title is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .update({
      title: title.trim(),
      title_customized: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Conversation not found or not owned by user." }, { status: 404 });
  }

  return NextResponse.json({ conversation: data });
}

export async function DELETE(
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(conversationId)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // 1. Verify existence and ownership
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conv) {
    return NextResponse.json({ error: "Conversation not found or unauthorized." }, { status: 404 });
  }

  // 2. Remove any stored attachment files in Supabase Storage
  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (attachments && attachments.length > 0) {
    const paths = attachments.map((a) => a.file_path);
    await supabase.storage.from("user-uploads").remove(paths);
  }

  // 3. Explicitly clean up messages belonging to this conversation
  await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  // 4. Delete the conversation
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedId: conversationId });
}
