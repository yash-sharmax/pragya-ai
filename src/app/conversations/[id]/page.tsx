import { redirect } from "next/navigation";

export default function ConversationsPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/c/${params.id}`);
}
