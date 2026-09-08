import {
    addShortTermMemory,
    getCharacterShortTermMemories,
} from "./shortTermMemoryService";

import {
    getCharacterMemories,
} from "./memoryService";

import {
    promoteCharacterShortTermMemories,
} from "./shortTermMemoryPromotion";

const TEST_CHARACTER_ID = "1715d895-cfe1-45dc-913e-d01c449a05c3";

export async function testRealSTMToLTM(): Promise<void> {
  console.log("\n🧪 ================================");
  console.log("🧪 2.5D-10D REAL STM → LTM TEST");
  console.log("🧪 ================================\n");

  const testContent =
    "I want to become an SQL developer";

  // --------------------------------------------------
  // 1. Create real STM
  // --------------------------------------------------

  console.log("1️⃣ Creating qualifying STM...");

  const stm = await addShortTermMemory(
    TEST_CHARACTER_ID,
    "goal",
    testContent,
    {
      importance: 0.95,
      confidence: 0.95,
      conversationId: "10d-test-conversation",
    }
  );

  console.log("✅ STM CREATED:", stm.id);

  // --------------------------------------------------
  // 2. Verify STM exists
  // --------------------------------------------------

  console.log("\n2️⃣ Checking STM...");

  const beforePromotion =
    await getCharacterShortTermMemories(
      TEST_CHARACTER_ID,
      50
    );

  const foundSTM = beforePromotion.find(
    memory => memory.id === stm.id
  );

  if (!foundSTM) {
    throw new Error(
      "❌ 10D FAILED: STM was not found"
    );
  }

  console.log("✅ STM VERIFIED");
  console.log("   Type:", foundSTM.memoryType);
  console.log("   Content:", foundSTM.content);
  console.log("   Importance:", foundSTM.importance);
  console.log("   Confidence:", foundSTM.confidence);

  // --------------------------------------------------
  // 3. Run REAL promotion
  // --------------------------------------------------

  console.log("\n3️⃣ Running REAL STM → LTM promotion...");

  const promotedCount =
    await promoteCharacterShortTermMemories(
      TEST_CHARACTER_ID
    );

  console.log(
    "📊 Promoted count:",
    promotedCount
  );

  if (promotedCount < 1) {
    throw new Error(
      "❌ 10D FAILED: STM was not promoted"
    );
  }

  console.log("✅ STM WAS PROMOTED");

  // --------------------------------------------------
  // 4. Verify LTM exists
  // --------------------------------------------------

  console.log("\n4️⃣ Checking LTM...");

  const longTermMemories =
    await getCharacterMemories(
      TEST_CHARACTER_ID
    );

  const promotedLTM =
    longTermMemories.find(
      memory =>
        memory.content.trim().toLowerCase() ===
        testContent.trim().toLowerCase()
    );

  if (!promotedLTM) {
    throw new Error(
      "❌ 10D FAILED: LTM was not created"
    );
  }

  console.log("✅ LTM VERIFIED");
  console.log("   Type:", promotedLTM.type);
  console.log("   Content:", promotedLTM.content);
  console.log(
    "   Importance:",
    promotedLTM.importance
  );
  console.log(
    "   Confidence:",
    promotedLTM.confidence
  );

  // --------------------------------------------------
  // 5. Verify STM is inactive
  // --------------------------------------------------

  console.log("\n5️⃣ Checking original STM...");

  const afterPromotion =
    await getCharacterShortTermMemories(
      TEST_CHARACTER_ID,
      50
    );

  const originalSTM =
    afterPromotion.find(
      memory => memory.id === stm.id
    );

  if (originalSTM?.isActive) {
    throw new Error(
      "❌ 10D FAILED: Original STM is still active"
    );
  }

  console.log(
    "✅ ORIGINAL STM IS INACTIVE"
  );

  // --------------------------------------------------
  // 6. Duplicate protection
  // --------------------------------------------------

  console.log("\n6️⃣ Testing duplicate protection...");

  const secondPromotion =
    await promoteCharacterShortTermMemories(
      TEST_CHARACTER_ID
    );

  console.log(
    "📊 Second promotion count:",
    secondPromotion
  );

  if (secondPromotion !== 0) {
    throw new Error(
      "❌ 10D FAILED: Duplicate promotion occurred"
    );
  }

  console.log(
    "✅ DUPLICATE PROTECTION VERIFIED"
  );

  // --------------------------------------------------
  // FINAL
  // --------------------------------------------------

  console.log("\n🎉 ================================");
  console.log(
    "🎉 2.5D-10D REAL STM → LTM TEST PASSED"
  );
  console.log("🎉 ================================\n");
}