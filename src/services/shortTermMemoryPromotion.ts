import {
  getCharacterShortTermMemories,
  removeShortTermMemory,
  ShortTermMemory,
  ShortTermMemoryType,
} from "./shortTermMemoryService";

import {
  addMemory,
  getCharacterMemories,
} from "./memoryService";

import {
  calculateShortTermMemoryPriority,
} from "./shortTermMemoryPriority";

import {
  MemoryType,
} from "../types/memory";

/* ============================================================
   PROMOTION CONFIGURATION
   ============================================================ */

const PROMOTION_PRIORITY_THRESHOLD = 0.75;

const PROMOTION_IMPORTANCE_THRESHOLD = 0.7;

const PROMOTION_CONFIDENCE_THRESHOLD = 0.7;

/* ============================================================
   QUESTION / RECALL PROTECTION
   2.5E — MEMORY HYGIENE
   ============================================================ */

/**
 * Questions and recall requests are conversational requests,
 * not user memories.
 *
 * This is intentionally duplicated at the promotion layer
 * as a second safety barrier.
 */
function isQuestionOrRecallRequest(
  text: string
): boolean {
  const raw =
    text.trim();

  if (!raw) {
    return false;
  }

  const normalized =
    raw
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // ----------------------------------------------------------
  // Explicit question mark
  // ----------------------------------------------------------

  if (
    raw.includes("?")
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // Question starters
  // ----------------------------------------------------------

  const questionStarters = [
    "what ",
    "which ",
    "where ",
    "when ",
    "who ",
    "whom ",
    "whose ",
    "why ",
    "how ",

    "can you ",
    "could you ",
    "would you ",
    "should i ",
    "should we ",

    "do you ",
    "does ",
    "did ",
    "is ",
    "are ",
    "am i ",
    "was ",
    "were ",

    "will ",
    "have ",
    "has ",
    "had ",
  ];

  if (
    questionStarters.some(
      (starter) =>
        normalized.startsWith(starter)
    )
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // Explicit recall requests
  // ----------------------------------------------------------

  const recallPatterns = [
    "do you remember",
    "did i say",
    "did i tell you",
    "what did i say",
    "what did i tell you",
    "what am i planning",
    "what was i planning",
    "what is my goal",
    "what are my goals",
    "what do i want",
    "what am i interested in",
    "what do i like",
    "what do i prefer",
    "remind me",
    "can you remind me",
  ];

  return recallPatterns.some(
    (pattern) =>
      normalized.includes(pattern)
  );
}

/* ============================================================
   STM → LTM TYPE MAPPING
   ============================================================ */

function mapSTMTypeToLTMType(
  type: ShortTermMemoryType
): MemoryType | null {

  switch (type) {

    case "preference":
      return "preference";

    case "goal":
      return "goal";

    case "topic":
      return "interest";

    case "relationship":
      return "relationship";

    case "context":
      return "context";

    case "emotion":
      return "fact";

    case "event":
      return "fact";

    case "other":
      return "fact";

    default:
      return null;
  }
}

/* ============================================================
   DUPLICATE CHECK
   ============================================================ */

function normalizeMemoryText(
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

function isDuplicateLongTermMemory(
  content: string,
  existingMemories: {
    content: string;
  }[]
): boolean {

  const normalizedContent =
    normalizeMemoryText(content);

  return existingMemories.some(
    (memory) =>
      normalizeMemoryText(
        memory.content
      ) === normalizedContent
  );
}

/* ============================================================
   SHOULD PROMOTE
   ============================================================ */

export function shouldPromoteShortTermMemory(
  memory: ShortTermMemory
): boolean {

  /*
   * ==========================================================
   * QUESTION SAFETY BARRIER
   * ==========================================================
   *
   * Even if a question somehow reaches STM,
   * it must never be promoted to LTM.
   */

  if (
    isQuestionOrRecallRequest(
      memory.content
    )
  ) {
    console.log(
      "🧠 STM → LTM: QUESTION / RECALL REQUEST REJECTED"
    );

    console.log({
      memoryId:
        memory.id,

      content:
        memory.content,
    });

    return false;
  }

  /*
   * Inactive memories should never
   * be promoted.
   */

  if (!memory.isActive) {
    return false;
  }

  /*
   * Expired memories should not
   * become long-term memories.
   */

  if (memory.expiresAt) {

    const expiresAt =
      new Date(
        memory.expiresAt
      ).getTime();

    if (
      !Number.isNaN(expiresAt) &&
      expiresAt <= Date.now()
    ) {
      return false;
    }
  }

  /*
   * Importance requirement.
   */

  if (
    memory.importance <
    PROMOTION_IMPORTANCE_THRESHOLD
  ) {
    return false;
  }

  /*
   * Confidence requirement.
   */

  if (
    memory.confidence <
    PROMOTION_CONFIDENCE_THRESHOLD
  ) {
    return false;
  }

  /*
   * Final priority requirement.
   */

  const priority =
    calculateShortTermMemoryPriority(
      memory
    );

  return (
    priority >=
    PROMOTION_PRIORITY_THRESHOLD
  );
}

/* ============================================================
   PROMOTE ONE MEMORY
   ============================================================ */

export async function promoteShortTermMemory(
  memory: ShortTermMemory
): Promise<boolean> {

  if (
    !shouldPromoteShortTermMemory(
      memory
    )
  ) {
    return false;
  }

  const ltmType =
    mapSTMTypeToLTMType(
      memory.memoryType
    );

  if (!ltmType) {
    return false;
  }

  /*
   * Get existing long-term memories
   * for duplicate prevention.
   */

  const existingMemories =
    await getCharacterMemories(
      memory.characterId
    );

  /*
   * Don't create the same LTM twice.
   */

  if (
    isDuplicateLongTermMemory(
      memory.content,
      existingMemories
    )
  ) {

    console.log(
      "🧠 STM → LTM: DUPLICATE SKIPPED"
    );

    await removeShortTermMemory(
      memory.id
    );

    return false;
  }

  /*
   * Create the long-term memory.
   */

  await addMemory(
    memory.characterId,
    ltmType,
    memory.content,
    memory.importance,
    memory.confidence
  );

  /*
   * STM has now successfully been
   * promoted to LTM.
   */

  await removeShortTermMemory(
    memory.id
  );

  console.log(
    "🧠 STM → LTM PROMOTED:",
    memory.memoryType,
    "→",
    ltmType,
    memory.content
  );

  return true;
}

/* ============================================================
   PROMOTE CHARACTER MEMORIES
   ============================================================ */

export async function promoteCharacterShortTermMemories(
  characterId: string
): Promise<number> {

  console.log(
    "🔄 STM → LTM PROMOTION STARTED"
  );

  const memories =
    await getCharacterShortTermMemories(
      characterId,
      50
    );

  let promotedCount = 0;

  for (
    const memory of memories
  ) {

    const promoted =
      await promoteShortTermMemory(
        memory
      );

    if (promoted) {
      promotedCount++;
    }
  }

  console.log(
    "✅ STM → LTM PROMOTION COMPLETE:",
    promotedCount
  );

  return promotedCount;
}

/* ============================================================
   TEST PROMOTION RULE
   ============================================================ */

export function testShortTermMemoryPromotion(): void {

  console.log(
    "\n🧪 STM → LTM PROMOTION TEST"
  );

  const highValueMemory:
    ShortTermMemory = {

      id: "test-memory",

      userId: "test-user",

      characterId: "test-character",

      conversationId:
        "test-conversation",

      memoryType: "goal",

      content:
        "I want to become an SQL developer",

      importance: 0.9,

      confidence: 0.95,

      isActive: true,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

  const result =
    shouldPromoteShortTermMemory(
      highValueMemory
    );

  console.log(
    "Promotion decision:",
    result
  );

  if (!result) {

    throw new Error(
      "❌ High-value STM should be promoted"
    );
  }

  console.log(
    "✅ STM → LTM PROMOTION TEST PASSED"
  );
}

/* ============================================================
   CONTROLLED PROMOTION
   ============================================================ */

/**
 * Promote only STM memories that satisfy
 * the existing promotion rules.
 *
 * Questions are explicitly rejected before
 * the normal promotion rules are evaluated.
 */
export async function runControlledShortTermMemoryPromotion(
  characterId: string
): Promise<number> {

  console.log(
    "🧠 CONTROLLED STM → LTM PROMOTION STARTED"
  );

  const memories =
    await getCharacterShortTermMemories(
      characterId,
      50
    );

  let promotedCount = 0;

  for (
    const memory of memories
  ) {

    const promoted =
      await promoteShortTermMemory(
        memory
      );

    if (promoted) {
      promotedCount++;
    }
  }

  console.log(
    "🧠 CONTROLLED STM → LTM PROMOTION RESULT:",
    promotedCount
  );

  return promotedCount;
}