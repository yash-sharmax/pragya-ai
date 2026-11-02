"use client";

import { ChatDashboard } from "@/components/ChatDashboard";

export default function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  return <ChatDashboard initialConversationId={params.id} />;
}
