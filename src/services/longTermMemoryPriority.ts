import {
  applyLongTermMemoryRecencyBoost,
} from "./longTermMemoryRecency";

import {
  applyRelatedMemoryBoost,
} from "./relatedLongTermMemory";

import { Memory } from "../types/memory";

/* ============================================================
   LONG-TERM MEMORY PRIORITY
   ============================================================ */

export type RankedLongTermMemory = {
  memory: Memory;
  relevanceScore: number;
};

/* ============================================================
   MEMORY TYPE WEIGHTS
   ============================================================ */

const MEMORY_TYPE_WEIGHTS: Record<Memory["type"], number> = {
  goal: 1.0,
  preference: 0.9,
  relationship: 0.85,
  interest: 0.8,
  habit: 0.75,
  context: 0.65,
  fact: 0.6,
};

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
  "actually",
  "anymore",
  "today",
  "tomorrow",
  "yesterday",
  "hey",
  "hi",
  "hello",
]);

/* ============================================================
   HELPERS
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

function getKeywords(
  text: string
): string[] {

  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 3 &&
            !STOP_WORDS.has(word)
        )
    ),
  ];
}

/* ============================================================
   CURRENT INTENT
   ============================================================ */

const GENERIC_INTENT_WORDS = new Set([
  "want",
  "wants",
  "wanted",
  "work",
  "working",
  "worked",
  "become",
  "becoming",
  "became",
  "goal",
  "goals",
  "interested",
  "interest",
  "preparing",
  "prepare",
  "prepared",
  "practicing",
  "practice",
  "practiced",
  "learning",
  "learn",
  "learned",
  "studying",
  "study",
  "studied",
  "focusing",
  "focus",
  "focused",
  "planning",
  "plan",
  "planned",
  "pursuing",
  "pursue",
  "pursued",
  "applying",
  "apply",
  "applied",
  "interview",
  "interviews",
  "technical",
  "career",
  "role",
  "job",
]);

/* ============================================================
   POLARITY PATTERNS
   ============================================================ */

const NEGATIVE_INTENT_PATTERNS = [
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
  /\bleft\b/,
  /\bleaving\b/,
  /\bnot interested\b/,
  /\bno interest\b/,
  /\bnever again\b/,
  /\bnot pursuing\b/,
  /\bnot pursuing anymore\b/,
  /\bstopped pursuing\b/,
  /\bstopped learning\b/,
  /\bstopped studying\b/,
  /\bstopped practicing\b/,
  /\bdon't want to become\b/,
  /\bdo not want to become\b/,
  /\bdont want to become\b/,
  /\bdon't want to work\b/,
  /\bdo not want to work\b/,
  /\bdont want to work\b/,
];

const POSITIVE_INTENT_PATTERNS = [
  /\bi want\b/,
  /\bi like\b/,
  /\bi love\b/,
  /\bi am interested\b/,
  /\bi'm interested\b/,
  /\bmy goal is\b/,
  /\bi plan to\b/,
  /\bi'm planning\b/,
  /\bi am planning\b/,
  /\bi want to become\b/,
  /\bi want to work\b/,
  /\bi enjoy\b/,
  /\bi prefer\b/,

  /\bi am preparing\b/,
  /\bi'm preparing\b/,
  /\bi am practicing\b/,
  /\bi'm practicing\b/,
  /\bi am working on\b/,
  /\bi'm working on\b/,
  /\bi am learning\b/,
  /\bi'm learning\b/,
  /\bi am studying\b/,
  /\bi'm studying\b/,
  /\bi have been learning\b/,
  /\bi've been learning\b/,
  /\bi have been practicing\b/,
  /\bi've been practicing\b/,
  /\bi have been studying\b/,
  /\bi've been studying\b/,
  /\bi am focusing on\b/,
  /\bi'm focusing on\b/,
  /\bi am pursuing\b/,
  /\bi'm pursuing\b/,
  /\bi am applying\b/,
  /\bi'm applying\b/,
  /\bi have an interview\b/,
  /\bi'm preparing for\b/,
  /\bi am preparing for\b/,
];

type IntentPolarity =
  | "positive"
  | "negative"
  | "neutral";

/* ============================================================
   POLARITY HELPERS
   ============================================================ */

function hasNegativeIntent(
  text: string
): boolean {

  const normalized =
    text.toLowerCase();

  return NEGATIVE_INTENT_PATTERNS.some(
    (pattern) =>
      pattern.test(normalized)
  );
}

function hasPositiveIntent(
  text: string
): boolean {

  const normalized =
    text.toLowerCase();

  return POSITIVE_INTENT_PATTERNS.some(
    (pattern) =>
      pattern.test(normalized)
  );
}

function getIntentPolarity(
  text: string
): IntentPolarity {

  const positive =
    hasPositiveIntent(text);

  const negative =
    hasNegativeIntent(text);

  if (
    positive &&
    !negative
  ) {
    return "positive";
  }

  if (
    negative &&
    !positive
  ) {
    return "negative";
  }

  return "neutral";
}

/* ============================================================
   TOPIC KEYWORDS
   ============================================================ */

function getTopicKeywords(
  text: string
): string[] {

  return [
    ...new Set(
      getKeywords(text).filter(
        (word) =>
          !GENERIC_INTENT_WORDS.has(word)
      )
    ),
  ];
}

/* ============================================================
   CURRENT INTENT TOPIC OVERLAP
   ============================================================ */

function calculateCurrentIntentTopicOverlap(
  currentMessage: string,
  memoryContent: string
): number {

  const currentTopics =
    getTopicKeywords(
      currentMessage
    );

  const memoryTopics =
    getTopicKeywords(
      memoryContent
    );

  if (
    currentTopics.length === 0 ||
    memoryTopics.length === 0
  ) {
    return 0;
  }

  const matches =
    currentTopics.filter(
      (word) =>
        memoryTopics.includes(word)
    );

  if (matches.length === 0) {
    return 0;
  }

  return clamp(
    matches.length /
      Math.max(
        1,
        Math.min(
          currentTopics.length,
          memoryTopics.length
        )
      )
  );
}

/* ============================================================
   CURRENT INTENT MEMORY SUPPRESSION
   ============================================================ */

/**
 * CURRENT INTENT RULE:
 *
 * CURRENT NEGATIVE → suppress OLD POSITIVE
 *
 * CURRENT POSITIVE → suppress OLD NEGATIVE
 *
 * SAME POLARITY → keep
 *
 * NEUTRAL → keep
 *
 * UNRELATED TOPIC → keep
 */
function shouldSuppressMemoryForCurrentIntent(
  userMessage: string,
  memory: Memory
): boolean {

  const currentPolarity =
    getIntentPolarity(
      userMessage
    );

  const memoryPolarity =
    getIntentPolarity(
      memory.content
    );

  /*
   * Ambiguous current intent:
   * don't suppress anything.
   */
  if (
    currentPolarity === "neutral"
  ) {
    return false;
  }

  /*
   * Ambiguous memory:
   * don't assume conflict.
   */
  if (
    memoryPolarity === "neutral"
  ) {
    return false;
  }

  /*
   * SAME POLARITY = COMPATIBLE
   */
  if (
    currentPolarity ===
    memoryPolarity
  ) {
    return false;
  }

  /*
   * Opposite polarity requires topic overlap.
   */
  const topicOverlap =
    calculateCurrentIntentTopicOverlap(
      userMessage,
      memory.content
    );

  if (
    topicOverlap < 0.40
  ) {
    return false;
  }

  /*
   * Opposite polarity + same topic
   * = suppress.
   */
  return true;
}

/* ============================================================
   KEYWORD RELEVANCE
   ============================================================ */

function calculateKeywordRelevance(
  userMessage: string,
  memoryContent: string
): number {

  const messageKeywords =
    getKeywords(userMessage);

  const memoryKeywords =
    getKeywords(memoryContent);

  if (
    messageKeywords.length === 0 ||
    memoryKeywords.length === 0
  ) {
    return 0;
  }

  const uniqueMessageKeywords =
    [...new Set(messageKeywords)];

  const matchingKeywords =
    uniqueMessageKeywords.filter(
      (word) =>
        memoryKeywords.includes(word)
    );

  if (
    matchingKeywords.length === 0
  ) {
    return 0;
  }

  return clamp(
    matchingKeywords.length /
      uniqueMessageKeywords.length
  );
}

/* ============================================================
   RECENCY
   ============================================================ */

function calculateRecencyScore(
  memory: Memory
): number {

  if (!memory.lastUsedAt) {
    return 0.5;
  }

  const ageMs =
    Date.now() -
    memory.lastUsedAt;

  if (ageMs < 0) {
    return 1;
  }

  const ageDays =
    ageMs /
    (24 * 60 * 60 * 1000);

  return clamp(
    Math.exp(-ageDays / 14)
  );
}

/* ============================================================
   TYPE RELEVANCE
   ============================================================ */

function calculateTypeWeight(
  memory: Memory
): number {

  return (
    MEMORY_TYPE_WEIGHTS[
      memory.type
    ] ?? 0.5
  );
}

/* ============================================================
   CONTEXT SIGNALS
   ============================================================ */

function calculateContextSignal(
  userMessage: string,
  memory: Memory
): number {

  const message =
    userMessage.toLowerCase();

  const content =
    memory.content.toLowerCase();

  let signal = 0;

  const careerWords = [
    "career",
    "job",
    "work",
    "interview",
    "developer",
    "developer role",
    "company",
    "resume",
    "recruitment",
    "hiring",
  ];

  const memoryCareer =
    careerWords.some(
      (word) =>
        content.includes(word)
    );

  const messageCareer =
    careerWords.some(
      (word) =>
        message.includes(word)
    );

  if (
    memoryCareer &&
    messageCareer
  ) {
    signal += 0.35;
  }

  const learningWords = [
    "learn",
    "learning",
    "practice",
    "studying",
    "study",
    "exam",
    "course",
    "coding",
    "programming",
    "sql",
    "python",
    "data",
  ];

  const memoryLearning =
    learningWords.some(
      (word) =>
        content.includes(word)
    );

  const messageLearning =
    learningWords.some(
      (word) =>
        message.includes(word)
    );

  if (
    memoryLearning &&
    messageLearning
  ) {
    signal += 0.35;
  }

  const emotionWords = [
    "nervous",
    "sad",
    "happy",
    "angry",
    "worried",
    "stress",
    "stressed",
    "excited",
    "tired",
    "lonely",
    "anxious",
  ];

  const memoryEmotion =
    emotionWords.some(
      (word) =>
        content.includes(word)
    );

  const messageEmotion =
    emotionWords.some(
      (word) =>
        message.includes(word)
    );

  if (
    memoryEmotion &&
    messageEmotion
  ) {
    signal += 0.30;
  }

  return clamp(signal);
}

/* ============================================================
   CONCEPT GROUPS
   ============================================================ */

type ConceptGroup = {
  name: string;
  keywords: string[];
};

const CONCEPT_GROUPS: ConceptGroup[] = [
  {
    name: "career",
    keywords: [
      "career",
      "job",
      "work",
      "interview",
      "developer",
      "role",
      "company",
      "resume",
      "recruitment",
      "hiring",
      "employment",
      "professional",
    ],
  },

  {
    name: "learning",
    keywords: [
      "learn",
      "learning",
      "study",
      "studying",
      "practice",
      "exam",
      "course",
      "coding",
      "programming",
      "sql",
      "python",
      "data",
      "developer",
    ],
  },

  {
    name: "food",
    keywords: [
      "food",
      "eat",
      "eating",
      "ate",
      "meal",
      "lunch",
      "dinner",
      "breakfast",
      "biryani",
      "chicken",
      "rice",
      "parotta",
      "pongal",
    ],
  },

  {
    name: "emotion",
    keywords: [
      "nervous",
      "worried",
      "worry",
      "anxious",
      "anxiety",
      "stress",
      "stressed",
      "sad",
      "happy",
      "angry",
      "excited",
      "lonely",
      "tired",
    ],
  },

  {
    name: "technology",
    keywords: [
      "sql",
      "python",
      "javascript",
      "typescript",
      "react",
      "reactnative",
      "expo",
      "coding",
      "programming",
      "database",
      "software",
      "developer",
    ],
  },
];

/* ============================================================
   GET CONCEPT GROUPS
   ============================================================ */

function getMatchingConceptGroups(
  text: string
): string[] {

  const normalized =
    text.toLowerCase();

  return CONCEPT_GROUPS
    .filter((group) =>
      group.keywords.some(
        (keyword) =>
          normalized.includes(keyword)
      )
    )
    .map(
      (group) =>
        group.name
    );
}

/* ============================================================
   CONCEPT RELEVANCE
   ============================================================ */

function calculateConceptRelevance(
  userMessage: string,
  memory: Memory
): number {

  const messageConcepts =
    getMatchingConceptGroups(
      userMessage
    );

  const memoryConcepts =
    getMatchingConceptGroups(
      memory.content
    );

  if (
    messageConcepts.length === 0 ||
    memoryConcepts.length === 0
  ) {
    return 0;
  }

  const matchingConcepts =
    messageConcepts.filter(
      (concept) =>
        memoryConcepts.includes(
          concept
        )
    );

  if (
    matchingConcepts.length === 0
  ) {
    return 0;
  }

  return clamp(
    matchingConcepts.length /
      Math.max(
        messageConcepts.length,
        memoryConcepts.length
      )
  );
}

/* ============================================================
   MAIN PRIORITY SCORE
   ============================================================ */

export function calculateLongTermMemoryPriority(
  memory: Memory,
  userMessage: string
): number {

  /* ----------------------------------------------------------
     CURRENT INTENT OVERRIDE
     ---------------------------------------------------------- */

  if (
    shouldSuppressMemoryForCurrentIntent(
      userMessage,
      memory
    )
  ) {

    console.log(
      "🧠 LTM CURRENT INTENT SUPPRESSION:",
      {
        currentMessage:
          userMessage,

        currentPolarity:
          getIntentPolarity(
            userMessage
          ),

        suppressedMemory:
          memory.content,

        memoryPolarity:
          getIntentPolarity(
            memory.content
          ),
      }
    );

    return 0;
  }

  const keywordRelevance =
    calculateKeywordRelevance(
      userMessage,
      memory.content
    );

  const contextSignal =
    calculateContextSignal(
      userMessage,
      memory
    );

  const conceptRelevance =
    calculateConceptRelevance(
      userMessage,
      memory
    );

  if (
    keywordRelevance <= 0 &&
    contextSignal <= 0 &&
    conceptRelevance <= 0
  ) {
    return 0;
  }

  const importance =
    clamp(memory.importance);

  const confidence =
    clamp(memory.confidence);

  const recency =
    calculateRecencyScore(memory);

  const typeWeight =
    calculateTypeWeight(memory);

  const score =
    keywordRelevance * 0.30 +
    importance * 0.20 +
    confidence * 0.15 +
    recency * 0.10 +
    typeWeight * 0.10 +
    contextSignal * 0.10 +
    conceptRelevance * 0.05;

  return Number(
    clamp(score).toFixed(4)
  );
}

/* ============================================================
   RANK MEMORIES
   ============================================================ */

export function rankLongTermMemories(
  memories: Memory[],
  userMessage: string
): RankedLongTermMemory[] {

  const ranked =
    memories
      .map((memory) => ({
        memory,
        relevanceScore:
          calculateLongTermMemoryPriority(
            memory,
            userMessage
          ),
      }))
      .filter(
        (item) =>
          item.relevanceScore > 0
      )
      .sort(
        (a, b) =>
          b.relevanceScore -
          a.relevanceScore
      );

  const relatedBoosted =
    applyRelatedMemoryBoost(
      ranked
    );

  const recencyBoosted =
    applyLongTermMemoryRecencyBoost(
      relatedBoosted
    );

  return recencyBoosted;
}

/* ============================================================
   TOP MEMORIES
   ============================================================ */

export function getTopLongTermMemories(
  memories: Memory[],
  userMessage: string,
  limit = 8
): RankedLongTermMemory[] {

  const ranked =
    rankLongTermMemories(
      memories,
      userMessage
    );

  const filtered =
    removeSimilarLongTermMemories(
      ranked
    );

  return filtered.slice(
    0,
    Math.max(0, limit)
  );
}

/* ============================================================
   BASIC PRIORITY TEST
   ============================================================ */

export function testLongTermMemoryPriority(): void {

  console.log(
    "\n🧪 LTM PRIORITY TEST"
  );

  const sqlMemory: Memory = {
    id: "test-sql",
    characterId: "test-character",
    type: "interest",
    content:
      "User is interested in SQL",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const goalMemory: Memory = {
    id: "test-goal",
    characterId: "test-character",
    type: "goal",
    content:
      "User wants to become an SQL developer",
    importance: 0.95,
    confidence: 0.95,
    createdAt: Date.now(),
  };

  const unrelatedMemory: Memory = {
    id: "test-food",
    characterId: "test-character",
    type: "preference",
    content:
      "User likes biryani",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const memories = [
    sqlMemory,
    goalMemory,
    unrelatedMemory,
  ];

  const ranked =
    rankLongTermMemories(
      memories,
      "I am practicing SQL joins"
    );

  console.log(
    "📊 Ranked LTM:"
  );

  for (const item of ranked) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  if (ranked.length !== 2) {
    throw new Error(
      "❌ Expected 2 relevant memories"
    );
  }

  if (
    ranked[0].relevanceScore <
    ranked[1].relevanceScore
  ) {
    throw new Error(
      "❌ Ranking order is incorrect"
    );
  }

  console.log(
    "✅ LTM PRIORITY TEST PASSED"
  );
}

/* ============================================================
   CURRENT INTENT OVERRIDE TEST
   ============================================================ */

export function testLongTermMemoryCurrentIntent(): void {

  console.log(
    "\n🧪 LTM CURRENT INTENT OVERRIDE TEST"
  );

  const sqlPracticeMemory: Memory = {
    id: "test-sql-practice",
    characterId: "test-character",
    type: "fact",
    content:
      "I am preparing for my developer interview and practicing SQL",
    importance: 0.8,
    confidence: 1,
    createdAt: Date.now(),
  };

  const sqlInterviewMemory: Memory = {
    id: "test-sql-interview",
    characterId: "test-character",
    type: "fact",
    content:
      "I have an SQL interview",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const sqlInterestMemory: Memory = {
    id: "test-sql-interest",
    characterId: "test-character",
    type: "interest",
    content:
      "User is interested in SQL",
    importance: 0.8,
    confidence: 0.96,
    createdAt: Date.now(),
  };

  const sqlNegativeMemory: Memory = {
    id: "test-sql-negative",
    characterId: "test-character",
    type: "goal",
    content:
      "I don't want to work with SQL anymore",
    importance: 0.8,
    confidence: 0.99,
    createdAt: Date.now(),
  };

  const careerMemory: Memory = {
    id: "test-career",
    characterId: "test-character",
    type: "fact",
    content:
      "I am feeling nervous about my career",
    importance: 0.7,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const pythonMemory: Memory = {
    id: "test-python",
    characterId: "test-character",
    type: "interest",
    content:
      "I am practicing Python",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  /* ----------------------------------------------------------
     NEGATIVE SQL
     ---------------------------------------------------------- */

  const negativeSqlMessage =
    "Actually I don't want to work with SQL anymore";

  const practiceScore =
    calculateLongTermMemoryPriority(
      sqlPracticeMemory,
      negativeSqlMessage
    );

  if (practiceScore !== 0) {
    throw new Error(
      "❌ Positive SQL practice memory was not suppressed"
    );
  }

  const interviewScore =
    calculateLongTermMemoryPriority(
      sqlInterviewMemory,
      negativeSqlMessage
    );

  if (interviewScore !== 0) {
    throw new Error(
      "❌ Positive SQL interview memory was not suppressed"
    );
  }

  const interestScore =
    calculateLongTermMemoryPriority(
      sqlInterestMemory,
      negativeSqlMessage
    );

  if (interestScore !== 0) {
    throw new Error(
      "❌ Positive SQL interest memory was not suppressed"
    );
  }

  const negativeScore =
    calculateLongTermMemoryPriority(
      sqlNegativeMemory,
      negativeSqlMessage
    );

  if (negativeScore <= 0) {
    throw new Error(
      "❌ Negative SQL memory was incorrectly suppressed"
    );
  }

  /* ----------------------------------------------------------
     UNRELATED MEMORIES
     ---------------------------------------------------------- */

  const careerScore =
    calculateLongTermMemoryPriority(
      careerMemory,
      negativeSqlMessage
    );

  if (careerScore <= 0) {
    throw new Error(
      "❌ Career memory was incorrectly suppressed"
    );
  }

  const pythonScore =
    calculateLongTermMemoryPriority(
      pythonMemory,
      negativeSqlMessage
    );

  if (pythonScore !== 0) {
    throw new Error(
      "❌ Python memory incorrectly matched SQL intent"
    );
  }

  /* ----------------------------------------------------------
     POSITIVE SQL RESTORES RECALL
     ---------------------------------------------------------- */

  const positiveSqlMessage =
    "I want to get back into SQL";

  const restoredPositiveScore =
    calculateLongTermMemoryPriority(
      sqlPracticeMemory,
      positiveSqlMessage
    );

  if (
    restoredPositiveScore <= 0
  ) {
    throw new Error(
      "❌ Positive SQL memory was not restored"
    );
  }

  /* ----------------------------------------------------------
     POSITIVE SQL SUPPRESSES OLD NEGATIVE SQL
     ---------------------------------------------------------- */

  const suppressedNegativeScore =
    calculateLongTermMemoryPriority(
      sqlNegativeMemory,
      positiveSqlMessage
    );

  if (
    suppressedNegativeScore !== 0
  ) {
    throw new Error(
      "❌ Old negative SQL memory was not suppressed"
    );
  }

  /* ----------------------------------------------------------
     NATURAL POSITIVE CHANGE-OF-MIND
     ---------------------------------------------------------- */

  const naturalPositiveMessage =
    "Actually I changed my mind. I want to prepare for SQL interview again";

  const naturalPositiveScore =
    calculateLongTermMemoryPriority(
      sqlPracticeMemory,
      naturalPositiveMessage
    );

  if (
    naturalPositiveScore <= 0
  ) {
    throw new Error(
      "❌ Natural positive change-of-mind SQL message failed"
    );
  }

  const naturalNegativeScore =
    calculateLongTermMemoryPriority(
      sqlNegativeMemory,
      naturalPositiveMessage
    );

  if (
    naturalNegativeScore !== 0
  ) {
    throw new Error(
      "❌ Natural positive change-of-mind failed to suppress old negative SQL memory"
    );
  }

  console.log(
    "✅ LTM CURRENT INTENT OVERRIDE TEST PASSED"
  );
}

/* ============================================================
   SIMILAR MEMORY FILTERING
   ============================================================ */

function normalizeMemoryText(
  text: string
): string {

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMemoryWords(
  text: string
): Set<string> {

  return new Set(
    normalizeMemoryText(text)
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 3
      )
  );
}

function calculateMemorySimilarity(
  first: string,
  second: string
): number {

  const firstWords =
    getMemoryWords(first);

  const secondWords =
    getMemoryWords(second);

  if (
    firstWords.size === 0 ||
    secondWords.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const word of firstWords) {
    if (secondWords.has(word)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...firstWords,
      ...secondWords,
    ]).size;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

/* ============================================================
   REMOVE SIMILAR MEMORIES
   ============================================================ */

export function removeSimilarLongTermMemories(
  rankedMemories: RankedLongTermMemory[],
  similarityThreshold = 0.75
): RankedLongTermMemory[] {

  const selected:
    RankedLongTermMemory[] = [];

  for (
    const candidate of rankedMemories
  ) {

    const isSimilar =
      selected.some(
        (existing) =>
          calculateMemorySimilarity(
            existing.memory.content,
            candidate.memory.content
          ) >= similarityThreshold
      );

    if (!isSimilar) {
      selected.push(candidate);
    }
  }

  return selected;
}