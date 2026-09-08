
import {
  resolveContradictionsForNewMessage,
} from "./longTermMemoryContradictionResolution";

import {
  buildShortTermMemoryContext,
} from "./shortTermMemoryContext";

import {
  runControlledShortTermMemoryPromotion,
} from "./shortTermMemoryPromotion";

import {
  updateRelevantLongTermMemoryConfidences,
} from "./longTermMemoryConfidenceIntegration";

import {
  getCharacterById,
} from "./characterService";

import {
  buildMemoryContext,
  MemoryContext,
} from "./memoryContext";

import {
  getCharacterPackage,
} from "./characterPackageService";

import {
  isQuestionOrRecallRequest,
  classifyRecallIntent,
} from "./memoryIntent";

import {
  buildMemoryRecallContext,
  MemoryRecallContext,
} from "./memoryRecall";

// ============================================================
// CONFIG
// ============================================================

const AI_BACKEND_URL =
  process.env.EXPO_PUBLIC_AI_BACKEND_URL ||
  "http://192.168.1.149:3000/chat";

// ============================================================
// TYPES
// ============================================================

export type AIContext = {
  characterId: string;
  conversationId: string;
  userMessage: string;
  recentMessages?: string[];
};

export type AIResponse = {
  text: string;
  source: "local" | "ai";
  memoryUsed?: boolean;
};

// ============================================================
// CURRENT INTENT
// ============================================================

const NEGATIVE_INTENT_PATTERNS = [
  /\bi\s*(?:really\s*)?don'?t\s+want\s+to\s+(?:work\s+with|work\s+on|learn|study|continue|do)\b/i,
  /\bi\s*(?:really\s*)?don'?t\s+want\s+(?:sql|python|coding|programming)\b/i,
  /\bi'?m\s+done\s+with\b/i,
  /\bi'?m\s+finished\s+with\b/i,
  /\bi\s+don'?t\s+want\s+to\s+continue\b/i,
  /\bi\s+want\s+to\s+stop\b/i,
  /\bi\s+want\s+to\s+quit\b/i,
  /\bi\s+don'?t\s+like\s+working\s+with\b/i,
  /\bi\s+don'?t\s+want\s+anything\s+to\s+do\s+with\b/i,
];

// ============================================================
// TOPIC KEYWORDS
// ============================================================

const TOPIC_KEYWORDS: Record<string, string[]> = {
  sql: [
    "sql",
    "mysql",
    "postgres",
    "postgresql",
    "plsql",
    "database",
    "databases",
    "sql query",
    "sql queries",
    "sql join",
    "sql joins",
    "sql interview",
  ],

  python: [
    "python",
    "pandas",
    "numpy",
    "flask",
    "django",
  ],

  coding: [
    "coding",
    "programming",
    "software development",
  ],
};

// ============================================================
// CURRENT POSITIVE INTENT
// ============================================================

const POSITIVE_INTENT_PATTERNS = [
  /\bi\s+(?:want|would like)\s+to\b/i,
  /\bi\s+(?:want|would like)\s+(?:sql|python|coding|programming)\b/i,
  /\bi\s+am\s+(?:preparing|learning|studying|practicing)\b/i,
  /\bi'?m\s+(?:preparing|learning|studying|practicing)\b/i,
  /\bi\s+(?:changed my mind|decided)\b/i,
  /\blet'?s\s+(?:continue|start|do|learn|practice)\b/i,
];

// ============================================================
// POLARITY
// ============================================================

type CurrentPolarity =
  | "positive"
  | "negative"
  | "neutral";

function getMessagePolarity(
  userMessage: string
): CurrentPolarity {
  const message = userMessage.trim();

  if (!message) {
    return "neutral";
  }

  if (
    NEGATIVE_INTENT_PATTERNS.some(
      (pattern) => pattern.test(message)
    )
  ) {
    return "negative";
  }

  if (
    POSITIVE_INTENT_PATTERNS.some(
      (pattern) => pattern.test(message)
    )
  ) {
    return "positive";
  }

  return "neutral";
}

// ============================================================
// CURRENT TOPICS
// ============================================================

function getCurrentTopics(
  userMessage: string
): string[] {
  const lower = userMessage.toLowerCase();

  const topics: string[] = [];

  for (
    const [topic, keywords] of Object.entries(
      TOPIC_KEYWORDS
    )
  ) {
    const matched = keywords.some(
      (keyword) => lower.includes(keyword)
    );

    if (matched) {
      topics.push(topic);
    }
  }

  return topics;
}

// ============================================================
// CURRENT INTENT OVERRIDE
// ============================================================

function buildCurrentIntentOverride(
  userMessage: string
): string {
  const polarity =
    getMessagePolarity(userMessage);

  if (polarity !== "negative") {
    return "";
  }

  const topics =
    getCurrentTopics(userMessage);

  if (topics.length === 0) {
    return `
CURRENT INTENT OVERRIDE

The user's current message indicates that they do not
currently want to continue with a previously discussed
direction.

Treat the current preference as more important than
historical memories.

Do not assume the user still wants the previously discussed
topic unless the user explicitly brings it back.

Respond naturally to what the user is expressing now.
`;
  }

  return `
CURRENT INTENT OVERRIDE
=======================

The user's CURRENT message indicates that they do NOT
currently want to continue with:

${topics.join(", ")}

This is a current conversational direction.

Historical memories may contain information suggesting
that the user previously liked, studied, practiced,
planned, or intended to pursue this topic.

Those memories must NOT be treated as the user's current
goal or current interest.

Priority:

CURRENT USER INTENT
>
RECENT CONVERSATION
>
SHORT-TERM CONTEXT
>
HISTORICAL LONG-TERM MEMORY

Do not revive the rejected topic unless the user
explicitly brings it back.

Do not ask about the rejected topic merely because
historical memories mention it.

Respond naturally to the user's current emotional or
conversational direction.
`;
}

// ============================================================
// LTM CONTEXT SANITIZATION
// ============================================================

function sanitizeMemoryContextForCurrentIntent(
  memoryContext: MemoryContext,
  userMessage: string
): MemoryContext {
  const polarity =
    getMessagePolarity(userMessage);

  if (polarity !== "negative") {
    return memoryContext;
  }

  const currentTopics =
    getCurrentTopics(userMessage);

  if (currentTopics.length === 0) {
    return memoryContext;
  }

  const filteredMemories =
    memoryContext.memories.filter(
      (memory) => {
        const memoryText =
          memory.content.toLowerCase();

        const belongsToRejectedTopic =
          currentTopics.some(
            (topic) => {
              const keywords =
                TOPIC_KEYWORDS[topic] || [];

              return keywords.some(
                (keyword) =>
                  memoryText.includes(keyword)
              );
            }
          );

        if (belongsToRejectedTopic) {
          console.log(
            "🧹 AI CONTEXT: HISTORICAL MEMORY FILTERED:",
            memory.content
          );

          return false;
        }

        return true;
      }
    );

  console.log(
    "🧹 AI CONTEXT: LTM BEFORE:",
    memoryContext.memories.length
  );

  console.log(
    "🧹 AI CONTEXT: LTM AFTER:",
    filteredMemories.length
  );

  return {
    memories: filteredMemories,
    text: filteredMemories
      .map(
        (memory) =>
          `- ${memory.content}`
      )
      .join("\n"),
  };
}

// ============================================================
// RECENT CONVERSATION SANITIZATION
// ============================================================

function sanitizeRecentConversationForCurrentIntent(
  recentMessages: string[],
  userMessage: string
): string {
  const polarity =
    getMessagePolarity(userMessage);

  if (polarity !== "negative") {
    return buildRecentConversationContext(
      recentMessages
    );
  }

  const currentTopics =
    getCurrentTopics(userMessage);

  if (currentTopics.length === 0) {
    return buildRecentConversationContext(
      recentMessages
    );
  }

  const filteredMessages =
    recentMessages
      .slice(-12)
      .filter(
        (message) => {
          const lower =
            message.toLowerCase();

          const belongsToRejectedTopic =
            currentTopics.some(
              (topic) => {
                const keywords =
                  TOPIC_KEYWORDS[topic] || [];

                return keywords.some(
                  (keyword) =>
                    lower.includes(keyword)
                );
              }
            );

          if (
            belongsToRejectedTopic
          ) {
            console.log(
              "🧹 AI CONTEXT: RECENT MESSAGE FILTERED:",
              message
            );

            return false;
          }

          return true;
        }
      );

  if (
    filteredMessages.length === 0
  ) {
    return "No relevant recent conversation available.";
  }

  return filteredMessages
    .map(
      (message, index) =>
        `${index + 1}. ${message}`
    )
    .join("\n");
}

// ============================================================
// CHARACTER PACKAGE → PERSONALITY CONTEXT
// ============================================================

function buildCharacterPersonalityContext(
  character: ReturnType<typeof getCharacterById>,
  characterPackage: any
): string {
  const characterName =
    character?.name ||
    characterPackage?.identity?.name ||
    "AI Companion";

  const basicPersonality =
    character?.personality ||
    characterPackage?.identity?.description ||
    "Friendly, natural and caring.";

  const aiProfile =
    character?.aiProfile;

  const packageTraits =
    Array.isArray(
      characterPackage?.personality?.traits
    )
      ? characterPackage.personality.traits.join(
          ", "
        )
      : "";

  const temperament =
    characterPackage?.personality?.temperament ||
    "";

  const values =
    Array.isArray(
      characterPackage?.personality?.values
    )
      ? characterPackage.personality.values.join(
          ", "
        )
      : "";

  const strengths =
    Array.isArray(
      characterPackage?.personality?.strengths
    )
      ? characterPackage.personality.strengths.join(
          ", "
        )
      : "";

  const weaknesses =
    Array.isArray(
      characterPackage?.personality?.weaknesses
    )
      ? characterPackage.personality.weaknesses.join(
          ", "
        )
      : "";

  const speakingTone =
    characterPackage?.speakingStyle?.tone ||
    "";

  const speakingLanguage =
    characterPackage?.speakingStyle?.language ||
    "";

  const responseLength =
    characterPackage?.speakingStyle?.responseLength ||
    "";

  const emojiUsage =
    characterPackage?.speakingStyle?.emojiUsage ||
    "";

  const styleRules =
    Array.isArray(
      characterPackage?.speakingStyle?.styleRules
    )
      ? characterPackage.speakingStyle.styleRules.join(
          "\n- "
        )
      : "";

  const examplePhrases =
    Array.isArray(
      characterPackage?.speakingStyle?.examplePhrases
    )
      ? characterPackage.speakingStyle.examplePhrases.join(
          "\n- "
        )
      : "";

  const emotionalExpressiveness =
    characterPackage?.emotionalBehavior?.expressiveness ||
    "";

  const empathy =
    characterPackage?.emotionalBehavior?.empathy ||
    "";

  const moodAware =
    characterPackage?.emotionalBehavior?.moodAware;

  const reactions =
    Array.isArray(
      characterPackage?.emotionalBehavior?.reactions
    )
      ? characterPackage.emotionalBehavior.reactions.join(
          "\n- "
        )
      : "";

  const emotionalRules =
    Array.isArray(
      characterPackage?.emotionalBehavior?.emotionalRules
    )
      ? characterPackage.emotionalBehavior.emotionalRules.join(
          "\n- "
        )
      : "";

  const conversationBehavior =
    characterPackage?.conversationBehavior;

  const conversationRules =
    Array.isArray(
      conversationBehavior?.conversationRules
    )
      ? conversationBehavior.conversationRules.join(
          "\n- "
        )
      : "";

  const relationship =
    characterPackage?.relationship;

  const relationshipType =
    relationship?.type ||
    aiProfile?.relationship ||
    "Friendly companion";

  const relationshipCloseness =
    relationship?.closeness;

  const relationshipAffection =
    relationship?.affection;

  const relationshipRules =
    Array.isArray(
      relationship?.relationshipRules
    )
      ? relationship.relationshipRules.join(
          "\n- "
        )
      : "";

  const boundaries =
    Array.isArray(
      relationship?.boundaries
    )
      ? relationship.boundaries.join(
          "\n- "
        )
      : "";

  const proactive =
    characterPackage?.proactive;

  const memory =
    characterPackage?.memory;

  const ai =
    characterPackage?.ai;

  const conversationExamples =
    Array.isArray(
      characterPackage?.conversationExamples
    )
      ? characterPackage.conversationExamples
      : [];

  const examplePairs =
    conversationExamples
      .slice(0, 8)
      .map(
        (example: any) =>
          `User: ${example.user}\nCharacter: ${example.character}`
      )
      .join("\n\n");

  return `
CHARACTER IDENTITY
==================

Name: ${characterName}

PERSONALITY
===========

${basicPersonality}

${
  packageTraits
    ? `Personality traits: ${packageTraits}`
    : ""
}

${
  temperament
    ? `Temperament: ${temperament}`
    : ""
}

${
  values
    ? `Values: ${values}`
    : ""
}

${
  strengths
    ? `Strengths: ${strengths}`
    : ""
}

${
  weaknesses
    ? `Weaknesses: ${weaknesses}`
    : ""
}

SPEAKING STYLE
==============

${
  aiProfile?.speakingStyle ||
  "Natural, casual and conversational."
}

${
  speakingTone
    ? `Tone: ${speakingTone}`
    : ""
}

${
  speakingLanguage
    ? `Language: ${speakingLanguage}`
    : ""
}

${
  responseLength
    ? `Preferred response length: ${responseLength}`
    : ""
}

${
  emojiUsage
    ? `Emoji usage: ${emojiUsage}`
    : ""
}

${
  styleRules
    ? `Style rules:
- ${styleRules}`
    : ""
}

${
  examplePhrases
    ? `Example phrases:
- ${examplePhrases}`
    : ""
}

EMOTIONAL BEHAVIOR
==================

Expressiveness:
${emotionalExpressiveness || "natural"}

Empathy:
${empathy || "natural"}

Mood awareness:
${moodAware === undefined ? "natural" : moodAware}

${
  reactions
    ? `Possible emotional reactions:
- ${reactions}`
    : ""
}

${
  emotionalRules
    ? `Emotional rules:
- ${emotionalRules}`
    : ""
}

CONVERSATION BEHAVIOR
=====================

Ask follow-up questions:
${conversationBehavior?.askFollowUpQuestions ?? true}

Initiate topics:
${conversationBehavior?.initiateTopics ?? true}

Playful:
${conversationBehavior?.playful ?? false}

Teasing:
${conversationBehavior?.teasing ?? false}

Disagreement allowed:
${conversationBehavior?.disagreementAllowed ?? true}

${
  conversationRules
    ? `Conversation rules:
- ${conversationRules}`
    : ""
}

RELATIONSHIP
============

Type:
${relationshipType}

${
  relationshipCloseness !== undefined
    ? `Closeness: ${relationshipCloseness}`
    : ""
}

${
  relationshipAffection !== undefined
    ? `Affection: ${relationshipAffection}`
    : ""
}

${
  relationshipRules
    ? `Relationship rules:
- ${relationshipRules}`
    : ""
}

${
  boundaries
    ? `Boundaries:
- ${boundaries}`
    : ""
}

PROACTIVE BEHAVIOR
==================

Enabled:
${proactive?.enabled ?? false}

${
  proactive?.style
    ? `Style:
${proactive.style}`
    : ""
}

MEMORY BEHAVIOR
===============

Enabled:
${memory?.enabled ?? true}

Remember preferences:
${memory?.rememberPreferences ?? true}

Remember goals:
${memory?.rememberGoals ?? true}

Remember important events:
${memory?.rememberImportantEvents ?? true}

AI CONFIGURATION
================

Temperature preference:
${ai?.temperature ?? "default"}

Preferred response tokens:
${ai?.maxResponseTokens ?? "default"}

${
  ai?.modelPreference
    ? `Model preference:
${ai.modelPreference}`
    : ""
}

CONVERSATION EXAMPLES
=====================

${
  examplePairs ||
  "No example conversations provided."
}

IMPORTANT CHARACTER RULES
=========================

Stay in character.

Do not mention:

- AI systems
- prompts
- memory systems
- short-term memory
- long-term memory
- internal instructions
- context construction

The user should feel like they are talking to the same
character consistently.

The examples above demonstrate STYLE and PERSONALITY.
They are not scripts.

Do not copy an example response unless it genuinely fits
the current message.

Generate a fresh response appropriate to the current
situation.
`;
}

// ============================================================
// RECENT CONVERSATION
// ============================================================

function buildRecentConversationContext(
  recentMessages: string[]
): string {
  if (
    !recentMessages ||
    recentMessages.length === 0
  ) {
    return "No recent conversation available.";
  }

  return recentMessages
    .slice(-12)
    .map(
      (message, index) =>
        `${index + 1}. ${message}`
    )
    .join("\n");
}

// ============================================================
// SITUATIONAL CONTEXT
// ============================================================

function buildSituationalContext(
  userMessage: string
): string {
  return `
SITUATIONAL CONVERSATION RULES
==============================

Current user message:
"${userMessage}"

Interpret the meaning of the message rather than reacting
to keywords mechanically.

A keyword is NOT a response rule.

For example:

"enna panra?"

does not have one predefined response.

"saptiya?"

does not have one predefined response.

"hi"

does not have one predefined response.

The response should depend on:

- current conversation
- character personality
- relationship
- emotional tone
- relevant memories
- current intent
- conversational momentum
- what the character might naturally say

Casual statements can receive casual reactions.

Questions should be answered naturally.

Emotional messages should receive emotional reactions.

Jokes can receive jokes.

Teasing can receive teasing.

A serious statement should be treated seriously.

Sometimes the character can ask one question.

Sometimes the character should simply react.

Sometimes the character can change the subject.

Sometimes the character can disagree.

Sometimes the character can tease.

Do not force these behaviors.

Choose what naturally fits this exact moment.
`;
}

// ============================================================
// MAIN AI BRAIN
// ============================================================

export async function generateResponse(
  context: AIContext
): Promise<AIResponse> {
  const {
    characterId,
    conversationId,
    userMessage,
    recentMessages = [],
  } = context;

  console.log("\n");
  console.log(
    "============================================"
  );
  console.log(
    "🧠 AI BRAIN STARTED"
  );
  console.log(
    "============================================"
  );

  console.log(
    "👤 CHARACTER ID:",
    characterId
  );

  console.log(
    "💬 CONVERSATION ID:",
    conversationId
  );

  console.log(
    "🗣️ USER MESSAGE:",
    userMessage
  );

  console.log(
    "💬 RECENT MESSAGES:",
    recentMessages.length
  );

  console.log(
    "🧭 CURRENT POLARITY:",
    getMessagePolarity(userMessage)
  );

  console.log(
    "🧭 CURRENT TOPICS:",
    getCurrentTopics(userMessage)
  );

  // ==========================================================
  // MEMORY INTENT
  // ==========================================================
  //
  // IMPORTANT:
  //
  // A question / recall request is a READ operation.
  //
  // It must NOT:
  //
  // - create STM
  // - resolve contradictions
  // - promote STM to LTM
  // - update LTM confidence
  //
  // But it MUST still be allowed to:
  //
  // - read existing LTM
  // - use LTM to answer the user
  //
  // This protects complex recall messages such as:
  //
  // "I previously said X, then changed my mind to Y.
  // Can you tell me what my current plan is?"
  // ==========================================================

  const isRecallQuery =
    isQuestionOrRecallRequest(
      userMessage
    );

  console.log(
    "🧠 MEMORY INTENT:",
    isRecallQuery
      ? "QUESTION / RECALL"
      : "NORMAL STATEMENT"
  );

  // ==========================================================
  // 1. CHARACTER
  // ==========================================================

  const character =
    getCharacterById(characterId);

  if (!character) {
    console.warn(
      "⚠️ AI BRAIN: CHARACTER NOT FOUND:",
      characterId
    );
  } else {
    console.log(
      "👤 CHARACTER:",
      character.name
    );
  }

  // ==========================================================
  // 2. CHARACTER PACKAGE
  // ==========================================================

  let characterPackage: any = null;

  try {
    characterPackage =
      await getCharacterPackage(
        characterId
      );

    if (characterPackage) {
      console.log(
        "📦 CHARACTER PACKAGE:",
        characterPackage.identity?.name
      );

      console.log(
        "🎭 PACKAGE TRAITS:",
        characterPackage.personality?.traits
      );

      console.log(
        "💬 PACKAGE EXAMPLES:",
        characterPackage.conversationExamples?.length || 0
      );
    }
  } catch (error) {
    console.warn(
      "⚠️ AI BRAIN: CHARACTER PACKAGE FAILED",
      error
    );
  }

  // ==========================================================
  // 3. MEMORY MAINTENANCE
  // ==========================================================
  //
  // NORMAL MESSAGE:
  //
  //     contradiction resolution
  //          ↓
  //     STM → LTM promotion
  //          ↓
  //     LTM confidence integration
  //
  // RECALL QUESTION:
  //
  //     SKIP ALL OF THE ABOVE
  //
  //     because the message is asking us to READ memory,
  //     not CREATE or MODIFY memory.
  // ==========================================================

  if (!isRecallQuery) {
    try {
      console.log(
        "🧠 AI BRAIN: RESOLVING LTM CONTRADICTIONS..."
      );

      const contradictionsResolved =
        await resolveContradictionsForNewMessage(
          characterId,
          userMessage
        );

      // IMPORTANT:
      // resolveContradictionsForNewMessage()
      // returns a NUMBER, not an array.
      console.log(
        "🧠 AI BRAIN: LTM CONTRADICTIONS RESOLVED:",
        contradictionsResolved
      );

      console.log(
        "🧠 AI BRAIN: CHECKING STM → LTM PROMOTION..."
      );

      const promotedCount =
        await runControlledShortTermMemoryPromotion(
          characterId
        );

      console.log(
        "🧠 AI BRAIN: STM → LTM PROMOTED:",
        promotedCount
      );

      console.log(
        "🧠 AI BRAIN: CHECKING LTM CONFIDENCE..."
      );

      const confidenceUpdated =
        await updateRelevantLongTermMemoryConfidences(
          characterId,
          userMessage
        );

      console.log(
        "🧠 AI BRAIN: LTM CONFIDENCE UPDATED:",
        confidenceUpdated.length
      );
    } catch (error) {
      console.warn(
        "⚠️ AI BRAIN: MEMORY MAINTENANCE FAILED. CONTINUING...",
        error
      );
    }
  } else {
    console.log(
      "🧠 AI BRAIN: MEMORY MAINTENANCE SKIPPED: QUESTION / RECALL REQUEST"
    );
  }

  // ==========================================================
  // 4. SHORT-TERM MEMORY
  // ==========================================================

  let shortTermMemoryContext = "";

  try {
    shortTermMemoryContext =
      await buildShortTermMemoryContext(
        conversationId
      );

    console.log(
      "🧠 AI BRAIN: STM CONTEXT BUILT"
    );
  } catch (error) {
    console.warn(
      "⚠️ AI BRAIN: STM CONTEXT FAILED",
      error
    );
  }

  // ==========================================================
  // 5. LONG-TERM MEMORY
  // ==========================================================
  //
  // IMPORTANT:
  // LTM READING CONTINUES even for recall questions.
  //
  // This is what allows:
  //
  // "What am I planning to work on?"
  //
  // to be answered using existing memory.
  // ==========================================================

  let memoryContext: MemoryContext = {
    memories: [],
    text: "",
  };

  try {
    memoryContext =
      await buildMemoryContext(
        characterId,
        userMessage
      );

    console.log(
      "🧠 AI BRAIN: LTM MEMORIES:",
      memoryContext.memories.length
    );
  } catch (error) {
    console.warn(
      "⚠️ AI BRAIN: LTM CONTEXT FAILED",
      error
    );
  }

  // ==========================================================
  // 6. AI CONTEXT / RECALL RETRIEVAL
  // ==========================================================
  //
  // Recall is a READ operation and needs a different retrieval
  // view from normal conversational memory.
  //
  // CURRENT recall:
  //   active memories only, latest/current state preferred.
  //
  // HISTORICAL recall:
  //   active + suppressed memories, ordered chronologically.
  //
  // This must happen BEFORE normal current-intent sanitization,
  // otherwise a historical question such as:
  //
  //   "Did I ever say I wanted to stop Python?"
  //
  // can accidentally hide the very suppressed memory we need.
  // ==========================================================

  let aiMemoryContext: MemoryContext = memoryContext;
  let recallContext: MemoryRecallContext | null = null;

  if (isRecallQuery) {
    try {
      recallContext =
        await buildMemoryRecallContext(
          characterId,
          userMessage
        );

      aiMemoryContext = {
        memories: recallContext.memories,
        text: recallContext.text,
      };

      console.log(
        "🧠 AI BRAIN: RECALL MODE:",
        classifyRecallIntent(userMessage),
        "MEMORIES:",
        recallContext.memories.length
      );
    } catch (error) {
      console.warn(
        "⚠️ AI BRAIN: RECALL CONTEXT FAILED:",
        error
      );
    }
  } else {
    aiMemoryContext =
      sanitizeMemoryContextForCurrentIntent(
        memoryContext,
        userMessage
      );
  }

  // ==========================================================
  // 7. PERSONALITY
  // ==========================================================

  const personalityContext =
    buildCharacterPersonalityContext(
      character,
      characterPackage
    );

  // ==========================================================
  // 8. RECENT CONVERSATION
  // ==========================================================

  const recentConversationText =
    sanitizeRecentConversationForCurrentIntent(
      recentMessages,
      userMessage
    );

  // ==========================================================
  // 9. SITUATIONAL CONTEXT
  // ==========================================================

  const situationalContext =
    buildSituationalContext(
      userMessage
    );

  // ==========================================================
  // 10. CURRENT INTENT OVERRIDE
  // ==========================================================

  const currentIntentOverride =
    buildCurrentIntentOverride(
      userMessage
    );

  if (currentIntentOverride) {
    console.log(
      "🧠 AI BRAIN: CURRENT INTENT OVERRIDE ACTIVE"
    );
  }

  // ==========================================================
  // 11. RESPONSE LENGTH
  // ==========================================================

  const packageResponseLength =
    characterPackage?.speakingStyle
      ?.responseLength || "medium";

  const responseLengthInstruction =
    packageResponseLength === "short"
      ? `
Prefer a short response.

Usually 1–3 sentences unless the
conversation genuinely requires more.
`
      : packageResponseLength === "long"
        ? `
Longer responses are allowed when
the conversation genuinely benefits
from them.

Do not become unnecessarily verbose.
`
        : `
Prefer moderate conversational responses.

Usually 1–5 sentences depending on
the situation.
`;

  // ==========================================================
  // 12. AI PROMPT
  // ==========================================================

  const prompt = `
You are participating in an ongoing personal conversation.

Your primary goal is to produce a natural response that fits
the CURRENT situation.

You are not a generic assistant.

You are the character described below.

==================================================
CHARACTER
==================================================

${personalityContext}

==================================================
CURRENT INTENT
==================================================

${
  currentIntentOverride ||
  "No special current-intent override detected."
}

==================================================
LONG-TERM MEMORY
==================================================

${
  aiMemoryContext.text ||
  "No relevant long-term memory available."
}

==================================================
SHORT-TERM MEMORY
==================================================

${
  shortTermMemoryContext ||
  "No active short-term memory available."
}

==================================================
RECENT CONVERSATION
==================================================

${recentConversationText}

==================================================
SITUATIONAL CONTEXT
==================================================

${situationalContext}

==================================================
RESPONSE LENGTH
==================================================

${responseLengthInstruction}

==================================================
NATURAL CONVERSATION RULES
==================================================

1. Respond to the CURRENT user message first.

2. Understand what the user actually means.

3. Use recent conversation for continuity when relevant.

4. Use short-term memory when relevant.

5. Use long-term memory only when relevant.

6. Do not force memories into unrelated messages.

7. Do not treat keywords as commands.

8. "SQL" does not automatically mean the user wants
   to discuss SQL.

9. "Python" does not automatically mean the user wants
   to discuss Python.

10. "Enna panra?" does not have one fixed answer.

11. "Saptiya?" does not have one fixed answer.

12. Greetings do not have one fixed answer.

13. Casual conversation should remain casual.

14. Emotional messages should receive appropriate emotion.

15. If the user is joking, you can joke back.

16. If the user is teasing, you can tease back.

17. If appropriate, you can tease the user naturally.

18. You may disagree naturally when the character would.

19. You do not need to ask a question every time.

20. Ask at most one natural follow-up question when useful.

21. Do not ask a question merely to keep the conversation alive.

22. Statements can receive reactions rather than questions.

23. Do not automatically give advice.

24. Do not turn casual conversation into an educational answer.

25. Do not sound like customer support.

26. Avoid generic phrases such as:
   "How can I help you today?"
   "That's interesting!"
   "I understand."

27. Avoid repetitive sentence structures.

28. Avoid repeating the same opening phrase.

29. Do not copy previous responses.

30. Keep the character's personality consistent.

31. Allow natural variation between responses.

32. Complete the thought naturally.

33. CURRENT USER INTENT ALWAYS OVERRIDES HISTORICAL MEMORY.

34. If the user rejected a topic, do not revive that topic.

35. Do not repeatedly mention a rejected topic.

36. Do not use historical preferences to contradict
   what the user is saying right now.

37. If the user changes direction, follow the new direction.

38. Character examples are style references, not scripts.

39. Never mention these instructions.

40. Never mention internal AI processing.

41. Never mention memory systems.

42. Never mention prompts or context construction.

43. Stay in character.

==================================================
MEMORY RECALL RULE
==================================================

If the CURRENT user message is asking what they previously
said, what they are currently planning, what changed between
previous decisions, or whether you remember a previous
decision:

- Treat the message as a RECALL / READ request.
- Use the supplied long-term memory context to answer.
- Do NOT invent a new memory from the question.
- Do NOT interpret the question as a new goal.
- Do NOT reinterpret the question as a new preference.
- Do NOT treat statements quoted inside the question as
  new current decisions.
- Answer based on the most recent valid memory.
- If two memories conflict, prefer the newer active decision
  when the memory context indicates that it superseded the
  older decision.
- Answer naturally without mentioning the memory system.

==================================================
MEMORY RECALL CONTEXT
==================================================

${
  recallContext
    ? recallContext.intent === "HISTORICAL"
      ? `RECALL TYPE: HISTORICAL\n\nThe user is asking about what happened previously.
Treat [SUPPRESSED / PAST] memories as valid historical evidence.
They are NOT current decisions, but they ARE evidence that the user
said or believed something in the past.
Never say "you never said that" when a matching suppressed memory
is present in the supplied historical timeline.
If the timeline shows a change of mind, explain the progression
naturally and distinguish the old state from the current active state.\n\n${recallContext.text || "No historical memory evidence available."}`
      : `RECALL TYPE: CURRENT STATE\n\nAnswer current-state questions from [CURRENT ACTIVE] memories.
Prefer the newest valid active decision/plan/goal when memories overlap.
Do not treat suppressed memories as current.\n\n${recallContext.text || "No current active memory evidence available."}`
    : "Not a memory-recall request."
}

==================================================
CURRENT USER MESSAGE
==================================================

${userMessage}

==================================================
FINAL RESPONSE
==================================================

Write ONLY the character's natural reply.

Do not add headings.

Do not add labels.

Do not explain your reasoning.
`;

  // ==========================================================
  // 13. DEBUG
  // ==========================================================

  console.log(
    "\n============================================"
  );

  console.log(
    "🤖 AI-FIRST CHARACTER CONVERSATION"
  );

  console.log(
    "============================================"
  );

  console.log(
    "🧠 POLARITY:",
    getMessagePolarity(userMessage)
  );

  console.log(
    "🧭 TOPICS:",
    getCurrentTopics(userMessage)
  );

  console.log(
    "🧠 MEMORY INTENT:",
    isRecallQuery
      ? "QUESTION / RECALL"
      : "NORMAL STATEMENT"
  );

  console.log(
    "🧠 LTM AVAILABLE:",
    memoryContext.memories.length
  );

  console.log(
    "🧠 LTM USED BY AI:",
    aiMemoryContext.memories.length
  );

  console.log(
    "🧠 STM AVAILABLE:",
    shortTermMemoryContext
      ? "YES"
      : "NO"
  );

  console.log(
    "💬 RECENT MESSAGES:",
    recentMessages.length
  );

  console.log(
    "🎭 CHARACTER PACKAGE:",
    characterPackage
      ? "YES"
      : "NO"
  );

  console.log(
    "💬 PACKAGE EXAMPLES:",
    characterPackage?.conversationExamples?.length || 0
  );

  console.log(
    "🌐 AI BACKEND:",
    AI_BACKEND_URL
  );

  // ==========================================================
  // 14. SEND TO EXPRESS BACKEND
  // ==========================================================

  try {
    if (!character) {
      throw new Error(
        "Character unavailable for AI generation."
      );
    }

    console.log(
      "🚀 AI BRAIN: SENDING REQUEST TO BACKEND..."
    );

    const response =
      await fetch(
        AI_BACKEND_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            prompt,
            character,
          }),
        }
      );

    // ========================================================
    // BACKEND ERROR
    // ========================================================

    if (!response.ok) {
      let backendError =
        `AI backend HTTP ${response.status}`;

      try {
        const errorData =
          await response.json();

        if (
          errorData?.error
        ) {
          backendError =
            errorData.error;
        }
      } catch {
        // Ignore JSON parsing failure
      }

      throw new Error(
        backendError
      );
    }

    // ========================================================
    // BACKEND RESPONSE
    // ========================================================

    const data =
      await response.json();

    const aiText =
      typeof data?.text === "string"
        ? data.text.trim()
        : "";

    if (!aiText) {
      throw new Error(
        "AI backend returned an empty response."
      );
    }

    console.log(
      "🏆 AI BRAIN: AI RESPONSE RECEIVED"
    );

    console.log(
      "🤖 PROVIDER:",
      data?.provider || "unknown"
    );

    console.log(
      "🧠 MODEL:",
      data?.model || "unknown"
    );

    console.log(
      "💬 RESPONSE:",
      aiText
    );

    console.log(
      "============================================\n"
    );

    return {
      text: aiText,
      source: "ai",
      memoryUsed:
        aiMemoryContext.memories.length > 0 ||
        shortTermMemoryContext.length > 0,
    };
  } catch (error) {
    console.warn(
      "⚠️ AI BRAIN: AI BACKEND FAILED:",
      error
    );
  }

  // ==========================================================
  // 15. EMERGENCY FALLBACK
  // ==========================================================

  console.warn(
    "🛟 AI BRAIN: USING EMERGENCY LOCAL FALLBACK"
  );

  return {
    text:
      generateEmergencyFallback(
        userMessage
      ),

    source:
      "local",

    memoryUsed:
      aiMemoryContext.memories.length > 0 ||
      shortTermMemoryContext.length > 0,
  };
}

// ============================================================
// EMERGENCY FALLBACK
// ============================================================

function generateEmergencyFallback(
  userMessage: string
): string {
  const message =
    userMessage.trim();

  const lower =
    message.toLowerCase();

  if (!message) {
    return "Hmm 😌";
  }

  if (
    lower === "hi" ||
    lower === "hey" ||
    lower === "hello"
  ) {
    return "Heyy 😌 sollu?";
  }

  if (
    lower.includes("good morning")
  ) {
    return "Good morning 😌";
  }

  if (
    lower.includes("good night")
  ) {
    return "Good night da 😌";
  }

  return "Hmm 😌 naan inga dhaan irukken.";
}

