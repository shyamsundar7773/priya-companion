import {
  addShortTermMemory,
  ShortTermMemoryType,
} from "./shortTermMemoryService";

import {
  isQuestionOrRecallRequest,
} from "./memoryIntent";

// ============================================================
// SHORT-TERM MEMORY ANALYZER
// ============================================================
// Purpose:
// Analyze a newly saved user message and decide whether it
// should become Short-Term Memory.
//
// IMPORTANT 2.5E RULE:
//
// QUESTION / RECALL REQUEST
//     ↓
// NO STM
//
// NORMAL MEMORY STATEMENT
//     ↓
// STM
//
// The public function name/signature MUST remain:
//
// analyzeShortTermMessage(
//   characterId,
//   conversationId,
//   message
// )
//
// because chat/[id].tsx already calls it this way.
// ============================================================


// ============================================================
// ANALYZER MEMORY TYPE
// ============================================================
// This is the semantic classification used internally by the
// analyzer.
//
// It is intentionally different from ShortTermMemoryType.
//
// For example:
//   "interest" is an analyzer concept,
//   but STM stores that information as "topic".
//
//   "fact" is an analyzer concept,
//   but STM stores that information as "context".
// ============================================================

type AnalyzerMemoryType =
  | "fact"
  | "preference"
  | "habit"
  | "goal"
  | "interest"
  | "relationship"
  | "context";


// ============================================================
// ANALYZER TYPE → STM TYPE
// ============================================================
// Converts the analyzer's semantic type into one of the exact
// types accepted by addShortTermMemory().
//
// IMPORTANT:
// Do NOT pass AnalyzerMemoryType directly to
// addShortTermMemory().
// ============================================================

function mapToShortTermMemoryType(
  memoryType: AnalyzerMemoryType
): ShortTermMemoryType {

  switch (memoryType) {

    case "fact":
      return "context";

    case "context":
      return "context";

    case "preference":
      return "preference";

    case "habit":
      return "context";

    case "goal":
      return "goal";

    case "interest":
      return "topic";

    case "relationship":
      return "relationship";

    default:
      return "other";
  }
}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function cleanText(
  text: string
): string {
  return text
    .replace(/\s+/g, " ")
    .trim();
}


// ============================================================
// MEMORY TYPE DETECTION
// ============================================================

function detectMemoryType(
  text: string
): AnalyzerMemoryType | null {

  const lower =
    text.toLowerCase();

  // ----------------------------------------------------------
  // GOAL
  // ----------------------------------------------------------

  if (
    lower.includes("planning to") ||
    lower.includes("plan to") ||
    lower.includes("going to") ||
    lower.includes("want to start") ||
    lower.includes("want to learn") ||
    lower.includes("want to work") ||
    lower.includes("decided to") ||
    lower.includes("i decided")
  ) {
    return "goal";
  }


  // ----------------------------------------------------------
  // PREFERENCE
  // ----------------------------------------------------------

  if (
    lower.includes("i prefer") ||
    lower.includes("i like") ||
    lower.includes("i love") ||
    lower.includes("i enjoy") ||
    lower.includes("i hate") ||
    lower.includes("i dislike")
  ) {
    return "preference";
  }


  // ----------------------------------------------------------
  // HABIT
  // ----------------------------------------------------------

  if (
    lower.includes("every day") ||
    lower.includes("everyday") ||
    lower.includes("usually") ||
    lower.includes("normally") ||
    lower.includes("always")
  ) {
    return "habit";
  }


  // ----------------------------------------------------------
  // RELATIONSHIP
  // ----------------------------------------------------------

  if (
    lower.includes("my friend") ||
    lower.includes("my brother") ||
    lower.includes("my sister") ||
    lower.includes("my roommate") ||
    lower.includes("my mother") ||
    lower.includes("my father")
  ) {
    return "relationship";
  }


  // ----------------------------------------------------------
  // INTEREST
  // ----------------------------------------------------------

  if (
    lower.includes("interested in") ||
    lower.includes("interest in") ||
    lower.includes("i enjoy learning") ||
    lower.includes("i enjoy working")
  ) {
    return "interest";
  }


  // ----------------------------------------------------------
  // FACT
  // ----------------------------------------------------------

  if (
    lower.includes("i am") ||
    lower.includes("i'm") ||
    lower.includes("my name") ||
    lower.includes("i live") ||
    lower.includes("i work")
  ) {
    return "fact";
  }


  return null;
}


// ============================================================
// EVENT COMPLETION
// ============================================================
// Some messages explicitly modify an earlier decision.
//
// Example:
//
// "Actually I changed my mind. I am planning to start
// with Python."
//
// These are legitimate memory statements.
//
// IMPORTANT:
// This function is NEVER called for question/recall requests.
// ============================================================

function tryCompleteExistingEvent(
  text: string
): {
  memoryType: AnalyzerMemoryType;
  content: string;
  importance: number;
  confidence: number;
} | null {

  const lower =
    text.toLowerCase();

  const containsActually =
    lower.includes("actually");

  const containsDecisionChange =
    lower.includes("changed my mind") ||
    lower.includes("change my mind") ||
    lower.includes("decided") ||
    lower.includes("planning to");


  if (
    !containsActually ||
    !containsDecisionChange
  ) {
    return null;
  }


  const memoryType =
    detectMemoryType(text);


  if (!memoryType) {
    return null;
  }


  return {
    memoryType,
    content: text,
    importance: 0.8,
    confidence: 0.95,
  };
}


// ============================================================
// ANALYZE SHORT-TERM MESSAGE
// ============================================================
// THIS IS THE PUBLIC API USED BY chat/[id].tsx.
//
// DO NOT RENAME THIS FUNCTION.
// ============================================================

export async function analyzeShortTermMessage(
  characterId: string,
  conversationId: string,
  message: string
): Promise<void> {

  const cleaned =
    cleanText(message);


  // ==========================================================
  // EMPTY MESSAGE
  // ==========================================================

  if (!cleaned) {

    console.log(
      "🧠 STM SKIPPED: EMPTY MESSAGE"
    );

    return;
  }


  // ==========================================================
  // 2.5E — QUESTION / RECALL GUARD
  // ==========================================================
  //
  // MUST happen BEFORE:
  //
  // - event completion
  // - memory type detection
  // - addShortTermMemory
  //
  // This prevents messages such as:
  //
  // "I previously said X, but then changed my mind and
  // said Y. Can you tell me what my current plan is?"
  //
  // from becoming a goal memory.
  // ==========================================================

  if (
    isQuestionOrRecallRequest(
      cleaned
    )
  ) {

    console.log(
      "🧠 STM SKIPPED: QUESTION / RECALL REQUEST"
    );

    console.log(
      "🧠 STM → LTM: QUESTION / RECALL REQUEST REJECTED"
    );

    return;
  }


  // ==========================================================
  // EVENT COMPLETION
  // ==========================================================

  const completedEvent =
    tryCompleteExistingEvent(
      cleaned
    );


  if (completedEvent) {

    const shortTermMemoryType =
      mapToShortTermMemoryType(
        completedEvent.memoryType
      );


    console.log(
      "🧠 STM EVENT COMPLETION DETECTED:",
      {
        memoryType:
          completedEvent.memoryType,

        shortTermMemoryType,

        content:
          completedEvent.content,

        importance:
          completedEvent.importance,

        confidence:
          completedEvent.confidence,
      }
    );


    try {

      await addShortTermMemory(
        characterId,

        shortTermMemoryType,

        completedEvent.content,

        {
          conversationId,

          importance:
            completedEvent.importance,

          confidence:
            completedEvent.confidence,

          expiresAt:
            new Date(
              Date.now() +
                1000 *
                  60 *
                  60 *
                  24 *
                  30
            ).toISOString(),
        }
      );


      console.log(
        "🧠 SHORT-TERM MEMORY SAVED"
      );

    } catch (error) {

      console.error(
        "❌ SHORT-TERM MEMORY SAVE FAILED:",
        error
      );
    }


    return;
  }


  // ==========================================================
  // DETECT MEMORY TYPE
  // ==========================================================

  const memoryType =
    detectMemoryType(cleaned);


  if (!memoryType) {

    console.log(
      "🧠 STM SKIPPED: NO MEMORY TYPE DETECTED"
    );

    return;
  }


  // ==========================================================
  // MAP ANALYZER TYPE → ACTUAL STM TYPE
  // ==========================================================

  const shortTermMemoryType =
    mapToShortTermMemoryType(
      memoryType
    );


  // ==========================================================
  // NORMAL STM MEMORY
  // ==========================================================

  const importance =
    0.8;

  const confidence =
    0.85;


  console.log(
    "🧠 STM DETECTED:",
    {
      memoryType,

      shortTermMemoryType,

      content:
        cleaned,

      importance,

      confidence,
    }
  );


  // ==========================================================
  // SAVE STM
  // ==========================================================

  try {

    await addShortTermMemory(
      characterId,

      shortTermMemoryType,

      cleaned,

      {
        conversationId,

        importance,

        confidence,

        expiresAt:
          new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                30
          ).toISOString(),
      }
    );


    console.log(
      "🧠 SHORT-TERM MEMORY SAVED"
    );

  } catch (error) {

    console.error(
      "❌ SHORT-TERM MEMORY SAVE FAILED:",
      error
    );

    throw error;
  }
}