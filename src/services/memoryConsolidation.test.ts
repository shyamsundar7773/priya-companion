import {
  clearAllMemories,
  clearCharacterMemories,
  getCharacterMemories,
} from "./memoryService";

import {
  calculateConfidence,
  calculateImportance,
  consolidateCandidate,
  consolidateMessage,
  consolidateShortTermMemories,
  consolidateShortTermMemory,
  formatConsolidatedMemoriesForPrompt,
  getConsolidatedMemories,
  isTransientConversation,
  MemoryCandidate,
  ShortTermMemoryInput,
} from "./memoryConsolidation";

/* ============================================================
   TEST RUNNER UTILITY
   ============================================================ */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

/* ============================================================
   TEST SUITE
   ============================================================ */

export async function runMemoryConsolidationTests(): Promise<void> {
  console.log("\n============================================================");
  console.log("🧠 MEMORY CONSOLIDATION SYSTEM TEST SUITE");
  console.log("============================================================\n");

  let passedTests = 0;
  const totalTests = 7;

  // ----------------------------------------------------------
  // TEST 1: Important preference is remembered
  // ----------------------------------------------------------
  console.log("🧪 Running Test 1: Important preference is remembered...");
  await clearAllMemories();

  const preferenceMessage = "I prefer dark mode for all my coding environments";
  const prefResults = await consolidateMessage("priya", preferenceMessage);

  assert(prefResults.length > 0, "Expected at least one consolidation result");
  assert(
    prefResults[0].action === "created",
    `Expected action to be 'created', got '${prefResults[0].action}'`
  );
  assert(
    prefResults[0].candidate.category === "preference",
    `Expected category 'preference', got '${prefResults[0].candidate.category}'`
  );
  assert(
    prefResults[0].candidate.importance >= 0.70,
    `Expected importance >= 0.70, got ${prefResults[0].candidate.importance}`
  );
  assert(
    prefResults[0].candidate.confidence >= 0.70,
    `Expected confidence >= 0.70, got ${prefResults[0].candidate.confidence}`
  );

  const priyaMemoriesTest1 = await getCharacterMemories("priya");
  assert(
    priyaMemoriesTest1.length === 1,
    `Expected 1 memory stored for Priya, found ${priyaMemoriesTest1.length}`
  );
  assert(
    priyaMemoriesTest1[0].content.toLowerCase().includes("dark mode"),
    `Expected memory content to include 'dark mode', got '${priyaMemoriesTest1[0].content}'`
  );

  console.log("✅ TEST 1 PASSED: Important preference is remembered.\n");
  passedTests++;

  // ----------------------------------------------------------
  // TEST 2: Meaningful event is remembered
  // ----------------------------------------------------------
  console.log("🧪 Running Test 2: Meaningful event is remembered...");
  await clearAllMemories();

  const eventMessage =
    "I have a technical interview for a senior SQL developer position tomorrow";
  const eventResults = await consolidateMessage("priya", eventMessage);

  assert(eventResults.length > 0, "Expected at least one consolidation result");
  assert(
    eventResults[0].action === "created",
    `Expected action to be 'created', got '${eventResults[0].action}'`
  );
  assert(
    eventResults[0].candidate.category === "episodic" ||
      eventResults[0].candidate.type === "event",
    "Expected candidate to be categorized as episodic or event"
  );
  assert(
    eventResults[0].candidate.importance >= 0.75,
    `Expected high importance (>= 0.75), got ${eventResults[0].candidate.importance}`
  );

  const priyaMemoriesTest2 = await getCharacterMemories("priya");
  assert(
    priyaMemoriesTest2.length === 1,
    `Expected 1 memory stored, found ${priyaMemoriesTest2.length}`
  );
  assert(
    priyaMemoriesTest2[0].content.toLowerCase().includes("interview"),
    "Expected memory content to include 'interview'"
  );

  console.log("✅ TEST 2 PASSED: Meaningful event is remembered.\n");
  passedTests++;

  // ----------------------------------------------------------
  // TEST 3: Normal greeting/small talk is not stored as durable memory
  // ----------------------------------------------------------
  console.log(
    "🧪 Running Test 3: Normal greeting/small talk is not stored as durable memory..."
  );
  await clearAllMemories();

  const smallTalkMessages = [
    "Hello Priya!",
    "Hey, how are you doing today?",
    "Good morning!",
    "ok cool thanks",
    "sounds good bye",
  ];

  for (const message of smallTalkMessages) {
    const isTransient = isTransientConversation(message);
    assert(
      isTransient,
      `Expected message '${message}' to be recognized as transient conversation`
    );

    const results = await consolidateMessage("priya", message);
    assert(
      results.length > 0 && results[0].action === "rejected_transient",
      `Expected '${message}' to be rejected_transient, got '${results[0]?.action}'`
    );
  }

  const priyaMemoriesTest3 = await getCharacterMemories("priya");
  assert(
    priyaMemoriesTest3.length === 0,
    `Expected 0 durable memories stored from small talk, found ${priyaMemoriesTest3.length}`
  );

  console.log(
    "✅ TEST 3 PASSED: Normal greeting/small talk is filtered out.\n"
  );
  passedTests++;

  // ----------------------------------------------------------
  // TEST 4: Duplicate memories are avoided
  // ----------------------------------------------------------
  console.log("🧪 Running Test 4: Duplicate memories are avoided...");
  await clearAllMemories();

  const originalMessage = "I love playing badminton every weekend";
  const firstResult = await consolidateMessage("priya", originalMessage);
  assert(
    firstResult[0].action === "created",
    "First submission should be created"
  );

  const memoriesAfterFirst = await getCharacterMemories("priya");
  assert(
    memoriesAfterFirst.length === 1,
    `Expected 1 memory, got ${memoriesAfterFirst.length}`
  );

  // Exact duplicate
  const secondResult = await consolidateMessage("priya", originalMessage);
  assert(
    secondResult[0].action === "skipped_duplicate",
    `Expected 'skipped_duplicate', got '${secondResult[0].action}'`
  );

  // Slight punctuation / casing variation duplicate
  const thirdResult = await consolidateMessage(
    "priya",
    "I love playing badminton every weekend!"
  );
  assert(
    thirdResult[0].action === "skipped_duplicate",
    `Expected 'skipped_duplicate' for variation, got '${thirdResult[0].action}'`
  );

  const memoriesAfterDuplicates = await getCharacterMemories("priya");
  assert(
    memoriesAfterDuplicates.length === 1,
    `Expected still 1 memory after duplicate attempts, got ${memoriesAfterDuplicates.length}`
  );

  console.log("✅ TEST 4 PASSED: Duplicate memories are avoided.\n");
  passedTests++;

  // ----------------------------------------------------------
  // TEST 5: Updated information updates the existing memory
  // ----------------------------------------------------------
  console.log(
    "🧪 Running Test 5: Updated information updates the existing memory..."
  );
  await clearAllMemories();

  // Initial preference
  await consolidateMessage("priya", "I prefer working with dark theme");
  const initialMemories = await getCharacterMemories("priya");
  assert(initialMemories.length === 1, "Initial memory should be created");
  assert(
    initialMemories[0].content.toLowerCase().includes("dark theme") ||
      initialMemories[0].content.toLowerCase().includes("dark"),
    "Initial memory should mention dark"
  );
  const originalMemoryId = initialMemories[0].id;

  // New updated preference overriding the previous one
  const updateResults = await consolidateMessage(
    "priya",
    "Actually, I changed my mind, I now prefer working with light theme"
  );

  assert(
    updateResults[0].action === "updated",
    `Expected action 'updated', got '${updateResults[0].action}'`
  );
  assert(
    updateResults[0].memory?.id === originalMemoryId,
    "Expected existing memory record to be updated in place"
  );

  const updatedMemories = await getCharacterMemories("priya");
  assert(
    updatedMemories.length === 1,
    `Expected 1 memory after update (no conflicting duplicate), got ${updatedMemories.length}`
  );
  assert(
    updatedMemories[0].content.toLowerCase().includes("light theme") ||
      updatedMemories[0].content.toLowerCase().includes("light"),
    `Expected updated memory to mention light theme, got: ${updatedMemories[0].content}`
  );

  console.log(
    "✅ TEST 5 PASSED: Updated information updates the existing memory.\n"
  );
  passedTests++;

  // ----------------------------------------------------------
  // TEST 6: Priya's memory is isolated from another character's memory
  // ----------------------------------------------------------
  console.log(
    "🧪 Running Test 6: Priya's memory is isolated from another character's memory..."
  );
  await clearAllMemories();

  // Add memory for Priya
  await consolidateMessage("priya", "My name is Priya and I love coding TypeScript");

  // Add memory for another character (e.g. 'alex')
  await consolidateMessage("alex", "My name is Alex and I enjoy playing the guitar");

  const priyaOnlyMemories = await getCharacterMemories("priya");
  const alexOnlyMemories = await getCharacterMemories("alex");

  assert(
    priyaOnlyMemories.length === 1,
    `Expected 1 memory for Priya, got ${priyaOnlyMemories.length}`
  );
  assert(
    alexOnlyMemories.length === 1,
    `Expected 1 memory for Alex, got ${alexOnlyMemories.length}`
  );

  assert(
    priyaOnlyMemories[0].characterId === "priya",
    "Priya memory must have characterId 'priya'"
  );
  assert(
    priyaOnlyMemories[0].content.toLowerCase().includes("typescript"),
    "Priya's memory should contain TypeScript"
  );
  assert(
    !priyaOnlyMemories[0].content.toLowerCase().includes("guitar"),
    "Priya's memory MUST NOT contain Alex's guitar memory"
  );

  assert(
    alexOnlyMemories[0].characterId === "alex",
    "Alex memory must have characterId 'alex'"
  );
  assert(
    alexOnlyMemories[0].content.toLowerCase().includes("guitar"),
    "Alex's memory should contain guitar"
  );
  assert(
    !alexOnlyMemories[0].content.toLowerCase().includes("typescript"),
    "Alex's memory MUST NOT contain Priya's TypeScript memory"
  );

  // Clearing Alex's memory should NOT affect Priya
  await clearCharacterMemories("alex");
  const priyaAfterAlexClear = await getCharacterMemories("priya");
  const alexAfterClear = await getCharacterMemories("alex");
  assert(
    priyaAfterAlexClear.length === 1,
    "Priya's memory must remain untouched after clearing Alex's memories"
  );
  assert(
    alexAfterClear.length === 0,
    "Alex's memories should now be cleared"
  );

  console.log(
    "✅ TEST 6 PASSED: Priya's memory is strictly isolated from another character.\n"
  );
  passedTests++;

  // ----------------------------------------------------------
  // TEST 7: Low-confidence information is handled appropriately
  // ----------------------------------------------------------
  console.log(
    "🧪 Running Test 7: Low-confidence information is handled appropriately..."
  );
  await clearAllMemories();

  const speculativeStatement =
    "I might maybe consider learning Rust someday, but I'm not really sure";
  const speculativeConfidence = calculateConfidence(speculativeStatement);

  assert(
    speculativeConfidence < 0.60,
    `Expected speculative statement confidence < 0.60, got ${speculativeConfidence}`
  );

  const lowConfResults = await consolidateMessage("priya", speculativeStatement);
  assert(
    lowConfResults.length > 0 &&
      lowConfResults[0].action === "rejected_low_confidence",
    `Expected 'rejected_low_confidence', got '${lowConfResults[0]?.action}'`
  );

  const memoriesAfterLowConf = await getCharacterMemories("priya");
  assert(
    memoriesAfterLowConf.length === 0,
    `Expected 0 durable memories from low-confidence information, got ${memoriesAfterLowConf.length}`
  );

  // Contrast: high-confidence definitive statement IS accepted
  const definitiveStatement = "I am definitely learning Rust";
  const definitiveConfidence = calculateConfidence(definitiveStatement);
  assert(
    definitiveConfidence >= 0.85,
    `Expected high confidence (>= 0.85), got ${definitiveConfidence}`
  );

  const highConfResults = await consolidateMessage("priya", definitiveStatement);
  assert(
    highConfResults[0].action === "created",
    `Expected definitive statement to be 'created', got '${highConfResults[0].action}'`
  );

  const memoriesAfterHighConf = await getCharacterMemories("priya");
  assert(
    memoriesAfterHighConf.length === 1,
    `Expected 1 durable memory from high-confidence information, got ${memoriesAfterHighConf.length}`
  );

  console.log(
    "✅ TEST 7 PASSED: Low-confidence information is rejected, high-confidence is accepted.\n"
  );
  passedTests++;

  // ----------------------------------------------------------
  // BONUS / EXTRA: Short-Term Memory to Long-Term Memory Batch Consolidation
  // ----------------------------------------------------------
  console.log("🧪 Testing Short-Term Memory to Long-Term Memory Batch Consolidation...");
  await clearAllMemories();

  const stmItems: ShortTermMemoryInput[] = [
    {
      id: "stm-1",
      characterId: "priya",
      memoryType: "preference",
      content: "User prefers dark mode",
      importance: 0.80,
      confidence: 0.90,
      isActive: true,
    },
    {
      id: "stm-2",
      characterId: "priya",
      memoryType: "event",
      content: "User has a coding interview tomorrow",
      importance: 0.90,
      confidence: 0.95,
      isActive: true,
    },
    {
      id: "stm-3",
      characterId: "priya",
      memoryType: "context",
      content: "Hello Priya!",
      importance: 0.20,
      confidence: 0.90,
      isActive: true,
    },
    {
      id: "stm-4",
      characterId: "priya",
      memoryType: "preference",
      content: "User prefers dark mode", // duplicate of stm-1
      importance: 0.80,
      confidence: 0.90,
      isActive: true,
    },
  ];

  const batchResult = await consolidateShortTermMemories("priya", stmItems);
  assert(batchResult.created === 2, `Expected 2 created, got ${batchResult.created}`);
  assert(
    batchResult.reinforced >= 1,
    `Expected at least 1 reinforced/duplicate, got ${batchResult.reinforced}`
  );
  assert(
    batchResult.rejected >= 1,
    `Expected at least 1 rejected transient, got ${batchResult.rejected}`
  );

  const consolidatedMemories = await getConsolidatedMemories("priya");
  assert(
    consolidatedMemories.length === 2,
    `Expected 2 consolidated LTMs, got ${consolidatedMemories.length}`
  );

  const promptText = formatConsolidatedMemoriesForPrompt(consolidatedMemories);
  assert(promptText.length > 0, "Prompt text should be formatted and non-empty");

  console.log("✅ STM → LTM Batch Consolidation verified.\n");

  console.log("============================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} FOCUSED TESTS PASSED SUCCESSFULLY!`);
  console.log("============================================================\n");
}

// Auto-run if executed directly
if (typeof require !== "undefined" && (require as any).main === module) {
  runMemoryConsolidationTests().catch((err) => {
    console.error("❌ Test suite encountered an error:", err);
    process.exit(1);
  });
}

