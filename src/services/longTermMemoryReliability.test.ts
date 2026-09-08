import { Memory } from "../types/memory";

import {
    calculateMemoryConfidenceUpdate,
} from "./longTermMemoryConfidenceUpdate";

import {
    calculateMemoryReinforcement,
} from "./longTermMemoryReinforcement";

import {
    calculateMemoryContradictionScore,
} from "./longTermMemoryContradiction";

/* ============================================================
   2.5E-5E
   LTM RELIABILITY TESTING
============================================================ */

function createMemory(
  overrides: Partial<Memory> = {}
): Memory {
  return {
    id: "test-memory",
    characterId: "test-character",
    type: "interest",
    content: "User is interested in SQL",
    importance: 0.8,
    confidence: 0.7,
    createdAt: Date.now(),
    ...overrides,
  };
}

/* ============================================================
   TEST 1 — STRONG REINFORCEMENT
============================================================ */

function testStrongReinforcement(): void {

  const memory =
    createMemory();

  const message =
    "I really enjoy practicing SQL";

  const reinforcement =
    calculateMemoryReinforcement(
      memory,
      message
    );

  const update =
    calculateMemoryConfidenceUpdate(
      memory,
      message
    );

  console.log(
    "\n🧪 TEST 1 — STRONG REINFORCEMENT"
  );

  console.log(
    "Reinforcement:",
    reinforcement
  );

  console.log(
    "Confidence:",
    update.previousConfidence,
    "→",
    update.newConfidence
  );

  if (
    reinforcement <= 0
  ) {
    throw new Error(
      "❌ Strong reinforcement was not detected"
    );
  }

  if (
    update.reason !==
    "reinforced"
  ) {
    throw new Error(
      "❌ Memory should be reinforced"
    );
  }

  if (
    update.newConfidence <=
    update.previousConfidence
  ) {
    throw new Error(
      "❌ Confidence did not increase"
    );
  }

  console.log(
    "✅ Strong reinforcement passed"
  );
}

/* ============================================================
   TEST 2 — CONTRADICTION
============================================================ */

function testContradiction(): void {

  const memory =
    createMemory();

  const message =
    "I don't want to work with SQL anymore";

  const contradiction =
    calculateMemoryContradictionScore(
      memory,
      message
    );

  const update =
    calculateMemoryConfidenceUpdate(
      memory,
      message
    );

  console.log(
    "\n🧪 TEST 2 — CONTRADICTION"
  );

  console.log(
    "Contradiction score:",
    contradiction
  );

  console.log(
    "Confidence:",
    update.previousConfidence,
    "→",
    update.newConfidence
  );

  if (
    contradiction < 0.60
  ) {
    throw new Error(
      "❌ Contradiction was not strong enough"
    );
  }

  if (
    update.reason !==
    "contradicted"
  ) {
    throw new Error(
      "❌ Memory should be marked contradicted"
    );
  }

  if (
    update.newConfidence >=
    update.previousConfidence
  ) {
    throw new Error(
      "❌ Confidence did not decrease"
    );
  }

  console.log(
    "✅ Contradiction passed"
  );
}

/* ============================================================
   TEST 3 — UNRELATED MESSAGE
============================================================ */

function testUnrelatedMessage(): void {

  const memory =
    createMemory();

  const message =
    "I had biryani for lunch";

  const update =
    calculateMemoryConfidenceUpdate(
      memory,
      message
    );

  console.log(
    "\n🧪 TEST 3 — UNRELATED MESSAGE"
  );

  console.log(
    "Confidence:",
    update.previousConfidence,
    "→",
    update.newConfidence
  );

  if (
    update.reason !==
    "unchanged"
  ) {
    throw new Error(
      "❌ Unrelated message changed memory confidence"
    );
  }

  if (
    update.change !== 0
  ) {
    throw new Error(
      "❌ Unrelated message produced confidence change"
    );
  }

  console.log(
    "✅ Unrelated message passed"
  );
}

/* ============================================================
   TEST 4 — REPEATED REINFORCEMENT
============================================================ */

function testRepeatedReinforcement(): void {

  let memory =
    createMemory({
      confidence: 0.50,
    });

  const messages = [
    "I enjoy practicing SQL",
    "I am learning SQL joins",
    "I like SQL very much",
  ];

  console.log(
    "\n🧪 TEST 4 — REPEATED REINFORCEMENT"
  );

  const initialConfidence =
    memory.confidence;

  for (
    const message of messages
  ) {

    const update =
      calculateMemoryConfidenceUpdate(
        memory,
        message
      );

    console.log(
      `"${message}"`,
      memory.confidence,
      "→",
      update.newConfidence
    );

    memory = {
      ...memory,
      confidence:
        update.newConfidence,
    };
  }

  if (
    memory.confidence <=
    initialConfidence
  ) {
    throw new Error(
      "❌ Repeated reinforcement did not increase confidence"
    );
  }

  if (
    memory.confidence > 1
  ) {
    throw new Error(
      "❌ Confidence exceeded 1.0"
    );
  }

  console.log(
    "Final confidence:",
    memory.confidence
  );

  console.log(
    "✅ Repeated reinforcement passed"
  );
}

/* ============================================================
   TEST 5 — REPEATED CONTRADICTION
============================================================ */

function testRepeatedContradiction(): void {

  let memory =
    createMemory({
      confidence: 0.90,
    });

  const messages = [
    "I don't want to work with SQL anymore",
    "I stopped learning SQL",
  ];

  console.log(
    "\n🧪 TEST 5 — REPEATED CONTRADICTION"
  );

  const initialConfidence =
    memory.confidence;

  for (
    const message of messages
  ) {

    const update =
      calculateMemoryConfidenceUpdate(
        memory,
        message
      );

    console.log(
      `"${message}"`,
      memory.confidence,
      "→",
      update.newConfidence
    );

    memory = {
      ...memory,
      confidence:
        update.newConfidence,
    };
  }

  if (
    memory.confidence >=
    initialConfidence
  ) {
    throw new Error(
      "❌ Repeated contradiction did not decrease confidence"
    );
  }

  if (
    memory.confidence < 0
  ) {
    throw new Error(
      "❌ Confidence went below 0"
    );
  }

  console.log(
    "Final confidence:",
    memory.confidence
  );

  console.log(
    "✅ Repeated contradiction passed"
  );
}

/* ============================================================
   TEST 6 — CONTRADICTION PRIORITY
============================================================ */

function testContradictionPriority(): void {

  const memory =
    createMemory({
      confidence: 0.80,
    });

  const message =
    "I don't like SQL anymore";

  const update =
    calculateMemoryConfidenceUpdate(
      memory,
      message
    );

  console.log(
    "\n🧪 TEST 6 — CONTRADICTION PRIORITY"
  );

  console.log(
    "Reason:",
    update.reason
  );

  console.log(
    "Change:",
    update.change
  );

  if (
    update.reason !==
    "contradicted"
  ) {
    throw new Error(
      "❌ Contradiction should take priority"
    );
  }

  if (
    update.change >= 0
  ) {
    throw new Error(
      "❌ Contradiction should lower confidence"
    );
  }

  console.log(
    "✅ Contradiction priority passed"
  );
}

/* ============================================================
   TEST 7 — CONFIDENCE BOUNDARY
============================================================ */

function testConfidenceBoundary(): void {

  console.log(
    "\n🧪 TEST 7 — CONFIDENCE BOUNDARY"
  );

  let highMemory =
    createMemory({
      confidence: 0.99,
    });

  const reinforcement =
    calculateMemoryConfidenceUpdate(
      highMemory,
      "I really enjoy practicing SQL"
    );

  highMemory = {
    ...highMemory,
    confidence:
      reinforcement.newConfidence,
  };

  console.log(
    "Upper boundary:",
    highMemory.confidence
  );

  if (
    highMemory.confidence > 1
  ) {
    throw new Error(
      "❌ Confidence exceeded 1.0"
    );
  }

  let lowMemory =
    createMemory({
      confidence: 0.01,
    });

  const contradiction =
    calculateMemoryConfidenceUpdate(
      lowMemory,
      "I don't want to work with SQL anymore"
    );

  lowMemory = {
    ...lowMemory,
    confidence:
      contradiction.newConfidence,
  };

  console.log(
    "Lower boundary:",
    lowMemory.confidence
  );

  if (
    lowMemory.confidence < 0
  ) {
    throw new Error(
      "❌ Confidence went below 0"
    );
  }

  console.log(
    "✅ Confidence boundary passed"
  );
}

/* ============================================================
   MASTER TEST
============================================================ */

export function testLongTermMemoryReliability(): void {

  console.log(
    "\n================================================"
  );

  console.log(
    "🧠 2.5E-5E LTM RELIABILITY TEST"
  );

  console.log(
    "================================================"
  );

  testStrongReinforcement();

  testContradiction();

  testUnrelatedMessage();

  testRepeatedReinforcement();

  testRepeatedContradiction();

  testContradictionPriority();

  testConfidenceBoundary();

  console.log(
    "\n================================================"
  );

  console.log(
    "🎉 ALL LTM RELIABILITY TESTS PASSED"
  );

  console.log(
    "================================================"
  );
}