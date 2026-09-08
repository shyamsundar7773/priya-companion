export type Character = {
  id: string;

  name: string;

  avatar?: string;

  avatarUri?: string;

  personality: string;

  status: "online" | "offline";

  createdAt: number;

  // ==========================================================
  // CHARACTER AI CONFIGURATION
  // ==========================================================

  aiProfile?: {
    personality?: string;

    speakingStyle?: string;

    behaviorRules?: string[];

    interests?: string[];

    likes?: string[];

    dislikes?: string[];

    relationship?: string;

    responseStyle?: string;

    proactiveEnabled?: boolean;

    proactiveStyle?: string;
  };
};