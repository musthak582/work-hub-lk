"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseTypingIndicatorOptions {
  chatId:        string;
  currentUserId: string;
}

export function useTypingIndicator({
  chatId,
  currentUserId,
}: UseTypingIndicatorOptions) {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef       = useRef<RealtimeChannel | null>(null);
  const supabase         = createClient();

  useEffect(() => {
    // Use a separate broadcast channel for typing
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: { user_id: string; is_typing: boolean } }) => {
          // Only react to the OTHER user's typing events
          if (payload.user_id === currentUserId) return;

          if (payload.is_typing) {
            setOtherUserTyping(true);
            // Auto-clear after 3s if no further typing event
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          } else {
            setOtherUserTyping(false);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // ============================================
  // BROADCAST TYPING EVENT
  // Call this on every keystroke in the input
  // ============================================
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      channelRef.current?.send({
        type:    "broadcast",
        event:   "typing",
        payload: { user_id: currentUserId, is_typing: isTyping },
      });
    },
    [currentUserId]
  );

  return { otherUserTyping, sendTyping };
}