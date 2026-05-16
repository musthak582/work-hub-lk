"use client";

import {
  useState, useRef, useEffect,
  useTransition, useCallback,
} from "react";
import Link   from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, ArrowLeft, MoreVertical,
  Phone, Star, Wifi, WifiOff,
} from "lucide-react";
import { toast }   from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { useRealtimeChat }    from "@/hooks/use-realtime-chat";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { sendMessageAction, markMessagesReadAction } from "@/actions/chat";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn }      from "@/lib/utils";
import type { ChatDetail } from "@/actions/chat";

// ============================================
// MESSAGE BUBBLE
// ============================================
function MessageBubble({
  message, isOwn, showAvatar, senderAvatar, senderName,
}: {
  message: {
    id: string; content: string;
    sender_id: string; is_read: boolean; created_at: string;
  };
  isOwn:        boolean;
  showAvatar:   boolean;
  senderAvatar: string | null;
  senderName:   string;
}) {
  const initials = senderName
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const timeStr = format(new Date(message.created_at), "h:mm a");
  const isOptimistic = message.id.startsWith("temp-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-end gap-2 group",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn("w-7 flex-shrink-0", !showAvatar && "invisible")}>
        {showAvatar && !isOwn && (
          <Avatar className="w-7 h-7">
            <AvatarImage src={senderAvatar ?? ""} alt={senderName} />
            <AvatarFallback className="text-xs bg-secondary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-white rounded-br-sm"
            : "bg-card border border-border/60 text-foreground rounded-bl-sm shadow-soft-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-xs",
            isOwn ? "text-white/60" : "text-muted-foreground"
          )}>
            {timeStr}
          </span>
          {isOwn && (
            <span className={cn(
              "text-xs",
              isOptimistic
                ? "text-white/40"
                : message.is_read
                ? "text-white/80"
                : "text-white/50"
            )}>
              {isOptimistic ? "•" : message.is_read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// DATE SEPARATOR
// ============================================
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = isToday(d)
    ? "Today"
    : isYesterday(d)
    ? "Yesterday"
    : format(d, "MMMM d, yyyy");

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-xs text-muted-foreground font-medium px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

// ============================================
// TYPING INDICATOR BUBBLE
// ============================================
function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-end gap-2"
    >
      <div className="w-7 flex-shrink-0" />
      <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN CHAT ROOM COMPONENT
// ============================================
interface ChatRoomProps {
  chat:          ChatDetail;
  currentUserId: string;
}

export function ChatRoom({ chat, currentUserId }: ChatRoomProps) {
  const [input,    setInput]    = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const isHirer  = chat.hirer_id  === currentUserId;
  const otherUser = isHirer ? chat.worker : chat.hirer;

  const otherInitials = otherUser.full_name
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const otherAvatar = chat.worker_profile?.profile_image_url
    ?? otherUser.avatar_url ?? null;

  // Realtime hook
  const {
    messages,
    isConnected,
    otherUserOnline,
    addOptimisticMessage,
    removeOptimisticMessage,
  } = useRealtimeChat({
    chatId:          chat.id,
    currentUserId,
    initialMessages: chat.messages,
    onNewMessage: (msg) => {
      // Mark as read if the window is active
      if (document.visibilityState === "visible" && msg.sender_id !== currentUserId) {
        markMessagesReadAction(chat.id);
      }
    },
  });

  // Typing indicator hook
  const { otherUserTyping, sendTyping } = useTypingIndicator({
    chatId:        chat.id,
    currentUserId,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  // Mark read when tab becomes active
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markMessagesReadAction(chat.id);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [chat.id]);

  // ── SEND MESSAGE ────────────────────────────
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || isPending) return;

    const tempId = `temp-${Date.now()}`;
    setInput("");
    inputRef.current?.focus();

    // Optimistic update
    addOptimisticMessage(content, tempId);

    // Stop typing indicator
    sendTyping(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("chat_id", chat.id);
      fd.append("content", content);

      const result = await sendMessageAction(fd);

      if (!result.success) {
        removeOptimisticMessage(tempId);
        toast.error(result.error ?? "Failed to send message");
      }
      // On success, the Realtime subscription will add the real message
      // and the optimistic one will be deduplicated
    });
  }, [
    input, isPending, chat.id,
    addOptimisticMessage, removeOptimisticMessage, sendTyping,
  ]);

  // ── TYPING DETECTION ───────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);

    // Broadcast typing
    sendTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  }

  // ── ENTER TO SEND (Shift+Enter = newline) ──
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── GROUP MESSAGES BY DATE ──────────────────
  const groupedMessages: {
    date:     string;
    messages: typeof messages;
  }[] = [];

  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.created_at), "yyyy-MM-dd");
    const last    = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== dateKey) {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border border-border/60 rounded-2xl shadow-soft overflow-hidden">

      {/* ── HEADER ──────────────────────────── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border/60 bg-card flex-shrink-0">
        {/* Back button — mobile */}
        <Link
          href="/dashboard/chats"
          className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar + name */}
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherAvatar ?? ""} alt={otherUser.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {otherInitials}
            </AvatarFallback>
          </Avatar>
          {/* Online dot */}
          <div className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card",
            otherUserOnline ? "bg-green-500" : "bg-muted-foreground/30"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {otherUser.full_name}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {otherUserTyping
              ? <span className="text-primary font-medium">typing…</span>
              : otherUserOnline
              ? <span className="text-green-600">Online</span>
              : chat.worker_profile?.title ?? (isHirer ? "Worker" : "Hirer")
            }
          </p>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            isConnected
              ? "bg-green-50 text-green-700"
              : "bg-muted text-muted-foreground"
          )}>
            {isConnected
              ? <Wifi    className="w-3 h-3" />
              : <WifiOff className="w-3 h-3" />
            }
            <span className="hidden sm:inline">
              {isConnected ? "Live" : "Connecting…"}
            </span>
          </div>

          {/* Worker profile link (for hirers) */}
          {isHirer && chat.worker_profile && (
            <Link
              href={`/workers/${chat.worker_profile.id}`}
              target="_blank"
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="View worker profile"
            >
              <Star className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      {/* ── MESSAGES AREA ───────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1.5 bg-secondary/20">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Chat unlocked!
            </p>
            <p className="text-xs text-muted-foreground">
              Say hello to start the conversation.
            </p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <DateSeparator date={group.date} />
            <div className="space-y-1.5">
              {group.messages.map((msg, i) => {
                const isOwn      = msg.sender_id === currentUserId;
                const nextMsg    = group.messages[i + 1];
                // Show avatar on last consecutive message from same sender
                const showAvatar = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderAvatar={isOwn ? null : otherAvatar}
                    senderName={isOwn ? "You" : otherUser.full_name}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {otherUserTyping && <TypingBubble />}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT AREA ──────────────────────── */}
      <div className="px-4 py-3 border-t border-border/60 bg-card flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser.full_name.split(" ")[0]}…`}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-background",
                "px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                "outline-none focus:ring-2 focus:ring-ring transition-shadow",
                "max-h-32 overflow-y-auto"
              )}
              style={{
                height: "auto",
                minHeight: "42px",
              }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <p className="absolute right-3 bottom-2 text-xs text-muted-foreground/40 select-none">
              ↵ send
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            size="icon"
            className="w-10 h-10 rounded-xl flex-shrink-0 shadow-soft"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50 mt-1.5 text-center">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}