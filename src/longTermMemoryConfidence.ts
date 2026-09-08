// Keep this module self-contained when the shared memory type is unavailable.
type Memory = {
  id: string;
  characterId: string;
  type:
    | "goal"
    | "preference"
    | "relationship"
    | "habit"
    | "interest"
    | "context"
    | "fact";
  content: string;
  importance: number;
  confidence: number;
  createdAt: number;
};

/* ============================================================
   2.5E-5A
   LONG-TERM MEMORY CONFIDENCE EVALUATION
============================================================ */

export type MemoryConfidenceEvaluation = {
  memory: Memory;
  confidenceScore: number;
  reliability: "low" | "medium" | "high";
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
   BASE CONFIDENCE
============================================================ */

function calculateBaseConfidence(
  memory: Memory
): number {
  return clamp(
    memory.confidence
  );
}

/* ============================================================
   IMPORTANCE SIGNAL
============================================================ */

function calculateImportanceSignal(
  memory: Memory
): number {
  return clamp(
    memory.importance
  );
}

/* ============================================================
   MEMORY TYPE RELIABILITY
============================================================ */

function calculateTypeReliability(
  memory: Memory
): number {

  switch (memory.type) {
    case "goal":
      return 1.0;

    case "preference":
      return 0.95;

    case "relationship":
      return 0.9;

    case "habit":
      return 0.85;

    case "interest":
      return 0.8;

    case "context":
      return 0.7;

    case "fact":
      return 0.75;

    default:
      return 0.6;
  }
}

/* ============================================================
   CONFIDENCE SCORE
============================================================ */

export function calculateMemoryConfidenceScore(
  memory: Memory
): number {

  const baseConfidence =
    calculateBaseConfidence(
      memory
    );

  const importance =
    calculateImportanceSignal(
      memory
    );

  const typeReliability =
    calculateTypeReliability(
      memory
    );

  const score =
    baseConfidence * 0.60 +
    importance * 0.20 +
    typeReliability * 0.20;

  return Number(
    clamp(score).toFixed(4)
  );
}

/* ============================================================
   RELIABILITY CLASSIFICATION
============================================================ */

export function classifyMemoryReliability(
  confidenceScore: number
): "low" | "medium" | "high" {

  if (
    confidenceScore >= 0.75
  ) {
    return "high";
  }

  if (
    confidenceScore >= 0.50
  ) {
    return "medium";
  }

  return "low";
}

/* ============================================================
   EVALUATE MEMORY
============================================================ */

export function evaluateMemoryConfidence(
  memory: Memory
): MemoryConfidenceEvaluation {

  const confidenceScore =
    calculateMemoryConfidenceScore(
      memory
    );

  const reliability =
    classifyMemoryReliability(
      confidenceScore
    );

  return {
    memory,
    confidenceScore,
    reliability,
  };
}

/* ============================================================
   EVALUATE MULTIPLE MEMORIES
============================================================ */

export function evaluateMemoryConfidences(
  memories: Memory[]
): MemoryConfidenceEvaluation[] {

  return memories
    .map(
      evaluateMemoryConfidence
    )
    .sort(
      (
        a,
        b
      ) =>
        b.confidenceScore -
        a.confidenceScore
    );
}

/* ============================================================
   TEST
============================================================ */

export function testLongTermMemoryConfidence(): void {

  console.log(
    "\n🧪 LTM CONFIDENCE EVALUATION TEST"
  );

  const highConfidenceMemory: Memory = {
    id: "high-confidence",
    characterId: "test-character",
    type: "goal",
    content:
      "User wants to become an SQL developer",
    importance: 0.95,
    confidence: 0.95,
    createdAt: Date.now(),
  };

  const mediumConfidenceMemory: Memory = {
    id: "medium-confidence",
    characterId: "test-character",
    type: "interest",
    content:
      "User is interested in Python",
    importance: 0.6,
    confidence: 0.6,
    createdAt: Date.now(),
  };

  const lowConfidenceMemory: Memory = {
    id: "low-confidence",
    characterId: "test-character",
    type: "fact",
    content:
      "User may like a particular technology",
    importance: 0.3,
    confidence: 0.2,
    createdAt: Date.now(),
  };

  const high =
    evaluateMemoryConfidence(
      highConfidenceMemory
    );

  const medium =
    evaluateMemoryConfidence(
      mediumConfidenceMemory
    );

  const low =
    evaluateMemoryConfidence(
      lowConfidenceMemory
    );

  console.log(
    "HIGH:",
    high.confidenceScore,
    high.reliability
  );

  console.log(
    "MEDIUM:",
    medium.confidenceScore,
    medium.reliability
  );

  console.log(
    "LOW:",
    low.confidenceScore,
    low.reliability
  );

  if (
    high.confidenceScore <=
    medium.confidenceScore
  ) {
    throw new Error(
      "❌ High-confidence memory should score higher"
    );
  }

  if (
    medium.confidenceScore <=
    low.confidenceScore
  ) {
    throw new Error(
      "❌ Medium-confidence memory should score higher"
    );
  }

  if (
    high.reliability !==
    "high"
  ) {
    throw new Error(
      "❌ High-confidence memory should be classified as high reliability"
    );
  }

  if (
    low.reliability !==
    "low"
  ) {
    throw new Error(
      "❌ Low-confidence memory should be classified as low reliability"
    );
  }

  console.log(
    "✅ LTM CONFIDENCE EVALUATION TEST PASSED"
  );
}