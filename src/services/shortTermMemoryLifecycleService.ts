import {
    ShortTermMemory,
    updateShortTermMemory,
} from "./shortTermMemoryService";
import { supabase } from "./supabase";

/* ============================================================
   TYPES
   ============================================================ */

export type ShortTermMemoryLifecycleResult = {
  characterId: string;
  expiredCount: number;
  deletedCount: number;
  refreshedAt: string;
};

/* ============================================================
   CONSTANTS
   ============================================================ */

// Production cleanup threshold:
// inactive STM must be older than 7 days before deletion.
const INACTIVE_CLEANUP_MAX_AGE_MS =
  7 * 24 * 60 * 60 * 1000;

/* ============================================================
   GET ACTIVE STM RECORDS FOR LIFECYCLE PROCESSING
   ============================================================ */

async function getLifecycleMemories(
  characterId: string
): Promise<ShortTermMemory[]> {

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "No authenticated user found."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("short_term_memory")
    .select("*")
    .eq(
      "user_id",
      user.id
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
    );

  if (error) {
    console.error(
      "❌ Failed to get STM lifecycle memories:",
      error
    );

    throw error;
  }

  return (data ?? []).map(
    (row: any): ShortTermMemory => ({
      id:
        row.id,

      userId:
        row.user_id,

      characterId:
        row.character_id,

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
    })
  );
}

/* ============================================================
   8B — EXPIRE STM MEMORIES
   ============================================================ */

export async function expireShortTermMemoriesForCharacter(
  characterId: string
): Promise<number> {

  const memories =
    await getLifecycleMemories(
      characterId
    );

  const now =
    Date.now();

  let expiredCount = 0;

  for (const memory of memories) {

    if (!memory.expiresAt) {
      continue;
    }

    const expiresAt =
      new Date(
        memory.expiresAt
      ).getTime();

    if (Number.isNaN(expiresAt)) {

      console.warn(
        "⚠️ STM INVALID EXPIRY DATE:",
        {
          memoryId:
            memory.id,

          expiresAt:
            memory.expiresAt,
        }
      );

      continue;
    }

    if (expiresAt <= now) {

      await updateShortTermMemory(
        memory.id,
        {
          isActive:
            false,
        }
      );

      expiredCount++;

      console.log(
        "⏳ STM MEMORY EXPIRED:",
        {
          memoryId:
            memory.id,

          memoryType:
            memory.memoryType,

          content:
            memory.content,

          expiresAt:
            memory.expiresAt,
        }
      );
    }
  }

  console.log(
    `🧹 STM EXPIRATION COMPLETE: ${expiredCount} memories expired.`
  );

  return expiredCount;
}

/* ============================================================
   8C — GET INACTIVE STM MEMORIES
   ============================================================ */

async function getInactiveShortTermMemories(
  characterId: string
): Promise<ShortTermMemory[]> {

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "No authenticated user found."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("short_term_memory")
    .select("*")
    .eq(
      "user_id",
      user.id
    )
    .eq(
      "character_id",
      characterId
    )
    .eq(
      "is_active",
      false
    )
    .order(
      "updated_at",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "❌ Failed to get inactive STM memories:",
      error
    );

    throw error;
  }

  return (data ?? []).map(
    (row: any): ShortTermMemory => ({
      id:
        row.id,

      userId:
        row.user_id,

      characterId:
        row.character_id,

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
    })
  );
}

/* ============================================================
   8C — CLEANUP INACTIVE STM MEMORIES
   ============================================================ */

export async function cleanupInactiveShortTermMemories(
  characterId: string,
  maxAgeMs: number
): Promise<number> {

  if (
    maxAgeMs <= 0 ||
    !Number.isFinite(maxAgeMs)
  ) {
    throw new Error(
      "maxAgeMs must be a positive number."
    );
  }

  const memories =
    await getInactiveShortTermMemories(
      characterId
    );

  const now =
    Date.now();

  let deletedCount = 0;

  for (const memory of memories) {

    const updatedAt =
      new Date(
        memory.updatedAt
      ).getTime();

    if (Number.isNaN(updatedAt)) {

      console.warn(
        "⚠️ STM INVALID UPDATED DATE:",
        {
          memoryId:
            memory.id,

          updatedAt:
            memory.updatedAt,
        }
      );

      continue;
    }

    const age =
      now - updatedAt;

    if (age >= maxAgeMs) {

      const {
        error,
      } = await supabase
        .from("short_term_memory")
        .delete()
        .eq(
          "id",
          memory.id
        )
        .eq(
          "user_id",
          memory.userId
        )
        .eq(
          "character_id",
          characterId
        )
        .eq(
          "is_active",
          false
        );

      if (error) {

        console.error(
          "❌ Failed to delete inactive STM:",
          error
        );

        throw error;
      }

      deletedCount++;

      console.log(
        "🗑️ STM INACTIVE MEMORY DELETED:",
        {
          memoryId:
            memory.id,

          memoryType:
            memory.memoryType,

          content:
            memory.content,

          updatedAt:
            memory.updatedAt,
        }
      );
    }
  }

  console.log(
    `🧹 STM INACTIVE CLEANUP COMPLETE: ${deletedCount} memories deleted.`
  );

  return deletedCount;
}

/* ============================================================
   8D — STM LIFECYCLE REFRESH
   ============================================================ */

export async function runShortTermMemoryLifecycle(
  characterId: string
): Promise<ShortTermMemoryLifecycleResult> {

  console.log(
    "🔄 STM LIFECYCLE REFRESH STARTED"
  );

  console.log(
    "👤 CHARACTER:",
    characterId
  );

  /*
   * STEP 1
   * Expire STM records whose expires_at
   * has already passed.
   */

  console.log(
    "⏳ STM LIFECYCLE: CHECKING EXPIRATION..."
  );

  const expiredCount =
    await expireShortTermMemoriesForCharacter(
      characterId
    );

  /*
   * STEP 2
   * Delete inactive STM records that are
   * older than the production threshold.
   */

  console.log(
    "🧹 STM LIFECYCLE: CHECKING INACTIVE CLEANUP..."
  );

  const deletedCount =
    await cleanupInactiveShortTermMemories(
      characterId,
      INACTIVE_CLEANUP_MAX_AGE_MS
    );

  /*
   * STEP 3
   * Record refresh timestamp.
   */

  const refreshedAt =
    new Date().toISOString();

  const result:
    ShortTermMemoryLifecycleResult = {
      characterId,

      expiredCount,

      deletedCount,

      refreshedAt,
    };

  console.log(
    "🔄 STM LIFECYCLE REFRESH RESULT:",
    result
  );

  console.log(
    "✅ STM LIFECYCLE REFRESH COMPLETED"
  );

  return result;
}

/* ============================================================
   TEST STM LIFECYCLE
   ============================================================ */

export async function testShortTermMemoryLifecycle(
  characterId: string
): Promise<void> {

  console.log(
    "🧪 TESTING STM LIFECYCLE..."
  );

  const result =
    await runShortTermMemoryLifecycle(
      characterId
    );

  console.log(
    "🧪 STM LIFECYCLE TEST RESULT:",
    result
  );

  console.log(
    "✅ STM LIFECYCLE TEST COMPLETED."
  );
}

/* ============================================================
   TEST STM EXPIRATION
   ============================================================ */

export async function testShortTermMemoryExpiration(
  characterId: string
): Promise<void> {

  console.log(
    "🧪 TESTING STM EXPIRATION..."
  );

  const expiredCount =
    await expireShortTermMemoriesForCharacter(
      characterId
    );

  console.log(
    "🧪 STM EXPIRATION TEST RESULT:",
    {
      characterId,

      expiredCount,
    }
  );

  console.log(
    "✅ STM EXPIRATION TEST COMPLETED."
  );
}

/* ============================================================
   CREATE EXPIRED TEST MEMORY
   ============================================================ */

export async function createExpiredTestMemory(
  characterId: string,
  conversationId: string
): Promise<void> {

  const {
    addShortTermMemory,
  } = await import(
    "./shortTermMemoryService"
  );

  const expiredAt =
    new Date(
      Date.now() -
        60 * 1000
    ).toISOString();

  const memory =
    await addShortTermMemory(
      characterId,
      "event",
      "TEST EVENT - expired STM",
      {
        conversationId,

        importance:
          0.5,

        confidence:
          1,

        expiresAt:
          expiredAt,
      }
    );

  console.log(
    "🧪 EXPIRED TEST MEMORY CREATED:",
    {
      id:
        memory.id,

      content:
        memory.content,

      expiresAt:
        memory.expiresAt,

      isActive:
        memory.isActive,
    }
  );
}

/* ============================================================
   8C — CREATE INACTIVE TEST MEMORY
   ============================================================ */

export async function createInactiveTestMemory(
  characterId: string,
  conversationId: string
): Promise<void> {

  const {
    addShortTermMemory,
  } = await import(
    "./shortTermMemoryService"
  );

  const memory =
    await addShortTermMemory(
      characterId,
      "context",
      "TEST INACTIVE STM - cleanup",
      {
        conversationId,

        importance:
          0.5,

        confidence:
          1,
      }
    );

  await updateShortTermMemory(
    memory.id,
    {
      isActive:
        false,
    }
  );

  console.log(
    "🧪 INACTIVE TEST MEMORY CREATED:",
    {
      id:
        memory.id,

      content:
        memory.content,

      isActive:
        false,
    }
  );
}

/* ============================================================
   8C — TEST INACTIVE CLEANUP
   ============================================================ */

export async function testInactiveShortTermMemoryCleanup(
  characterId: string
): Promise<void> {

  console.log(
    "🧪 TESTING INACTIVE STM CLEANUP..."
  );

  const deletedCount =
    await cleanupInactiveShortTermMemories(
      characterId,

      // Temporary test threshold:
      // 1 second
      1000
    );

  console.log(
    "🧪 STM INACTIVE CLEANUP TEST RESULT:",
    {
      characterId,

      deletedCount,
    }
  );

  console.log(
    "✅ STM INACTIVE CLEANUP TEST COMPLETED."
  );
}