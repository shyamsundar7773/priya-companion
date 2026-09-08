import { Memory } from "../types/memory";

import {
    calculateMemoryReinforcement,
} from "./longTermMemoryReinforcement";

import {
    calculateMemoryContradictionScore,
} from "./longTermMemoryContradiction";

/* ============================================================
   2.5E-5D
   LONG-TERM MEMORY CONFIDENCE UPDATE
============================================================ */

const MAX_CONFIDENCE = 1.0;
const MIN_CONFIDENCE = 0.0;

const MAX_CONFIDENCE_INCREASE = 0.10;
const MAX_CONFIDENCE_DECREASE = 0.15;

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
   CONFIDENCE UPDATE RESULT
============================================================ */

export type MemoryConfidenceUpdate = {
  memory: Memory;
  previousConfidence: number;
  newConfidence: number;
  change: number;
  reason:
    | "reinforced"
    | "contradicted"
    | "unchanged";
};

/* ============================================================
   CALCULATE CONFIDENCE UPDATE
============================================================ */

export function calculateMemoryConfidenceUpdate(
  memory: Memory,
  userMessage: string
): MemoryConfidenceUpdate {

  const previousConfidence =
    clamp(
      memory.confidence
    );

  const reinforcement =
    calculateMemoryReinforcement(
      memory,
      userMessage
    );

  const contradiction =
    calculateMemoryContradictionScore(
      memory,
      userMessage
    );

  /* ==========================================================
     CONTRADICTION TAKES PRIORITY
  ========================================================== */

  if (
    contradiction >= 0.60
  ) {

    const decrease =
      Math.min(
        MAX_CONFIDENCE_DECREASE,
        contradiction *
          MAX_CONFIDENCE_DECREASE
      );

    const newConfidence =
      clamp(
        previousConfidence -
          decrease,
        MIN_CONFIDENCE,
        MAX_CONFIDENCE
      );

    return {
      memory,
      previousConfidence,
      newConfidence:
        Number(
          newConfidence.toFixed(4)
        ),
      change:
        Number(
          (
            newConfidence -
            previousConfidence
          ).toFixed(4)
        ),
      reason:
        "contradicted",
    };
  }

  /* ==========================================================
     REINFORCEMENT
  ========================================================== */

  if (
    reinforcement > 0
  ) {

    const increase =
      Math.min(
        MAX_CONFIDENCE_INCREASE,
        reinforcement
      );

    const newConfidence =
      clamp(
        previousConfidence +
          increase,
        MIN_CONFIDENCE,
        MAX_CONFIDENCE
      );

    return {
      memory,
      previousConfidence,
      newConfidence:
        Number(
          newConfidence.toFixed(4)
        ),
      change:
        Number(
          (
            newConfidence -
            previousConfidence
          ).toFixed(4)
        ),
      reason:
        "reinforced",
    };
  }

  /* ==========================================================
     NO CHANGE
  ========================================================== */

  return {
    memory,
    previousConfidence,
    newConfidence:
      previousConfidence,
    change: 0,
    reason:
      "unchanged",
  };
}

/* ============================================================
   APPLY UPDATE
============================================================ */

export function applyMemoryConfidenceUpdate(
  memory: Memory,
  userMessage: string
): Memory {

  const result =
    calculateMemoryConfidenceUpdate(
      memory,
      userMessage
    );

  if (
    result.change === 0
  ) {
    return memory;
  }

  return {
    ...memory,
    confidence:
      result.newConfidence,
  };
}

/* ============================================================
   UPDATE MULTIPLE MEMORIES
============================================================ */

export function updateMemoryConfidences(
  memories: Memory[],
  userMessage: string
): Memory[] {

  return memories.map(
    memory =>
      applyMemoryConfidenceUpdate(
        memory,
        userMessage
      )
  );
}

/* ============================================================
   TEST
============================================================ */

export function testLongTermMemoryConfidenceUpdate(): void {

  console.log(
    "\n🧪 LTM CONFIDENCE UPDATE TEST"
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
      0.7,
    createdAt:
      Date.now(),
  };

  /* ==========================================================
     REINFORCEMENT TEST
  ========================================================== */

  const reinforcementMessage =
    "I really enjoy practicing SQL";

  const reinforced =
    calculateMemoryConfidenceUpdate(
      sqlMemory,
      reinforcementMessage
    );

  console.log(
    "Reinforcement:",
    reinforced
  );

  if (
    reinforced.reason !==
    "reinforced"
  ) {
    throw new Error(
      "❌ Expected reinforcement"
    );
  }

  if (
    reinforced.newConfidence <=
    reinforced.previousConfidence
  ) {
    throw new Error(
      "❌ Confidence should increase after reinforcement"
    );
  }

  if (
    reinforced.change <= 0
  ) {
    throw new Error(
      "❌ Confidence change should be positive"
    );
  }

  /* ==========================================================
     CONTRADICTION TEST
  ========================================================== */

  const contradictionMessage =
    "I don't want to work with SQL anymore";

  const contradicted =
    calculateMemoryConfidenceUpdate(
      sqlMemory,
      contradictionMessage
    );

  console.log(
    "Contradiction:",
    contradicted
  );

  if (
    contradicted.reason !==
    "contradicted"
  ) {
    throw new Error(
      "❌ Expected contradiction"
    );
  }

  if (
    contradicted.newConfidence >=
    contradicted.previousConfidence
  ) {
    throw new Error(
      "❌ Confidence should decrease after contradiction"
    );
  }

  if (
    contradicted.change >= 0
  ) {
    throw new Error(
      "❌ Contradiction should produce negative confidence change"
    );
  }

  /* ==========================================================
     UNRELATED TEST
  ========================================================== */

  const unrelatedMessage =
    "I had biryani for lunch";

  const unchanged =
    calculateMemoryConfidenceUpdate(
      sqlMemory,
      unrelatedMessage
    );

  console.log(
    "Unrelated:",
    unchanged
  );

  if (
    unchanged.reason !==
    "unchanged"
  ) {
    throw new Error(
      "❌ Unrelated message should not change confidence"
    );
  }

  if (
    unchanged.change !== 0
  ) {
    throw new Error(
      "❌ Unrelated message changed confidence"
    );
  }

  /* ==========================================================
     BOUNDARY TEST
  ========================================================== */

  const almostCertain: Memory = {
    ...sqlMemory,
    confidence:
      0.98,
  };

  const capped =
    applyMemoryConfidenceUpdate(
      almostCertain,
      reinforcementMessage
    );

  console.log(
    "Maximum confidence:",
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

  const almostZero: Memory = {
    ...sqlMemory,
    confidence:
      0.05,
  };

  const lowered =
    applyMemoryConfidenceUpdate(
      almostZero,
      contradictionMessage
    );

  console.log(
    "Minimum confidence:",
    lowered.confidence
  );

  if (
    lowered.confidence <
    MIN_CONFIDENCE
  ) {
    throw new Error(
      "❌ Confidence went below minimum"
    );
  }

  console.log(
    "✅ LTM CONFIDENCE UPDATE TEST PASSED"
  );
}