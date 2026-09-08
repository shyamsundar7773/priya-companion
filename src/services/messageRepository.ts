import {
  ChatMessage,
  ChatMessageRole,
} from "../types/chatMessage";

import { supabase } from "./supabase";

export type SaveMessageInput = {
  conversationId: string;
  characterId: string;
  role: ChatMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
};

/* ============================================================
GET CURRENT USER
============================================================ */

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "User must be signed in."
    );
  }

  return user.id;
}

/* ============================================================
DATABASE → APP MESSAGE
============================================================ */

function mapMessage(
  row: any
): ChatMessage {
  return {
    id: row.id,

    conversationId:
      row.conversation_id,

    userId:
      row.user_id,

    characterId:
      row.character_id,

    role:
      row.role,

    content:
      row.content,

    metadata:
      row.metadata ?? undefined,

    memoryProcessed:
      row.memory_processed ?? false,

    analyzed:
      row.analyzed ?? false,

    createdAt:
      row.created_at,
  };
}

/* ============================================================
SAVE MESSAGE
============================================================ */

export async function saveMessage(
  input: SaveMessageInput
): Promise<ChatMessage> {
  if (!input.conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  if (!input.characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  if (!input.content.trim()) {
    throw new Error(
      "Message content cannot be empty."
    );
  }

  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("messages")
    .insert({
      conversation_id:
        input.conversationId,

      user_id:
        userId,

      character_id:
        input.characterId,

      role:
        input.role,

      content:
        input.content.trim(),

      metadata:
        input.metadata ?? {},

      memory_processed:
        false,

      analyzed:
        false,
    })
    .select("*")
    .single();

  if (error) {
    console.error(
      "Failed to save message:",
      error
    );

    throw error;
  }

  return mapMessage(data);
}

/* ============================================================
GET CONVERSATION MESSAGES
============================================================ */

export async function getConversationMessages(
  conversationId: string,
  limit = 100
): Promise<ChatMessage[]> {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  const safeLimit =
    Math.max(
      1,
      Math.min(
        limit,
        500
      )
    );

  const {
    data,
    error,
  } = await supabase
    .from("messages")
    .select("*")
    .eq(
      "conversation_id",
      conversationId
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(safeLimit);

  if (error) {
    console.error(
      "Failed to load conversation messages:",
      error
    );

    throw error;
  }

  return (
    (data ?? []) as any[]
  )
    .map(mapMessage)
    .reverse();
}

/* ============================================================
GET RECENT MESSAGES
============================================================ */

export async function getRecentConversationMessages(
  conversationId: string,
  limit = 20
): Promise<ChatMessage[]> {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  const safeLimit =
    Math.max(
      1,
      Math.min(
        limit,
        100
      )
    );

  const {
    data,
    error,
  } = await supabase
    .from("messages")
    .select("*")
    .eq(
      "conversation_id",
      conversationId
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(safeLimit);

  if (error) {
    console.error(
      "Failed to load recent messages:",
      error
    );

    throw error;
  }

  return (
    (data ?? []) as any[]
  )
    .map(mapMessage)
    .reverse();
}

/* ============================================================
MARK MESSAGE ANALYZED
============================================================ */

export async function markMessageAnalyzed(
  messageId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("messages")
    .update({
      analyzed: true,
    })
    .eq(
      "id",
      messageId
    );

  if (error) {
    console.error(
      "Failed to mark message analyzed:",
      error
    );

    throw error;
  }
}

/* ============================================================
MARK MEMORY PROCESSED
============================================================ */

export async function markMessageMemoryProcessed(
  messageId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("messages")
    .update({
      memory_processed: true,
    })
    .eq(
      "id",
      messageId
    );

  if (error) {
    console.error(
      "Failed to mark memory processed:",
      error
    );

    throw error;
  }
}

/* ============================================================
DELETE SINGLE MESSAGE
============================================================ */

export async function deleteMessage(
  messageId: string
): Promise<void> {
  if (!messageId) {
    return;
  }

  const userId =
    await getCurrentUserId();

  const {
    error,
  } = await supabase
    .from("messages")
    .delete()
    .eq(
      "id",
      messageId
    )
    .eq(
      "user_id",
      userId
    );

  if (error) {
    console.error(
      "Failed to delete message:",
      error
    );

    throw error;
  }

  console.log(
    "🧹 MESSAGE DELETED:",
    messageId
  );
}

/* ============================================================
DELETE CONVERSATION MESSAGES
============================================================ */

export async function deleteConversationMessages(
  conversationId: string
): Promise<void> {
  if (!conversationId) {
    return;
  }

  const {
    error,
  } = await supabase
    .from("messages")
    .delete()
    .eq(
      "conversation_id",
      conversationId
    );

  if (error) {
    console.error(
      "Failed to delete messages:",
      error
    );

    throw error;
  }
}

/* ============================================================
TEST
============================================================ */

export async function testMessageRepository(
  conversationId: string,
  characterId: string
): Promise<void> {
  try {
    console.log(
      "💬 Testing message repository..."
    );

    const message =
      await saveMessage({
        conversationId,
        characterId,
        role: "system",
        content:
          "2.5C repository test message.",
        metadata: {
          test: true,
        },
      });

    console.log(
      "✅ Saved message:",
      message
    );

    const messages =
      await getConversationMessages(
        conversationId
      );

    console.log(
      "✅ Loaded messages:",
      messages
    );

    await deleteConversationMessages(
      conversationId
    );

    console.log(
      "🧹 Test messages deleted."
    );

    console.log(
      "✅ Message repository test completed."
    );
  } catch (error) {
    console.error(
      "❌ Message repository test failed:",
      error
    );
  }
}