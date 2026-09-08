
import { supabase } from "./supabase";

import {
    buildBehaviorContractFromCharacter,
    buildBehaviorContractFromPackage,
    CharacterBehaviorContract,
} from "./characterBehaviorService";

import { Character } from "@/types/character";
import { CharacterPackage } from "@/types/characterPackage";

/**
 * ============================================================
 * CHARACTER BEHAVIOUR REPOSITORY
 * ============================================================
 *
 * Responsible for storing and retrieving:
 *
 *   characters
 *   character_behaviors
 *   character_settings
 *
 * from Supabase.
 *
 * This file does NOT control AI responses.
 * ============================================================
 */

type CharacterRow = {
  id: string;
  user_id: string;

  name: string;
  avatar: string | null;
  avatar_uri: string | null;

  source: "manual" | "imported";

  package_version: string | null;
  package_data: Record<string, unknown> | null;

  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

type CharacterBehaviorRow = {
  character_id: string;

  personality: Record<string, unknown> | null;
  speaking_style: Record<string, unknown> | null;
  emotional_behavior: Record<string, unknown> | null;
  conversation_behavior: Record<string, unknown> | null;
  relationship_behavior: Record<string, unknown> | null;
  memory_behavior: Record<string, unknown> | null;
  proactive_behavior: Record<string, unknown> | null;
  ai_behavior: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;
};

type CharacterSettingsRow = {
  character_id: string;

  is_enabled: boolean;
  proactive_enabled: boolean;
  memory_enabled: boolean;

  short_term_memory_days: number;
  long_term_memory_enabled: boolean;

  context_message_limit: number;

  temperature: number;
  max_response_tokens: number;

  allow_ai_initiated_messages: boolean;

  created_at?: string;
  updated_at?: string;
};

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function asRecord(
  value: unknown
): Record<string, unknown> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

/**
 * ============================================================
 * SAVE CHARACTER → SUPABASE
 * ============================================================
 *
 * Creates/updates the parent row in the `characters` table.
 *
 * This MUST happen before inserting:
 *
 *   character_behaviors
 *   character_settings
 *
 * because those tables reference characters.id.
 */

export async function saveCharacterToSupabase(
  character: Character,
  packageData?: CharacterPackage
): Promise<CharacterRow> {
  if (!character.id) {
    throw new Error(
      "Character ID is required."
    );
  }

  /**
   * Get currently authenticated user.
   */

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Failed to get authenticated user:",
      userError
    );

    throw userError;
  }

  if (!user) {
    throw new Error(
      "No authenticated user found."
    );
  }

  /**
   * Determine whether this is a manual
   * or imported character.
   */

  const source:
    | "manual"
    | "imported" =
    packageData
      ? "imported"
      : "manual";

  /**
   * Preserve the original package JSON
   * for imported characters.
   */

  const packageDataRecord =
    packageData
      ? (packageData as unknown as Record<
          string,
          unknown
        >)
      : null;

  /**
   * Supabase characters row.
   */

  const row = {
    id: character.id,

    user_id: user.id,

    name: character.name,

    avatar:
      character.avatar ??
      null,

    avatar_uri:
      character.avatarUri ??
      null,

    source,

    package_version:
      packageData?.packageVersion ??
      null,

    package_data:
      packageDataRecord,

    is_active: true,
  };

  const {
    data,
    error,
  } = await supabase
    .from("characters")
    .upsert(row, {
      onConflict: "id",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Failed to save character to Supabase:",
      error
    );

    throw error;
  }

  console.log(
    "✅ Character saved to Supabase:",
    character.name,
    character.id
  );

  return data as CharacterRow;
}

/**
 * ============================================================
 * GET CHARACTER FROM SUPABASE
 * ============================================================
 */

export async function getCharacterFromSupabase(
  characterId: string
): Promise<CharacterRow | null> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load character from Supabase:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  return data as CharacterRow;
}

/**
 * ============================================================
 * CONVERT BEHAVIOUR CONTRACT → SUPABASE ROW
 * ============================================================
 */

function contractToBehaviorRow(
  characterId: string,
  contract: CharacterBehaviorContract
): CharacterBehaviorRow {
  return {
    character_id: characterId,

    personality: asRecord(
      contract.personality
    ),

    speaking_style: asRecord(
      contract.speakingStyle
    ),

    emotional_behavior: asRecord(
      contract.emotionalBehavior
    ),

    conversation_behavior: asRecord(
      contract.conversationBehavior
    ),

    relationship_behavior: asRecord(
      contract.relationship
    ),

    memory_behavior: asRecord(
      contract.memory
    ),

    proactive_behavior: asRecord(
      contract.proactive
    ),

    ai_behavior: asRecord(
      contract.ai
    ),
  };
}

/**
 * ============================================================
 * CONVERT SUPABASE ROW → BEHAVIOUR CONTRACT
 * ============================================================
 */

function behaviorRowToContract(
  row: CharacterBehaviorRow,
  character: Character
): CharacterBehaviorContract {
  return {
    identity: {
      name: character.name,
      avatar: character.avatar,
      avatarUri: character.avatarUri,
      description: character.personality,
    },

    personality: {
      ...asRecord(row.personality),
    } as CharacterBehaviorContract["personality"],

    speakingStyle: {
      ...asRecord(row.speaking_style),
    } as CharacterBehaviorContract["speakingStyle"],

    emotionalBehavior: {
      ...asRecord(row.emotional_behavior),
    } as CharacterBehaviorContract["emotionalBehavior"],

    conversationBehavior: {
      ...asRecord(row.conversation_behavior),
    } as CharacterBehaviorContract["conversationBehavior"],

    relationship: {
      ...asRecord(row.relationship_behavior),
    } as CharacterBehaviorContract["relationship"],

    memory: {
      ...asRecord(row.memory_behavior),
    } as CharacterBehaviorContract["memory"],

    proactive: {
      ...asRecord(row.proactive_behavior),
    } as CharacterBehaviorContract["proactive"],

    ai: {
      ...asRecord(row.ai_behavior),
    } as CharacterBehaviorContract["ai"],
  };
}

/**
 * ============================================================
 * SAVE CHARACTER BEHAVIOUR
 * ============================================================
 */

export async function saveCharacterBehavior(
  characterId: string,
  contract: CharacterBehaviorContract
): Promise<CharacterBehaviorContract> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const row =
    contractToBehaviorRow(
      characterId,
      contract
    );

  const {
    data,
    error,
  } = await supabase
    .from("character_behaviors")
    .upsert(row, {
      onConflict: "character_id",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Failed to save character behaviour:",
      error
    );

    throw error;
  }

  return behaviorRowToContract(
    data as CharacterBehaviorRow,
    {
      id: characterId,

      name:
        contract.identity?.name ??
        "Character",

      avatar:
        contract.identity?.avatar,

      avatarUri:
        contract.identity?.avatarUri,

      personality:
        contract.identity?.description ??
        "",

      status: "offline",

      createdAt: Date.now(),
    } as Character
  );
}

/**
 * ============================================================
 * GET CHARACTER BEHAVIOUR
 * ============================================================
 */

export async function getCharacterBehavior(
  characterId: string,
  character?: Character
): Promise<CharacterBehaviorContract | null> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("character_behaviors")
    .select("*")
    .eq("character_id", characterId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load character behaviour:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  const fallbackCharacter: Character =
    character ??
    ({
      id: characterId,
      name: "Character",
      personality: "",
      status: "offline",
      createdAt: Date.now(),
    } as Character);

  return behaviorRowToContract(
    data as CharacterBehaviorRow,
    fallbackCharacter
  );
}

/**
 * ============================================================
 * CREATE BEHAVIOUR FROM CHARACTER
 * ============================================================
 */

export async function createCharacterBehaviorFromCharacter(
  character: Character,
  packageData?: CharacterPackage
): Promise<CharacterBehaviorContract> {
  if (packageData) {
    return buildBehaviorContractFromPackage(
      packageData
    );
  }

  return buildBehaviorContractFromCharacter(
    character
  );
}

/**
 * ============================================================
 * SAVE CHARACTER BEHAVIOUR FROM CHARACTER
 * ============================================================
 */

export async function saveCharacterBehaviorFromCharacter(
  character: Character,
  packageData?: CharacterPackage
): Promise<CharacterBehaviorContract> {
  const contract =
    await createCharacterBehaviorFromCharacter(
      character,
      packageData
    );

  return saveCharacterBehavior(
    character.id,
    contract
  );
}

/**
 * ============================================================
 * UPDATE CHARACTER BEHAVIOUR
 * ============================================================
 */

export async function updateCharacterBehavior(
  characterId: string,
  updates: Partial<CharacterBehaviorContract>,
  character?: Character
): Promise<CharacterBehaviorContract> {
  const existing =
    await getCharacterBehavior(
      characterId,
      character
    );

  if (!existing) {
    throw new Error(
      "Character behaviour does not exist."
    );
  }

  const updated: CharacterBehaviorContract = {
    ...existing,

    identity: {
      ...existing.identity,
      ...(updates.identity ?? {}),
    },

    personality: {
      ...existing.personality,
      ...(updates.personality ?? {}),
    },

    speakingStyle: {
      ...existing.speakingStyle,
      ...(updates.speakingStyle ?? {}),
    },

    emotionalBehavior: {
      ...existing.emotionalBehavior,
      ...(updates.emotionalBehavior ?? {}),
    },

    conversationBehavior: {
      ...existing.conversationBehavior,
      ...(updates.conversationBehavior ?? {}),
    },

    relationship: {
      ...existing.relationship,
      ...(updates.relationship ?? {}),
    },

    memory: {
      ...existing.memory,
      ...(updates.memory ?? {}),
    },

    proactive: {
      ...existing.proactive,
      ...(updates.proactive ?? {}),
    },

    ai: {
      ...existing.ai,
      ...(updates.ai ?? {}),
    },
  };

  return saveCharacterBehavior(
    characterId,
    updated
  );
}

/**
 * ============================================================
 * DELETE CHARACTER BEHAVIOUR
 * ============================================================
 */

export async function deleteCharacterBehavior(
  characterId: string
): Promise<void> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const {
    error,
  } = await supabase
    .from("character_behaviors")
    .delete()
    .eq("character_id", characterId);

  if (error) {
    console.error(
      "Failed to delete character behaviour:",
      error
    );

    throw error;
  }
}

/**
 * ============================================================
 * SAVE CHARACTER SETTINGS
 * ============================================================
 */

export async function saveCharacterSettings(
  characterId: string,
  settings: Partial<CharacterSettingsRow>
): Promise<CharacterSettingsRow> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const row = {
    character_id: characterId,

    is_enabled:
      settings.is_enabled ?? true,

    proactive_enabled:
      settings.proactive_enabled ?? false,

    memory_enabled:
      settings.memory_enabled ?? true,

    short_term_memory_days:
      settings.short_term_memory_days ?? 7,

    long_term_memory_enabled:
      settings.long_term_memory_enabled ?? true,

    context_message_limit:
      settings.context_message_limit ?? 20,

    temperature:
      settings.temperature ?? 0.7,

    max_response_tokens:
      settings.max_response_tokens ?? 500,

    allow_ai_initiated_messages:
      settings.allow_ai_initiated_messages ??
      false,
  };

  const {
    data,
    error,
  } = await supabase
    .from("character_settings")
    .upsert(row, {
      onConflict: "character_id",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Failed to save character settings:",
      error
    );

    throw error;
  }

  return data as CharacterSettingsRow;
}

/**
 * ============================================================
 * GET CHARACTER SETTINGS
 * ============================================================
 */

export async function getCharacterSettings(
  characterId: string
): Promise<CharacterSettingsRow | null> {
  if (!characterId) {
    throw new Error(
      "Character ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("character_settings")
    .select("*")
    .eq("character_id", characterId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load character settings:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  return data as CharacterSettingsRow;
}

/**
 * ============================================================
 * ENSURE CHARACTER BEHAVIOUR + SETTINGS
 * ============================================================
 *
 * IMPORTANT:
 *
 * The parent `characters` row must already exist.
 *
 * Therefore callers should execute:
 *
 *   saveCharacterToSupabase(character)
 *
 * BEFORE:
 *
 *   ensureCharacterBehavior(character)
 *
 * ============================================================
 */

export async function ensureCharacterBehavior(
  character: Character,
  packageData?: CharacterPackage
): Promise<CharacterBehaviorContract> {
  let contract =
    await getCharacterBehavior(
      character.id,
      character
    );

  if (!contract) {
    contract =
      await saveCharacterBehaviorFromCharacter(
        character,
        packageData
      );
  }

  const existingSettings =
    await getCharacterSettings(
      character.id
    );

  if (!existingSettings) {
    await saveCharacterSettings(
      character.id,
      {}
    );
  }

  return contract;
}

/**
 * ============================================================
 * TEST / DEBUG
 * ============================================================
 */

export async function testCharacterBehaviorRepository(
  character: Character
): Promise<void> {
  try {
    console.log(
      "🧠 Testing character behaviour repository..."
    );

    const supabaseCharacter =
      await getCharacterFromSupabase(
        character.id
      );

    console.log(
      "👤 Supabase character:",
      supabaseCharacter
    );

    const saved =
      await ensureCharacterBehavior(
        character
      );

    console.log(
      "🧠 Behaviour saved:",
      saved
    );

    const loaded =
      await getCharacterBehavior(
        character.id,
        character
      );

    console.log(
      "🧠 Behaviour loaded:",
      loaded
    );

    const settings =
      await getCharacterSettings(
        character.id
      );

    console.log(
      "⚙️ Character settings:",
      settings
    );

    console.log(
      "✅ Character behaviour repository test completed."
    );
  } catch (error) {
    console.error(
      "❌ Character behaviour repository test failed:",
      error
    );
  }
}

