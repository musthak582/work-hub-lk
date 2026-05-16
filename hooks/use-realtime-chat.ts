"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeMessage {
  id:         string;
  chat_id:    string;
  sender_id:  string;
  content:    string;
  is_read:    boolean;
  created_at: string;
}

interface UseRealtimeChatOptions {
  chatId:         string;
  currentUserId:  string;
  initialMessages: RealtimeMessage[];
  onNewMessage?:  (msg: RealtimeMessage) => void;
}

export function useRealtimeChat({
  chatId,
  currentUserId,
  initialMessages,
  onNewMessage,
}: UseRealtimeChatOptions) {
  const [messages,    setMessages]    = useState<RealtimeMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const channelRef  = useRef<RealtimeChannel | null>(null);
  const supabase    = createClient();

  // ============================================
  // SUBSCRIBE TO NEW MESSAGES
  // ============================================
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      // New message inserted
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as RealtimeMessage;
          setMessages((prev) => {
            // Avoid duplicates (optimistic UI)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          onNewMessage?.(newMsg);
        }
      )
      // Message updated (is_read changed)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updated = payload.new as RealtimeMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      // Presence — track online users
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const onlineIds = Object.values(state)
          .flat()
          .map((p) => p.user_id);

        // Check if the other user is online (anyone who isn't us)
        const otherOnline = onlineIds.some((id) => id !== currentUserId);
        setOtherUserOnline(otherOnline);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const joined = (newPresences as { user_id: string }[]);
        if (joined.some((p) => p.user_id !== currentUserId)) {
          setOtherUserOnline(true);
        }
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const onlineIds = Object.values(state)
          .flat()
          .map((p) => p.user_id);
        setOtherUserOnline(onlineIds.some((id) => id !== currentUserId));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          // Track own presence
          await channel.track({ user_id: currentUserId });
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // ============================================
  // ADD MESSAGE OPTIMISTICALLY
  // Called immediately when user sends a message
  // so the UI updates before the DB confirms
  // ============================================
  const addOptimisticMessage = useCallback(
    (content: string, tempId: string) => {
      const optimistic: RealtimeMessage = {
        id:         tempId,
        chat_id:    chatId,
        sender_id:  currentUserId,
        content,
        is_read:    false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
    },
    [chatId, currentUserId]
  );

  // ============================================
  // REMOVE OPTIMISTIC MESSAGE (on error)
  // ============================================
  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  return {
    messages,
    isConnected,
    otherUserOnline,
    addOptimisticMessage,
    removeOptimisticMessage,
  };
}