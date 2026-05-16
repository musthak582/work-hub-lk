"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types/actions";

// ============================================
// SEND MESSAGE
// ============================================
const sendMessageSchema = z.object({
    chat_id: z.string().uuid(),
    content: z.string().min(1).max(2000).trim(),
});

export async function sendMessageAction(
    formData: FormData
): Promise<ActionResult<{ id: string }>> {
    const raw = {
        chat_id: formData.get("chat_id"),
        content: formData.get("content"),
    };

    const parsed = sendMessageSchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message };
    }

    const { chat_id, content } = parsed.data;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Not authenticated." };

    const { data: user } = await adminSupabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

    if (!user) return { success: false, error: "User not found." };

    // Verify user is a participant in this chat
    const { data: chat } = await adminSupabase
        .from("chats")
        .select("id, is_active, hirer_id, worker_id")
        .eq("id", chat_id)
        .single();

    if (!chat) return { success: false, error: "Chat not found." };
    if (!chat.is_active) return { success: false, error: "Chat is inactive." };

    const isParticipant =
        chat.hirer_id === user.id || chat.worker_id === user.id;

    if (!isParticipant) {
        return { success: false, error: "You are not a participant in this chat." };
    }

    // Insert message
    const { data: message, error } = await adminSupabase
        .from("messages")
        .insert({
            chat_id,
            sender_id: user.id,
            content,
            is_read: false,
        })
        .select("id")
        .single();

    if (error || !message) {
        console.error("[Chat] Message insert error:", error);
        return { success: false, error: "Failed to send message." };
    }

    // Update chat updated_at (for sorting chat list)
    await adminSupabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chat_id);

    return { success: true, data: { id: message.id } };
}

// ============================================
// MARK MESSAGES AS READ
// ============================================
export async function markMessagesReadAction(
    chatId: string
): Promise<void> {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: user } = await adminSupabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

    if (!user) return;

    // Mark all messages NOT sent by current user as read
    await adminSupabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .eq("is_read", false)
        .neq("sender_id", user.id);
}

// ============================================
// GET ALL CHATS FOR CURRENT USER
// ============================================
export interface ChatListItem {
    id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    other_user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    worker_profile: {
        id: string;
        title: string;
        profile_image_url: string | null;
    } | null;
    last_message: {
        content: string;
        created_at: string;
        is_read: boolean;
        sender_id: string;
    } | null;
    unread_count: number;
}

export async function getChatsAction(): Promise<ChatListItem[]> {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return [];

    const { data: user } = await adminSupabase
        .from("users")
        .select("id, role")
        .eq("auth_id", authUser.id)
        .single();

    if (!user) return [];

    // Fetch chats with participants
    const { data: chats } = await adminSupabase
        .from("chats")
        .select(`
    id, is_active, created_at, updated_at,
    hirer_id, worker_id,
    hirer:users!chats_hirer_id_fkey(id, full_name, avatar_url),
    worker:users!chats_worker_id_fkey(id, full_name, avatar_url)
  `)
        .or(`hirer_id.eq.${user.id},worker_id.eq.${user.id}`)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

    if (!chats) return [];

    // For each chat, get last message + unread count
    const enriched = await Promise.all(
        chats.map(async (chat: any) => {
            const isHirer = chat.hirer_id === user.id;
            const other_user = isHirer ? chat.worker : chat.hirer;

            // Last message
            const { data: lastMsg } = await adminSupabase
                .from("messages")
                .select("content, created_at, is_read, sender_id")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            // Unread count (messages sent by other user, not read)
            const { count: unreadCount } = await adminSupabase
                .from("messages")
                .select("id", { count: "exact" })
                .eq("chat_id", chat.id)
                .eq("is_read", false)
                .neq("sender_id", user.id);

            // Worker profile (only relevant when hirer views)
            const workerProfile = null;

            return {
                id: chat.id,
                is_active: chat.is_active,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                other_user: {
                    id: other_user?.id ?? "",
                    full_name: other_user?.full_name ?? "Unknown",
                    avatar_url: other_user?.avatar_url ?? null,
                },
                worker_profile: workerProfile
                    ? {
                        id: workerProfile.id,
                        title: workerProfile.title,
                        profile_image_url: workerProfile.profile_image_url,
                    }
                    : null,
                last_message: lastMsg ?? null,
                unread_count: unreadCount ?? 0,
            } as ChatListItem;
        })
    );

    return enriched;
}

// ============================================
// GET SINGLE CHAT + MESSAGES
// ============================================
export interface ChatDetail {
    id: string;
    hirer_id: string;
    worker_id: string;
    is_active: boolean;
    created_at: string;
    hirer: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    worker: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    worker_profile: {
        id: string;
        title: string;
        profile_image_url: string | null;
        district: string;
    } | null;
    messages: {
        id: string;
        content: string;
        sender_id: string;
        is_read: boolean;
        created_at: string;
    }[];
    current_user_id: string;
}

export async function getChatDetailAction(
    chatId: string
): Promise<ChatDetail | null> {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: user } = await adminSupabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

    if (!user) return null;

    // Fetch chat
    const { data: chat, error } = await adminSupabase
        .from("chats")
        .select(`
    id,
    hirer_id,
    worker_id,
    is_active,
    created_at,

    hirer:users!chats_hirer_id_fkey(
      id,
      full_name,
      avatar_url
    ),

    worker:users!chats_worker_id_fkey(
      id,
      full_name,
      avatar_url
    )
  `)
        .eq("id", chatId)
        .single();

    console.log("CHAT ERROR:", error);
    console.log("CHAT RAW:", chat);

    if (!chat) return null;

    // Verify participant
    const isParticipant =
        (chat as any).hirer_id === user.id ||
        (chat as any).worker_id === user.id;

    if (!isParticipant) return null;

    // Fetch messages
    const { data: messages } = await adminSupabase
        .from("messages")
        .select("id, content, sender_id, is_read, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(100);

    const workerProfile = (chat as any).worker_profile?.[0] ?? null;

    return {
        id: (chat as any).id,
        hirer_id: (chat as any).hirer_id,
        worker_id: (chat as any).worker_id,
        is_active: (chat as any).is_active,
        created_at: (chat as any).created_at,
        hirer: (chat as any).hirer,
        worker: (chat as any).worker,
        worker_profile: workerProfile,
        messages: (messages ?? []) as ChatDetail["messages"],
        current_user_id: user.id,
    };
}