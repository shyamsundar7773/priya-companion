import {
    rankLongTermMemories,
} from "./longTermMemoryPriority";

import { Memory } from "../types/memory";

/* ============================================================
   TEST MEMORIES
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
    id: "career-goal",
    characterId: "test",
    type: "goal",
    content: "User is focused on building a career",
    importance: 0.9,
    confidence: 0.9,
    createdAt: Date.now(),
  },

  {
    id: "nervous",
    characterId: "test",
    type: "fact",
    content: "User is feeling nervous about career",
    importance: 0.7,
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
];

/* ============================================================
   TEST 1 — SQL CONTEXT
   ============================================================ */

function testSQLContext(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am practicing SQL joins"
    );

  console.log(
    "\n🧪 CONTEXT TEST 1 — SQL"
  );

  for (const item of ranked) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  const hasSQL =
    ranked.some(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("sql")
    );

  if (!hasSQL) {
    throw new Error(
      "❌ SQL context was not recalled"
    );
  }

  console.log(
    "✅ SQL context passed"
  );
}

/* ============================================================
   TEST 2 — CAREER CONTEXT
   ============================================================ */

function testCareerContext(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am preparing for an interview"
    );

  console.log(
    "\n🧪 CONTEXT TEST 2 — CAREER"
  );

  for (const item of ranked) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  const hasCareer =
    ranked.some(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("career")
    );

  if (!hasCareer) {
    throw new Error(
      "❌ Career context was not recalled"
    );
  }

  console.log(
    "✅ Career context passed"
  );
}

/* ============================================================
   TEST 3 — EMOTIONAL CONTEXT
   ============================================================ */

function testEmotionContext(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am feeling nervous today"
    );

  console.log(
    "\n🧪 CONTEXT TEST 3 — EMOTION"
  );

  const hasEmotion =
    ranked.some(
      (item) =>
        item.memory.content
          .toLowerCase()
          .includes("nervous")
    );

  if (!hasEmotion) {
    throw new Error(
      "❌ Emotional context was not recalled"
    );
  }

  console.log(
    "✅ Emotional context passed"
  );
}

/* ============================================================
   TEST 4 — UNRELATED MEMORY
   ============================================================ */

function testUnrelatedMemory(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "I am practicing SQL"
    );

  console.log(
    "\n🧪 CONTEXT TEST 4 — UNRELATED"
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
   TEST 5 — GREETING
   ============================================================ */

function testGreeting(): void {

  const ranked =
    rankLongTermMemories(
      memories,
      "hello"
    );

  console.log(
    "\n🧪 CONTEXT TEST 5 — GREETING"
  );

  if (ranked.length !== 0) {
    throw new Error(
      "❌ Greeting should not recall memories"
    );
  }

  console.log(
    "✅ Greeting context passed"
  );
}

/* ============================================================
   RUN
   ============================================================ */

export function testLongTermMemoryContext(): void {

  console.log(
    "\n========================================"
  );

  console.log(
    "🧠 LTM CONTEXT RECALL TEST"
  );

  console.log(
    "========================================"
  );

  testSQLContext();
  testCareerContext();
  testEmotionContext();
  testUnrelatedMemory();
  testGreeting();

  console.log(
    "\n🎉 ALL CONTEXT TESTS PASSED"
  );
}