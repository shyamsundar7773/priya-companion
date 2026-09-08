// ============================================================
// MEMORY INTENT
// ============================================================
// Centralized detection for messages that are asking the AI
// to READ / RECALL memory rather than CREATE memory.
//
// IMPORTANT:
// A message can contain factual statements AND still be a
// recall request.
//
// Example:
//
// "I previously said X, then changed my mind and said Y.
// Can you tell me what my current plan is?"
//
// This must be treated as READ-ONLY memory intent.
//
// Such messages must NOT:
// - create STM
// - create LTM
// - trigger contradiction resolution
// - trigger STM → LTM promotion
// - reinforce LTM confidence
//
// But existing LTM MUST still be available to the AI.
// ============================================================

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isQuestionOrRecallRequest(
  text: string
): boolean {
  const normalized = normalize(text);

  if (!normalized) {
    return false;
  }

  // ----------------------------------------------------------
  // DIRECT RECALL PATTERNS
  // ----------------------------------------------------------

  const recallPatterns = [
    "do you remember",
    "did you remember",
    "can you remember",
    "what do you remember",
    "what do you recall",
    "do you recall",

    "did i say",
    "did i tell you",
    "did i mention",
    "did i previously say",
    "did i previously tell you",
    "did i previously mention",

    "what did i say",
    "what did i tell you",
    "what did i mention",
    "what have i said",
    "what have i told you",
    "what have i mentioned",

    "what am i planning",
    "what was i planning",
    "what am i working on",
    "what was i working on",
    "what am i learning",
    "what was i learning",

    "what do i want to learn",
    "what do i want to work on",
    "what do i want to do",

    "what is my plan",
    "what was my plan",
    "what are my plans",

    "what is my goal",
    "what was my goal",
    "what are my goals",

    "what do you know about me",
    "what do you remember about me",

    "remind me",
    "remind me what",
    "remind me of",

    "tell me what i",
    "tell me what my",
    "tell me what you remember",

    "can you tell me what i",
    "can you tell me what my",
    "can you tell me what you remember",

    "whether you remember",
    "if you remember",
    "do you still remember",
  ];

  if (
    recallPatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // COMPLEX RECALL PATTERNS
  // ----------------------------------------------------------
  // These are especially important for 2.5E because the user
  // may describe the historical statements before asking
  // about the current/latest one.
  // ----------------------------------------------------------

  const complexRecallPatterns = [
    "what changed between",
    "what changed from",
    "what changed after",
    "what is my current plan",
    "what is my current goal",
    "what is my current decision",
    "what is my latest plan",
    "what is my latest goal",
    "what is my latest decision",
    "what was my previous plan",
    "what was my previous goal",
    "what was my previous decision",

    "which one is my latest decision",
    "which one is my current decision",
    "which one is my latest plan",
    "which one is my current plan",
    "which one is my latest goal",
    "which one is my current goal",

    "which is my latest decision",
    "which is my current decision",
    "which is my latest plan",
    "which is my current plan",

    "what do i currently plan",
    "what do i currently want",
    "what am i currently planning",
    "what am i currently working on",
    "what am i currently learning",

    "what did i change my mind about",
    "what have i changed my mind about",
    "what did i change",
    "what was changed",
  ];

  if (
    complexRecallPatterns.some((pattern) =>
      normalized.includes(pattern)
    )
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // QUESTION STARTERS
  // ----------------------------------------------------------

  const questionStarters = [
    "what ",
    "why ",
    "when ",
    "where ",
    "who ",
    "which ",
    "whose ",
    "whom ",
    "how ",

    "can you ",
    "could you ",
    "would you ",
    "will you ",

    "do you ",
    "did you ",
    "have you ",
    "has it ",
    "is it ",
    "are you ",
    "was it ",
    "were you ",

    "should i ",
    "should we ",
    "am i ",
    "did i ",
    "do i ",
    "can i ",
    "could i ",
  ];

  if (
    questionStarters.some((starter) =>
      normalized.startsWith(starter)
    )
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // QUESTION MARK
  // ----------------------------------------------------------
  // If a message contains "?" and is not clearly a declaration,
  // treat it as a question.
  //
  // This prevents:
  //
  // "I started Python? No, actually..."
  //
  // from being blindly treated as memory creation.
  // ----------------------------------------------------------

  if (text.includes("?")) {
    const declarationPatterns = [
      "i am ",
      "i'm ",
      "i want ",
      "i need ",
      "i like ",
      "i love ",
      "i prefer ",
      "i enjoy ",
      "i hate ",
      "i dislike ",
      "i plan ",
      "i am planning ",
      "i'm planning ",
      "i decided ",
      "i have ",
      "i got ",
      "i will ",
      "i'm going to ",
      "i am going to ",
      "i started ",
      "i stopped ",
      "i changed ",
      "i no longer ",
      "i don't want ",
      "i do not want ",
    ];

    const hasDeclaration =
      declarationPatterns.some((pattern) =>
        normalized.includes(pattern)
      );

    if (!hasDeclaration) {
      return true;
    }
  }

  return false;
}
export type RecallIntent = "CURRENT" | "HISTORICAL";

/**
 * Classifies a question/recall request for READ-ONLY memory retrieval.
 * This does not decide whether the message is a question; it only decides
 * which memory view should be used after question/recall has been detected.
 */
export function classifyRecallIntent(
  text: string
): RecallIntent {
  const normalized = normalize(text);

  const historicalPatterns = [
    "did i ever",
    "have i ever",
    "did i previously",
    "what did i previously",
    "what did i say before",
    "what did i tell you before",
    "what did i mention before",
    "what have i said before",
    "what have i told you before",
    "what have i mentioned before",
    "previously say",
    "previously tell",
    "previously mention",
    "before i",
    "earlier i",
    "what was my previous",
    "what was my old",
    "what was my earlier",
    "what changed",
    "changed my mind",
    "ever said",
    "ever told you",
    "ever mentioned",
    "at any point",
    "in the past",
    "back then",
  ];

  if (historicalPatterns.some((pattern) => normalized.includes(pattern))) {
    return "HISTORICAL";
  }

  return "CURRENT";
}
