import {
  getConversationShortTermMemories,
  ShortTermMemory,
} from "./shortTermMemoryService";

import {
  RankedShortTermMemory,
  rankShortTermMemories,
} from "./shortTermMemoryPriority";

/* ============================================================
   NORMALIZE TEXT
   ============================================================ */

function normalizeText(
  text: string
): string {

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   STOP WORDS
   ============================================================ */

const STOP_WORDS = new Set([
  "i",
  "im",
  "i'm",
  "am",
  "is",
  "are",
  "was",
  "were",
  "the",
  "a",
  "an",
  "my",
  "me",
  "to",
  "of",
  "for",
  "and",
  "about",
  "have",
  "has",
  "had",
  "this",
  "that",
  "it",
  "be",
  "been",
  "being",
  "very",
  "little",
  "really",
  "actually",
  "just",
  "today",
  "tomorrow",
  "yesterday",
  "on",
  "in",
  "at",
  "with",
]);

/* ============================================================
   MEANINGFUL WORDS
   ============================================================ */

function getMeaningfulWords(
  text: string
): Set<string> {

  return new Set(
    normalizeText(text)
      .split(" ")
      .filter(
        (word) =>
          word.length > 2 &&
          !STOP_WORDS.has(word)
      )
  );
}

/* ============================================================
   SIMILARITY
   ============================================================ */

function similarityScore(
  a: string,
  b: string
): number {

  const wordsA =
    getMeaningfulWords(a);

  const wordsB =
    getMeaningfulWords(b);

  if (
    wordsA.size === 0 ||
    wordsB.size === 0
  ) {
    return 0;
  }

  let common = 0;

  for (const word of wordsA) {
    if (wordsB.has(word)) {
      common++;
    }
  }

  const total =
    new Set([
      ...wordsA,
      ...wordsB,
    ]).size;

  return total === 0
    ? 0
    : common / total;
}

/* ============================================================
   EXPIRED MEMORY FILTER
   ============================================================ */

function isActiveMemory(
  memory: ShortTermMemory
): boolean {

  if (!memory.expiresAt) {
    return true;
  }

  return (
    new Date(
      memory.expiresAt
    ).getTime() > Date.now()
  );
}

/* ============================================================
   DEDUPLICATE RANKED MEMORIES
   ============================================================ */

function deduplicateRankedMemories(
  memories: RankedShortTermMemory[]
): RankedShortTermMemory[] {

  const result:
    RankedShortTermMemory[] = [];

  /*
   * Memories are already sorted by
   * priority.
   *
   * Therefore, when two memories are
   * similar, the higher-priority one
   * automatically survives.
   */

  for (const item of memories) {

    const duplicate =
      result.some(
        (existing) => {

          if (
            existing.memory.memoryType !==
            item.memory.memoryType
          ) {
            return false;
          }

          return (
            similarityScore(
              existing.memory.content,
              item.memory.content
            ) >= 0.5
          );
        }
      );

    if (!duplicate) {
      result.push(item);
    }
  }

  return result;
}

/* ============================================================
   COMPACT MEMORY CONTENT
   ============================================================ */

function compactMemoryContent(
  content: string
): string {

  return content
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   BUILD CONTEXT
   ============================================================ */

export async function buildShortTermMemoryContext(
  conversationId: string
): Promise<string> {

  const memories =
    await getConversationShortTermMemories(
      conversationId,
      30
    );

  /*
   * Remove expired memories.
   */

  const activeMemories =
    memories.filter(
      isActiveMemory
    );

  if (
    activeMemories.length === 0
  ) {
    return "";
  }

  /* ========================================================
     RANK MEMORIES
     ======================================================== */

  const rankedMemories =
    rankShortTermMemories(
      activeMemories
    );

  /*
   * Higher priority memories now
   * appear first.
   */

  const uniqueMemories =
    deduplicateRankedMemories(
      rankedMemories
    );

  if (
    uniqueMemories.length === 0
  ) {
    return "";
  }

  /* ========================================================
     LIMIT CONTEXT
     ======================================================== */

  /*
   * Keep the context compact.
   *
   * The highest-priority memories
   * survive because ranking happened
   * before this limit.
   */

  const limitedMemories =
    uniqueMemories.slice(0, 15);

  /* ========================================================
     GROUP BY MEMORY TYPE
     ======================================================== */

  const grouped: Record<
    string,
    RankedShortTermMemory[]
  > = {};

  for (
    const item of limitedMemories
  ) {

    const memoryType =
      item.memory.memoryType;

    if (
      !grouped[memoryType]
    ) {
      grouped[memoryType] = [];
    }

    grouped[memoryType].push(
      item
    );
  }

  /* ========================================================
     CATEGORY ORDER
     ======================================================== */

  /*
   * Category order remains stable
   * for readability.
   *
   * Priority determines which
   * memories survive and their
   * importance inside the selection.
   */

  const order = [
    "event",
    "emotion",
    "goal",
    "relationship",
    "preference",
    "topic",
    "context",
    "other",
  ];

  const sections: string[] = [];

  /* ========================================================
     BUILD SECTIONS
     ======================================================== */

  for (
    const memoryType of order
  ) {

    const items =
      grouped[memoryType];

    if (
      !items ||
      items.length === 0
    ) {
      continue;
    }

    sections.push(
      `${memoryType.toUpperCase()}:`
    );

    /*
     * Maximum 5 memories per category.
     */

    const categoryItems =
      items.slice(0, 5);

    for (
      const item of categoryItems
    ) {

      sections.push(
        `- ${compactMemoryContent(
          item.memory.content
        )}`
      );
    }

    sections.push("");
  }

  /* ========================================================
     UNKNOWN TYPES SAFETY
     ======================================================== */

  /*
   * If a future memory type is added
   * but not included in the fixed
   * category order, don't silently
   * lose it.
   */

  const knownTypes =
    new Set(order);

  const unknownTypes =
    Object.keys(grouped)
      .filter(
        (type) =>
          !knownTypes.has(type)
      );

  for (
    const memoryType of unknownTypes
  ) {

    const items =
      grouped[memoryType];

    if (
      !items ||
      items.length === 0
    ) {
      continue;
    }

    sections.push(
      `${memoryType.toUpperCase()}:`
    );

    for (
      const item of items.slice(0, 5)
    ) {

      sections.push(
        `- ${compactMemoryContent(
          item.memory.content
        )}`
      );
    }

    sections.push("");
  }

  if (
    sections.length === 0
  ) {
    return "";
  }

  /* ========================================================
     FINAL CONTEXT
     ======================================================== */

  return [
    "SHORT-TERM MEMORY:",
    ...sections,
  ]
    .join("\n")
    .trim();
}