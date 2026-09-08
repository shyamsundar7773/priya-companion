import { Memory } from "../types/memory";
import {
    RankedLongTermMemory,
} from "./longTermMemoryPriority";

/* ============================================================
   RELATED LONG-TERM MEMORY BOOSTING
   ============================================================ */

const RELATED_MEMORY_BOOST = 0.10;

const CONCEPT_GROUPS = {
  career: [
    "career",
    "job",
    "work",
    "interview",
    "developer",
    "role",
    "company",
    "resume",
    "recruitment",
    "hiring",
    "employment",
    "professional",
  ],

  learning: [
    "learn",
    "learning",
    "study",
    "studying",
    "practice",
    "exam",
    "course",
    "coding",
    "programming",
    "sql",
    "python",
    "data",
    "developer",
  ],

  food: [
    "food",
    "eat",
    "eating",
    "ate",
    "meal",
    "lunch",
    "dinner",
    "breakfast",
    "biryani",
    "chicken",
    "rice",
    "parotta",
    "pongal",
  ],

  emotion: [
    "nervous",
    "worried",
    "worry",
    "anxious",
    "anxiety",
    "stress",
    "stressed",
    "sad",
    "happy",
    "angry",
    "excited",
    "lonely",
    "tired",
  ],

  technology: [
    "sql",
    "python",
    "javascript",
    "typescript",
    "react",
    "reactnative",
    "expo",
    "coding",
    "programming",
    "database",
    "software",
    "developer",
  ],
} as const;

type ConceptGroup = keyof typeof CONCEPT_GROUPS;

/* ============================================================
   HELPERS
   ============================================================ */

function getConceptGroups(text: string): ConceptGroup[] {
  const normalized = text.toLowerCase();

  return (Object.keys(CONCEPT_GROUPS) as ConceptGroup[]).filter(
    (group) =>
      CONCEPT_GROUPS[group].some((keyword) =>
        normalized.includes(keyword)
      )
  );
}

function calculateRelatedness(
  first: Memory,
  second: Memory
): number {
  const firstConcepts = getConceptGroups(first.content);
  const secondConcepts = getConceptGroups(second.content);

  if (
    firstConcepts.length === 0 ||
    secondConcepts.length === 0
  ) {
    return 0;
  }

  const matchingConcepts = firstConcepts.filter((concept) =>
    secondConcepts.includes(concept)
  );

  if (matchingConcepts.length === 0) {
    return 0;
  }

  return Math.min(
    1,
    matchingConcepts.length /
      Math.max(firstConcepts.length, secondConcepts.length)
  );
}

/* ============================================================
   RELATED MEMORY BOOST
   ============================================================ */

export function calculateRelatedMemoryBoost(
  candidate: Memory,
  rankedMemories: RankedLongTermMemory[]
): number {
  let strongestRelatedness = 0;

  for (const ranked of rankedMemories) {
    if (ranked.memory.id === candidate.id) {
      continue;
    }

    const relatedness = calculateRelatedness(
      candidate,
      ranked.memory
    );

    if (relatedness > strongestRelatedness) {
      strongestRelatedness = relatedness;
    }
  }

  return Number(
    Math.min(
      RELATED_MEMORY_BOOST,
      strongestRelatedness * RELATED_MEMORY_BOOST
    ).toFixed(4)
  );
}

/* ============================================================
   APPLY BOOST
   ============================================================ */

export function applyRelatedMemoryBoost(
  rankedMemories: RankedLongTermMemory[]
): RankedLongTermMemory[] {
  if (rankedMemories.length <= 1) {
    return rankedMemories;
  }

  return rankedMemories
    .map((item) => {
      const boost = calculateRelatedMemoryBoost(
        item.memory,
        rankedMemories
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
        b.relevanceScore - a.relevanceScore
    );
}

/* ============================================================
   TEST
   ============================================================ */

export function testRelatedLongTermMemory(): void {
  console.log(
    "\n🧪 RELATED LTM BOOST TEST"
  );

  const goalMemory: Memory = {
    id: "goal",
    characterId: "test-character",
    type: "goal",
    content:
      "My goal is to become an SQL developer",
    importance: 0.95,
    confidence: 0.95,
    createdAt: Date.now(),
  };

  const sqlMemory: Memory = {
    id: "sql",
    characterId: "test-character",
    type: "interest",
    content:
      "User is interested in SQL",
    importance: 0.8,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const careerMemory: Memory = {
    id: "career",
    characterId: "test-character",
    type: "fact",
    content:
      "Iam feeling nervous about my career today",
    importance: 0.7,
    confidence: 0.9,
    createdAt: Date.now(),
  };

  const ranked: RankedLongTermMemory[] = [
    {
      memory: goalMemory,
      relevanceScore: 0.63,
    },
    {
      memory: sqlMemory,
      relevanceScore: 0.50,
    },
    {
      memory: careerMemory,
      relevanceScore: 0.48,
    },
  ];

  const boosted = applyRelatedMemoryBoost(ranked);

  console.log("📊 BEFORE BOOST:");

  for (const item of ranked) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  console.log("📈 AFTER BOOST:");

  for (const item of boosted) {
    console.log(
      item.relevanceScore,
      "→",
      item.memory.content
    );
  }

  if (boosted.length !== 3) {
    throw new Error(
      "❌ Related memory boost changed memory count"
    );
  }

  if (
    boosted[0].relevanceScore <
    boosted[1].relevanceScore
  ) {
    throw new Error(
      "❌ Ranking order became invalid"
    );
  }

  console.log(
    "✅ RELATED LTM BOOST TEST PASSED"
  );
}