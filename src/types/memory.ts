export type MemoryType =
  | "fact"
  | "preference"
  | "habit"
  | "goal"
  | "interest"
  | "relationship"
  | "context";

export type Memory = {
  id: string;

  characterId: string;

  type: MemoryType;

  content: string;

  importance: number;

  confidence: number;

  createdAt: number;

  lastUsedAt?: number;
};