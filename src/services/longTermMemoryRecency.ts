import { Memory } from "../types/memory";

/* ============================================================
   LONG-TERM MEMORY RECENCY & USAGE BOOST
   ============================================================ */

const MAX_RECENCY_BOOST = 0.08;

/* ============================================================
   RECENCY SCORE
   ============================================================ */

export function calculateLongTermMemoryRecency(
  memory: Memory
): number {
  if (!memory.lastUsedAt) {
    return 0.5;
  }

  const ageMs = Date.now() - memory.lastUsedAt;

  if (ageMs < 0) {
    return 1;
  }

  const ageDays =
    ageMs / (1000 * 60 * 60 * 24);

  /*
   * Recent usage decays gradually.
   * Half-life is intentionally gentle so old
   * but important memories do not disappear.
   */
  const recency = Math.exp(
    -ageDays / 14
  );

  return Math.max(
    0,
    Math.min(1, recency)
  );
}

/* ============================================================
   USAGE BOOST
   ============================================================ */

export function calculateLongTermMemoryRecencyBoost(
  memory: Memory
): number {
  const recency =
    calculateLongTermMemoryRecency(memory);

  return Number(
    Math.min(
      MAX_RECENCY_BOOST,
      recency * MAX_RECENCY_BOOST
    ).toFixed(4)
  );
}

/* ============================================================
   APPLY RECENCY BOOST
   ============================================================ */

export function applyLongTermMemoryRecencyBoost(
  memories: {
    memory: Memory;
    relevanceScore: number;
  }[]
) {
  return memories
    .map((item) => {
      const boost =
        calculateLongTermMemoryRecencyBoost(
          item.memory
        );

      return {
        ...item,
        relevanceScore: Number(
          Math.min(
            1,
            item.relevanceScore + boost
          ).toFixed(4)
        ),
      };
    })
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    );
}

/* ============================================================
   TEST
   ============================================================ */

export function testLongTermMemoryRecency(): void {
  console.log(
    "\n🧪 LTM RECENCY BOOST TEST"
  );

  const recentMemory: Memory = {
    id: "recent",
    characterId: "test-character",
    type: "interest",
    content: "User is interested in SQL",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };

  const oldMemory: Memory = {
    id: "old",
    characterId: "test-character",
    type: "interest",
    content: "User is interested in Python",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
    lastUsedAt:
      Date.now() -
      30 * 24 * 60 * 60 * 1000,
  };

  const recentBoost =
    calculateLongTermMemoryRecencyBoost(
      recentMemory
    );

  const oldBoost =
    calculateLongTermMemoryRecencyBoost(
      oldMemory
    );

  console.log(
    "Recent memory boost:",
    recentBoost
  );

  console.log(
    "Old memory boost:",
    oldBoost
  );

  if (recentBoost <= oldBoost) {
    throw new Error(
      "❌ Recent memory should receive a higher boost"
    );
  }

  if (recentBoost > MAX_RECENCY_BOOST) {
    throw new Error(
      "❌ Recency boost exceeded maximum"
    );
  }

  console.log(
    "✅ LTM RECENCY BOOST TEST PASSED"
  );
}