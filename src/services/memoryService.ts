import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    Memory,
    MemoryType,
} from "../types/memory";

const MEMORY_STORAGE_KEY =
  "@priya_companion_memories";

/* ============================================================
   GET ALL MEMORIES
   ============================================================ */

export async function getMemories(): Promise<Memory[]> {
  try {
    const stored =
      await AsyncStorage.getItem(
        MEMORY_STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed: Memory[] =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Failed to load memories:",
      error
    );

    return [];
  }
}

/* ============================================================
   GET CHARACTER MEMORIES
   ============================================================ */

export async function getCharacterMemories(
  characterId: string
): Promise<Memory[]> {
  const memories =
    await getMemories();

  return memories.filter(
    (memory) =>
      memory.characterId === characterId
  );
}

/* ============================================================
   SAVE ALL MEMORIES
   ============================================================ */

async function saveMemories(
  memories: Memory[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      MEMORY_STORAGE_KEY,
      JSON.stringify(memories)
    );
  } catch (error) {
    console.error(
      "Failed to save memories:",
      error
    );
  }
}

/* ============================================================
   ADD MEMORY
   ============================================================ */

export async function addMemory(
  characterId: string,
  type: MemoryType,
  content: string,
  importance = 0.5,
  confidence = 0.5
): Promise<Memory> {

  const memories =
    await getMemories();

  const existing =
    memories.find(
      (memory) =>
        memory.characterId === characterId &&
        memory.content.toLowerCase() ===
          content.toLowerCase()
    );

  if (existing) {
    existing.confidence = Math.min(
      1,
      existing.confidence + 0.05
    );

    existing.lastUsedAt =
      Date.now();

    await saveMemories(memories);

    return existing;
  }

  const memory: Memory = {
    id: `memory-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    characterId,

    type,

    content,

    importance,

    confidence,

    createdAt: Date.now(),

    lastUsedAt: Date.now(),
  };

  memories.push(memory);

  await saveMemories(memories);

  return memory;
}

/* ============================================================
   UPDATE MEMORY
   ============================================================ */

export async function updateMemory(
  memoryId: string,
  updates: Partial<Memory>
): Promise<void> {

  const memories =
    await getMemories();

  const index =
    memories.findIndex(
      (memory) =>
        memory.id === memoryId
    );

  if (index === -1) {
    return;
  }

  memories[index] = {
    ...memories[index],
    ...updates,
    lastUsedAt: Date.now(),
  };

  await saveMemories(memories);
}

/* ============================================================
   REMOVE MEMORY
   ============================================================ */

export async function removeMemory(
  memoryId: string
): Promise<void> {

  const memories =
    await getMemories();

  const updated =
    memories.filter(
      (memory) =>
        memory.id !== memoryId
    );

  await saveMemories(updated);
}

/* ============================================================
   CLEAR CHARACTER MEMORIES
   ============================================================ */

export async function clearCharacterMemories(
  characterId: string
): Promise<void> {

  const memories =
    await getMemories();

  const updated =
    memories.filter(
      (memory) =>
        memory.characterId !== characterId
    );

  await saveMemories(updated);
}

export async function testMemorySystem(): Promise<void> {
  const memory = await addMemory(
    "priya",
    "interest",
    "User is learning SQL",
    0.8,
    0.9
  );

  console.log("🧠 MEMORY TEST:", memory);

  const memories =
    await getCharacterMemories("priya");

  console.log(
    "🧠 ALL PRIYA MEMORIES:",
    memories
  );
}