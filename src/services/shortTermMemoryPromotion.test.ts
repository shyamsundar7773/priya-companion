import {
    shouldPromoteShortTermMemory,
} from "./shortTermMemoryPromotion";

import {
    ShortTermMemory,
} from "./shortTermMemoryService";

/* ============================================================
   TEST MEMORY FACTORY
   ============================================================ */

function createTestMemory(
  overrides: Partial<ShortTermMemory>
): ShortTermMemory {

  return {
    id: crypto.randomUUID(),

    userId: "test-user",

    characterId: "test-character",

    conversationId: "test-conversation",

    memoryType: "goal",

    content: "I want to become an SQL developer",

    importance: 0.9,

    confidence: 0.9,

    isActive: true,

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    ...overrides,
  };
}

/* ============================================================
   TEST 1 — HIGH VALUE MEMORY
   ============================================================ */

console.log(
  "\n🧪 TEST 1: HIGH VALUE MEMORY"
);

const highValueMemory =
  createTestMemory({
    memoryType: "goal",
    importance: 0.9,
    confidence: 0.9,
  });

const highValueResult =
  shouldPromoteShortTermMemory(
    highValueMemory
  );

console.log(
  "Promotion decision:",
  highValueResult
);

if (!highValueResult) {
  throw new Error(
    "❌ High-value memory should be promoted"
  );
}

console.log(
  "✅ TEST 1 PASSED"
);

/* ============================================================
   TEST 2 — LOW IMPORTANCE
   ============================================================ */

console.log(
  "\n🧪 TEST 2: LOW IMPORTANCE"
);

const lowImportanceMemory =
  createTestMemory({
    importance: 0.3,
    confidence: 0.9,
  });

const lowImportanceResult =
  shouldPromoteShortTermMemory(
    lowImportanceMemory
  );

console.log(
  "Promotion decision:",
  lowImportanceResult
);

if (lowImportanceResult) {
  throw new Error(
    "❌ Low-importance memory should not be promoted"
  );
}

console.log(
  "✅ TEST 2 PASSED"
);

/* ============================================================
   TEST 3 — LOW CONFIDENCE
   ============================================================ */

console.log(
  "\n🧪 TEST 3: LOW CONFIDENCE"
);

const lowConfidenceMemory =
  createTestMemory({
    importance: 0.9,
    confidence: 0.3,
  });

const lowConfidenceResult =
  shouldPromoteShortTermMemory(
    lowConfidenceMemory
  );

console.log(
  "Promotion decision:",
  lowConfidenceResult
);

if (lowConfidenceResult) {
  throw new Error(
    "❌ Low-confidence memory should not be promoted"
  );
}

console.log(
  "✅ TEST 3 PASSED"
);

/* ============================================================
   TEST 4 — INACTIVE MEMORY
   ============================================================ */

console.log(
  "\n🧪 TEST 4: INACTIVE MEMORY"
);

const inactiveMemory =
  createTestMemory({
    importance: 0.9,
    confidence: 0.9,
    isActive: false,
  });

const inactiveResult =
  shouldPromoteShortTermMemory(
    inactiveMemory
  );

console.log(
  "Promotion decision:",
  inactiveResult
);

if (inactiveResult) {
  throw new Error(
    "❌ Inactive memory should not be promoted"
  );
}

console.log(
  "✅ TEST 4 PASSED"
);

/* ============================================================
   TEST 5 — EXPIRED MEMORY
   ============================================================ */

console.log(
  "\n🧪 TEST 5: EXPIRED MEMORY"
);

const expiredMemory =
  createTestMemory({
    importance: 0.9,
    confidence: 0.9,

    expiresAt:
      new Date(
        Date.now() - 60 * 1000
      ).toISOString(),
  });

const expiredResult =
  shouldPromoteShortTermMemory(
    expiredMemory
  );

console.log(
  "Promotion decision:",
  expiredResult
);

if (expiredResult) {
  throw new Error(
    "❌ Expired memory should not be promoted"
  );
}

console.log(
  "✅ TEST 5 PASSED"
);

/* ============================================================
   TEST 6 — PREFERENCE PROMOTION
   ============================================================ */

console.log(
  "\n🧪 TEST 6: PREFERENCE MEMORY"
);

const preferenceMemory =
  createTestMemory({
    memoryType: "preference",

    content:
      "I prefer learning SQL through practical examples",

    importance: 0.85,

    confidence: 0.9,
  });

const preferenceResult =
  shouldPromoteShortTermMemory(
    preferenceMemory
  );

console.log(
  "Promotion decision:",
  preferenceResult
);

if (!preferenceResult) {
  throw new Error(
    "❌ High-value preference should be promoted"
  );
}

console.log(
  "✅ TEST 6 PASSED"
);

/* ============================================================
   TEST 7 — EVENT PROMOTION
   ============================================================ */

console.log(
  "\n🧪 TEST 7: EVENT MEMORY"
);

const eventMemory =
  createTestMemory({
    memoryType: "event",

    content:
      "I have an SQL developer interview tomorrow",

    importance: 0.9,

    confidence: 0.95,
  });

const eventResult =
  shouldPromoteShortTermMemory(
    eventMemory
  );

console.log(
  "Promotion decision:",
  eventResult
);

if (!eventResult) {
  throw new Error(
    "❌ High-value event should be eligible for promotion"
  );
}

console.log(
  "✅ TEST 7 PASSED"
);

/* ============================================================
   TEST 8 — TEMPORARY CONTEXT
   ============================================================ */

console.log(
  "\n🧪 TEST 8: TEMPORARY CONTEXT"
);

const temporaryContext =
  createTestMemory({
    memoryType: "context",

    content:
      "Tell me something interesting",

    importance: 0.3,

    confidence: 0.5,
  });

const temporaryResult =
  shouldPromoteShortTermMemory(
    temporaryContext
  );

console.log(
  "Promotion decision:",
  temporaryResult
);

if (temporaryResult) {
  throw new Error(
    "❌ Temporary conversational context should not be promoted"
  );
}

console.log(
  "✅ TEST 8 PASSED"
);

/* ============================================================
   FINAL RESULT
   ============================================================ */

console.log(
  "\n🎉 ALL STM → LTM PROMOTION TESTS PASSED!"
);

console.log(
  "✅ 2.5D-10B COMPLETE"
);