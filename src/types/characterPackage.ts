export type CharacterPackageVersion = "1.0";

export type CharacterPackage = {
  packageVersion: CharacterPackageVersion;

  identity: {
    name: string;

    avatar?: string;

    avatarUri?: string;

    description?: string;
  };

  personality: {
    traits: string[];

    temperament?: string;

    values?: string[];

    strengths?: string[];

    weaknesses?: string[];
  };

  speakingStyle: {
    tone?: string;

    language?: string;

    responseLength?: "short" | "medium" | "long";

    emojiUsage?: "none" | "low" | "medium" | "high";

    styleRules?: string[];

    examplePhrases?: string[];
  };

  emotionalBehavior: {
    expressiveness?: "low" | "medium" | "high";

    empathy?: "low" | "medium" | "high";

    moodAware?: boolean;

    reactions?: string[];

    emotionalRules?: string[];
  };

  conversationBehavior: {
    askFollowUpQuestions?: boolean;

    initiateTopics?: boolean;

    playful?: boolean;

    teasing?: boolean;

    disagreementAllowed?: boolean;

    conversationRules?: string[];
  };

  relationship: {
    type?: string;

    closeness?: number;

    affection?: number;

    relationshipRules?: string[];

    boundaries?: string[];
  };

  memory: {
    enabled?: boolean;

    rememberPreferences?: boolean;

    rememberGoals?: boolean;

    rememberImportantEvents?: boolean;

    memoryRules?: string[];
  };

  proactive: {
    enabled?: boolean;

    style?: string;

    triggers?: (
      | "time"
      | "inactivity"
      | "memory"
      | "conversation"
      | "random"
    )[];

    proactiveRules?: string[];
  };

  ai: {
    temperature?: number;

    maxResponseTokens?: number;

    modelPreference?: string;

    fallbackEnabled?: boolean;

    aiRules?: string[];
  };

  memories?: {
    type:
      | "fact"
      | "interest"
      | "preference"
      | "goal"
      | "habit"
      | "relationship"
      | "important_event";

    content: string;

    importance?: number;

    confidence?: number;
  }[];

  conversationExamples?: {
    user: string;

    character: string;
  }[];

  metadata?: {
    description?: string;

    author?: string;

    createdAt?: string;

    updatedAt?: string;

    tags?: string[];
  };
};