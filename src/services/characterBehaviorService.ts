import { Character } from "../types/character";
import {
    CharacterPackage,
} from "../types/characterPackage";

/* ============================================================
   CHARACTER BEHAVIOUR CONTRACT
   ============================================================ */

export type CharacterBehaviorContract = {
  identity: {
    name: string;
    avatar?: string;
    avatarUri?: string;
    description?: string;
  };

  personality: {
    traits: string[];
    temperament?: string;
    values: string[];
    strengths: string[];
    weaknesses: string[];
  };

  speakingStyle: {
    tone?: string;
    language?: string;
    responseLength: "short" | "medium" | "long";
    emojiUsage: "none" | "low" | "medium" | "high";
    styleRules: string[];
    examplePhrases: string[];
  };

  emotionalBehavior: {
    expressiveness: "low" | "medium" | "high";
    empathy: "low" | "medium" | "high";
    moodAware: boolean;
    reactions: string[];
    emotionalRules: string[];
  };

  conversationBehavior: {
    askFollowUpQuestions: boolean;
    initiateTopics: boolean;
    playful: boolean;
    teasing: boolean;
    disagreementAllowed: boolean;
    conversationRules: string[];
  };

  relationship: {
    type?: string;
    closeness: number;
    affection: number;
    relationshipRules: string[];
    boundaries: string[];
  };

  memory: {
    enabled: boolean;
    rememberPreferences: boolean;
    rememberGoals: boolean;
    rememberImportantEvents: boolean;
    memoryRules: string[];
  };

  proactive: {
    enabled: boolean;
    style?: string;
    triggers: string[];
    proactiveRules: string[];
  };

  ai: {
    temperature: number;
    maxResponseTokens: number;
    modelPreference?: string;
    fallbackEnabled: boolean;
    aiRules: string[];
  };
};


/* ============================================================
   HELPERS
   ============================================================ */

function stringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}


function booleanValue(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}


function numberValue(
  value: unknown,
  fallback: number
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}


function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    max,
    Math.max(min, value)
  );
}


/* ============================================================
   PACKAGE → BEHAVIOUR CONTRACT
   ============================================================ */

export function buildBehaviorContractFromPackage(
  packageData: CharacterPackage
): CharacterBehaviorContract {

  return {
    /* --------------------------------------------------------
       IDENTITY
       -------------------------------------------------------- */

    identity: {
      name: packageData.identity.name,

      avatar:
        packageData.identity.avatar,

      avatarUri:
        packageData.identity.avatarUri,

      description:
        packageData.identity.description,
    },


    /* --------------------------------------------------------
       PERSONALITY
       -------------------------------------------------------- */

    personality: {
      traits:
        stringArray(
          packageData.personality?.traits
        ),

      temperament:
        packageData.personality?.temperament,

      values:
        stringArray(
          packageData.personality?.values
        ),

      strengths:
        stringArray(
          packageData.personality?.strengths
        ),

      weaknesses:
        stringArray(
          packageData.personality?.weaknesses
        ),
    },


    /* --------------------------------------------------------
       SPEAKING STYLE
       -------------------------------------------------------- */

    speakingStyle: {
      tone:
        packageData.speakingStyle?.tone,

      language:
        packageData.speakingStyle?.language,

      responseLength:
        packageData.speakingStyle?.responseLength ??
        "medium",

      emojiUsage:
        packageData.speakingStyle?.emojiUsage ??
        "medium",

      styleRules:
        stringArray(
          packageData.speakingStyle?.styleRules
        ),

      examplePhrases:
        stringArray(
          packageData.speakingStyle?.examplePhrases
        ),
    },


    /* --------------------------------------------------------
       EMOTIONAL BEHAVIOUR
       -------------------------------------------------------- */

    emotionalBehavior: {
      expressiveness:
        packageData.emotionalBehavior?.expressiveness ??
        "medium",

      empathy:
        packageData.emotionalBehavior?.empathy ??
        "medium",

      moodAware:
        booleanValue(
          packageData.emotionalBehavior?.moodAware,
          true
        ),

      reactions:
        stringArray(
          packageData.emotionalBehavior?.reactions
        ),

      emotionalRules:
        stringArray(
          packageData.emotionalBehavior?.emotionalRules
        ),
    },


    /* --------------------------------------------------------
       CONVERSATION BEHAVIOUR
       -------------------------------------------------------- */

    conversationBehavior: {
      askFollowUpQuestions:
        booleanValue(
          packageData.conversationBehavior?.askFollowUpQuestions,
          true
        ),

      initiateTopics:
        booleanValue(
          packageData.conversationBehavior?.initiateTopics,
          true
        ),

      playful:
        booleanValue(
          packageData.conversationBehavior?.playful,
          true
        ),

      teasing:
        booleanValue(
          packageData.conversationBehavior?.teasing,
          false
        ),

      disagreementAllowed:
        booleanValue(
          packageData.conversationBehavior?.disagreementAllowed,
          true
        ),

      conversationRules:
        stringArray(
          packageData.conversationBehavior?.conversationRules
        ),
    },


    /* --------------------------------------------------------
       RELATIONSHIP
       -------------------------------------------------------- */

    relationship: {
      type:
        packageData.relationship?.type,

      closeness:
        clamp(
          numberValue(
            packageData.relationship?.closeness,
            0.5
          ),
          0,
          1
        ),

      affection:
        clamp(
          numberValue(
            packageData.relationship?.affection,
            0.5
          ),
          0,
          1
        ),

      relationshipRules:
        stringArray(
          packageData.relationship?.relationshipRules
        ),

      boundaries:
        stringArray(
          packageData.relationship?.boundaries
        ),
    },


    /* --------------------------------------------------------
       MEMORY
       -------------------------------------------------------- */

    memory: {
      enabled:
        booleanValue(
          packageData.memory?.enabled,
          true
        ),

      rememberPreferences:
        booleanValue(
          packageData.memory?.rememberPreferences,
          true
        ),

      rememberGoals:
        booleanValue(
          packageData.memory?.rememberGoals,
          true
        ),

      rememberImportantEvents:
        booleanValue(
          packageData.memory?.rememberImportantEvents,
          true
        ),

      memoryRules:
        stringArray(
          packageData.memory?.memoryRules
        ),
    },


    /* --------------------------------------------------------
       PROACTIVE
       -------------------------------------------------------- */

    proactive: {
      enabled:
        booleanValue(
          packageData.proactive?.enabled,
          false
        ),

      style:
        packageData.proactive?.style,

      triggers:
        stringArray(
          packageData.proactive?.triggers
        ),

      proactiveRules:
        stringArray(
          packageData.proactive?.proactiveRules
        ),
    },


    /* --------------------------------------------------------
       AI CONFIGURATION
       -------------------------------------------------------- */

    ai: {
      temperature:
        clamp(
          numberValue(
            packageData.ai?.temperature,
            0.7
          ),
          0,
          2
        ),

      maxResponseTokens:
        Math.max(
          1,
          Math.round(
            numberValue(
              packageData.ai?.maxResponseTokens,
              500
            )
          )
        ),

      modelPreference:
        packageData.ai?.modelPreference,

      fallbackEnabled:
        booleanValue(
          packageData.ai?.fallbackEnabled,
          true
        ),

      aiRules:
        stringArray(
          packageData.ai?.aiRules
        ),
    },
  };
}


/* ============================================================
   MANUAL CHARACTER → BEHAVIOUR CONTRACT
   ============================================================ */

export function buildBehaviorContractFromCharacter(
  character: Character
): CharacterBehaviorContract {

  const profile =
    character.aiProfile;

  return {
    /* --------------------------------------------------------
       IDENTITY
       -------------------------------------------------------- */

    identity: {
      name: character.name,
      avatar: character.avatar,
      avatarUri: character.avatarUri,
    },


    /* --------------------------------------------------------
       PERSONALITY
       -------------------------------------------------------- */

    personality: {
      traits:
        profile?.personality
          ? [profile.personality]
          : [character.personality],

      values: [],

      strengths: [],

      weaknesses: [],
    },


    /* --------------------------------------------------------
       SPEAKING STYLE
       -------------------------------------------------------- */

    speakingStyle: {
      tone:
        profile?.speakingStyle,

      language:
        "English",

      responseLength:
        "medium",

      emojiUsage:
        "medium",

      styleRules: [],

      examplePhrases: [],
    },


    /* --------------------------------------------------------
       EMOTIONAL BEHAVIOUR
       -------------------------------------------------------- */

    emotionalBehavior: {
      expressiveness:
        "medium",

      empathy:
        "medium",

      moodAware:
        true,

      reactions: [],

      emotionalRules: [],
    },


    /* --------------------------------------------------------
       CONVERSATION BEHAVIOUR
       -------------------------------------------------------- */

    conversationBehavior: {
      askFollowUpQuestions:
        profile?.behaviorRules?.some(
          rule =>
            rule.toLowerCase().includes(
              "follow-up"
            )
        ) ?? true,

      initiateTopics:
        true,

      playful:
        true,

      teasing:
        profile?.behaviorRules?.some(
          rule =>
            rule.toLowerCase().includes(
              "tease"
            )
        ) ?? false,

      disagreementAllowed:
        profile?.behaviorRules?.some(
          rule =>
            rule.toLowerCase().includes(
              "disagree"
            )
        ) ?? true,

      conversationRules:
        stringArray(
          profile?.behaviorRules
        ),
    },


    /* --------------------------------------------------------
       RELATIONSHIP
       -------------------------------------------------------- */

    relationship: {
      type:
        profile?.relationship,

      closeness:
        0.5,

      affection:
        0.5,

      relationshipRules: [],

      boundaries: [],
    },


    /* --------------------------------------------------------
       MEMORY
       -------------------------------------------------------- */

    memory: {
      enabled: true,

      rememberPreferences: true,

      rememberGoals: true,

      rememberImportantEvents: true,

      memoryRules: [],
    },


    /* --------------------------------------------------------
       PROACTIVE
       -------------------------------------------------------- */

    proactive: {
      enabled:
        profile?.proactiveEnabled ?? false,

      style:
        profile?.proactiveStyle,

      triggers: [],

      proactiveRules: [],
    },


    /* --------------------------------------------------------
       AI CONFIGURATION
       -------------------------------------------------------- */

    ai: {
      temperature: 0.7,

      maxResponseTokens: 500,

      fallbackEnabled: true,

      aiRules: [],
    },
  };
}


/* ============================================================
   UNIVERSAL BUILDER
   ============================================================ */

export function buildCharacterBehaviorContract(
  character: Character,
  packageData?: CharacterPackage
): CharacterBehaviorContract {

  if (packageData) {
    return buildBehaviorContractFromPackage(
      packageData
    );
  }

  return buildBehaviorContractFromCharacter(
    character
  );
}


/* ============================================================
   AI-FRIENDLY TEXT REPRESENTATION
   ============================================================ */

export function behaviorContractToPrompt(
  contract: CharacterBehaviorContract
): string {

  return `
CHARACTER BEHAVIOUR CONTRACT

IDENTITY
Name: ${contract.identity.name}
Description: ${contract.identity.description ?? "Not specified"}

PERSONALITY
Traits:
${contract.personality.traits.length
    ? contract.personality.traits
        .map(item => `- ${item}`)
        .join("\n")
    : "- Not specified"}

Temperament:
${contract.personality.temperament ?? "Not specified"}

Values:
${contract.personality.values.length
    ? contract.personality.values
        .map(item => `- ${item}`)
        .join("\n")
    : "- None specified"}

Strengths:
${contract.personality.strengths.length
    ? contract.personality.strengths
        .map(item => `- ${item}`)
        .join("\n")
    : "- None specified"}

Weaknesses:
${contract.personality.weaknesses.length
    ? contract.personality.weaknesses
        .map(item => `- ${item}`)
        .join("\n")
    : "- None specified"}


SPEAKING STYLE
Tone: ${contract.speakingStyle.tone ?? "Natural"}
Language: ${contract.speakingStyle.language ?? "English"}
Response Length: ${contract.speakingStyle.responseLength}
Emoji Usage: ${contract.speakingStyle.emojiUsage}

Style Rules:
${contract.speakingStyle.styleRules.length
    ? contract.speakingStyle.styleRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}

Example Phrases:
${contract.speakingStyle.examplePhrases.length
    ? contract.speakingStyle.examplePhrases
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


EMOTIONAL BEHAVIOUR
Expressiveness: ${contract.emotionalBehavior.expressiveness}
Empathy: ${contract.emotionalBehavior.empathy}
Mood Aware: ${contract.emotionalBehavior.moodAware}

Reactions:
${contract.emotionalBehavior.reactions.length
    ? contract.emotionalBehavior.reactions
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}

Emotional Rules:
${contract.emotionalBehavior.emotionalRules.length
    ? contract.emotionalBehavior.emotionalRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


CONVERSATION BEHAVIOUR
Ask Follow-up Questions:
${contract.conversationBehavior.askFollowUpQuestions}

Initiate Topics:
${contract.conversationBehavior.initiateTopics}

Playful:
${contract.conversationBehavior.playful}

Teasing:
${contract.conversationBehavior.teasing}

Disagreement Allowed:
${contract.conversationBehavior.disagreementAllowed}

Conversation Rules:
${contract.conversationBehavior.conversationRules.length
    ? contract.conversationBehavior.conversationRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


RELATIONSHIP
Type: ${contract.relationship.type ?? "Not specified"}
Closeness: ${contract.relationship.closeness}
Affection: ${contract.relationship.affection}

Relationship Rules:
${contract.relationship.relationshipRules.length
    ? contract.relationship.relationshipRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}

Boundaries:
${contract.relationship.boundaries.length
    ? contract.relationship.boundaries
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


MEMORY
Enabled: ${contract.memory.enabled}
Remember Preferences: ${contract.memory.rememberPreferences}
Remember Goals: ${contract.memory.rememberGoals}
Remember Important Events: ${contract.memory.rememberImportantEvents}

Memory Rules:
${contract.memory.memoryRules.length
    ? contract.memory.memoryRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


PROACTIVE BEHAVIOUR
Enabled: ${contract.proactive.enabled}
Style: ${contract.proactive.style ?? "Not specified"}

Triggers:
${contract.proactive.triggers.length
    ? contract.proactive.triggers
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}

Proactive Rules:
${contract.proactive.proactiveRules.length
    ? contract.proactive.proactiveRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}


AI CONFIGURATION
Temperature: ${contract.ai.temperature}
Maximum Response Tokens: ${contract.ai.maxResponseTokens}
Model Preference: ${contract.ai.modelPreference ?? "Default"}
Fallback Enabled: ${contract.ai.fallbackEnabled}

AI Rules:
${contract.ai.aiRules.length
    ? contract.ai.aiRules
        .map(item => `- ${item}`)
        .join("\n")
    : "- None"}
`.trim();
}