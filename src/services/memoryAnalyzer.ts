import {
  consolidateMessage,
  ConsolidationResult,
} from "./memoryConsolidation";
import { getCharacterMemories } from "./memoryService";

/* ============================================================
   MEMORY ANALYZER
   ============================================================ */

export async function analyzeMessage(
  characterId: string,
  message: string
): Promise<ConsolidationResult[]> {
  const text = message.trim();

  if (!text) {
    return [];
  }

  const results = await consolidateMessage(characterId, text);

  const memories = await getCharacterMemories(characterId);

  console.log("🧠 MEMORY CONSOLIDATION RESULTS:", results);
  console.log("🧠 CURRENT MEMORIES:", memories);

  return results;
}