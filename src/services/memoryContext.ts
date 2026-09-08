import {
  getCharacterMemories,
  updateMemory,
} from "./memoryService";

import {
  Memory,
} from "../types/memory";

import {
  rankLongTermMemories,
  removeSimilarLongTermMemories,
} from "./longTermMemoryPriority";

/* ============================================================
   MEMORY CONTEXT
============================================================ */

export type MemoryContext = {
  memories: Memory[];
  text: string;
};

/* ============================================================
   SUPPRESSION THRESHOLD
============================================================ */

/*
 * Memories at or below this confidence have been
 * suppressed/superseded by contradiction resolution.
 *
 * They remain stored for historical continuity and
 * possible explicit reinstatement.
 *
 * BUT:
 *
 * They must not enter normal AI context.
 */

const SUPPRESSED_MEMORY_CONFIDENCE = 0.20;

/* ============================================================
   BUILD INTELLIGENT MEMORY CONTEXT
============================================================ */

export async function buildMemoryContext(
  characterId: string,
  userMessage?: string
): Promise<MemoryContext> {

  if (!characterId) {
    return {
      memories: [],
      text: "",
    };
  }

  const memories =
    await getCharacterMemories(
      characterId
    );

  if (
    memories.length === 0 ||
    !userMessage?.trim()
  ) {
    return {
      memories: [],
      text: "",
    };
  }

  /* ==========================================================
     SUPPRESSED MEMORY FILTER
  ========================================================== */

  /*
   * CRITICAL 2.5E RULE:
   *
   * Suppressed memories stay in storage.
   *
   * They are NOT deleted.
   *
   * They are NOT ranked.
   *
   * They are NOT sent to the AI.
   *
   * They can only return through explicit
   * contradiction-resolution reinstatement.
   */

  const activeMemories =
    memories.filter(
      memory =>
        memory.confidence >
        SUPPRESSED_MEMORY_CONFIDENCE
    );

  console.log(
    "🛡️ LTM ACTIVE MEMORY FILTER:",
    {
      totalMemories:
        memories.length,

      activeMemories:
        activeMemories.length,

      suppressedMemories:
        memories.length -
        activeMemories.length,
    }
  );

  if (
    activeMemories.length === 0
  ) {

    console.log(
      "🧠 INTELLIGENT LTM CONTEXT: no active memories"
    );

    return {
      memories: [],
      text: "",
    };
  }

  /* ==========================================================
     RANK ACTIVE MEMORIES ONLY
  ========================================================== */

  const ranked =
    rankLongTermMemories(
      activeMemories,
      userMessage
    );

  /* ==========================================================
     REMOVE SIMILAR MEMORIES
  ========================================================== */

  const filtered =
    removeSimilarLongTermMemories(
      ranked
    );

  /* ==========================================================
     TOP MEMORIES
  ========================================================== */

  const selected =
    filtered.slice(
      0,
      8
    );

  /* ==========================================================
     UPDATE LAST USED
  ========================================================== */

  for (
    const item of selected
  ) {

    try {

      await updateMemory(
        item.memory.id,
        {
          lastUsedAt:
            Date.now(),
        }
      );

    } catch (error) {

      console.error(
        "🧠 Failed to update LTM lastUsedAt:",
        error
      );
    }
  }

  /* ==========================================================
     BUILD AI MEMORY TEXT
  ========================================================== */

  const text =
    selected
      .map(
        item =>
          `- ${item.memory.content}`
      )
      .join("\n");

  /* ==========================================================
     DEBUG
  ========================================================== */

  console.log(
    "\n🧠 INTELLIGENT LTM CONTEXT:"
  );

  selected.forEach(
    (
      item,
      index
    ) => {

      console.log(
        `${index + 1}.`,
        item.relevanceScore,
        "→",
        item.memory.content,
        `(confidence: ${item.memory.confidence})`
      );
    }
  );

  /*
   * Explicitly show suppressed memories that were
   * prevented from entering context.
   */

  const suppressed =
    memories.filter(
      memory =>
        memory.confidence <=
        SUPPRESSED_MEMORY_CONFIDENCE
    );

  if (
    suppressed.length > 0
  ) {

    console.log(
      "🛡️ SUPPRESSED MEMORIES EXCLUDED FROM CONTEXT:"
    );

    suppressed.forEach(
      memory => {

        console.log(
          "🚫",
          memory.confidence,
          "→",
          memory.content
        );
      }
    );
  }

  return {
    memories:
      selected.map(
        item =>
          item.memory
      ),

    text,
  };
}