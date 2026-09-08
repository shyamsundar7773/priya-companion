import {
    calculateShortTermMemoryPriority,
    getTopShortTermMemories,
    rankShortTermMemories,
} from "./shortTermMemoryPriority";

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

    memoryType: "context",

    content: "Test memory",

    importance: 0.5,
    confidence: 0.5,

    isActive: true,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    ...overrides,
  };
}

/* ============================================================
   TEST 1 — BASIC PRIORITY SCORE
   ============================================================ */

console.log(
  "\n🧪 TEST 1: BASIC PRIORITY SCORE"
);

const basicMemory =
  createTestMemory({
    memoryType: "event",
    importance: 1,
    confidence: 1,
  });

const basicScore =
  calculateShortTermMemoryPriority(
    basicMemory
  );

console.log(
  "Priority Score:",
  basicScore
);

if (
  basicScore < 0 ||
  basicScore > 1
) {
  throw new Error(
    "❌ Priority score must be between 0 and 1"
  );
}

console.log(
  "✅ TEST 1 PASSED"
);

/* ============================================================
   TEST 2 — TYPE PRIORITY
   ============================================================ */

console.log(
  "\n🧪 TEST 2: MEMORY TYPE PRIORITY"
);

const eventMemory =
  createTestMemory({
    memoryType: "event",
    importance: 0.5,
    confidence: 0.5,
  });

const topicMemory =
  createTestMemory({
    memoryType: "topic",
    importance: 0.5,
    confidence: 0.5,
  });

const eventScore =
  calculateShortTermMemoryPriority(
    eventMemory
  );

const topicScore =
  calculateShortTermMemoryPriority(
    topicMemory
  );

console.log(
  "EVENT score:",
  eventScore
);

console.log(
  "TOPIC score:",
  topicScore
);

if (
  eventScore <= topicScore
) {
  throw new Error(
    "❌ Event memory should have higher priority than topic memory"
  );
}

console.log(
  "✅ TEST 2 PASSED"
);

/* ============================================================
   TEST 3 — IMPORTANCE
   ============================================================ */

console.log(
  "\n🧪 TEST 3: IMPORTANCE"
);

const lowImportance =
  createTestMemory({
    memoryType: "context",
    importance: 0.2,
    confidence: 0.5,
  });

const highImportance =
  createTestMemory({
    memoryType: "context",
    importance: 0.9,
    confidence: 0.5,
  });

const lowScore =
  calculateShortTermMemoryPriority(
    lowImportance
  );

const highScore =
  calculateShortTermMemoryPriority(
    highImportance
  );

console.log(
  "Low importance:",
  lowScore
);

console.log(
  "High importance:",
  highScore
);

if (
  highScore <= lowScore
) {
  throw new Error(
    "❌ Higher importance should produce higher priority"
  );
}

console.log(
  "✅ TEST 3 PASSED"
);

/* ============================================================
   TEST 4 — CONFIDENCE
   ============================================================ */

console.log(
  "\n🧪 TEST 4: CONFIDENCE"
);

const lowConfidence =
  createTestMemory({
    memoryType: "context",
    importance: 0.5,
    confidence: 0.2,
  });

const highConfidence =
  createTestMemory({
    memoryType: "context",
    importance: 0.5,
    confidence: 0.9,
  });

const lowConfidenceScore =
  calculateShortTermMemoryPriority(
    lowConfidence
  );

const highConfidenceScore =
  calculateShortTermMemoryPriority(
    highConfidence
  );

console.log(
  "Low confidence:",
  lowConfidenceScore
);

console.log(
  "High confidence:",
  highConfidenceScore
);

if (
  highConfidenceScore <=
  lowConfidenceScore
) {
  throw new Error(
    "❌ Higher confidence should produce higher priority"
  );
}

console.log(
  "✅ TEST 4 PASSED"
);

/* ============================================================
   TEST 5 — RANKING ORDER
   ============================================================ */

console.log(
  "\n🧪 TEST 5: RANKING ORDER"
);

const memories: ShortTermMemory[] = [

  createTestMemory({
    memoryType: "topic",
    content: "Low priority topic",
    importance: 0.2,
    confidence: 0.4,
  }),

  createTestMemory({
    memoryType: "emotion",
    content: "Feeling nervous",
    importance: 0.8,
    confidence: 0.9,
  }),

  createTestMemory({
    memoryType: "event",
    content: "Interview tomorrow",
    importance: 1,
    confidence: 1,
  }),

  createTestMemory({
    memoryType: "context",
    content: "Casual conversation",
    importance: 0.3,
    confidence: 0.5,
  }),
];

const ranked =
  rankShortTermMemories(
    memories
  );

console.log(
  "\n🧠 RANKING RESULT:"
);

ranked.forEach(
  (item, index) => {

    console.log(
      `${index + 1}. ` +
      `[${item.priorityScore}] ` +
      `${item.memory.memoryType.toUpperCase()} → ` +
      `${item.memory.content}`
    );
  }
);

for (
  let i = 1;
  i < ranked.length;
  i++
) {

  if (
    ranked[i].priorityScore >
    ranked[i - 1].priorityScore
  ) {
    throw new Error(
      "❌ Ranking order is incorrect"
    );
  }
}

console.log(
  "✅ TEST 5 PASSED"
);

/* ============================================================
   TEST 6 — TOP N MEMORIES
   ============================================================ */

console.log(
  "\n🧪 TEST 6: TOP N MEMORIES"
);

const topTwo =
  getTopShortTermMemories(
    memories,
    2
  );

console.log(
  "\n🏆 TOP 2 MEMORIES:"
);

topTwo.forEach(
  (item, index) => {

    console.log(
      `${index + 1}. ` +
      `[${item.priorityScore}] ` +
      `${item.memory.content}`
    );
  }
);

if (
  topTwo.length !== 2
) {
  throw new Error(
    "❌ getTopShortTermMemories did not respect limit"
  );
}

if (
  topTwo[0].priorityScore <
  topTwo[1].priorityScore
) {
  throw new Error(
    "❌ Top memories are not correctly ranked"
  );
}

console.log(
  "✅ TEST 6 PASSED"
);

/* ============================================================
   FINAL RESULT
   ============================================================ */

console.log(
  "\n🎉 ALL STM PRIORITY TESTS PASSED!"
);

console.log(
  "✅ 2.5D-9D COMPLETE"
);