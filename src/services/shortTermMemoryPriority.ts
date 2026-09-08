import {
    getCharacterShortTermMemories,
    ShortTermMemory,
    ShortTermMemoryType,
} from "./shortTermMemoryService";

/* ============================================================
   RANKED MEMORY TYPE
   ============================================================ */

export type RankedShortTermMemory = {
  memory: ShortTermMemory;
  priorityScore: number;
};

/* ============================================================
   MEMORY TYPE WEIGHTS
   ============================================================ */

const MEMORY_TYPE_WEIGHTS: Record<
  ShortTermMemoryType,
  number
> = {
  event: 1.0,
  goal: 0.95,
  emotion: 0.9,
  relationship: 0.85,
  preference: 0.75,
  topic: 0.65,
  context: 0.55,
  other: 0.4,
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
   RECENCY SCORE
   ============================================================ */

function calculateRecencyScore(
  createdAt: string
): number {

  const createdTime =
    new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return 0.5;
  }

  const ageMs =
    Math.max(
      0,
      Date.now() - createdTime
    );

  const ageDays =
    ageMs /
    (24 * 60 * 60 * 1000);

  /*
   * Memory loses relevance gradually
   * over approximately one week.
   */

  const recency =
    Math.exp(
      -ageDays / 7
    );

  return clamp(recency);
}

/* ============================================================
   PRIORITY SCORE
   ============================================================ */

export function calculateShortTermMemoryPriority(
  memory: ShortTermMemory
): number {

  const importance =
    clamp(memory.importance);

  const confidence =
    clamp(memory.confidence);

  const recency =
    calculateRecencyScore(
      memory.createdAt
    );

  const typeWeight =
    MEMORY_TYPE_WEIGHTS[
      memory.memoryType
    ] ?? 0.4;

  /*
   * Priority formula:
   *
   * Importance  → 35%
   * Confidence  → 20%
   * Recency     → 20%
   * Type        → 25%
   */

  const score =
    importance * 0.35 +
    confidence * 0.20 +
    recency * 0.20 +
    typeWeight * 0.25;

  return Number(
    clamp(score).toFixed(4)
  );
}

/* ============================================================
   RANK MEMORIES
   ============================================================ */

export function rankShortTermMemories(
  memories: ShortTermMemory[]
): RankedShortTermMemory[] {

  return memories
    .map((memory) => ({
      memory,
      priorityScore:
        calculateShortTermMemoryPriority(
          memory
        ),
    }))
    .sort(
      (a, b) =>
        b.priorityScore -
        a.priorityScore
    );
}

/* ============================================================
   GET TOP MEMORIES
   ============================================================ */

export function getTopShortTermMemories(
  memories: ShortTermMemory[],
  limit = 10
): RankedShortTermMemory[] {

  return rankShortTermMemories(
    memories
  ).slice(
    0,
    Math.max(0, limit)
  );
}

/* ============================================================
   GET RANKED CHARACTER MEMORIES
   ============================================================ */

export async function getRankedCharacterShortTermMemories(
  characterId: string,
  limit = 10
): Promise<RankedShortTermMemory[]> {

  /*
   * Retrieve active STM memories.
   */

  const memories =
    await getCharacterShortTermMemories(
      characterId,
      50
    );

  /*
   * Safety filter:
   * remove memories that have already expired.
   */

  const activeMemories =
    memories.filter(
      (memory) => {

        if (!memory.expiresAt) {
          return true;
        }

        return (
          new Date(
            memory.expiresAt
          ).getTime() >
          Date.now()
        );
      }
    );

  /*
   * Rank the active memories.
   */

  return getTopShortTermMemories(
    activeMemories,
    limit
  );
}

/* ============================================================
   LOG RANKING
   ============================================================ */

export function logShortTermMemoryRanking(
  memories: ShortTermMemory[]
): void {

  const ranked =
    rankShortTermMemories(
      memories
    );

  console.log(
    "🧠 STM PRIORITY RANKING:"
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
}

/* ============================================================
   LOG CHARACTER RANKING
   ============================================================ */

export async function logRankedCharacterShortTermMemories(
  characterId: string,
  limit = 10
): Promise<void> {

  const ranked =
    await getRankedCharacterShortTermMemories(
      characterId,
      limit
    );

  console.log(
    "🧠 RANKED CHARACTER STM:"
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
}