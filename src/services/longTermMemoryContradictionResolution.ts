
// src/services/longTermMemoryContradictionResolution.ts

import {
  getCharacterMemories,
  updateMemory,
} from "./memoryService";

import { isQuestionOrRecallRequest } from "./memoryIntent";

import type { Memory } from "../types/memory";

type Polarity = "positive" | "negative" | "neutral";

type MemoryIntent =
  | "decision"
  | "interest"
  | "preference"
  | "other";

/**
 * Detect whether a piece of text expresses a positive,
 * negative, or neutral position.
 */
function getPolarity(text: string): Polarity {
  const normalized = text.toLowerCase().trim();

  const negativePatterns = [
    "don't want",
    "do not want",
    "dont want",
    "no longer want",
    "don't like",
    "do not like",
    "dont like",
    "stop",
    "stopped",
    "quit",
    "finished with",
    "done with",
    "not interested",
    "no interest",
  ];

  const positivePatterns = [
    "want to",
    "would like to",
    "planning to",
    "plan to",
    "going to",
    "decided to",
    "changed my mind",
    "start with",
    "start learning",
    "start working",
    "interested in",
    "continue",
  ];

  if (
    negativePatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return "negative";
  }

  if (
    positivePatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return "positive";
  }

  return "neutral";
}

/**
 * Extract broad topics from a memory/message.
 */
function extractTopics(text: string): string[] {
  const normalized = text.toLowerCase();

  const topics = new Set<string>();

  // Python ecosystem
  if (
    normalized.includes("python") ||
    normalized.includes("pandas") ||
    normalized.includes("numpy") ||
    normalized.includes("flask") ||
    normalized.includes("django")
  ) {
    topics.add("python");
  }

  // SQL / database ecosystem
  if (
    normalized.includes("sql") ||
    normalized.includes("mysql") ||
    normalized.includes("postgres") ||
    normalized.includes("postgresql") ||
    normalized.includes("plsql") ||
    normalized.includes("database") ||
    normalized.includes("databases") ||
    normalized.includes("sql query") ||
    normalized.includes("queries") ||
    normalized.includes("join") ||
    normalized.includes("interview")
  ) {
    topics.add("sql");
  }

  // Coding / programming
  if (
    normalized.includes("coding") ||
    normalized.includes("programming") ||
    normalized.includes("software development")
  ) {
    topics.add("coding");
  }

  return Array.from(topics);
}

/**
 * Check whether two memories belong to the same topic.
 */
function memoriesShareTopic(
  firstText: string,
  secondText: string
): boolean {
  const firstTopics = extractTopics(firstText);
  const secondTopics = extractTopics(secondText);

  return firstTopics.some((topic) =>
    secondTopics.includes(topic)
  );
}

/**
 * Determine the semantic intent of a memory.
 *
 * This is important because:
 *
 * "I am interested in Python"
 *
 * is different from:
 *
 * "I am planning to start with Python"
 *
 * The first is an interest.
 * The second is a decision/goal.
 *
 * They should not automatically contradict each other.
 */
function getMemoryIntent(
  text: string,
  memoryType?: string
): MemoryIntent {
  const normalized = text.toLowerCase().trim();

  /**
   * Interest signals
   */
  const interestPatterns = [
    "interested in",
    "interest in",
    "i like",
    "i love",
    "i enjoy",
    "i am curious about",
    "i'm curious about",
  ];

  if (
    memoryType === "interest" ||
    interestPatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return "interest";
  }

  /**
   * Preference signals
   */
  const preferencePatterns = [
    "i prefer",
    "i'd prefer",
    "i would prefer",
    "my preference",
    "i usually prefer",
  ];

  if (
    memoryType === "preference" ||
    preferencePatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return "preference";
  }

  /**
   * Decision / goal signals.
   *
   * These include both positive decisions and negative decisions.
   */
  const decisionPatterns = [
    "want to",
    "would like to",
    "planning to",
    "plan to",
    "going to",
    "decided to",
    "start with",
    "start learning",
    "start working",
    "work with",
    "study",
    "learn",
    "continue",
    "stop",
    "stopped",
    "quit",
    "finished with",
    "done with",
    "no longer",
    "don't want",
    "do not want",
    "dont want",
    "not planning",
    "do not plan",
    "don't plan",
    "dont plan",
    "gave up",
    "giving up",
    "changed my mind",
  ];

  if (
    memoryType === "goal" ||
    decisionPatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return "decision";
  }

  return "other";
}

/**
 * Determine whether two intent categories can actually contradict
 * one another.
 *
 * We intentionally do NOT allow:
 *
 * interest ↔ decision
 * interest ↔ preference
 * decision ↔ preference
 *
 * to be treated as contradictions.
 */
function areContradictoryIntents(
  firstIntent: MemoryIntent,
  secondIntent: MemoryIntent
): boolean {
  if (
    firstIntent === "decision" &&
    secondIntent === "decision"
  ) {
    return true;
  }

  if (
    firstIntent === "interest" &&
    secondIntent === "interest"
  ) {
    return true;
  }

  if (
    firstIntent === "preference" &&
    secondIntent === "preference"
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate contradiction strength.
 */
function calculateContradictionScore(
  newPolarity: Polarity,
  oldPolarity: Polarity,
  sharedTopic: boolean,
  compatibleIntent: boolean
): number {
  if (!sharedTopic) {
    return 0;
  }

  if (!compatibleIntent) {
    return 0;
  }

  if (
    newPolarity === "neutral" ||
    oldPolarity === "neutral"
  ) {
    return 0;
  }

  if (newPolarity === oldPolarity) {
    return 0;
  }

  /**
   * Strong contradiction:
   * same topic + compatible intent + opposite polarity.
   */
  return 0.825;
}

/**
 * Determine whether an existing memory should be suppressed.
 *
 * IMPORTANT:
 * Existing question/recall memories are NOT treated as
 * contradictions.
 *
 * They are handled separately by quarantineQuestionMemories()
 * so that old polluted memories cannot remain active.
 */
function shouldSuppressMemory(
  newMessage: string,
  existingMemory: Memory,
  newPolarity: Polarity,
  newIntent: MemoryIntent
): boolean {
  /**
   * Never treat a question/recall request as a real memory.
   */
  if (
    isQuestionOrRecallRequest(existingMemory.content)
  ) {
    return false;
  }

  /**
   * New message itself should also never be treated as a
   * contradiction source if it is a question/recall request.
   */
  if (isQuestionOrRecallRequest(newMessage)) {
    return false;
  }

  const oldPolarity = getPolarity(existingMemory.content);

  if (
    oldPolarity === "neutral" ||
    newPolarity === "neutral"
  ) {
    return false;
  }

  if (
    !memoriesShareTopic(
      newMessage,
      existingMemory.content
    )
  ) {
    return false;
  }

  const oldMemoryType = (
    existingMemory as Memory & {
      memoryType?: string;
    }
  ).memoryType;

  const oldIntent = getMemoryIntent(
    existingMemory.content,
    oldMemoryType ?? existingMemory.type
  );

  if (
    !areContradictoryIntents(
      newIntent,
      oldIntent
    )
  ) {
    return false;
  }

  return newPolarity !== oldPolarity;
}

/**
 * Determine whether a previously suppressed positive decision
 * should become active again.
 *
 * Example:
 *
 * Old:
 * "I don't want to work with Python anymore"
 *
 * Later:
 * "I am planning to start with Python"
 *
 * The old negative decision stays suppressed,
 * while any compatible previous positive decision can be
 * reinstated.
 */
function shouldReinstateMemory(
  newMessage: string,
  existingMemory: Memory,
  newPolarity: Polarity,
  newIntent: MemoryIntent
): boolean {
  /**
   * Never reinstate a question/recall request.
   *
   * This is critical for polluted historical memories.
   */
  if (
    isQuestionOrRecallRequest(existingMemory.content)
  ) {
    return false;
  }

  /**
   * Never use a question/recall request as a reinstatement source.
   */
  if (isQuestionOrRecallRequest(newMessage)) {
    return false;
  }

  /**
   * Reinstatement only makes sense when the new message is
   * a positive decision.
   */
  if (newPolarity !== "positive") {
    return false;
  }

  /**
   * Only decision memories can be reinstated here.
   */
  if (newIntent !== "decision") {
    return false;
  }

  if (
    !memoriesShareTopic(
      newMessage,
      existingMemory.content
    )
  ) {
    return false;
  }

  const oldPolarity = getPolarity(
    existingMemory.content
  );

  if (oldPolarity !== "positive") {
    return false;
  }

  const oldMemoryType = (
    existingMemory as Memory & {
      memoryType?: string;
    }
  ).memoryType;

  const oldIntent = getMemoryIntent(
    existingMemory.content,
    oldMemoryType ?? existingMemory.type
  );

  /**
   * Only compatible positive decisions are reinstated.
   */
  if (oldIntent !== "decision") {
    return false;
  }

  /**
   * A confidence around 0.2 indicates that the memory was
   * previously suppressed/superseded.
   */
  if (existingMemory.confidence > 0.2) {
    return false;
  }

  return true;
}

/**
 * -------------------------------------------------------------
 * LEGACY QUESTION / RECALL MEMORY QUARANTINE
 * -------------------------------------------------------------
 *
 * Some older LTM records may have been created before the
 * question/recall protection was fully active.
 *
 * Example polluted memory:
 *
 * "I know I previously said I didn't want to work with python
 * anymore but then I changed my mind and I said I was planning
 * to start with python again can you tell me what my current
 * plan is..."
 *
 * Such a record may have been incorrectly stored as:
 *
 * type: "goal"
 *
 * Therefore checking only existingMemory.type is NOT enough.
 *
 * We inspect the actual CONTENT.
 *
 * If the content is a question/recall request:
 *
 *     confidence → 0.2
 *
 * This does NOT make it a valid memory.
 *
 * Instead it quarantines the legacy polluted record so that:
 *
 * 1. It cannot become active LTM.
 * 2. It cannot be reinstated.
 * 3. Confidence integration can protect it as suppressed.
 * 4. It cannot pollute future AI context.
 *
 * IMPORTANT:
 * This only fixes already-existing polluted memories.
 * New question/recall messages are already protected elsewhere.
 */
async function quarantineQuestionMemories(
  existingMemories: Memory[]
): Promise<number> {
  let quarantinedCount = 0;

  for (const existingMemory of existingMemories) {
    if (
      !isQuestionOrRecallRequest(
        existingMemory.content
      )
    ) {
      continue;
    }

    /**
     * Already safely suppressed.
     */
    if (existingMemory.confidence <= 0.2) {
      console.log(
        "🛡️ QUESTION / RECALL MEMORY ALREADY QUARANTINED:",
        JSON.stringify({
          memoryId: existingMemory.id,
          confidence: existingMemory.confidence,
          content: existingMemory.content,
        })
      );

      continue;
    }

    /**
     * Legacy polluted question/recall memory detected.
     *
     * Force it into the same suppressed state used by
     * contradiction resolution.
     */
    await updateMemory(
      existingMemory.id,
      {
        confidence: 0.2,
      }
    );

    quarantinedCount++;

    console.log(
      "🧹 LEGACY QUESTION / RECALL MEMORY QUARANTINED:",
      JSON.stringify({
        memoryId: existingMemory.id,
        previousConfidence:
          existingMemory.confidence,
        newConfidence: 0.2,
        content: existingMemory.content,
        reason:
          "memory content is a question / recall request",
      })
    );
  }

  return quarantinedCount;
}

/**
 * Main contradiction resolution function.
 *
 * Flow:
 *
 * Question / Recall
 *      ↓
 *      STOP
 *
 * Normal statement
 *      ↓
 * load LTM
 *      ↓
 * quarantine legacy question/recall memories
 *      ↓
 * detect polarity
 *      ↓
 * detect topics
 *      ↓
 * detect semantic intent
 *      ↓
 * reinstate compatible old positive decisions
 *      ↓
 * suppress genuine contradictory memories
 */
export async function resolveContradictionsForNewMessage(
  characterId: string,
  newMessage: string
): Promise<number> {
  /**
   * ---------------------------------------------------------
   * STEP 0 — QUESTION / RECALL PROTECTION
   * ---------------------------------------------------------
   *
   * Questions must NEVER modify normal memory state.
   *
   * We intentionally return before loading or modifying LTM.
   */
  if (isQuestionOrRecallRequest(newMessage)) {
    console.log(
      "🧠 CONTRADICTION RESOLUTION: QUESTION / RECALL REQUEST — SKIPPED"
    );

    return 0;
  }

  /**
   * ---------------------------------------------------------
   * STEP 1 — LOAD EXISTING LTM
   * ---------------------------------------------------------
   */
  const existingMemories =
    await getCharacterMemories(characterId);

  /**
   * ---------------------------------------------------------
   * STEP 2 — QUARANTINE LEGACY QUESTION / RECALL MEMORIES
   * ---------------------------------------------------------
   *
   * This is the key fix.
   *
   * Older polluted question memories may have been incorrectly
   * stored with type "goal".
   *
   * We identify them using their CONTENT instead of their type.
   */
  const quarantinedCount =
    await quarantineQuestionMemories(
      existingMemories
    );

  if (quarantinedCount > 0) {
    console.log(
      "🧹 LEGACY QUESTION / RECALL MEMORIES QUARANTINED:",
      quarantinedCount
    );
  }

  /**
   * ---------------------------------------------------------
   * STEP 3 — ANALYZE NEW MESSAGE
   * ---------------------------------------------------------
   */
  const newPolarity = getPolarity(newMessage);
  const newTopics = extractTopics(newMessage);

  console.log(
    "🧭 CONTRADICTION NEW POLARITY:",
    newPolarity
  );

  console.log(
    "🧭 CONTRADICTION NEW TOPICS:",
    JSON.stringify(newTopics)
  );

  /**
   * Determine the semantic intent of the new message.
   */
  const newIntent = getMemoryIntent(newMessage);

  /**
   * If there is no usable polarity or topic,
   * there is nothing meaningful to compare.
   */
  if (
    newPolarity === "neutral" ||
    newTopics.length === 0
  ) {
    console.log(
      "🧠 CONTRADICTION RESOLUTION: NO ACTIONABLE POLARITY / TOPIC"
    );

    return 0;
  }

  let resolvedCount = 0;

  /**
   * ---------------------------------------------------------
   * PASS 1 — REINSTATE COMPATIBLE POSITIVE DECISIONS
   * ---------------------------------------------------------
   *
   * Example:
   *
   * Previous positive:
   * "I am planning to start with Python"
   *
   * Later negative:
   * "I don't want to work with Python anymore"
   *
   * Later positive again:
   * "I am planning to start with Python"
   *
   * The old positive decision can become active again.
   */
  for (const existingMemory of existingMemories) {
    /**
     * Question/recall memories are quarantined and can NEVER
     * participate in reinstatement.
     */
    if (
      isQuestionOrRecallRequest(
        existingMemory.content
      )
    ) {
      continue;
    }

    if (
      shouldReinstateMemory(
        newMessage,
        existingMemory,
        newPolarity,
        newIntent
      )
    ) {
      const previousConfidence =
        existingMemory.confidence;

      const reinstatedConfidence =
        Math.max(
          previousConfidence,
          0.75
        );

      await updateMemory(
        existingMemory.id,
        {
          confidence: reinstatedConfidence,
        }
      );

      console.log(
        "🧠 MEMORY REINSTATED:",
        JSON.stringify({
          memoryId: existingMemory.id,
          newConfidence:
            reinstatedConfidence,
          oldContent:
            existingMemory.content,
          previousConfidence,
        })
      );
    }
  }

  /**
   * ---------------------------------------------------------
   * PASS 2 — SUPPRESS TRUE CONTRADICTIONS
   * ---------------------------------------------------------
   *
   * We only suppress when ALL of these are true:
   *
   * 1. Same topic
   * 2. Same semantic intent category
   * 3. Opposite polarity
   * 4. Existing memory is NOT a question/recall request
   */
  for (const existingMemory of existingMemories) {
    /**
     * Never process polluted historical questions.
     *
     * They were quarantined above and remain outside the
     * contradiction system.
     */
    if (
      isQuestionOrRecallRequest(
        existingMemory.content
      )
    ) {
      continue;
    }

    const oldPolarity = getPolarity(
      existingMemory.content
    );

    const oldMemoryType = (
      existingMemory as Memory & {
        memoryType?: string;
      }
    ).memoryType;

    const oldIntent = getMemoryIntent(
      existingMemory.content,
      oldMemoryType ?? existingMemory.type
    );

    const sharedTopic = memoriesShareTopic(
      newMessage,
      existingMemory.content
    );

    const intentCompatible =
      areContradictoryIntents(
        newIntent,
        oldIntent
      );

    const contradictionScore =
      calculateContradictionScore(
        newPolarity,
        oldPolarity,
        sharedTopic,
        intentCompatible
      );

    console.log(
      "🧭 CONTRADICTION INTENT CHECK:",
      JSON.stringify({
        contradictionScore,
        existingMemory:
          existingMemory.content,
        intentCompatible,
        newIntent,
        newMessage,
        newPolarity,
        oldIntent,
        oldPolarity,
      })
    );

    /**
     * Suppress only genuine contradictions.
     */
    if (
      shouldSuppressMemory(
        newMessage,
        existingMemory,
        newPolarity,
        newIntent
      )
    ) {
      const previousConfidence =
        existingMemory.confidence;

      /**
       * Suppression confidence.
       *
       * 0.2 means:
       *
       * "This memory is historically known,
       * but it is currently superseded."
       */
      await updateMemory(
        existingMemory.id,
        {
          confidence: 0.2,
        }
      );

      console.log(
        "🧠 CONTRADICTION FOUND:",
        JSON.stringify({
          memoryId:
            existingMemory.id,
          newConfidence: 0.2,
          newIntent,
          newPolarity,
          oldContent:
            existingMemory.content,
          oldIntent,
          oldPolarity,
          previousConfidence,
        })
      );

      resolvedCount++;
    }
  }

  console.log(
    "🧠 CONTRADICTION RESOLUTION COMPLETE:",
    resolvedCount
  );

  return resolvedCount;
}

