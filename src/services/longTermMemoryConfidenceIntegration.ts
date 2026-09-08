import {
  getCharacterMemories,
  updateMemory,
} from "./memoryService";

import {
  calculateMemoryConfidenceUpdate,
} from "./longTermMemoryConfidenceUpdate";

import { Memory } from "../types/memory";

/* ============================================================
   2.5E
   LTM CONFIDENCE AI INTEGRATION
============================================================ */

/*
  ARCHITECTURAL RULE:

  Contradiction handling belongs to:

      longTermMemoryContradictionResolution.ts

  This service handles:

      1. Relevant memory reinforcement
      2. Confidence increases
      3. Normal confidence maintenance

  It must NEVER resurrect a memory that has already
  been suppressed by contradiction resolution.
*/

/* ============================================================
   SUPPRESSION THRESHOLD
============================================================ */

/*
 * A memory at or below this confidence is considered
 * suppressed/superseded.
 *
 * Contradiction resolution may later explicitly reinstate it.
 *
 * Confidence integration must NOT do that automatically.
 */

const SUPPRESSED_MEMORY_CONFIDENCE = 0.20;

/* ============================================================
   RELEVANCE THRESHOLD
============================================================ */

const MIN_RELEVANCE_FOR_UPDATE = 0.30;

/* ============================================================
   STOP WORDS
============================================================ */

const STOP_WORDS = new Set([
  "the",
  "and",
  "you",
  "your",
  "are",
  "was",
  "were",
  "this",
  "that",
  "with",
  "for",
  "from",
  "have",
  "has",
  "had",
  "but",
  "not",
  "what",
  "when",
  "where",
  "who",
  "how",
  "why",
  "can",
  "could",
  "would",
  "should",
  "will",
  "just",
  "really",
  "very",
  "today",
  "tomorrow",
  "yesterday",
  "hey",
  "hi",
  "hello",
]);

/* ============================================================
   NORMALIZATION
============================================================ */

function normalize(
  text: string
): string {

  return text
    .toLowerCase()
    .replace(
      /[^a-z0-9\s']/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   QUESTION DETECTION
============================================================ */

/*
 * Confidence integration should also ignore pure questions.
 *
 * Example:
 *
 * "What am I planning to work on?"
 *
 * is asking the system to retrieve memory.
 *
 * It is NOT new evidence that should reinforce
 * the memory merely because the question contains
 * topic words.
 */

function isQuestion(
  text: string
): boolean {

  const normalized =
    normalize(text);

  if (!normalized) {
    return false;
  }

  if (text.includes("?")) {
    return true;
  }

  const questionPatterns = [

    /^what\b/,
    /^why\b/,
    /^when\b/,
    /^where\b/,
    /^who\b/,
    /^how\b/,
    /^which\b/,
    /^whose\b/,

    /^what am i\b/,
    /^what do i\b/,
    /^what did i\b/,
    /^what was i\b/,
    /^what have i\b/,

    /^do i\b/,
    /^did i\b/,
    /^am i\b/,
    /^was i\b/,
    /^have i\b/,
    /^will i\b/,

    /^can i\b/,
    /^should i\b/,
    /^would i\b/,
    /^could i\b/,
  ];

  return questionPatterns.some(
    pattern =>
      pattern.test(normalized)
  );
}

/* ============================================================
   KEYWORDS
============================================================ */

function getKeywords(
  text: string
): string[] {

  return [
    ...new Set(
      normalize(text)
        .replace(
          /'/g,
          ""
        )
        .split(/\s+/)
        .filter(
          word =>
            word.length >= 3 &&
            !STOP_WORDS.has(word)
        )
    ),
  ];
}

/* ============================================================
   CHANGE / NEGATION DETECTION
============================================================ */

/*
  These signals indicate that the user is changing
  an existing preference or goal.

  Contradiction resolution owns these situations.

  Confidence integration must therefore NOT apply
  another confidence change.
*/

const NEGATION_PATTERNS = [
  /\bno longer\b/,
  /\bnot anymore\b/,
  /\bdon't want\b/,
  /\bdo not want\b/,
  /\bdont want\b/,
  /\bdon't like\b/,
  /\bdo not like\b/,
  /\bdont like\b/,
  /\bstopped\b/,
  /\bstop\b/,
  /\bgave up\b/,
  /\bgiving up\b/,
  /\bquit\b/,
  /\bquitting\b/,
  /\bchanged my mind\b/,
  /\bchanged my goal\b/,
  /\bnot interested\b/,
  /\bno interest\b/,
  /\bnever again\b/,
  /\bwon't\b/,
  /\bwill not\b/,
];

/* ============================================================
   CHANGE SIGNAL
============================================================ */

function hasContradictionSignal(
  text: string
): boolean {

  const normalized =
    normalize(text);

  return NEGATION_PATTERNS.some(
    pattern =>
      pattern.test(normalized)
  );
}

/* ============================================================
   RELEVANCE
============================================================ */

function calculateMemoryRelevance(
  memory: Memory,
  userMessage: string
): number {

  const messageKeywords =
    [
      ...new Set(
        getKeywords(
          userMessage
        )
      ),
    ];

  const memoryKeywords =
    [
      ...new Set(
        getKeywords(
          memory.content
        )
      ),
    ];

  if (
    messageKeywords.length === 0 ||
    memoryKeywords.length === 0
  ) {
    return 0;
  }

  const matches =
    messageKeywords.filter(
      word =>
        memoryKeywords.includes(
          word
        )
    );

  return Math.min(
    1,
    matches.length /
      messageKeywords.length
  );
}

/* ============================================================
   UPDATE ONE MEMORY
============================================================ */

export async function updateRelevantMemoryConfidence(
  memory: Memory,
  userMessage: string
): Promise<Memory | null> {

  /* ==========================================================
     QUESTION PROTECTION
  ========================================================== */

  if (isQuestion(userMessage)) {

    console.log(
      "🧠 LTM CONFIDENCE SKIPPED:",
      "question / recall request",
      userMessage
    );

    return null;
  }

  /* ==========================================================
     SUPPRESSED MEMORY PROTECTION
  ========================================================== */

  /*
   * THIS IS THE CRITICAL FIX.
   *
   * If contradiction resolution has already reduced a memory
   * to <= 0.20, confidence integration must NOT increase it.
   *
   * Only the dedicated contradiction resolver can explicitly
   * reinstate that memory.
   */

  if (
    memory.confidence <=
    SUPPRESSED_MEMORY_CONFIDENCE
  ) {

    console.log(
      "🛡️ LTM CONFIDENCE PROTECTED:",
      {
        memory:
          memory.content,

        confidence:
          memory.confidence,

        reason:
          "memory is suppressed/superseded",
      }
    );

    return null;
  }

  /* ==========================================================
     SELF / DUPLICATE PROTECTION
  ========================================================== */

  const normalizedMemory =
    normalize(
      memory.content
    );

  const normalizedMessage =
    normalize(
      userMessage
    );

  /*
    If the current message is the same information
    as the memory, it is reinforcement.

    It must NEVER be treated as contradiction.
  */

  const isSameMemory =
    normalizedMemory ===
    normalizedMessage;

  /* ==========================================================
     RELEVANCE
  ========================================================== */

  const relevance =
    calculateMemoryRelevance(
      memory,
      userMessage
    );

  if (
    relevance <
    MIN_RELEVANCE_FOR_UPDATE
  ) {
    return null;
  }

  /* ==========================================================
     CONTRADICTION OWNERSHIP
  ========================================================== */

  /*
    If this is a change/negation message, the dedicated
    contradiction-resolution service has already handled
    contradictory memories.

    Therefore:

      DO NOT apply another contradiction decrease here.

    Identical memory is still allowed to receive
    normal reinforcement.
  */

  if (
    hasContradictionSignal(
      userMessage
    ) &&
    !isSameMemory
  ) {

    console.log(
      "🧠 LTM CONFIDENCE:",
      "contradiction handled by resolution service",
      memory.content
    );

    return null;
  }

  /* ==========================================================
     CONFIDENCE CALCULATION
  ========================================================== */

  const update =
    calculateMemoryConfidenceUpdate(
      memory,
      userMessage
    );

  /*
    This service only applies reinforcement.

    If the confidence calculator says the memory
    was contradicted, contradiction resolution owns it.
  */

  if (
    update.reason !== "reinforced" ||
    update.change <= 0
  ) {
    return null;
  }

  /* ==========================================================
     PERSIST
  ========================================================== */

  await updateMemory(
    memory.id,
    {
      confidence:
        update.newConfidence,

      lastUsedAt:
        Date.now(),
    }
  );

  console.log(
    "🧠 LTM CONFIDENCE REINFORCED:",
    {
      memory:
        memory.content,

      relevance,

      previousConfidence:
        update.previousConfidence,

      newConfidence:
        update.newConfidence,

      change:
        update.change,

      reason:
        update.reason,
    }
  );

  return {
    ...memory,

    confidence:
      update.newConfidence,

    lastUsedAt:
      Date.now(),
  };
}

/* ============================================================
   UPDATE ALL RELEVANT MEMORIES
============================================================ */

export async function updateRelevantLongTermMemoryConfidences(
  characterId: string,
  userMessage: string
): Promise<Memory[]> {

  if (isQuestion(userMessage)) {

    console.log(
      "🛡️ LTM CONFIDENCE INTEGRATION SKIPPED:",
      "question / recall request"
    );

    return [];
  }

  const memories =
    await getCharacterMemories(
      characterId
    );

  if (
    memories.length === 0
  ) {
    return [];
  }

  const updatedMemories:
    Memory[] = [];

  for (
    const memory of memories
  ) {

    const updated =
      await updateRelevantMemoryConfidence(
        memory,
        userMessage
      );

    if (updated) {
      updatedMemories.push(
        updated
      );
    }
  }

  console.log(
    "🧠 LTM CONFIDENCE INTEGRATION:",
    updatedMemories.length,
    "memories reinforced"
  );

  return updatedMemories;
}

/* ============================================================
   TEST
============================================================ */

export async function testLongTermMemoryConfidenceIntegration(
  characterId: string
): Promise<void> {

  console.log(
    "\n🧪 LTM CONFIDENCE INTEGRATION TEST"
  );

  const memories =
    await getCharacterMemories(
      characterId
    );

  if (
    memories.length === 0
  ) {

    console.log(
      "⚠️ No LTM memories available for test"
    );

    return;
  }

  const testMessage =
    "I am practicing SQL joins";

  const updated =
    await updateRelevantLongTermMemoryConfidences(
      characterId,
      testMessage
    );

  console.log(
    "Updated memories:",
    updated
  );

  console.log(
    "✅ LTM CONFIDENCE INTEGRATION TEST COMPLETED"
  );
}