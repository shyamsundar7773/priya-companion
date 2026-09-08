import {
    addMemory,
    getCharacterMemories,
} from "./memoryService";


/* ============================================================
   MEMORY ANALYZER
   ============================================================ */

export async function analyzeMessage(
  characterId: string,
  message: string
): Promise<void> {

  const text =
    message.trim();

  if (!text) {
    return;
  }

  const lower =
    text.toLowerCase();

  /* ==========================================================
     INTERESTS
     ========================================================== */

  if (
    lower.includes("i like sql") ||
    lower.includes("i love sql") ||
    lower.includes("learning sql") ||
    lower.includes("studying sql")
  ) {
    await addMemory(
      characterId,
      "interest",
      "User is interested in SQL",
      0.8,
      0.9
    );
  }

  if (
    lower.includes("i like python") ||
    lower.includes("i love python") ||
    lower.includes("learning python") ||
    lower.includes("studying python")
  ) {
    await addMemory(
      characterId,
      "interest",
      "User is interested in Python",
      0.8,
      0.9
    );
  }

  /* ==========================================================
     FOOD PREFERENCES
     ========================================================== */

  if (
    lower.includes("i like biryani") ||
    lower.includes("i love biryani")
  ) {
    await addMemory(
      characterId,
      "preference",
      "User likes biryani",
      0.7,
      0.9
    );
  }

  if (
    lower.includes("i like chicken") ||
    lower.includes("i love chicken")
  ) {
    await addMemory(
      characterId,
      "preference",
      "User likes chicken",
      0.7,
      0.9
    );
  }

  /* ==========================================================
     GOALS
     ========================================================== */

  if (
    lower.includes("i want to get a job") ||
    lower.includes("i need a job") ||
    lower.includes("looking for a job")
  ) {
    await addMemory(
      characterId,
      "goal",
      "User is looking for a job",
      0.9,
      0.9
    );
  }

  if (
    lower.includes("i want to learn") ||
    lower.includes("i want to improve")
  ) {
    await addMemory(
      characterId,
      "goal",
      text,
      0.7,
      0.7
    );
  }

  /* ==========================================================
     SIMPLE FACTS
     ========================================================== */

  if (
    lower.includes("my name is ")
  ) {
    const name =
      text
        .substring(
          lower.indexOf("my name is ") +
            "my name is ".length
        )
        .trim();

    if (name) {
      await addMemory(
        characterId,
        "fact",
        `User's name is ${name}`,
        1.0,
        0.95
      );
    }
  }

  /* ==========================================================
     HABITS
     ========================================================== */

  if (
    lower.includes("every morning")
  ) {
    await addMemory(
      characterId,
      "habit",
      text,
      0.6,
      0.7
    );
  }

  if (
    lower.includes("every night")
  ) {
    await addMemory(
      characterId,
      "habit",
      text,
      0.6,
      0.7
    );
  }

  const memories = await getCharacterMemories(characterId);

  console.log(
    "🧠 CURRENT MEMORIES:",
    memories
  );
}