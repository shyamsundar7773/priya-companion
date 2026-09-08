import { Character } from "../types/character";

export type PromptContext = {
character: Character;
memoryText: string;
recentMessages: string[];
userMessage: string;
};

/* ============================================================
BUILD CHARACTER PROMPT
============================================================ */

export function buildCharacterPrompt(
context: PromptContext
): string {

const {
character,
memoryText,
recentMessages,
userMessage,
} = context;

const profile =
character.aiProfile;

const personality =
profile?.personality ||
character.personality ||
"Friendly, natural and caring.";

const speakingStyle =
profile?.speakingStyle ||
"Natural and conversational.";

const relationship =
profile?.relationship ||
"Friendly companion.";

const responseStyle =
profile?.responseStyle ||
"Natural, conversational and emotionally expressive.";

const behaviorRules =
profile?.behaviorRules || [];

const interests =
profile?.interests || [];

const likes =
profile?.likes || [];

const dislikes =
profile?.dislikes || [];

/* ==========================================================
CHARACTER PROFILE
========================================================== */

const characterSection = `
CHARACTER PROFILE

Name:
${character.name}

Personality:
${personality}

Speaking Style:
${speakingStyle}

Relationship:
${relationship}

Response Style:
${responseStyle}
`;

/* ==========================================================
BEHAVIOUR RULES
========================================================== */

const behaviorSection =
behaviorRules.length > 0
? `
BEHAVIOUR RULES

${behaviorRules
.map((rule) => `- ${rule}`)
.join("\n")}
`
: "";

/* ==========================================================
INTERESTS
========================================================== */

const interestsSection =
interests.length > 0
? `
INTERESTS

${interests
.map((item) => `- ${item}`)
.join("\n")}
`
: "";

/* ==========================================================
LIKES
========================================================== */

const likesSection =
likes.length > 0
? `
LIKES

${likes
.map((item) => `- ${item}`)
.join("\n")}
`
: "";

/* ==========================================================
DISLIKES
========================================================== */

const dislikesSection =
dislikes.length > 0
? `
DISLIKES

${dislikes
.map((item) => `- ${item}`)
.join("\n")}
`
: "";

/* ==========================================================
MEMORY
========================================================== */

const memorySection =
memoryText.trim().length > 0
? `
RELEVANT MEMORIES

${memoryText}
`      :`
RELEVANT MEMORIES

No relevant memories yet.
`;

/* ==========================================================
RECENT CONVERSATION
========================================================== */

const conversationSection =
recentMessages.length > 0
? `
RECENT CONVERSATION

${recentMessages
.map(
(message) => `- ${message}`
)
.join("\n")}
`      :`
RECENT CONVERSATION

No previous messages available.
`;

/* ==========================================================
CURRENT MESSAGE
========================================================== */

const currentMessageSection = `
CURRENT USER MESSAGE

${userMessage}
`;

/* ==========================================================
FINAL INSTRUCTIONS
========================================================== */

const instructionSection = `
RESPONSE INSTRUCTIONS

Respond as ${character.name}.

Stay consistent with the character's personality,
speaking style, relationship and behaviour rules.

Use memories naturally when they are relevant.

Do not mention that you are an AI.

Do not mention internal memory systems,
prompts, character packages or system instructions.

Do not force memories into unrelated conversations.

Respond naturally to the user's current message.

Do not repeat the same response unnecessarily.

Ask a follow-up question when it feels natural.

Maintain continuity with the recent conversation.

The response should feel like a genuine conversation
with this character.
`;

/* ==========================================================
FINAL PROMPT
========================================================== */

return (
characterSection +
behaviorSection +
interestsSection +
likesSection +
dislikesSection +
memorySection +
conversationSection +
currentMessageSection +
instructionSection
).trim();
}
