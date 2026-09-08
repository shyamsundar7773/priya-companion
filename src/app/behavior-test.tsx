import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    getCharacterBehavior,
    getCharacterSettings,
} from "@/services/characterBehaviorRepository";
import { getCharacters } from "@/services/characterService";
import { Character } from "@/types/character";

export default function BehaviorTestScreen() {
  const [loading, setLoading] =
    useState(true);

  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [results, setResults] =
    useState<
      {
        character: Character;
        behavior: unknown;
        settings: unknown;
        behaviorFound: boolean;
        settingsFound: boolean;
      }[]
    >([]);

  useEffect(() => {
    runTest();
  }, []);

  const runTest = async () => {
    try {
      setLoading(true);

      const storedCharacters =
        await getCharacters();

      setCharacters(
        storedCharacters
      );

      const testResults = [];

      for (
        const character of storedCharacters
      ) {
        try {
          const behavior =
            await getCharacterBehavior(
              character.id,
              character
            );

          const settings =
            await getCharacterSettings(
              character.id
            );

          testResults.push({
            character,
            behavior,
            settings,
            behaviorFound:
              behavior !== null,
            settingsFound:
              settings !== null,
          });

        } catch (error) {
          console.error(
            `Behaviour test failed for ${character.name}:`,
            error
          );

          testResults.push({
            character,
            behavior: null,
            settings: null,
            behaviorFound: false,
            settingsFound: false,
          });
        }
      }

      setResults(
        testResults
      );

    } catch (error) {
      console.error(
        "Behaviour verification failed:",
        error
      );

      Alert.alert(
        "Test Failed",
        "Unable to verify character behaviour."
      );

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingText}>
          Checking character behaviour...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <Text style={styles.title}>
        2.5B Behaviour Verification
      </Text>

      <Text style={styles.subtitle}>
        Manual + imported character
        behaviour persistence test
      </Text>

      {/* SUMMARY */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Characters Found
        </Text>

        <Text style={styles.summaryValue}>
          {characters.length}
        </Text>
      </View>

      {/* RESULTS */}

      {results.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No characters found.
          </Text>

          <Text style={styles.emptyHint}>
            Create at least one character
            before running this test.
          </Text>
        </View>
      )}

      {results.map(
        ({
          character,
          behavior,
          settings,
          behaviorFound,
          settingsFound,
        }) => (
          <View
            key={character.id}
            style={styles.characterCard}
          >
            {/* CHARACTER */}

            <Text style={styles.characterName}>
              {character.avatar ?? "👤"}{" "}
              {character.name}
            </Text>

            <Text style={styles.characterId}>
              ID: {character.id}
            </Text>

            {/* BEHAVIOUR */}

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>
                Behaviour
              </Text>

              <Text
                style={[
                  styles.resultValue,
                  behaviorFound
                    ? styles.success
                    : styles.failure,
                ]}
              >
                {behaviorFound
                  ? "✓ Found"
                  : "✗ Missing"}
              </Text>
            </View>

            {/* SETTINGS */}

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>
                Settings
              </Text>

              <Text
                style={[
                  styles.resultValue,
                  settingsFound
                    ? styles.success
                    : styles.failure,
                ]}
              >
                {settingsFound
                  ? "✓ Found"
                  : "✗ Missing"}
              </Text>
            </View>

            {/* BEHAVIOUR DATA */}

            {behaviorFound && (
              <View
                style={styles.dataSection}
              >
                <Text
                  style={
                    styles.dataTitle
                  }
                >
                  Behaviour Contract
                </Text>

                <Text
                  style={
                    styles.dataText
                  }
                >
                  {JSON.stringify(
                    behavior,
                    null,
                    2
                  )}
                </Text>
              </View>
            )}

            <Pressable
  onPress={() =>
    router.push("/behavior-test")
  }
>
  <Text>
    🧪 Behaviour Test
  </Text>
</Pressable>

            {/* SETTINGS DATA */}

            {settingsFound && (
              <View
                style={styles.dataSection}
              >
                <Text
                  style={
                    styles.dataTitle
                  }
                >
                  Character Settings
                </Text>

                <Text
                  style={
                    styles.dataText
                  }
                >
                  {JSON.stringify(
                    settings,
                    null,
                    2
                  )}
                </Text>
              </View>
            )}
          </View>
        )
      )}

      {/* FINAL STATUS */}

      {results.length > 0 && (
        <View style={styles.finalCard}>
          {results.every(
            (item) =>
              item.behaviorFound &&
              item.settingsFound
          ) ? (
            <>
              <Text
                style={styles.finalSuccess}
              >
                ✅ 2.5B VERIFIED
              </Text>

              <Text
                style={styles.finalDescription}
              >
                All characters have both
                behaviour and settings
                stored in Supabase.
              </Text>
            </>
          ) : (
            <>
              <Text
                style={styles.finalFailure}
              >
                ⚠️ VERIFICATION INCOMPLETE
              </Text>

              <Text
                style={styles.finalDescription}
              >
                One or more characters are
                missing behaviour or settings.
              </Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666666",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    lineHeight: 20,
    marginBottom: 20,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#777777",
  },

  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#7B2CBF",
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333333",
  },

  emptyHint: {
    marginTop: 6,
    fontSize: 14,
    color: "#777777",
  },

  characterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  characterName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222222",
  },

  characterId: {
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
    marginBottom: 16,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  resultLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444444",
  },

  resultValue: {
    fontSize: 14,
    fontWeight: "800",
  },

  success: {
    color: "#16803C",
  },

  failure: {
    color: "#C62828",
  },

  dataSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
  },

  dataTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333333",
    marginBottom: 8,
  },

  dataText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#555555",
    fontFamily: "monospace",
  },

  finalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },

  finalSuccess: {
    fontSize: 20,
    fontWeight: "900",
    color: "#16803C",
  },

  finalFailure: {
    fontSize: 20,
    fontWeight: "900",
    color: "#C62828",
  },

  finalDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#666666",
    textAlign: "center",
  },
});

