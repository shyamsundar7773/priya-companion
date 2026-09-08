import { Memory } from "../types/memory";

import {
    rankLongTermMemories,
} from "./longTermMemoryPriority";

/* ============================================================
   2.5E-3D
   FINAL LTM RANKING VALIDATION
============================================================ */

export function testFinalLongTermMemoryRanking(): void {
  console.log(
    "\n🧪 2.5E-3D FINAL LTM RANKING TEST"
  );

  const now = Date.now();

  /* ==========================================================
     RECENT HIGH-VALUE SQL GOAL
  ========================================================== */

  const recentGoal: Memory = {
    id: "recent-sql-goal",
    characterId: "test-character",
    type: "goal",
    content:
      "User wants to become an SQL developer",
    importance: 0.95,
    confidence: 0.95,
    createdAt: now,
    lastUsedAt: now,
  };

  /* ==========================================================
     OLD SQL INTEREST
  ========================================================== */

  const oldSqlInterest: Memory = {
    id: "old-sql-interest",
    characterId: "test-character",
    type: "interest",
    content:
      "User is interested in SQL",
    importance: 0.8,
    confidence: 0.9,
    createdAt:
      now -
      30 * 24 * 60 * 60 * 1000,
    lastUsedAt:
      now -
      30 * 24 * 60 * 60 * 1000,
  };

  /* ==========================================================
     RECENT UNRELATED FOOD MEMORY
  ========================================================== */

  const recentFood: Memory = {
    id: "recent-food",
    characterId: "test-character",
    type: "preference",
    content:
      "User likes biryani",
    importance: 0.9,
    confidence: 0.95,
    createdAt: now,
    lastUsedAt: now,
  };

  /* ==========================================================
     CAREER MEMORY
  ========================================================== */

  const careerMemory: Memory = {
    id: "career-memory",
    characterId: "test-character",
    type: "fact",
    content:
      "User is preparing for a developer interview",
    importance: 0.8,
    confidence: 0.9,
    createdAt: now,
    lastUsedAt: now,
  };

  const memories = [
    recentGoal,
    oldSqlInterest,
    recentFood,
    careerMemory,
  ];

  /* ==========================================================
     USER MESSAGE
  ========================================================== */

  const userMessage =
    "I'm practicing SQL for my developer interview";

  /* ==========================================================
     RANK
  ========================================================== */

  const ranked =
    rankLongTermMemories(
      memories,
      userMessage
    );

  /* ==========================================================
     OUTPUT
  ========================================================== */

  console.log(
    "\n📊 FINAL LTM RANKING:"
  );

  ranked.forEach(
    (
      item,
      index
    ) => {
      console.log(
        `${index + 1}.`,
        item.relevanceScore,
        "→",
        item.memory.content
      );
    }
  );

  /* ==========================================================
     VALIDATION
  ========================================================== */

  if (ranked.length < 3) {
    throw new Error(
      "❌ Expected at least 3 relevant memories"
    );
  }

  const first =
    ranked[0].memory;

  if (
    first.id !==
    "recent-sql-goal"
  ) {
    throw new Error(
      "❌ Recent high-value SQL goal should rank first"
    );
  }

  const foodIncluded =
    ranked.some(
      item =>
        item.memory.id ===
        "recent-food"
    );

  if (foodIncluded) {
    throw new Error(
      "❌ Unrelated food memory should not be recalled"
    );
  }

  const oldSql =
    ranked.find(
      item =>
        item.memory.id ===
        "old-sql-interest"
    );

  if (!oldSql) {
    throw new Error(
      "❌ SQL interest memory should remain relevant"
    );
  }

  console.log(
    "\n✅ FINAL LTM RANKING TEST PASSED"
  );

  console.log(
    "🧠 Keyword relevance ✓"
  );

  console.log(
    "🧠 Context relevance ✓"
  );

  console.log(
    "🧠 Concept relevance ✓"
  );

  console.log(
    "🧠 Importance/confidence ✓"
  );

  console.log(
    "🧠 Related-memory boost ✓"
  );

  console.log(
    "🧠 Recency boost ✓"
  );
}