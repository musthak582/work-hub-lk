import type { Metadata }   from "next";
import { requireAuth }     from "@/lib/session";
import { getChatsAction }  from "@/actions/chat";
import { ChatListClient }  from "@/components/chat/chat-list-client";

export const metadata: Metadata = {
  title: "Messages — WorkHub LK",
};

export default async function ChatsPage() {
  const user  = await requireAuth();
  const chats = await getChatsAction();

  console.log("CHATS:", JSON.stringify(chats, null, 2));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          {chats.length > 0
            ? `${chats.length} conversation${chats.length !== 1 ? "s" : ""}`
            : "No conversations yet"
          }
        </p>
      </div>
      <ChatListClient chats={chats} currentUserId={user.id} />
    </div>
  );
}