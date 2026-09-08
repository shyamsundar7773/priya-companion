
import { randomUUID } from "expo-crypto";
import { useTheme } from "../context/ThemeContext";

import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CharacterPhotoPicker from "@/components/character/CharacterPhotoPicker";

import {
  ensureCharacterBehavior,
  saveCharacterToSupabase,
} from "@/services/characterBehaviorRepository";

import {
  importCharacterPackage,
  savePackage,
} from "@/services/characterPackageService";

import { addCharacter } from "@/services/characterService";

import { Character } from "@/types/character";
import { CharacterPackage } from "@/types/characterPackage";

const avatars = [
  "👩🏻",
  "👩🏼",
  "👩🏽",
  "👩🏾",
  "👩🏿",
  "🧑🏻",
  "👩🏻‍🦰",
  "👩🏻‍🦱",
];

export default function CreateCharacterScreen() {
  const [name, setName] = useState("");
  const [personality, setPersonality] =
    useState("");

  const [selectedAvatar, setSelectedAvatar] =
    useState("👩🏻");

  const [avatarUri, setAvatarUri] =
    useState<string | undefined>(undefined);

  const [importing, setImporting] =
    useState(false);

  const { isDark } = useTheme();

  /* ==========================================================
     MANUAL CHARACTER
     ========================================================== */

  const saveCharacter = async () => {
    const trimmedName =
      name.trim();

    const trimmedPersonality =
      personality.trim();

    if (!trimmedName) {
      return;
    }

    try {
      /* ========================================================
         STEP 1
         Generate ONE UUID
         ======================================================== */

      const characterId =
        randomUUID();

      /* ========================================================
         STEP 2
         Create compatibility Character object
         ======================================================== */

      const newCharacter: Character = {
        id: characterId,

        name: trimmedName,

        avatar: selectedAvatar,

        avatarUri,

        personality:
          trimmedPersonality ||
          "Friendly, natural and caring.",

        status: "online",

        createdAt: Date.now(),

        aiProfile: {
          personality:
            trimmedPersonality ||
            "Friendly, natural and caring.",

          speakingStyle:
            "Natural, casual conversation.",

          behaviorRules: [
            "Respond naturally to the user.",
            "Ask follow-up questions when appropriate.",
            "Do not always agree with the user.",
            "Show personality instead of giving robotic responses.",
          ],

          interests: [],

          likes: [],

          dislikes: [],

          relationship:
            "Friendly companion",

          responseStyle:
            "Natural, conversational and emotionally expressive.",

          proactiveEnabled: false,

          proactiveStyle:
            "Occasional natural messages based on conversation context.",
        },
      };

      /* ========================================================
         STEP 3
         Create Character Package
         ======================================================== */

      const characterPackage: CharacterPackage = {
        packageVersion: "1.0",

        identity: {
          name: trimmedName,

          avatar:
            selectedAvatar,

          avatarUri,

          description:
            trimmedPersonality ||
            "Friendly, natural and caring.",
        },

        personality: {
          traits:
            trimmedPersonality
              ? [trimmedPersonality]
              : [
                  "friendly",
                  "natural",
                  "caring",
                ],

          temperament:
            "Friendly and natural",

          values: [],

          strengths: [],

          weaknesses: [],
        },

        speakingStyle: {
          tone:
            "casual and natural",

          language:
            "English",

          responseLength:
            "medium",

          emojiUsage:
            "medium",

          styleRules: [
            "Speak naturally.",
            "Avoid robotic responses.",
            "Keep conversation casual when appropriate.",
            "Do not sound like a formal assistant.",
          ],

          examplePhrases: [],
        },

        emotionalBehavior: {
          expressiveness:
            "medium",

          empathy:
            "medium",

          moodAware:
            true,

          reactions: [
            "React naturally to the user's emotional tone.",
            "Show warmth when the user is happy or positive.",
            "Show empathy when the user is upset or low.",
          ],

          emotionalRules: [
            "Do not overreact to ordinary messages.",
            "Match the emotional intensity of the conversation.",
            "Do not turn every emotional statement into advice.",
          ],
        },

        conversationBehavior: {
          askFollowUpQuestions:
            true,

          initiateTopics:
            true,

          playful:
            true,

          teasing:
            true,

          disagreementAllowed:
            true,

          conversationRules: [
            "Respond naturally to the current message.",
            "Do not ask a question every time.",
            "Use follow-up questions only when appropriate.",
            "The character may joke or tease naturally.",
            "The character may disagree respectfully.",
            "Do not force conversations into a specific topic.",
          ],
        },

        relationship: {
          type:
            "Friendly companion",

          closeness:
            0.5,

          affection:
            0.5,

          relationshipRules: [
            "Treat the user as a familiar companion.",
            "Maintain warmth and natural familiarity.",
          ],

          boundaries: [],
        },

        memory: {
          enabled:
            true,

          rememberPreferences:
            true,

          rememberGoals:
            true,

          rememberImportantEvents:
            true,

          memoryRules: [
            "Remember important user information when relevant.",
            "Use remembered information naturally.",
            "Do not mention internal memory systems.",
          ],
        },

        proactive: {
          enabled:
            false,

          style:
            "Occasional natural messages based on conversation context.",

          triggers: [],

          proactiveRules: [],
        },

        ai: {
          temperature:
            0.8,

          maxResponseTokens:
            800,

          fallbackEnabled:
            true,

          aiRules: [
            "Stay in character.",
            "Respond naturally.",
            "Avoid robotic responses.",
            "Prioritize current conversation context.",
          ],
        },

        memories: [],

        conversationExamples: [],

        metadata: {
          description:
            trimmedPersonality ||
            "Friendly, natural and caring.",

          author:
            "PriyaCompanion",

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),

          tags: [],
        },
      };

      /* ========================================================
         STEP 4
         Save character locally
         ======================================================== */

      await addCharacter(
        newCharacter
      );

      /* ========================================================
         STEP 5
         Save character to Supabase
         ======================================================== */

      await saveCharacterToSupabase(
        newCharacter
      );

      /* ========================================================
         STEP 6
         Save COMPLETE Character Package
         ======================================================== */

      await savePackage(
        characterId,
        characterPackage
      );

      console.log(
        "📦 CHARACTER PACKAGE SAVED:",
        {
          characterId,
          characterName:
            characterPackage.identity.name,
        }
      );

      /* ========================================================
         STEP 7
         Ensure character behavior
         ======================================================== */

      await ensureCharacterBehavior(
        newCharacter
      );

      /* ========================================================
         STEP 8
         Return to previous screen
         ======================================================== */

      router.back();

    } catch (error) {
      console.error(
        "Failed to create character:",
        error
      );

      Alert.alert(
        "Create Character Failed",
        "The character could not be created. Please try again."
      );
    }
  };

  /* ==========================================================
     IMPORT CHARACTER PACKAGE
     ========================================================== */

  const importPackage = async () => {
    if (importing) {
      return;
    }

    try {
      setImporting(true);

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "application/json",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file =
        result.assets?.[0];

      if (!file) {
        return;
      }

      const response =
        await fetch(file.uri);

      const text =
        await response.text();

      let packageData: CharacterPackage;

      try {
        packageData =
          JSON.parse(text);
      } catch {
        Alert.alert(
          "Invalid Character Package",
          "The selected file is not valid JSON."
        );

        return;
      }

      try {
        /* ======================================================
           STEP 1
           Import + normalize character package
           ====================================================== */

        const character =
          await importCharacterPackage(
            packageData
          );

        /* ======================================================
           STEP 2
           Save character locally
           ====================================================== */

        await addCharacter(
          character
        );

        /* ======================================================
           STEP 3
           Save character to Supabase
           ====================================================== */

        await saveCharacterToSupabase(
          character,
          packageData
        );

        /* ======================================================
           STEP 4
           Ensure character behavior
           ====================================================== */

        await ensureCharacterBehavior(
          character,
          packageData
        );

        /* ======================================================
           SUCCESS
           ====================================================== */

        Alert.alert(
          "Character Imported 🎉",
          `${character.name} has been added successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]
        );

      } catch (error) {
        console.error(
          "Character package validation failed:",
          error
        );

        Alert.alert(
          "Invalid Character Package",
          "This file does not contain a valid character package."
        );
      }

    } catch (error) {
      console.error(
        "Failed to import character package:",
        error
      );

      Alert.alert(
        "Import Failed",
        "Something went wrong while importing the character."
      );

    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            isDark
              ? "#121212"
              : "#FFFFFF",
        },
      ]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Create Character
          </Text>

          <View style={styles.headerSpace} />

        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ==================================================
              IMPORT PACKAGE
              ================================================== */}

          <View style={styles.importSection}>

            <Text style={styles.importTitle}>
              Already have a character?
            </Text>

            <Text style={styles.importDescription}>
              Import a character package with
              personality, behaviour, memories
              and conversation settings.
            </Text>

            <Pressable
              onPress={importPackage}
              disabled={importing}
              style={({ pressed }) => [
                styles.importButton,
                pressed &&
                  styles.pressed,
                importing &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.importButtonText}>
                {importing
                  ? "Importing..."
                  : "📦 Import Character Package"}
              </Text>
            </Pressable>

          </View>

          <View style={styles.dividerRow}>

            <View style={styles.divider} />

            <Text style={styles.orText}>
              OR CREATE MANUALLY
            </Text>

            <View style={styles.divider} />

          </View>

          {/* ==================================================
              CHARACTER PHOTO
              ================================================== */}

          <CharacterPhotoPicker
            avatar={selectedAvatar}
            avatarUri={avatarUri}
            onChange={setAvatarUri}
          />

          {/* ==================================================
              EMOJI AVATAR
              ================================================== */}

          <Text style={styles.sectionTitle}>
            Choose Avatar
          </Text>

          <View style={styles.avatarGrid}>

            {avatars.map((avatar) => (

              <Pressable
                key={avatar}
                onPress={() => {
                  setSelectedAvatar(
                    avatar
                  );

                  setAvatarUri(
                    undefined
                  );
                }}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar &&
                    !avatarUri &&
                    styles.selectedAvatar,
                ]}
              >
                <Text style={styles.avatarText}>
                  {avatar}
                </Text>
              </Pressable>

            ))}

          </View>

          {/* ==================================================
              CHARACTER NAME
              ================================================== */}

          <Text style={styles.label}>
            Character Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter character name"
            placeholderTextColor="#999"
            style={styles.input}
            maxLength={30}
          />

          {/* ==================================================
              PERSONALITY
              ================================================== */}

          <Text style={styles.label}>
            Personality
          </Text>

          <TextInput
            value={personality}
            onChangeText={setPersonality}
            placeholder="Describe the character's personality..."
            placeholderTextColor="#999"
            style={[
              styles.input,
              styles.personalityInput,
            ]}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />

          {/* ==================================================
              CREATE
              ================================================== */}

          <Pressable
            onPress={saveCharacter}
            style={({ pressed }) => [
              styles.saveButton,
              pressed &&
                styles.pressed,
              !name.trim() &&
                styles.disabledButton,
            ]}
          >
            <Text style={styles.saveText}>
              Create Character
            </Text>
          </Pressable>

        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 38,
    fontWeight: "300",
    color: "#222222",
    marginTop: -4,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
    color: "#111111",
  },

  headerSpace: {
    width: 42,
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },

  /* ========================================================
     IMPORT
     ======================================================== */

  importSection: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#F7F1FC",
    borderWidth: 1,
    borderColor: "#E5D5F2",
    marginBottom: 22,
  },

  importTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },

  importDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666666",
    marginBottom: 14,
  },

  importButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7B2CBF",
    justifyContent: "center",
    alignItems: "center",
  },

  importButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },

  orText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: "700",
    color: "#999999",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },

  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },

  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedAvatar: {
    borderColor: "#7B2CBF",
    backgroundColor: "#F0E7FA",
  },

  avatarText: {
    fontSize: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#222222",
    backgroundColor: "#FAFAFA",
    marginBottom: 22,
  },

  personalityInput: {
    minHeight: 120,
    paddingTop: 14,
  },

  saveButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#7B2CBF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.75,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

