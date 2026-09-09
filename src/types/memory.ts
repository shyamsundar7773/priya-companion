export type MemoryType =
  | "fact"
  | "preference"
  | "habit"
  | "goal"
  | "interest"
  | "relationship"
  | "context"
  | "event"
  | "episodic"
  | "semantic";

export type MemoryCategory =
  | "episodic"
  | "semantic"
  | "preference"
  | "event"
  | "fact";

export type Memory = {
  id: string;

  characterId: string;

  type: MemoryType;

  content: string;

  importance: number;

  confidence: number;

  createdAt: number;

  lastUsedAt?: number;

  updatedAt?: number;

  category?: MemoryCategory;

  metadata?: Record<string, any>;
};