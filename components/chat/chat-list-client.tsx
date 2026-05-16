"use client";

import { useState, useEffect }  from "react";
import Link                     from "next/link";
import { usePathname }          from "next/navigation";
import { motion }               from "framer-motion";
import { MessageCircle, Search, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge }          from "@/components/ui/badge";
import { createClient }   from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn }             from "@/lib/utils";
import type { ChatListItem } from "@/actions/chat";

interface ChatListClientProps {
  chats:         ChatListItem[];
  currentUserId: string;
}

export function ChatListClient({ chats: initialChats, currentUserId }: ChatListClientProps) {
  const [chats,   setChats]   = useState(initialChats);
  const [search,  setSearch]  = useState("");
  const pathname = usePathname();
  const supabase = createClient();

  // ── Realtime: update last message preview live ──
  useEffect(() => {
    const chatIds = chats.map((c) => c.id);
    if (!chatIds.length) return;

    const channel = supabase
      .channel("chat-list-updates")
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
        },
        (payload) => {
          const msg = payload.new as {
            id: string; chat_id: string; content: string;
            sender_id: string; is_read: boolean; created_at: string;
          };

          setChats((prev) =>
            prev.map((chat) => {
              if (chat.id !== msg.chat_id) return chat;
              const isOwnMessage = msg.sender_id === currentUserId;
              return {
                ...chat,
                last_message: {
                  content:    msg.content,
                  created_at: msg.created_at,
                  is_read:    msg.is_read,
                  sender_id:  msg.sender_id,
                },
                unread_count: isOwnMessage
                  ? chat.unread_count
                  : chat.unread_count + 1,
                updated_at: msg.created_at,
              };
            })
            .sort((a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chats.map((c) => c.id).join(","), currentUserId]);

  const filtered = chats.filter((c) =>
    c.other_user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.worker_profile?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (chats.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          When you unlock a chat with a worker, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-soft overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-lg border border-border/40 outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="divide-y divide-border/40">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No conversations match your search.
          </p>
        ) : (
          filtered.map((chat, i) => {
            const isActive = pathname === `/dashboard/chats/${chat.id}`;
            const hasUnread = chat.unread_count > 0;
            const initials  = chat.other_user.full_name
              .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const timeAgo   = chat.last_message
              ? formatDistanceToNow(new Date(chat.last_message.created_at), {
                  addSuffix: false,
                })
              : formatDistanceToNow(new Date(chat.created_at), { addSuffix: false });

            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/dashboard/chats/${chat.id}`}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 hover:bg-accent/60 transition-colors",
                    isActive && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  {/* Avatar with online dot */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage
                        src={
                          chat.worker_profile?.profile_image_url ??
                          chat.other_user.avatar_url ?? ""
                        }
                        alt={chat.other_user.full_name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-sm truncate",
                        hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"
                      )}>
                        {chat.other_user.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {timeAgo}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-xs truncate flex-1",
                        hasUnread
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}>
                        {chat.last_message
                          ? chat.last_message.sender_id === currentUserId
                            ? `You: ${chat.last_message.content}`
                            : chat.last_message.content
                          : chat.worker_profile?.title ?? "Chat unlocked"
                        }
                      </p>

                      {hasUnread && (
                        <Badge className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-primary text-white flex-shrink-0">
                          {chat.unread_count > 9 ? "9+" : chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}