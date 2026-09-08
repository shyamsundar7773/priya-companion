import {
    Memory,
} from "../types/memory";

/* ============================================================
   2.5E-5B
   LONG-TERM MEMORY CONFIDENCE REINFORCEMENT
============================================================ */

const MAX_CONFIDENCE = 1.0;

const MIN_REINFORCEMENT = 0.02;
const MAX_REINFORCEMENT = 0.10;

/* ============================================================
   CLAMP
============================================================ */

function clamp(
  value: number,
  min = 0,
  max = 1
): number {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

/* ============================================================
   TEXT NORMALIZATION
============================================================ */

function normalizeText(
  text: string
): string {
  return text
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   KEYWORD EXTRACTION
============================================================ */

function getKeywords(
  text: string
): string[] {

  const stopWords =
    new Set([
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

  return normalizeText(text)
    .split(/\s+/)
    .filter(
      word =>
        word.length >= 3 &&
        !stopWords.has(word)
    );
}

/* ============================================================
   REINFORCEMENT SIGNAL
============================================================ */

export function calculateMemoryReinforcement(
  memory: Memory,
  userMessage: string
): number {

  if (
    !userMessage.trim()
  ) {
    return 0;
  }

  const memoryKeywords =
    new Set(
      getKeywords(
        memory.content
      )
    );

  const messageKeywords =
    [
      ...new Set(
        getKeywords(
          userMessage
        )
      ),
    ];

  if (
    memoryKeywords.size === 0 ||
    messageKeywords.length === 0
  ) {
    return 0;
  }

  const matchingKeywords =
    messageKeywords.filter(
      word =>
        memoryKeywords.has(
          word
        )
    );

  if (
    matchingKeywords.length === 0
  ) {
    return 0;
  }

  const similarity =
    matchingKeywords.length /
    messageKeywords.length;

  /*
   * Stronger similarity →
   * stronger reinforcement.
   */

  const reinforcement =
    MIN_REINFORCEMENT +
    similarity *
      (
        MAX_REINFORCEMENT -
        MIN_REINFORCEMENT
      );

  return Number(
    clamp(
      reinforcement,
      MIN_REINFORCEMENT,
      MAX_REINFORCEMENT
    ).toFixed(4)
  );
}

/* ============================================================
   CALCULATE REINFORCED CONFIDENCE
============================================================ */

export function calculateReinforcedConfidence(
  memory: Memory,
  userMessage: string
): number {

  const reinforcement =
    calculateMemoryReinforcement(
      memory,
      userMessage
    );

  if (
    reinforcement <= 0
  ) {
    return Number(
      clamp(
        memory.confidence
      ).toFixed(4)
    );
  }

  const newConfidence =
    clamp(
      memory.confidence +
        reinforcement,
      0,
      MAX_CONFIDENCE
    );

  return Number(
    newConfidence.toFixed(4)
  );
}

/* ============================================================
   REINFORCE MEMORY
============================================================ */

export function reinforceMemory(
  memory: Memory,
  userMessage: string
): Memory {

  const newConfidence =
    calculateReinforcedConfidence(
      memory,
      userMessage
    );

  if (
    newConfidence ===
    memory.confidence
  ) {
    return memory;
  }

  return {
    ...memory,
    confidence:
      newConfidence,
  };
}

/* ============================================================
   REINFORCE MULTIPLE MEMORIES
============================================================ */

export function reinforceMemories(
  memories: Memory[],
  userMessage: string
): Memory[] {

  return memories.map(
    memory =>
      reinforceMemory(
        memory,
        userMessage
      )
  );
}

/* ============================================================
   TEST
============================================================ */

export function testLongTermMemoryReinforcement(): void {

  console.log(
    "\n🧪 LTM CONFIDENCE REINFORCEMENT TEST"
  );

  const memory: Memory = {
    id:
      "sql-interest",
    characterId:
      "test-character",
    type:
      "interest",
    content:
      "User is interested in SQL",
    importance:
      0.8,
    confidence:
      0.7,
    createdAt:
      Date.now(),
  };

  const matchingMessage =
    "I really enjoy practicing SQL";

  const unrelatedMessage =
    "I had biryani for lunch";

  /* ==========================================================
     MATCHING MESSAGE
  ========================================================== */

  const reinforcement =
    calculateMemoryReinforcement(
      memory,
      matchingMessage
    );

  console.log(
    "Reinforcement:",
    reinforcement
  );

  if (
    reinforcement <= 0
  ) {
    throw new Error(
      "❌ Matching message should reinforce memory"
    );
  }

  if (
    reinforcement >
    MAX_REINFORCEMENT
  ) {
    throw new Error(
      "❌ Reinforcement exceeded maximum"
    );
  }

  /* ==========================================================
     CONFIDENCE INCREASE
  ========================================================== */

  const reinforced =
    reinforceMemory(
      memory,
      matchingMessage
    );

  console.log(
    "Original confidence:",
    memory.confidence
  );

  console.log(
    "Reinforced confidence:",
    reinforced.confidence
  );

  if (
    reinforced.confidence <=
    memory.confidence
  ) {
    throw new Error(
      "❌ Matching message should increase confidence"
    );
  }

  /* ==========================================================
     UNRELATED MESSAGE
  ========================================================== */

  const unchanged =
    reinforceMemory(
      memory,
      unrelatedMessage
    );

  console.log(
    "Unrelated confidence:",
    unchanged.confidence
  );

  if (
    unchanged.confidence !==
    memory.confidence
  ) {
    throw new Error(
      "❌ Unrelated message should not reinforce memory"
    );
  }

  /* ==========================================================
     MAXIMUM CONFIDENCE
  ========================================================== */

  const almostCertain: Memory = {
    ...memory,
    confidence:
      0.98,
  };

  const capped =
    reinforceMemory(
      almostCertain,
      matchingMessage
    );

  console.log(
    "Capped confidence:",
    capped.confidence
  );

  if (
    capped.confidence >
    MAX_CONFIDENCE
  ) {
    throw new Error(
      "❌ Confidence exceeded maximum"
    );
  }

  console.log(
    "✅ LTM CONFIDENCE REINFORCEMENT TEST PASSED"
  );
}