import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = user.id;

    // 1. Clean up stored files in user-uploads
    const { data: uploadFiles } = await supabase.storage
      .from("user-uploads")
      .list(userId);

    if (uploadFiles && uploadFiles.length > 0) {
      const pathsToDelete = uploadFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("user-uploads").remove(pathsToDelete);
    }

    // 2. Clean up stored files in user-avatars
    const { data: avatarFiles } = await supabase.storage
      .from("user-avatars")
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("user-avatars").remove(avatarPaths);
    }

    // 3. Delete database records (cascading deletes will clean conversations, messages, evidence, etc.)
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.from("user_settings").delete().eq("user_id", userId);

    // 4. Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete account deletion." },
      { status: 500 }
    );
  }
}
