import AsyncStorage from "@react-native-async-storage/async-storage";


import { Character } from "@/types/character";
import { CharacterPackage } from "@/types/characterPackage";
import { MemoryType } from "@/types/memory";
import { addMemory } from "./memoryService";

const CURRENT_PACKAGE_VERSION = "1.0";

const PACKAGE_STORAGE_PREFIX =
  "@priya_companion_character_package_";

/**
 * Safely converts unknown values into an array of strings.
 */
function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

/**
 * Safely converts a value into a boolean.
 */
function booleanValue(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

/**
 * Safely converts a value into a number.
 */
function numberValue(
  value: unknown,
  fallback: number
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

/**
 * Clamp a number between two values.
 */
function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/**
 * Check whether a package version
 * is supported by the current app.
 */
function isSupportedPackageVersion(
  version: unknown
): version is "1.0" {
  return version === CURRENT_PACKAGE_VERSION;
}

/**
 * Validate the package version before
 * the package is normalized.
 */
function validatePackageVersion(
  raw: Record<string, any>
): void {
  const version =
    raw.packageVersion;

  if (typeof version !== "string") {
    throw new Error(
      "Character package is missing packageVersion."
    );
  }

  if (
    !isSupportedPackageVersion(
      version
    )
  ) {
    throw new Error(
      `Unsupported character package version: ${version}. ` +
      `This app currently supports version ${CURRENT_PACKAGE_VERSION}.`
    );
  }
}

/**
 * Check whether a memory type is valid
 * according to the CharacterPackage format.
 */
function isValidMemoryType(
  value: unknown
): value is
  | "fact"
  | "interest"
  | "preference"
  | "goal"
  | "habit"
  | "relationship"
  | "important_event" {
  return (
    value === "fact" ||
    value === "interest" ||
    value === "preference" ||
    value === "goal" ||
    value === "habit" ||
    value === "relationship" ||
    value === "important_event"
  );
}

/**
 * Convert CharacterPackage memory types
 * into the currently supported MemoryType.
 *
 * IMPORTANT:
 * "important_event" is temporarily mapped
 * to "fact".
 *
 * The proper "important_event" memory type
 * will be handled later when the new
 * Supabase memory architecture is connected.
 */
function convertPackageMemoryType(
  type:
    | "fact"
    | "interest"
    | "preference"
    | "goal"
    | "habit"
    | "relationship"
    | "important_event"
): MemoryType {
  switch (type) {
    case "fact":
      return "fact";

    case "interest":
      return "interest";

    case "preference":
      return "preference";

    case "goal":
      return "goal";

    case "habit":
      return "habit";

    case "relationship":
      return "relationship";

    case "important_event":
      // Temporary compatibility mapping.
      // Proper important_event handling will
      // be implemented in the Supabase memory layer.
      return "fact";

    default:
      return "fact";
  }
}

/**
 * Normalize an imported character package.
 *
 * This converts external package data into
 * a predictable internal structure.
 */
export function normalizeCharacterPackage(
  raw: unknown
): CharacterPackage {
  /**
   * ----------------------------------------------------------
   * Basic object validation
   * ----------------------------------------------------------
   */

  if (
    !raw ||
    typeof raw !== "object"
  ) {
    throw new Error(
      "Character package must be a valid JSON object."
    );
  }

  const data =
    raw as Record<string, any>;

  /**
   * ----------------------------------------------------------
   * Package version validation
   * ----------------------------------------------------------
   */

  validatePackageVersion(data);

  /**
   * ----------------------------------------------------------
   * Read package sections
   * ----------------------------------------------------------
   */

  const identity =
    data.identity ?? {};

  const personality =
    data.personality ?? {};

  const speakingStyle =
    data.speakingStyle ?? {};

  const emotionalBehavior =
    data.emotionalBehavior ?? {};

  const conversationBehavior =
    data.conversationBehavior ?? {};

  const relationship =
    data.relationship ?? {};

  const memory =
    data.memory ?? {};

  const proactive =
    data.proactive ?? {};

  const ai =
    data.ai ?? {};

  /**
   * ----------------------------------------------------------
   * Identity validation
   * ----------------------------------------------------------
   */

  if (
    typeof identity.name !== "string" ||
    !identity.name.trim()
  ) {
    throw new Error(
      "Character package must contain identity.name."
    );
  }

  /**
   * ----------------------------------------------------------
   * Normalize package
   * ----------------------------------------------------------
   */

  const normalized: CharacterPackage = {

    packageVersion:
      CURRENT_PACKAGE_VERSION,

    /**
     * --------------------------------------------------------
     * Identity
     * --------------------------------------------------------
     */

    identity: {
      name:
        identity.name.trim(),

      avatar:
        typeof identity.avatar === "string"
          ? identity.avatar
          : undefined,

      avatarUri:
        typeof identity.avatarUri === "string"
          ? identity.avatarUri
          : undefined,

      description:
        typeof identity.description === "string"
          ? identity.description
          : undefined,
    },

    /**
     * --------------------------------------------------------
     * Personality
     * --------------------------------------------------------
     */

    personality: {
      traits:
        stringArray(
          personality.traits
        ),

      temperament:
        typeof personality.temperament === "string"
          ? personality.temperament
          : undefined,

      values:
        stringArray(
          personality.values
        ),

      strengths:
        stringArray(
          personality.strengths
        ),

      weaknesses:
        stringArray(
          personality.weaknesses
        ),
    },

    /**
     * --------------------------------------------------------
     * Speaking Style
     * --------------------------------------------------------
     */

    speakingStyle: {
      tone:
        typeof speakingStyle.tone === "string"
          ? speakingStyle.tone
          : "casual",

      language:
        typeof speakingStyle.language === "string"
          ? speakingStyle.language
          : "English",

      responseLength:
        speakingStyle.responseLength === "short" ||
        speakingStyle.responseLength === "medium" ||
        speakingStyle.responseLength === "long"
          ? speakingStyle.responseLength
          : "medium",

      emojiUsage:
        speakingStyle.emojiUsage === "none" ||
        speakingStyle.emojiUsage === "low" ||
        speakingStyle.emojiUsage === "medium" ||
        speakingStyle.emojiUsage === "high"
          ? speakingStyle.emojiUsage
          : "medium",

      styleRules:
        stringArray(
          speakingStyle.styleRules
        ),

      examplePhrases:
        stringArray(
          speakingStyle.examplePhrases
        ),
    },

    /**
     * --------------------------------------------------------
     * Emotional Behaviour
     * --------------------------------------------------------
     */

    emotionalBehavior: {
      expressiveness:
        emotionalBehavior.expressiveness === "low" ||
        emotionalBehavior.expressiveness === "medium" ||
        emotionalBehavior.expressiveness === "high"
          ? emotionalBehavior.expressiveness
          : "medium",

      empathy:
        emotionalBehavior.empathy === "low" ||
        emotionalBehavior.empathy === "medium" ||
        emotionalBehavior.empathy === "high"
          ? emotionalBehavior.empathy
          : "medium",

      moodAware:
        booleanValue(
          emotionalBehavior.moodAware,
          true
        ),

      reactions:
        stringArray(
          emotionalBehavior.reactions
        ),

      emotionalRules:
        stringArray(
          emotionalBehavior.emotionalRules
        ),
    },

    /**
     * --------------------------------------------------------
     * Conversation Behaviour
     * --------------------------------------------------------
     */

    conversationBehavior: {
      askFollowUpQuestions:
        booleanValue(
          conversationBehavior.askFollowUpQuestions,
          true
        ),

      initiateTopics:
        booleanValue(
          conversationBehavior.initiateTopics,
          true
        ),

      playful:
        booleanValue(
          conversationBehavior.playful,
          false
        ),

      teasing:
        booleanValue(
          conversationBehavior.teasing,
          false
        ),

      disagreementAllowed:
        booleanValue(
          conversationBehavior.disagreementAllowed,
          true
        ),

      conversationRules:
        stringArray(
          conversationBehavior.conversationRules
        ),
    },

    /**
     * --------------------------------------------------------
     * Relationship
     * --------------------------------------------------------
     */

    relationship: {
      type:
        typeof relationship.type === "string"
          ? relationship.type
          : "companion",

      closeness:
        clamp(
          numberValue(
            relationship.closeness,
            0.5
          ),
          0,
          1
        ),

      affection:
        clamp(
          numberValue(
            relationship.affection,
            0.5
          ),
          0,
          1
        ),

      relationshipRules:
        stringArray(
          relationship.relationshipRules
        ),

      boundaries:
        stringArray(
          relationship.boundaries
        ),
    },

    /**
     * --------------------------------------------------------
     * Memory Behaviour
     * --------------------------------------------------------
     */

    memory: {
      enabled:
        booleanValue(
          memory.enabled,
          true
        ),

      rememberPreferences:
        booleanValue(
          memory.rememberPreferences,
          true
        ),

      rememberGoals:
        booleanValue(
          memory.rememberGoals,
          true
        ),

      rememberImportantEvents:
        booleanValue(
          memory.rememberImportantEvents,
          true
        ),

      memoryRules:
        stringArray(
          memory.memoryRules
        ),
    },

    /**
     * --------------------------------------------------------
     * Proactive Behaviour
     * --------------------------------------------------------
     */

    proactive: {
      enabled:
        booleanValue(
          proactive.enabled,
          false
        ),

      style:
        typeof proactive.style === "string"
          ? proactive.style
          : undefined,

      triggers:
        Array.isArray(
          proactive.triggers
        )
          ? proactive.triggers.filter(
              (
                trigger: unknown
              ): trigger is
                | "time"
                | "inactivity"
                | "memory"
                | "conversation"
                | "random" =>
                trigger === "time" ||
                trigger === "inactivity" ||
                trigger === "memory" ||
                trigger === "conversation" ||
                trigger === "random"
            )
          : [],

      proactiveRules:
        stringArray(
          proactive.proactiveRules
        ),
    },

    /**
     * --------------------------------------------------------
     * AI Configuration
     * --------------------------------------------------------
     */

    ai: {
      temperature:
        clamp(
          numberValue(
            ai.temperature,
            0.7
          ),
          0,
          2
        ),

      maxResponseTokens:
        Math.max(
          1,
          Math.floor(
            numberValue(
              ai.maxResponseTokens,
              1000
            )
          )
        ),

      modelPreference:
        typeof ai.modelPreference === "string"
          ? ai.modelPreference
          : undefined,

      fallbackEnabled:
        booleanValue(
          ai.fallbackEnabled,
          true
        ),

      aiRules:
        stringArray(
          ai.aiRules
        ),
    },

    /**
     * --------------------------------------------------------
     * Long-term / imported memories
     * --------------------------------------------------------
     */

    memories:
      Array.isArray(
        data.memories
      )
        ? data.memories
            .filter(
              (memoryItem: any) =>
                memoryItem &&
                typeof memoryItem === "object" &&
                typeof memoryItem.content === "string" &&
                memoryItem.content.trim().length > 0 &&
                isValidMemoryType(
                  memoryItem.type
                )
            )
            .map(
              (memoryItem: any) => ({
                type:
                  memoryItem.type,

                content:
                  memoryItem.content.trim(),

                importance:
                  clamp(
                    numberValue(
                      memoryItem.importance,
                      0.5
                    ),
                    0,
                    1
                  ),

                confidence:
                  clamp(
                    numberValue(
                      memoryItem.confidence,
                      0.5
                    ),
                    0,
                    1
                  ),
              })
            )
        : [],

    /**
     * --------------------------------------------------------
     * Conversation Examples
     * --------------------------------------------------------
     */

    conversationExamples:
      Array.isArray(
        data.conversationExamples
      )
        ? data.conversationExamples.filter(
            (example: any) =>
              example &&
              typeof example.user === "string" &&
              typeof example.character === "string"
          )
        : [],

    /**
     * --------------------------------------------------------
     * Metadata
     * --------------------------------------------------------
     */

    metadata: {
      description:
        typeof data.metadata?.description === "string"
          ? data.metadata.description
          : undefined,

      author:
        typeof data.metadata?.author === "string"
          ? data.metadata.author
          : undefined,

      createdAt:
        typeof data.metadata?.createdAt === "string"
          ? data.metadata.createdAt
          : undefined,

      updatedAt:
        typeof data.metadata?.updatedAt === "string"
          ? data.metadata.updatedAt
          : undefined,

      tags:
        stringArray(
          data.metadata?.tags
        ),
    },
  };

  return normalized;
}


/**
 * Save a character package locally.
 *
 * The complete package is stored separately
 * from the compatibility Character object.
 */
export async function savePackage(
  characterId: string,
  packageData: CharacterPackage
): Promise<void> {

  const key =
    `${PACKAGE_STORAGE_PREFIX}${characterId}`;

  await AsyncStorage.setItem(
    key,
    JSON.stringify(packageData)
  );
}


/**
 * Get a saved character package.
 */
export async function getCharacterPackage(
  characterId: string
): Promise<CharacterPackage | null> {

  const key =
    `${PACKAGE_STORAGE_PREFIX}${characterId}`;

  const stored =
    await AsyncStorage.getItem(
      key
    );

  if (!stored) {
    return null;
  }

  try {

    const parsed =
      JSON.parse(stored);

    return normalizeCharacterPackage(
      parsed
    );

  } catch {

    return null;
  }
}


/**
 * Delete a saved character package.
 */
export async function deleteCharacterPackage(
  characterId: string
): Promise<void> {

  const key =
    `${PACKAGE_STORAGE_PREFIX}${characterId}`;

  await AsyncStorage.removeItem(
    key
  );
}


/**
 * Convert a normalized CharacterPackage
 * into the existing Character model.
 *
 * This is currently a compatibility bridge.
 */
export async function importCharacterPackage(
  packageData: unknown
): Promise<Character> {

  /**
   * ----------------------------------------------------------
   * Validate + normalize
   * ----------------------------------------------------------
   */

  const packageObject =
    normalizeCharacterPackage(
      packageData
    );

  /**
   * ----------------------------------------------------------
   * Generate character ID
   * ----------------------------------------------------------
   */

  const characterId =
    `character_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  /**
   * ----------------------------------------------------------
   * Create Character compatibility object
   * ----------------------------------------------------------
   */

  const character: Character = {

    id:
      characterId,

    name:
      packageObject.identity.name,

    avatar:
      packageObject.identity.avatar ??
      "👩🏻",

    avatarUri:
      packageObject.identity.avatarUri,

    personality:
      packageObject.personality.traits.join(
        ", "
      ),

    status:
      "online",

    aiProfile: {

      personality:
        packageObject.personality.traits.join(
          ", "
        ),

      speakingStyle:
        packageObject.speakingStyle.tone,

      behaviorRules:
        packageObject.conversationBehavior
          .conversationRules,

      interests:
        packageObject.metadata?.tags ?? [],

      likes:
        [],

      dislikes:
        [],

      relationship:
        packageObject.relationship.type,

      responseStyle:
        packageObject.speakingStyle.responseLength,

      proactiveEnabled:
        packageObject.proactive.enabled,

      proactiveStyle:
        packageObject.proactive.style,
    },

    createdAt:
      Date.now(),
  };

  /**
   * ----------------------------------------------------------
   * Preserve the complete package
   * ----------------------------------------------------------
   */

  await savePackage(
    characterId,
    packageObject
  );

  /**
   * ----------------------------------------------------------
   * Import package memories
   * ----------------------------------------------------------
   *
   * The new package format supports
   * "important_event".
   *
   * The current memoryService does not yet
   * support "important_event".
   *
   * Therefore we temporarily map
   * "important_event" to "fact".
   */

  if (
    packageObject.memory.enabled !== false &&
    packageObject.memories &&
    packageObject.memories.length > 0
  ) {

    for (
      const memoryItem
      of packageObject.memories
    ) {

      try {

        const memoryType =
          convertPackageMemoryType(
            memoryItem.type
          );

        await addMemory(
          characterId,
          memoryType,
          memoryItem.content,
          memoryItem.importance ?? 0.5,
          memoryItem.confidence ?? 0.5
        );

      } catch {

        /**
         * A memory import failure should not
         * prevent the character from being created.
         */
      }
    }
  }

  return character;
}