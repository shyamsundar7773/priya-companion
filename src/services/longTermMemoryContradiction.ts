import { Memory } from "../types/memory";

/* ============================================================
   2.5E-5C
   LONG-TERM MEMORY CONTRADICTION DETECTION
============================================================ */

export type MemoryContradictionResult = {
  memory: Memory;
  contradictionScore: number;
  isContradiction: boolean;
};

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
   KEYWORDS
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
      "i",
      "im",
      "my",
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
   NEGATION DETECTION
============================================================ */

function containsNegation(
  text: string
): boolean {

  const normalized =
    normalizeText(text);

  const negationWords = [
    "not",
    "dont",
    "doesnt",
    "never",
    "no",
    "stop",
    "stopped",
    "quit",
    "quit",
    "hate",
    "dislike",
    "avoid",
    "anymore",
    "no longer",
  ];

  return negationWords.some(
    word =>
      normalized.includes(
        word
      )
  );
}

/* ============================================================
   POSITIVE / NEGATIVE SENTIMENT
============================================================ */

function hasPositiveSignal(
  text: string
): boolean {

  const normalized =
    normalizeText(text);

  const positiveWords = [
    "like",
    "likes",
    "love",
    "loves",
    "enjoy",
    "enjoys",
    "interested",
    "interest",
    "want",
    "wants",
    "prefer",
    "prefers",
    "learn",
    "learning",
    "practice",
    "practicing",
  ];

  return positiveWords.some(
    word =>
      normalized.includes(
        word
      )
  );
}

function hasNegativeSignal(
  text: string
): boolean {

  const normalized =
    normalizeText(text);

  const negativeWords = [
    "dont",
    "doesnt",
    "never",
    "hate",
    "hates",
    "dislike",
    "dislikes",
    "avoid",
    "stopped",
    "stop",
    "quit",
    "quit",
      "anymore",
  ];

  return negativeWords.some(
    word =>
      normalized.includes(
        word
      )
  );
}

/* ============================================================
   KEYWORD OVERLAP
============================================================ */

function calculateKeywordOverlap(
  memory: Memory,
  userMessage: string
): number {

  const memoryKeywords =
    new Set(
      getKeywords(
        memory.content
      )
    );

  const messageKeywords =
    getKeywords(
      userMessage
    );

  if (
    memoryKeywords.size === 0 ||
    messageKeywords.length === 0
  ) {
    return 0;
  }

  const uniqueMessageKeywords =
    [
      ...new Set(
        messageKeywords
      ),
    ];

  const matching =
    uniqueMessageKeywords.filter(
      word =>
        memoryKeywords.has(
          word
        )
    );

  return clamp(
    matching.length /
      uniqueMessageKeywords.length
  );
}

/* ============================================================
   CONTRADICTION SCORE
============================================================ */

export function calculateMemoryContradictionScore(
  memory: Memory,
  userMessage: string
): number {

  if (
    !userMessage.trim()
  ) {
    return 0;
  }

  const overlap =
    calculateKeywordOverlap(
      memory,
      userMessage
    );

  if (overlap <= 0) {
    return 0;
  }

  const memoryPositive =
    hasPositiveSignal(
      memory.content
    );

  const memoryNegative =
    hasNegativeSignal(
      memory.content
    );

  const messagePositive =
    hasPositiveSignal(
      userMessage
    );

  const messageNegative =
    hasNegativeSignal(
      userMessage
    );

  let score = 0;

  /*
   * Positive memory + negative
   * user statement = contradiction.
   */

  if (
    memoryPositive &&
    messageNegative
  ) {
    score += 0.70;
  }

  /*
   * Negative memory + positive
   * user statement = contradiction.
   */

  if (
    memoryNegative &&
    messagePositive
  ) {
    score += 0.70;
  }

  /*
   * Explicit negation increases
   * contradiction confidence.
   */

  if (
    containsNegation(
      userMessage
    )
  ) {
    score += 0.20;
  }

  /*
   * Keyword overlap provides
   * topic confidence.
   */

  score +=
    overlap * 0.10;

  return Number(
    clamp(score).toFixed(4)
  );
}

/* ============================================================
   DETECT CONTRADICTION
============================================================ */

export function detectMemoryContradiction(
  memory: Memory,
  userMessage: string
): MemoryContradictionResult {

  const contradictionScore =
    calculateMemoryContradictionScore(
      memory,
      userMessage
    );

  return {
    memory,
    contradictionScore,
    isContradiction:
      contradictionScore >= 0.60,
  };
}

/* ============================================================
   DETECT AGAINST MULTIPLE MEMORIES
============================================================ */

export function detectMemoryContradictions(
  memories: Memory[],
  userMessage: string
): MemoryContradictionResult[] {

  return memories
    .map(
      memory =>
        detectMemoryContradiction(
          memory,
          userMessage
        )
    )
    .filter(
      result =>
        result.isContradiction
    )
    .sort(
      (a, b) =>
        b.contradictionScore -
        a.contradictionScore
    );
}

/* ============================================================
   TEST
============================================================ */

export function testLongTermMemoryContradiction(): void {

  console.log(
    "\n🧪 LTM CONTRADICTION DETECTION TEST"
  );

  const sqlMemory: Memory = {
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
      0.9,
    createdAt:
      Date.now(),
  };

  const contradictionMessage =
    "I don't want to work with SQL anymore";

  const matchingMessage =
    "I really enjoy practicing SQL";

  const unrelatedMessage =
    "I had biryani for lunch";

  /* ==========================================================
     CONTRADICTION
  ========================================================== */

  const contradiction =
    detectMemoryContradiction(
      sqlMemory,
      contradictionMessage
    );

  console.log(
    "Contradiction score:",
    contradiction.contradictionScore
  );

  console.log(
    "Is contradiction:",
    contradiction.isContradiction
  );

  if (
    !contradiction.isContradiction
  ) {
    throw new Error(
      "❌ Contradictory SQL statement was not detected"
    );
  }

  /* ==========================================================
     NORMAL MATCH
  ========================================================== */

  const normal =
    detectMemoryContradiction(
      sqlMemory,
      matchingMessage
    );

  console.log(
    "Normal statement score:",
    normal.contradictionScore
  );

  if (
    normal.isContradiction
  ) {
    throw new Error(
      "❌ Positive SQL statement incorrectly detected as contradiction"
    );
  }

  /* ==========================================================
     UNRELATED
  ========================================================== */

  const unrelated =
    detectMemoryContradiction(
      sqlMemory,
      unrelatedMessage
    );

  console.log(
    "Unrelated statement score:",
    unrelated.contradictionScore
  );

  if (
    unrelated.isContradiction
  ) {
    throw new Error(
      "❌ Unrelated statement incorrectly detected as contradiction"
    );
  }

  /* ==========================================================
     MULTIPLE MEMORY TEST
  ========================================================== */

  const memories: Memory[] = [
    sqlMemory,

    {
      id:
        "biryani",
      characterId:
        "test-character",
      type:
        "preference",
      content:
        "User likes biryani",
      importance:
        0.8,
      confidence:
        0.9,
      createdAt:
        Date.now(),
    },
  ];

  const results =
    detectMemoryContradictions(
      memories,
      contradictionMessage
    );

  if (
    results.length !== 1
  ) {
    throw new Error(
      "❌ Expected exactly one contradiction"
    );
  }

  if (
    results[0].memory.id !==
    "sql-interest"
  ) {
    throw new Error(
      "❌ Wrong memory identified as contradictory"
    );
  }

  console.log(
    "✅ LTM CONTRADICTION DETECTION TEST PASSED"
  );
}