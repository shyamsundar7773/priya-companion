import {
  getCharacterMemories,
} from "./memoryService";

import type { Memory } from "../types/memory";

import {
  classifyRecallIntent,
  type RecallIntent,
} from "./memoryIntent";

const SUPPRESSED_MEMORY_CONFIDENCE = 0.20;

export type MemoryRecallContext = {
  intent: RecallIntent;
  memories: Memory[];
  text: string;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(text: string): string[] {
  return [...new Set(
    normalize(text)
      .replace(/'/g, "")
      .split(/\s+/)
      .filter((word) => word.length >= 3)
  )];
}

function timestamp(memory: Memory): number {
  const value = (memory as any).createdAt
    ?? (memory as any).updatedAt
    ?? (memory as any).lastUsedAt
    ?? 0;

  if (typeof value === "number") return value;

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function relevance(memory: Memory, query: string): number {
  const queryWords = getWords(query);
  const memoryWords = getWords(memory.content);

  if (!queryWords.length || !memoryWords.length) return 0;

  const matches = queryWords.filter((word) =>
    memoryWords.includes(word)
  );

  return matches.length / queryWords.length;
}

function stateScore(memory: Memory, query: string): number {
  const text = normalize(memory.content);
  const queryText = normalize(query);
  let score = relevance(memory, query) * 10;

  const stateWords = [
    "current",
    "currently",
    "latest",
    "plan",
    "planning",
    "goal",
    "decision",
    "focus",
    "want",
    "learn",
    "work",
    "interested",
    "main focus",
  ];

  for (const word of stateWords) {
    if (queryText.includes(word) && text.includes(word)) score += 2;
  }

  if (/\b(i am|i'm|i want|i plan|i am planning|i'm planning|i decided|i have decided)\b/.test(text)) {
    score += 2;
  }

  return score;
}

export async function buildMemoryRecallContext(
  characterId: string,
  userMessage: string
): Promise<MemoryRecallContext> {
  const intent = classifyRecallIntent(userMessage);

  if (!characterId || !userMessage.trim()) {
    return { intent, memories: [], text: "" };
  }

  const allMemories = await getCharacterMemories(characterId);

  if (!allMemories.length) {
    return { intent, memories: [], text: "" };
  }

  if (intent === "HISTORICAL") {
    const ordered = [...allMemories]
      .sort((a, b) => timestamp(a) - timestamp(b));

    const relevant = ordered
      .filter((memory) => relevance(memory, userMessage) > 0)
      .slice(-20);

    const selected = relevant.length
      ? relevant
      : ordered.slice(-12);

    const text = selected.map((memory) => {
      const status = memory.confidence <= SUPPRESSED_MEMORY_CONFIDENCE
        ? "SUPPRESSED / PAST"
        : "ACTIVE";
      return `- [${status}] ${memory.content}`;
    }).join("\n");

    console.log("🧠 MEMORY RECALL: HISTORICAL", {
      total: allMemories.length,
      selected: selected.length,
    });

    return { intent, memories: selected, text };
  }

  const active = allMemories
    .filter((memory) => memory.confidence > SUPPRESSED_MEMORY_CONFIDENCE);

  const ranked = [...active].sort((a, b) => {
    const scoreDiff = stateScore(b, userMessage) - stateScore(a, userMessage);
    if (scoreDiff !== 0) return scoreDiff;
    return timestamp(b) - timestamp(a);
  });

  const selected = ranked.slice(0, 8);

  const text = selected.map((memory) =>
    `- [CURRENT ACTIVE] ${memory.content}`
  ).join("\n");

  console.log("🧠 MEMORY RECALL: CURRENT", {
    total: allMemories.length,
    active: active.length,
    selected: selected.length,
  });

  return { intent, memories: selected, text };
}
