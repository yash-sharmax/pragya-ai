import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: {
    token: string;
  };
}

// GET: Public read-only endpoint for shared conversation (Unauthenticated access permitted)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid share token." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Query conversation strictly via secure SECURITY DEFINER RPC function
    // This enforces exact token match, is_public=true, and omits private user IDs / internal storage paths
    const { data, error } = await supabase.rpc("get_public_shared_conversation", {
      lookup_token: token.trim(),
    });

    if (error) {
      console.error("Fetch shared conversation RPC error:", error);
      return NextResponse.json(
        { error: "Failed to load shared conversation." },
        { status: 500 }
      );
    }

    if (!data || !data.conversation) {
      return NextResponse.json(
        { error: "This shared conversation was not found or is no longer public." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: data.conversation,
      messages: data.messages || [],
      attachments: data.attachments || [],
    });
  } catch (err: any) {
    console.error("GET public share route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading shared conversation." },
      { status: 500 }
    );
  }
}
