
import { supabase } from "./supabase";

/* ============================================================
   SHORT-TERM MEMORY TYPES
   ============================================================ */

export type ShortTermMemoryType =
  | "context"
  | "preference"
  | "emotion"
  | "topic"
  | "goal"
  | "event"
  | "relationship"
  | "other";

export type ShortTermMemory = {
  id: string;

  userId: string;

  characterId: string;

  conversationId?: string;

  memoryType: ShortTermMemoryType;

  content: string;

  importance: number;

  confidence: number;

  expiresAt?: string;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
};

/* ============================================================
   DATABASE ROW
   ============================================================ */

type ShortTermMemoryRow = {
  id: string;
  user_id: string;
  character_id: string;
  conversation_id: string | null;
  memory_type: ShortTermMemoryType;
  content: string;
  importance: number;
  confidence: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/* ============================================================
   CURRENT USER
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
      "No authenticated user found."
    );
  }

  return user.id;
}

/* ============================================================
   DATABASE → APP
   ============================================================ */

function mapShortTermMemory(
  row: ShortTermMemoryRow
): ShortTermMemory {
  return {
    id: row.id,

    userId: row.user_id,

    characterId: row.character_id,

    conversationId:
      row.conversation_id ??
      undefined,

    memoryType:
      row.memory_type,

    content:
      row.content,

    importance:
      row.importance,

    confidence:
      row.confidence,

    expiresAt:
      row.expires_at ??
      undefined,

    isActive:
      row.is_active,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* ============================================================
   ADD SHORT-TERM MEMORY
   ============================================================ */

export async function addShortTermMemory(
  characterId: string,
  memoryType: ShortTermMemoryType,
  content: string,
  options?: {
    conversationId?: string;
    importance?: number;
    confidence?: number;
    expiresAt?: string;
  }
): Promise<ShortTermMemory> {

  const userId =
    await getCurrentUserId();

  const cleanContent =
    content.trim();

  if (!cleanContent) {
    throw new Error(
      "Short-term memory content cannot be empty."
    );
  }

  const importance =
    Math.max(
      0,
      Math.min(
        1,
        options?.importance ?? 0.5
      )
    );

  const confidence =
    Math.max(
      0,
      Math.min(
        1,
        options?.confidence ?? 0.5
      )
    );

  const { data, error } =
    await supabase
      .from("short_term_memory")
      .insert({
        user_id: userId,

        character_id:
          characterId,

        conversation_id:
          options?.conversationId ??
          null,

        memory_type:
          memoryType,

        content:
          cleanContent,

        importance,

        confidence,

        expires_at:
          options?.expiresAt ??
          null,

        is_active: true,
      })
      .select()
      .single();

  if (error) {
    console.error(
      "❌ Failed to add short-term memory:",
      error
    );

    throw error;
  }

  console.log(
    "🧠 SHORT-TERM MEMORY SAVED:",
    data
  );

  return mapShortTermMemory(
    data as ShortTermMemoryRow
  );
}

/* ============================================================
   GET CHARACTER SHORT-TERM MEMORIES
   ============================================================ */

export async function getCharacterShortTermMemories(
  characterId: string,
  limit = 50
): Promise<ShortTermMemory[]> {

  const userId =
    await getCurrentUserId();

  const { data, error } =
    await supabase
      .from("short_term_memory")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .eq(
        "character_id",
        characterId
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(limit);

  if (error) {
    console.error(
      "❌ Failed to get character short-term memories:",
      error
    );

    throw error;
  }

  return (
    (data as ShortTermMemoryRow[])
      .map(
        mapShortTermMemory
      )
  );
}

/* ============================================================
   GET CONVERSATION SHORT-TERM MEMORIES
   ============================================================ */

export async function getConversationShortTermMemories(
  conversationId: string,
  limit = 50
): Promise<ShortTermMemory[]> {

  const userId =
    await getCurrentUserId();

  const { data, error } =
    await supabase
      .from("short_term_memory")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .eq(
        "conversation_id",
        conversationId
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(limit);

  if (error) {
    console.error(
      "❌ Failed to get conversation short-term memories:",
      error
    );

    throw error;
  }

  return (
    (data as ShortTermMemoryRow[])
      .map(
        mapShortTermMemory
      )
  );
}

/* ============================================================
   GET ACTIVE SHORT-TERM MEMORIES
   ============================================================ */

export async function getActiveShortTermMemories(
  characterId: string,
  limit = 50
): Promise<ShortTermMemory[]> {

  const memories =
    await getCharacterShortTermMemories(
      characterId,
      limit
    );

  const now =
    Date.now();

  return memories.filter(
    (memory) => {

      if (!memory.expiresAt) {
        return true;
      }

      return (
        new Date(
          memory.expiresAt
        ).getTime() > now
      );
    }
  );
}

/* ============================================================
   UPDATE SHORT-TERM MEMORY
   ============================================================ */

export async function updateShortTermMemory(
  memoryId: string,
  updates: {
    content?: string;
    importance?: number;
    confidence?: number;
    expiresAt?: string | null;
    isActive?: boolean;
  }
): Promise<void> {

  const userId =
    await getCurrentUserId();

  const databaseUpdates: Record<
    string,
    unknown
  > = {};

  if (
    updates.content !==
    undefined
  ) {
    databaseUpdates.content =
      updates.content.trim();
  }

  if (
    updates.importance !==
    undefined
  ) {
    databaseUpdates.importance =
      Math.max(
        0,
        Math.min(
          1,
          updates.importance
        )
      );
  }

  if (
    updates.confidence !==
    undefined
  ) {
    databaseUpdates.confidence =
      Math.max(
        0,
        Math.min(
          1,
          updates.confidence
        )
      );
  }

  if (
    updates.expiresAt !==
    undefined
  ) {
    databaseUpdates.expires_at =
      updates.expiresAt;
  }

  if (
    updates.isActive !==
    undefined
  ) {
    databaseUpdates.is_active =
      updates.isActive;
  }

  if (
    Object.keys(
      databaseUpdates
    ).length === 0
  ) {
    return;
  }

  const { error } =
    await supabase
      .from("short_term_memory")
      .update(
        databaseUpdates
      )
      .eq(
        "id",
        memoryId
      )
      .eq(
        "user_id",
        userId
      );

  if (error) {
    console.error(
      "❌ Failed to update short-term memory:",
      error
    );

    throw error;
  }
}

/* ============================================================
   REMOVE SHORT-TERM MEMORY
   ============================================================ */

export async function removeShortTermMemory(
  memoryId: string
): Promise<void> {

  const userId =
    await getCurrentUserId();

  const { error } =
    await supabase
      .from("short_term_memory")
      .update({
        is_active: false,
      })
      .eq(
        "id",
        memoryId
      )
      .eq(
        "user_id",
        userId
      );

  if (error) {
    console.error(
      "❌ Failed to remove short-term memory:",
      error
    );

    throw error;
  }
}

/* ============================================================
   CLEAR CHARACTER SHORT-TERM MEMORIES
   ============================================================ */

export async function clearCharacterShortTermMemories(
  characterId: string
): Promise<void> {

  const userId =
    await getCurrentUserId();

  const { error } =
    await supabase
      .from("short_term_memory")
      .update({
        is_active: false,
      })
      .eq(
        "user_id",
        userId
      )
      .eq(
        "character_id",
        characterId
      );

  if (error) {
    console.error(
      "❌ Failed to clear character short-term memories:",
      error
    );

    throw error;
  }
}

/* ============================================================
   EXPIRE OLD MEMORIES
   ============================================================ */

export async function expireShortTermMemories(): Promise<void> {

  const userId =
    await getCurrentUserId();

  const now =
    new Date().toISOString();

  const { error } =
    await supabase
      .from("short_term_memory")
      .update({
        is_active: false,
      })
      .eq(
        "user_id",
        userId
      )
      .eq(
        "is_active",
        true
      )
      .not(
        "expires_at",
        "is",
        null
      )
      .lte(
        "expires_at",
        now
      );

  if (error) {
    console.error(
      "❌ Failed to expire short-term memories:",
      error
    );

    throw error;
  }
}

/* ============================================================
   TEST
   ============================================================ */

export async function testShortTermMemoryService(
  characterId: string,
  conversationId?: string
): Promise<void> {

  console.log(
    "🧪 Testing short-term memory service..."
  );

  const memory =
    await addShortTermMemory(
      characterId,
      "context",
      "User is currently testing the short-term memory system.",
      {
        conversationId,
        importance: 0.6,
        confidence: 1.0,
        expiresAt:
          new Date(
            Date.now() +
              24 *
                60 *
                60 *
                1000
          ).toISOString(),
      }
    );

  console.log(
    "🧠 Created memory:",
    memory
  );

  const memories =
    await getCharacterShortTermMemories(
      characterId
    );

  console.log(
    "🧠 Retrieved memories:",
    memories
  );
}

