const storage = new Map();

const AsyncStorage = {
  async getItem(key) {
    return storage.has(key)
      ? storage.get(key)
      : null;
  },

  async setItem(key, value) {
    storage.set(key, value);
  },
};

// ============================================================
// MEMORY LOGIC TEST
// ============================================================

const MEMORY_STORAGE_KEY =
  "@priya_companion_memories";

async function getMemories() {
  const stored =
    await AsyncStorage.getItem(
      MEMORY_STORAGE_KEY
    );

  if (!stored) {
    return [];
  }

  return JSON.parse(stored);
}

async function saveMemories(memories) {
  await AsyncStorage.setItem(
    MEMORY_STORAGE_KEY,
    JSON.stringify(memories)
  );
}

async function addMemory(
  characterId,
  type,
  content,
  importance = 0.5,
  confidence = 0.5
) {
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

    existing.lastUsedAt = Date.now();

    await saveMemories(memories);

    return existing;
  }

  const memory = {
    id:
      `memory-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8),

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

// ============================================================
// TEST
// ============================================================

async function runTest() {
  console.log("\n🧠 ===============================");
  console.log("   PRIYA MEMORY SYSTEM TEST");
  console.log("===============================\n");

  console.log("1️⃣ Adding memory...\n");

  const memory =
    await addMemory(
      "priya",
      "interest",
      "User is learning SQL",
      0.8,
      0.9
    );

  console.log(memory);

  console.log(
    "\n2️⃣ Reading memories...\n"
  );

  const memories =
    await getMemories();

  console.log(memories);

  console.log(
    "\n3️⃣ Testing duplicate memory...\n"
  );

  const duplicate =
    await addMemory(
      "priya",
      "interest",
      "User is learning SQL",
      0.8,
      0.9
    );

  console.log(duplicate);

  console.log(
    "\n4️⃣ Final memories...\n"
  );

  console.log(
    await getMemories()
  );

  console.log(
    "\n✅ MEMORY SYSTEM TEST COMPLETED\n"
  );
}

runTest();