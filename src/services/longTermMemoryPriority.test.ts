import {
    getTopLongTermMemories,
    rankLongTermMemories,
    removeSimilarLongTermMemories,
} from "./longTermMemoryPriority";

import { Memory } from "../types/memory";

/* ============================================================
   TEST DATA
   ============================================================ */

const memories: Memory[] = [
  {
    id: "sql-interest",
    characterId: "test",
    type: "interest",
    content: "User is interested in SQL",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  },

  {
    id: "sql-goal",
    characterId: "test",
    type: "goal",
    content: "User wants to become an SQL developer",
    importance: 0.95,
    confidence: 0.95,
    createdAt: Date.now(),
  },

  {
    id: "career",
    characterId: "test",
    type: "goal",
    content: "User is focused on building a career",
    importance: 0.9,
    confidence: 0.9,
    createdAt: Date.now(),
  },

  {
    id: "biryani",
    characterId: "test",
    type: "preference",
    content: "User likes biryani",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  },

  {
    id: "python",
    characterId: "test",
    type: "interest",
    content: "User is interested in Python",
    importance: 0.7,
    confidence: 0.8,
    createdAt: Date.now(),
  },

  {
    id: "nervous-1",
    characterId: "test",
    type: "fact",
    content: "User is feeling nervous about career",
    importance: 0.7,
    confidence: 0.9,
    createdAt: Date.now(),
  },

  {
    id: "nervous-2",
    characterId: "test",
    type: "fact",
    content: "User feels nervous about their career",
    importance: 0.7,
    confidence: 0.9,
    createdAt: Date.now(),
  },
];

/* ============================================================
   TEST 1
   SQL RECALL
   ============================================================ */

function testSQLRecall(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am practicing SQL joins"
    );

  console.log(
    "\n🧪 TEST 1 — SQL RECALL"
  );

  for (const item of ranked) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  if (ranked.length === 0) {
    throw new Error(
      "❌ SQL memories were not recalled"
    );
  }

  const hasSQLMemory =
    ranked.some(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("sql")
    );

  if (!hasSQLMemory) {
    throw new Error(
      "❌ SQL memory missing"
    );
  }

  console.log(
    "✅ SQL recall passed"
  );
}

/* ============================================================
   TEST 2
   UNRELATED MEMORY FILTER
   ============================================================ */

function testUnrelatedMemoryFiltering(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am practicing SQL joins"
    );

  console.log(
    "\n🧪 TEST 2 — UNRELATED FILTER"
  );

  const hasBiryani =
    ranked.some(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("biryani")
    );

  if (hasBiryani) {
    throw new Error(
      "❌ Unrelated biryani memory was recalled"
    );
  }

  console.log(
    "✅ Unrelated memory filtered"
  );
}

/* ============================================================
   TEST 3
   TOP LIMIT
   ============================================================ */

function testTopLimit(): void {

  const top =
    getTopLongTermMemories(
      memories,
      "I am practicing SQL joins",
      2
    );

  console.log(
    "\n🧪 TEST 3 — TOP LIMIT"
  );

  console.log(
    "Selected:",
    top.length
  );

  if (top.length > 2) {
    throw new Error(
      "❌ LTM limit failed"
    );
  }

  console.log(
    "✅ Top limit passed"
  );
}

/* ============================================================
   TEST 4
   SIMILAR MEMORY FILTER
   ============================================================ */

function testSimilarMemoryFiltering(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I feel nervous about my career"
    );

  const filtered =
    removeSimilarLongTermMemories(
      ranked,
      0.6
    );

  console.log(
    "\n🧪 TEST 4 — SIMILAR MEMORY FILTER"
  );

  console.log(
    "Before:",
    ranked.length
  );

  console.log(
    "After:",
    filtered.length
  );

  const nervousMemories =
    filtered.filter(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("nervous")
    );

  if (nervousMemories.length > 1) {
    throw new Error(
      "❌ Similar nervous memories were not filtered"
    );
  }

  console.log(
    "✅ Similar memory filtering passed"
  );
}

/* ============================================================
   TEST 5
   GREETING
   ============================================================ */

function testGreeting(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "hi"
    );

  console.log(
    "\n🧪 TEST 5 — GREETING"
  );

  if (ranked.length !== 0) {
    throw new Error(
      "❌ Greeting should not recall LTM"
    );
  }

  console.log(
    "✅ Greeting test passed"
  );
}

/* ============================================================
   RUN TESTS
   ============================================================ */

export function testLongTermMemoryRecall(): void {

  console.log(
    "\n========================================"
  );

  console.log(
    "🧠 LTM RECALL TEST SUITE"
  );

  console.log(
    "========================================"
  );

  testSQLRecall();
  testUnrelatedMemoryFiltering();
  testTopLimit();
  testSimilarMemoryFiltering();
  testGreeting();

  console.log(
    "\n🎉 ALL LTM RECALL TESTS PASSED"
  );
}