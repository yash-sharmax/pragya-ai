import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Check public share status of conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id, title, is_public, public_share_token, public_shared_at")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (error || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const host = request.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const shareUrl = conversation.is_public && conversation.public_share_token
      ? `${protocol}://${host}/share/${conversation.public_share_token}`
      : null;

    return NextResponse.json({
      is_public: conversation.is_public || false,
      public_share_token: conversation.public_share_token || null,
      public_shared_at: conversation.public_shared_at || null,
      shareUrl,
    });
  } catch (err: any) {
    console.error("GET share status error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve share status." },
      { status: 500 }
    );
  }
}

// POST: Enable public sharing and generate unguessable token
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;

    // Verify ownership
    const { data: existing, error: verifyError } = await supabase
      .from("conversations")
      .select("id, is_public, public_share_token")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Reuse existing token if already set, or generate a cryptographically secure 32-char hex token
    const token = existing.public_share_token || crypto.randomBytes(16).toString("hex");
    const sharedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_public: true,
        public_share_token: token,
        public_shared_at: sharedAt,
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    const host = request.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const shareUrl = `${protocol}://${host}/share/${token}`;

    return NextResponse.json({
      success: true,
      is_public: true,
      public_share_token: token,
      public_shared_at: sharedAt,
      shareUrl,
    });
  } catch (err: any) {
    console.error("POST enable share error:", err);
    return NextResponse.json(
      { error: "Failed to enable public sharing." },
      { status: 500 }
    );
  }
}

// DELETE: Revoke public sharing immediately
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_public: false,
        public_share_token: null,
        public_shared_at: null,
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      is_public: false,
      public_share_token: null,
      shareUrl: null,
    });
  } catch (err: any) {
    console.error("DELETE revoke share error:", err);
    return NextResponse.json(
      { error: "Failed to revoke public sharing." },
      { status: 500 }
    );
  }
}
