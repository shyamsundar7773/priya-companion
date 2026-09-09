import {
  Memory,
  MemoryCategory,
  MemoryType,
} from "../types/memory";

import {
  addMemory,
  getCharacterMemories,
  saveMemories,
  updateMemory,
} from "./memoryService";

import { isQuestionOrRecallRequest } from "./memoryIntent";

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

export type ConsolidationSource =
  | "conversation"
  | "short_term_memory"
  | "manual";

export type ConsolidationAction =
  | "created"
  | "updated"
  | "reinforced"
  | "skipped_duplicate"
  | "rejected_low_confidence"
  | "rejected_low_importance"
  | "rejected_transient";

export type MemoryCandidate = {
  characterId: string;
  type: MemoryType;
  category: MemoryCategory;
  content: string;
  rawText: string;
  importance: number;
  confidence: number;
  source: ConsolidationSource;
  metadata?: Record<string, any>;
};

export type ConsolidationResult = {
  action: ConsolidationAction;
  memory?: Memory;
  previousMemory?: Memory;
  candidate: MemoryCandidate;
  reason: string;
};

export type ConsolidationOptions = {
  minImportance?: number;
  minConfidence?: number;
  duplicateThreshold?: number;
  force?: boolean;
};

export type ConsolidationBatchResult = {
  characterId: string;
  processed: number;
  created: number;
  updated: number;
  reinforced: number;
  rejected: number;
  results: ConsolidationResult[];
};

export type ShortTermMemoryInput = {
  id?: string;
  characterId: string;
  memoryType?: string;
  content: string;
  importance?: number;
  confidence?: number;
  isActive?: boolean;
  expiresAt?: string;
  createdAt?: string;
};

/* ============================================================
   DEFAULT CONFIGURATION
   ============================================================ */

export const DEFAULT_MIN_IMPORTANCE = 0.65;
export const DEFAULT_MIN_CONFIDENCE = 0.60;
export const DEFAULT_DUPLICATE_THRESHOLD = 0.80;

/* ============================================================
   TEXT NORMALIZATION & SIMILARITY
   ============================================================ */

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractKeyTokens(text: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then",
    "so", "to", "in", "on", "at", "of", "for", "with",
    "about", "is", "am", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did",
    "user", "i", "my", "me", "we", "our", "you", "your",
    "it", "its", "that", "this", "these", "those"
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

export function calculateTokenSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(extractKeyTokens(textA));
  const tokensB = new Set(extractKeyTokens(textB));

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/* ============================================================
   TRANSIENT CONVERSATION FILTER
   ============================================================ */

const TRANSIENT_PATTERNS = [
  // Greetings
  /^hi(\s+there)?$/i,
  /^hello(\s+there)?$/i,
  /^hey(\s+there)?$/i,
  /^good\s+(morning|afternoon|evening|night|day)$/i,
  /^howdy$/i,
  /^sup$/i,
  /^yo$/i,
  /^greetings$/i,

  // Pleasantries & small talk
  /^how\s+are\s+you(\s+doing)?$/i,
  /^how\s+is\s+it\s+going$/i,
  /^how\'s\s+it\s+going$/i,
  /^how\s+was\s+your\s+day$/i,
  /^what\'s\s+up$/i,
  /^what\s+is\s+up$/i,
  /^how\s+have\s+you\s+been$/i,
  /^nice\s+to\s+meet\s+you$/i,
  /^what\s+are\s+you\s+doing$/i,

  // Acknowledgements & conversational fillers
  /^ok(ay)?$/i,
  /^cool$/i,
  /^nice$/i,
  /^great$/i,
  /^awesome$/i,
  /^sure$/i,
  /^got\s+it$/i,
  /^sounds\s+good$/i,
  /^yes$/i,
  /^yep$/i,
  /^yeah$/i,
  /^no$/i,
  /^nope$/i,
  /^nah$/i,
  /^thanks(\s+a\s+lot)?$/i,
  /^thank\s+you(\s+so\s+much)?$/i,
  /^you\'re\s+welcome$/i,
  /^np$/i,
  /^no\s+problem$/i,
  /^bye$/i,
  /^goodbye$/i,
  /^see\s+ya$/i,
  /^see\s+you(\s+later)?$/i,
  /^cya$/i,
  /^ttyl$/i,
  /^lol$/i,
  /^haha(ha)?$/i,
  /^lmao$/i,

  // Conversational commands / meta queries
  /^test(ing)?$/i,
  /^tell\s+me\s+a\s+joke$/i,
  /^can\s+you\s+help\s+me$/i,
  /^who\s+are\s+you$/i,
  /^what\s+is\s+your\s+name$/i,
];

export function isTransientConversation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= 2) {
    return true;
  }

  const normalized = normalizeText(trimmed);

  // Exact transient match
  for (const pattern of TRANSIENT_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(normalized)) {
      return true;
    }
  }

  // Pure greetings with character name, e.g. "Hello Priya!", "Hey Priya"
  if (
    /^(hello|hi|hey|good\s+morning|good\s+evening)\s+[a-z]+[!.]*$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // Small talk variants
  if (
    /^(hey|hello|hi)[,\s]+(how\s+are\s+you|what\'s\s+up|how\'s\s+your\s+day|how\s+is\s+it\s+going)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // Chit-chat combinations like "ok cool thanks", "thanks a lot bye", "sounds good bye"
  const words = normalized.split(/\s+/);
  const chitChatWords = new Set([
    "ok", "okay", "cool", "nice", "great", "thanks", "thank",
    "you", "bye", "see", "ya", "later", "yep", "yeah", "sure",
    "lot", "good", "hello", "hi", "hey", "sounds", "sound", "alright"
  ]);

  if (words.length <= 5 && words.every((w) => chitChatWords.has(w))) {
    return true;
  }

  return false;
}

/* ============================================================
   CONFIDENCE SCORING
   ============================================================ */

export function calculateConfidence(text: string): number {
  const lower = text.toLowerCase();

  // Strong hedging / uncertainty markers -> low confidence
  const lowConfidenceMarkers = [
    "might",
    "maybe",
    "perhaps",
    "possibly",
    "probably",
    "not sure",
    "i'm not sure",
    "im not sure",
    "i guess",
    "i suppose",
    "could be",
    "someday maybe",
    "tentatively",
    "who knows",
    "i think maybe",
    "kind of",
    "sort of",
  ];

  for (const marker of lowConfidenceMarkers) {
    if (lower.includes(marker)) {
      return 0.40; // Below consolidation threshold
    }
  }

  // High certainty markers
  const highConfidenceMarkers = [
    "definitely",
    "certainly",
    "absolutely",
    "always",
    "never",
    "i decided",
    "my name is",
    "i am a",
    "i work at",
    "i live in",
    "i have an interview",
    "i passed",
    "i got a job",
    "i prefer",
    "i really love",
    "i hate",
    "i love",
    "for sure",
  ];

  for (const marker of highConfidenceMarkers) {
    if (lower.includes(marker)) {
      return 0.95;
    }
  }

  // Clear first-person declarations without hedging
  if (
    lower.startsWith("i prefer") ||
    lower.startsWith("i like") ||
    lower.startsWith("i love") ||
    lower.startsWith("i am") ||
    lower.startsWith("i have") ||
    lower.startsWith("my ")
  ) {
    return 0.88;
  }

  return 0.75;
}

/* ============================================================
   IMPORTANCE SCORING
   ============================================================ */

export function calculateImportance(
  text: string,
  type: MemoryType,
  category: MemoryCategory
): number {
  const lower = text.toLowerCase();

  // Small talk / transient chatter
  if (isTransientConversation(text)) {
    return 0.10;
  }

  // 1. Core identity and biographical facts
  if (
    lower.includes("my name is") ||
    lower.includes("i am a") ||
    lower.includes("i work as") ||
    lower.includes("i work at") ||
    lower.includes("i live in") ||
    lower.includes("my wife") ||
    lower.includes("my husband") ||
    lower.includes("my son") ||
    lower.includes("my daughter")
  ) {
    return 0.95;
  }

  // 2. High-impact episodic events / milestones
  if (
    category === "episodic" ||
    type === "event" ||
    lower.includes("interview") ||
    lower.includes("exam") ||
    lower.includes("got a job") ||
    lower.includes("graduated") ||
    lower.includes("started a new job") ||
    lower.includes("moved to") ||
    lower.includes("adopted") ||
    lower.includes("bought a")
  ) {
    return 0.90;
  }

  // 3. Major life/career goals & firm decisions
  if (
    type === "goal" ||
    lower.includes("i decided") ||
    lower.includes("my goal is") ||
    lower.includes("want to become") ||
    lower.includes("planning to start")
  ) {
    return 0.85;
  }

  // 4. Strong user preferences
  if (
    category === "preference" ||
    type === "preference" ||
    lower.includes("i prefer") ||
    lower.includes("favorite") ||
    lower.includes("i love") ||
    lower.includes("i hate")
  ) {
    return 0.80;
  }

  // 5. Interests & hobbies
  if (
    type === "interest" ||
    lower.includes("interested in") ||
    lower.includes("i enjoy") ||
    lower.includes("i like")
  ) {
    return 0.72;
  }

  // 6. Routine habits
  if (
    type === "habit" ||
    lower.includes("every day") ||
    lower.includes("every morning") ||
    lower.includes("every weekend")
  ) {
    return 0.70;
  }

  // Ephemeral states or activities
  if (
    lower.includes("right now") ||
    lower.includes("currently eating") ||
    lower.includes("drinking water") ||
    lower.includes("feeling tired")
  ) {
    return 0.40;
  }

  return 0.60;
}

/* ============================================================
   CANDIDATE EXTRACTION FROM TEXT
   ============================================================ */

export function extractMemoryCandidates(
  characterId: string,
  text: string,
  source: ConsolidationSource = "conversation"
): MemoryCandidate[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  // Transient conversation check
  if (isTransientConversation(trimmed)) {
    return [
      {
        characterId,
        type: "context",
        category: "semantic",
        content: trimmed,
        rawText: trimmed,
        importance: 0.10,
        confidence: 0.90,
        source,
        metadata: { transient: true },
      },
    ];
  }

  // Question / recall requests should not create durable memories
  if (isQuestionOrRecallRequest(trimmed)) {
    return [];
  }

  const lower = trimmed.toLowerCase();
  const candidates: MemoryCandidate[] = [];

  // ----------------------------------------------------------
  // 1. User Preferences
  // ----------------------------------------------------------
  if (
    lower.includes("i prefer") ||
    lower.includes("i like") ||
    lower.includes("i love") ||
    lower.includes("i enjoy") ||
    lower.includes("i hate") ||
    lower.includes("i dislike") ||
    lower.includes("favorite") ||
    lower.includes("i don't like") ||
    lower.includes("i dont like")
  ) {
    let content = trimmed;
    // Format declarative statement if simple
    if (/^i prefer\s+/i.test(trimmed)) {
      content = `User prefers ${trimmed.replace(/^i prefer\s+/i, "")}`;
    } else if (/^i (love|really like)\s+/i.test(trimmed)) {
      content = `User loves ${trimmed.replace(/^i (love|really like)\s+/i, "")}`;
    } else if (/^i like\s+/i.test(trimmed)) {
      content = `User likes ${trimmed.replace(/^i like\s+/i, "")}`;
    } else if (/^my favorite\s+/i.test(trimmed)) {
      content = `User's favorite ${trimmed.replace(/^my favorite\s+/i, "")}`;
    }

    const confidence = calculateConfidence(trimmed);
    const importance = calculateImportance(trimmed, "preference", "preference");

    candidates.push({
      characterId,
      type: "preference",
      category: "preference",
      content,
      rawText: trimmed,
      importance,
      confidence,
      source,
    });
  }

  // ----------------------------------------------------------
  // 2. Episodic Memories & Important Conversation Events
  // ----------------------------------------------------------
  const isEventOrEpisode =
    lower.includes("interview") ||
    lower.includes("exam") ||
    lower.includes("test tomorrow") ||
    lower.includes("passed my") ||
    lower.includes("got a job") ||
    lower.includes("started a new") ||
    lower.includes("moved to") ||
    lower.includes("adopted") ||
    lower.includes("bought a") ||
    lower.includes("graduated") ||
    lower.includes("yesterday i") ||
    lower.includes("tomorrow i") ||
    lower.includes("last weekend i") ||
    lower.includes("last week i") ||
    lower.includes("i decided to") ||
    lower.includes("actually i changed my mind") ||
    lower.includes("i changed my mind");

  if (isEventOrEpisode) {
    let content = trimmed;
    if (/^i have\s+/i.test(trimmed)) {
      content = `User has ${trimmed.replace(/^i have\s+/i, "")}`;
    } else if (/^i passed\s+/i.test(trimmed)) {
      content = `User passed ${trimmed.replace(/^i passed\s+/i, "")}`;
    } else if (/^i got\s+/i.test(trimmed)) {
      content = `User got ${trimmed.replace(/^i got\s+/i, "")}`;
    } else if (/^i moved\s+/i.test(trimmed)) {
      content = `User moved ${trimmed.replace(/^i moved\s+/i, "")}`;
    } else if (/^i decided\s+/i.test(trimmed)) {
      content = `User decided ${trimmed.replace(/^i decided\s+/i, "")}`;
    }

    const confidence = calculateConfidence(trimmed);
    const importance = calculateImportance(trimmed, "event", "episodic");

    candidates.push({
      characterId,
      type: "event",
      category: "episodic",
      content,
      rawText: trimmed,
      importance,
      confidence,
      source,
    });
  }

  // ----------------------------------------------------------
  // 3. Semantic / Factual Memories & Identity
  // ----------------------------------------------------------
  const isFactualOrIdentity =
    lower.includes("my name is") ||
    lower.includes("i am a") ||
    lower.includes("i'm a") ||
    lower.includes("i work at") ||
    lower.includes("i work as") ||
    lower.includes("i live in") ||
    lower.includes("my brother") ||
    lower.includes("my sister") ||
    lower.includes("my roommate") ||
    lower.includes("i speak");

  if (isFactualOrIdentity && !candidates.some((c) => c.category === "episodic")) {
    let content = trimmed;
    if (/^my name is\s+/i.test(trimmed)) {
      content = `User's name is ${trimmed.replace(/^my name is\s+/i, "").trim()}`;
    } else if (/^i am a\s+/i.test(trimmed)) {
      content = `User is a ${trimmed.replace(/^i am a\s+/i, "").trim()}`;
    } else if (/^i live in\s+/i.test(trimmed)) {
      content = `User lives in ${trimmed.replace(/^i live in\s+/i, "").trim()}`;
    } else if (/^i work at\s+/i.test(trimmed)) {
      content = `User works at ${trimmed.replace(/^i work at\s+/i, "").trim()}`;
    }

    const confidence = calculateConfidence(trimmed);
    const importance = calculateImportance(trimmed, "fact", "semantic");

    candidates.push({
      characterId,
      type: "fact",
      category: "semantic",
      content,
      rawText: trimmed,
      importance,
      confidence,
      source,
    });
  }

  // ----------------------------------------------------------
  // 4. Goals & Learning Focus
  // ----------------------------------------------------------
  const isGoal =
    (lower.includes("want to learn") ||
      lower.includes("learning ") ||
      lower.includes("studying ") ||
      lower.includes("want to become") ||
      lower.includes("my goal is")) &&
    !candidates.some((c) => c.category === "preference" || c.category === "episodic");

  if (isGoal) {
    let content = trimmed;
    if (/^i want to learn\s+/i.test(trimmed)) {
      content = `User wants to learn ${trimmed.replace(/^i want to learn\s+/i, "")}`;
    } else if (/^i am learning\s+/i.test(trimmed)) {
      content = `User is learning ${trimmed.replace(/^i am learning\s+/i, "")}`;
    }

    const confidence = calculateConfidence(trimmed);
    const importance = calculateImportance(trimmed, "goal", "semantic");

    candidates.push({
      characterId,
      type: "goal",
      category: "semantic",
      content,
      rawText: trimmed,
      importance,
      confidence,
      source,
    });
  }

  return candidates;
}

/* ============================================================
   DUPLICATE DETECTION
   ============================================================ */

export function findDuplicateMemory(
  candidate: MemoryCandidate,
  existingMemories: Memory[],
  threshold = DEFAULT_DUPLICATE_THRESHOLD
): Memory | null {
  const normCandidate = normalizeText(candidate.content);
  const normRaw = normalizeText(candidate.rawText);

  for (const existing of existingMemories) {
    // Character isolation check
    if (existing.characterId !== candidate.characterId) {
      continue;
    }

    const normExisting = normalizeText(existing.content);

    // Exact match
    if (
      normExisting === normCandidate ||
      normExisting === normRaw
    ) {
      return existing;
    }

    // High token similarity
    const simCandidate = calculateTokenSimilarity(normCandidate, normExisting);
    const simRaw = calculateTokenSimilarity(normRaw, normExisting);

    if (simCandidate >= threshold || simRaw >= threshold) {
      return existing;
    }
  }

  return null;
}

/* ============================================================
   UPDATE / CONTRADICTION DETECTION
   ============================================================ */

type TopicDomain = {
  name: string;
  keywords: string[];
};

const TOPIC_DOMAINS: TopicDomain[] = [
  {
    name: "theme",
    keywords: ["dark mode", "light mode", "dark theme", "light theme", "editor theme"],
  },
  {
    name: "primary_language",
    keywords: ["sql", "python", "javascript", "typescript", "rust", "go", "java", "c++"],
  },
  {
    name: "location",
    keywords: ["live in", "lives in", "moved to", "reside in", "living in"],
  },
  {
    name: "favorite_food",
    keywords: ["pizza", "biryani", "sushi", "burger", "pasta", "tacos", "ramen"],
  },
  {
    name: "job_role",
    keywords: ["software engineer", "developer", "data scientist", "designer", "product manager"],
  },
];

function extractDomain(text: string): string | null {
  const norm = normalizeText(text);
  for (const domain of TOPIC_DOMAINS) {
    if (domain.keywords.some((kw) => norm.includes(normalizeText(kw)))) {
      return domain.name;
    }
  }
  return null;
}

export function findMemoryToUpdate(
  candidate: MemoryCandidate,
  existingMemories: Memory[]
): Memory | null {
  const normCandidate = normalizeText(candidate.content);
  const normRaw = normalizeText(candidate.rawText);

  // Indicators of changed mind or updated information
  const hasUpdateIndicator =
    normRaw.includes("changed my mind") ||
    normRaw.includes("change my mind") ||
    normRaw.includes("actually") ||
    normRaw.includes("instead of") ||
    normRaw.includes("no longer") ||
    normRaw.includes("not anymore") ||
    normRaw.includes("now prefer") ||
    normRaw.includes("switched to") ||
    normRaw.includes("decided to") ||
    normRaw.includes("now live in") ||
    normRaw.includes("moved to");

  const candidateDomain =
    extractDomain(candidate.content) || extractDomain(candidate.rawText);

  for (const existing of existingMemories) {
    // Character isolation check
    if (existing.characterId !== candidate.characterId) {
      continue;
    }

    const normExisting = normalizeText(existing.content);

    // If identical, it's a duplicate, not an update
    if (normExisting === normCandidate) {
      continue;
    }

    const existingDomain = extractDomain(existing.content);

    // 1. Same domain match (e.g. both are about editor theme: dark vs light)
    if (candidateDomain && existingDomain && candidateDomain === existingDomain) {
      // Must be of compatible types (e.g. preference vs preference, goal vs goal)
      if (
        existing.type === candidate.type ||
        (existing.type === "goal" && candidate.type === "goal") ||
        (existing.type === "preference" && candidate.type === "preference") ||
        (existing.type === "fact" && candidate.type === "fact") ||
        hasUpdateIndicator
      ) {
        return existing;
      }
    }

    // 2. Explicit update indicator with high semantic overlap
    if (hasUpdateIndicator) {
      const sim = calculateTokenSimilarity(normCandidate, normExisting);
      if (sim >= 0.35 && sim < 0.95) {
        return existing;
      }
    }
  }

  return null;
}

/* ============================================================
   CONSOLIDATE A SINGLE CANDIDATE
   ============================================================ */

export async function consolidateCandidate(
  candidate: MemoryCandidate,
  options: ConsolidationOptions = {}
): Promise<ConsolidationResult> {
  const minImportance = options.minImportance ?? DEFAULT_MIN_IMPORTANCE;
  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const duplicateThreshold =
    options.duplicateThreshold ?? DEFAULT_DUPLICATE_THRESHOLD;

  // 1. Transient conversation check
  if (
    isTransientConversation(candidate.rawText) ||
    isTransientConversation(candidate.content) ||
    candidate.metadata?.transient
  ) {
    return {
      action: "rejected_transient",
      candidate,
      reason: "Message is normal greeting, small talk, or transient conversational filler.",
    };
  }

  // 2. Importance threshold
  if (candidate.importance < minImportance && !options.force) {
    return {
      action: "rejected_low_importance",
      candidate,
      reason: `Importance score (${candidate.importance.toFixed(2)}) is below threshold (${minImportance}).`,
    };
  }

  // 3. Confidence threshold
  if (candidate.confidence < minConfidence && !options.force) {
    return {
      action: "rejected_low_confidence",
      candidate,
      reason: `Confidence score (${candidate.confidence.toFixed(2)}) is below threshold (${minConfidence}).`,
    };
  }

  // Fetch character memories for duplicate and update checks (CHARACTER ISOLATION)
  const existingMemories = await getCharacterMemories(candidate.characterId);

  // 4. Duplicate Check
  const duplicate = findDuplicateMemory(
    candidate,
    existingMemories,
    duplicateThreshold
  );

  if (duplicate) {
    // Reinforce existing memory
    const updatedConfidence = Math.min(1.0, duplicate.confidence + 0.05);
    await updateMemory(duplicate.id, {
      confidence: updatedConfidence,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      action: "skipped_duplicate",
      memory: {
        ...duplicate,
        confidence: updatedConfidence,
        lastUsedAt: Date.now(),
      },
      candidate,
      reason: `Duplicate detected with memory [${duplicate.id}]. Existing memory reinforced.`,
    };
  }

  // 5. Update / Contradiction Check
  const memoryToUpdate = findMemoryToUpdate(candidate, existingMemories);

  if (memoryToUpdate) {
    const previousSnapshot: Memory = { ...memoryToUpdate };

    const updatedMemory: Memory = {
      ...memoryToUpdate,
      content: candidate.content,
      type: candidate.type,
      category: candidate.category,
      importance: Math.max(memoryToUpdate.importance, candidate.importance),
      confidence: candidate.confidence,
      updatedAt: Date.now(),
      lastUsedAt: Date.now(),
      metadata: {
        ...memoryToUpdate.metadata,
        ...candidate.metadata,
        supersededContent: previousSnapshot.content,
        updatedAtTimestamp: Date.now(),
      },
    };

    // Update the memory in storage
    const allMemories = await getCharacterMemories(candidate.characterId);
    const targetIdx = allMemories.findIndex((m) => m.id === memoryToUpdate.id);
    if (targetIdx !== -1) {
      allMemories[targetIdx] = updatedMemory;
      await saveMemories(allMemories);
    } else {
      await updateMemory(memoryToUpdate.id, updatedMemory);
    }

    return {
      action: "updated",
      memory: updatedMemory,
      previousMemory: previousSnapshot,
      candidate,
      reason: `Updated existing memory [${memoryToUpdate.id}] with new information.`,
    };
  }

  // 6. Create New Long-Term Memory
  const created = await addMemory(
    candidate.characterId,
    candidate.type,
    candidate.content,
    candidate.importance,
    candidate.confidence,
    {
      category: candidate.category,
      metadata: {
        source: candidate.source,
        rawText: candidate.rawText,
        ...candidate.metadata,
      },
      updatedAt: Date.now(),
    }
  );

  return {
    action: "created",
    memory: created,
    candidate,
    reason: "Successfully consolidated into durable long-term memory.",
  };
}

/* ============================================================
   CONSOLIDATE FROM CHAT MESSAGE
   ============================================================ */

export async function consolidateMessage(
  characterId: string,
  message: string,
  options: ConsolidationOptions = {}
): Promise<ConsolidationResult[]> {
  const clean = message.trim();
  if (!clean) {
    return [];
  }

  // Transient conversation guard
  if (isTransientConversation(clean)) {
    return [
      {
        action: "rejected_transient",
        candidate: {
          characterId,
          type: "context",
          category: "semantic",
          content: clean,
          rawText: clean,
          importance: 0.10,
          confidence: 0.90,
          source: "conversation",
        },
        reason: "Message is normal greeting, small talk, or transient conversational filler.",
      },
    ];
  }

  const candidates = extractMemoryCandidates(characterId, clean, "conversation");

  if (candidates.length === 0) {
    return [];
  }

  const results: ConsolidationResult[] = [];
  for (const candidate of candidates) {
    const result = await consolidateCandidate(candidate, options);
    results.push(result);
  }

  return results;
}

/* ============================================================
   CONSOLIDATE SHORT-TERM MEMORY TO LONG-TERM MEMORY
   ============================================================ */

function mapStmTypeToLtm(type?: string): {
  type: MemoryType;
  category: MemoryCategory;
} {
  switch (type) {
    case "preference":
      return { type: "preference", category: "preference" };
    case "goal":
      return { type: "goal", category: "semantic" };
    case "event":
      return { type: "event", category: "episodic" };
    case "episodic":
      return { type: "episodic", category: "episodic" };
    case "semantic":
      return { type: "semantic", category: "semantic" };
    case "topic":
    case "interest":
      return { type: "interest", category: "semantic" };
    case "relationship":
      return { type: "relationship", category: "semantic" };
    case "fact":
      return { type: "fact", category: "fact" };
    default:
      return { type: "fact", category: "semantic" };
  }
}

export async function consolidateShortTermMemory(
  stm: ShortTermMemoryInput,
  options: ConsolidationOptions = {}
): Promise<ConsolidationResult> {
  const { type, category } = mapStmTypeToLtm(stm.memoryType);

  const candidate: MemoryCandidate = {
    characterId: stm.characterId,
    type,
    category,
    content: stm.content,
    rawText: stm.content,
    importance: stm.importance ?? 0.70,
    confidence: stm.confidence ?? 0.85,
    source: "short_term_memory",
    metadata: {
      stmId: stm.id,
      stmCreatedAt: stm.createdAt,
    },
  };

  return consolidateCandidate(candidate, options);
}

export async function consolidateShortTermMemories(
  characterId: string,
  memories: ShortTermMemoryInput[],
  options: ConsolidationOptions = {}
): Promise<ConsolidationBatchResult> {
  let created = 0;
  let updated = 0;
  let reinforced = 0;
  let rejected = 0;
  const results: ConsolidationResult[] = [];

  for (const stm of memories) {
    // Only process active memories if isActive flag is provided
    if (stm.isActive === false) {
      rejected++;
      continue;
    }

    const result = await consolidateShortTermMemory(stm, options);
    results.push(result);

    switch (result.action) {
      case "created":
        created++;
        break;
      case "updated":
        updated++;
        break;
      case "reinforced":
      case "skipped_duplicate":
        reinforced++;
        break;
      default:
        rejected++;
        break;
    }
  }

  return {
    characterId,
    processed: memories.length,
    created,
    updated,
    reinforced,
    rejected,
    results,
  };
}

/* ============================================================
   RETRIEVAL-READY MEMORY RECORDS
   ============================================================ */

export async function getConsolidatedMemories(
  characterId: string,
  options?: {
    category?: MemoryCategory;
    type?: MemoryType;
    minConfidence?: number;
    minImportance?: number;
    limit?: number;
  }
): Promise<Memory[]> {
  const all = await getCharacterMemories(characterId);
  const minConfidence = options?.minConfidence ?? 0.20;
  const minImportance = options?.minImportance ?? 0.0;

  let filtered = all.filter(
    (m) =>
      m.confidence >= minConfidence &&
      m.importance >= minImportance
  );

  if (options?.category) {
    filtered = filtered.filter((m) => m.category === options.category);
  }

  if (options?.type) {
    filtered = filtered.filter((m) => m.type === options.type);
  }

  // Sort by importance (descending) and recency (descending)
  filtered.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    const timeA = a.updatedAt ?? a.createdAt;
    const timeB = b.updatedAt ?? b.createdAt;
    return timeB - timeA;
  });

  if (options?.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function formatConsolidatedMemoriesForPrompt(
  memories: Memory[]
): string {
  if (!memories.length) {
    return "";
  }

  return memories
    .map((memory) => {
      const typeLabel = (memory.type || "fact").toUpperCase();
      return `- [${typeLabel}] ${memory.content}`;
    })
    .join("\n");
}
