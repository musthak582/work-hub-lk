import { notFound }        from "next/navigation";
import type { Metadata }   from "next";
import { requireAuth }     from "@/lib/session";
import { getChatDetailAction } from "@/actions/chat";
import { markMessagesReadAction } from "@/actions/chat";
import { ChatRoom } from "@/components/chat/chat-room";


interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Chat — WorkHub LK",
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const user   = await requireAuth();

  const chat = await getChatDetailAction(id);
  console.log(chat);
  if (!chat) notFound();

  // Mark messages as read on page load
  await markMessagesReadAction(id);

  return <ChatRoom chat={chat} currentUserId={user.id} />;
}