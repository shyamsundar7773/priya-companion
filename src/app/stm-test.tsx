import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    createExpiredTestMemory,
    createInactiveTestMemory,
    runShortTermMemoryLifecycle,
    testInactiveShortTermMemoryCleanup,
    testShortTermMemoryExpiration,
} from "@/services/shortTermMemoryLifecycleService";

import { supabase } from "@/services/supabase";

export default function STMTestScreen() {
  const [characterId, setCharacterId] =
    useState<string>("");

  const [conversationId, setConversationId] =
    useState<string>("");

  const [loading, setLoading] =
    useState(false);

  const [logs, setLogs] =
    useState<string[]>([]);

  // ==========================================================
  // LOG
  // ==========================================================

  const addLog = (message: string) => {
    console.log(message);

    setLogs((previous) => [
      message,
      ...previous,
    ]);
  };

  // ==========================================================
  // GET CURRENT CHARACTER + CONVERSATION
  // ==========================================================

  const loadTestIds = async () => {
    try {
      setLoading(true);

      addLog(
        "🔍 Loading test character..."
      );

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const userId =
        userData.user?.id;

      if (!userId) {
        throw new Error(
          "No authenticated user found."
        );
      }

      // ------------------------------------------------------
      // Get first character owned by user
      // ------------------------------------------------------

      const {
        data: character,
        error: characterError,
      } =
        await supabase
          .from("characters")
          .select("id,name")
          .eq(
            "user_id",
            userId
          )
          .limit(1)
          .maybeSingle();

      if (characterError) {
        throw characterError;
      }

      if (!character) {
        throw new Error(
          "No character found in Supabase."
        );
      }

      setCharacterId(
        character.id
      );

      addLog(
        `👤 CHARACTER: ${character.name}`
      );

      addLog(
        `🆔 CHARACTER ID: ${character.id}`
      );

      // ------------------------------------------------------
      // Get conversation for character
      // ------------------------------------------------------

      const {
        data: conversation,
        error: conversationError,
      } =
        await supabase
          .from("conversations")
          .select("id")
          .eq(
            "character_id",
            character.id
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (conversationError) {
        throw conversationError;
      }

      if (conversation) {
        setConversationId(
          conversation.id
        );

        addLog(
          `💬 CONVERSATION ID: ${conversation.id}`
        );
      } else {
        addLog(
          "ℹ️ No active conversation found."
        );
      }

      addLog(
        "✅ Test IDs loaded."
      );
    } catch (error) {
      console.error(
        "STM TEST LOAD ERROR:",
        error
      );

      addLog(
        `❌ ERROR: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // 8B — CREATE EXPIRED TEST MEMORY
  // ==========================================================

  const handleCreateExpiredMemory =
    async () => {
      try {
        setLoading(true);

        if (
          !characterId ||
          !conversationId
        ) {
          await loadTestIds();

          Alert.alert(
            "Run Again",
            "Test IDs were loaded. Tap the button once more to create the test memory."
          );

          return;
        }

        addLog(
          "🧪 Creating expired STM..."
        );

        await createExpiredTestMemory(
          characterId,
          conversationId
        );

        addLog(
          "✅ EXPIRED TEST MEMORY CREATED."
        );
      } catch (error) {
        console.error(
          "STM CREATE TEST ERROR:",
          error
        );

        addLog(
          `❌ ERROR: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // 8B — RUN EXPIRATION
  // ==========================================================

  const handleRunExpiration =
    async () => {
      try {
        setLoading(true);

        if (!characterId) {
          await loadTestIds();

          Alert.alert(
            "Run Again",
            "Character ID loaded. Tap the button once more."
          );

          return;
        }

        addLog(
          "⏳ Running STM expiration..."
        );

        await testShortTermMemoryExpiration(
          characterId
        );

        addLog(
          "✅ EXPIRATION TEST FINISHED."
        );
      } catch (error) {
        console.error(
          "STM EXPIRATION TEST ERROR:",
          error
        );

        addLog(
          `❌ ERROR: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // 8C — CREATE INACTIVE TEST MEMORY
  // ==========================================================

  const handleCreateInactiveMemory =
    async () => {
      try {
        setLoading(true);

        if (
          !characterId ||
          !conversationId
        ) {
          await loadTestIds();

          Alert.alert(
            "Run Again",
            "Test IDs were loaded. Tap the button once more to create the inactive test memory."
          );

          return;
        }

        addLog(
          "🧪 Creating inactive STM..."
        );

        await createInactiveTestMemory(
          characterId,
          conversationId
        );

        addLog(
          "✅ INACTIVE TEST MEMORY CREATED."
        );

        addLog(
          "⏱️ Waiting 1 second before cleanup..."
        );
      } catch (error) {
        console.error(
          "STM INACTIVE CREATE TEST ERROR:",
          error
        );

        addLog(
          `❌ ERROR: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // 8C — RUN INACTIVE CLEANUP
  // ==========================================================

  const handleRunInactiveCleanup =
    async () => {
      try {
        setLoading(true);

        if (!characterId) {
          await loadTestIds();

          Alert.alert(
            "Run Again",
            "Character ID loaded. Tap the button once more."
          );

          return;
        }

        addLog(
          "🧹 Running inactive STM cleanup..."
        );

        await testInactiveShortTermMemoryCleanup(
          characterId
        );

        addLog(
          "✅ INACTIVE CLEANUP TEST FINISHED."
        );
      } catch (error) {
        console.error(
          "STM INACTIVE CLEANUP TEST ERROR:",
          error
        );

        addLog(
          `❌ ERROR: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // 8D — RUN COMPLETE LIFECYCLE REFRESH
  // ==========================================================

  const handleLifecycleRefresh =
    async () => {
      try {
        setLoading(true);

        if (!characterId) {
          await loadTestIds();

          Alert.alert(
            "Run Again",
            "Character ID loaded. Tap the button once more to run the lifecycle refresh."
          );

          return;
        }

        addLog(
          "🔄 Running STM lifecycle refresh..."
        );

        const result =
          await runShortTermMemoryLifecycle(
            characterId
          );

        addLog(
          `✅ LIFECYCLE REFRESH FINISHED. Expired: ${result.expiredCount}, Deleted: ${result.deletedCount}`
        );

        addLog(
          `🕐 Refreshed at: ${result.refreshedAt}`
        );
      } catch (error) {
        console.error(
          "STM LIFECYCLE REFRESH ERROR:",
          error
        );

        addLog(
          `❌ ERROR: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // CLEAR LOGS
  // ==========================================================

  const clearLogs = () => {
    setLogs([]);
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        🧠 STM Lifecycle Test
      </Text>

      <Text style={styles.subtitle}>
        2.5D-8 — Lifecycle & Cleanup
      </Text>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >

        {/* ====================================================
            TEST SETUP
        ==================================================== */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Test Setup
          </Text>

          <Text style={styles.info}>
            Character:
            {" "}
            {characterId ||
              "Not loaded"}
          </Text>

          <Text style={styles.info}>
            Conversation:
            {" "}
            {conversationId ||
              "Not loaded"}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={loadTestIds}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              🔍 Load Test IDs
            </Text>
          </TouchableOpacity>

        </View>

        {/* ====================================================
            2.5D-8B EXPIRATION
        ==================================================== */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            2.5D-8B Expiration Test
          </Text>

          <Text style={styles.description}>
            Step 1: Create an active STM
            with an expiry time in the past.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleCreateExpiredMemory
            }
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              🧪 Create Expired STM
            </Text>
          </TouchableOpacity>

          <Text style={styles.description}>
            Step 2: Run expiration and
            deactivate expired memories.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleRunExpiration
            }
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              ⏳ Run Expiration
            </Text>
          </TouchableOpacity>

        </View>

        {/* ====================================================
            2.5D-8C INACTIVE CLEANUP
        ==================================================== */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            2.5D-8C Inactive Cleanup Test
          </Text>

          <Text style={styles.description}>
            Step 1: Create a memory and
            immediately mark it inactive.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleCreateInactiveMemory
            }
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              🧪 Create Inactive STM
            </Text>
          </TouchableOpacity>

          <Text style={styles.description}>
            Step 2: Wait at least 1 second,
            then permanently remove the
            inactive memory.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleRunInactiveCleanup
            }
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              🧹 Run Inactive Cleanup
            </Text>
          </TouchableOpacity>

        </View>

        {/* ====================================================
            2.5D-8D LIFECYCLE REFRESH
        ==================================================== */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            2.5D-8D Lifecycle Refresh Test
          </Text>

          <Text style={styles.description}>
            Runs the complete STM lifecycle:
            expiration check followed by
            inactive-memory cleanup using
            the production 7-day threshold.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleLifecycleRefresh
            }
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              🔄 Run Lifecycle Refresh
            </Text>
          </TouchableOpacity>

        </View>

        {/* ====================================================
            TEST LOGS
        ==================================================== */}

        <View style={styles.card}>

          <View style={styles.logHeader}>

            <Text style={styles.sectionTitle}>
              Test Logs
            </Text>

            <TouchableOpacity
              onPress={clearLogs}
            >
              <Text style={styles.clear}>
                Clear
              </Text>
            </TouchableOpacity>

          </View>

          {logs.length === 0 ? (

            <Text style={styles.empty}>
              No test logs yet.
            </Text>

          ) : (

            logs.map(
              (log, index) => (
                <Text
                  key={`${log}-${index}`}
                  style={styles.log}
                >
                  {log}
                </Text>
              )
            )

          )}

        </View>

      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    title: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 60,
      marginHorizontal: 20,
      color: "#111",
    },

    subtitle: {
      fontSize: 16,
      marginTop: 6,
      marginHorizontal: 20,
      marginBottom: 10,
      color: "#666",
    },

    card: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111",
      marginBottom: 12,
    },

    info: {
      fontSize: 13,
      color: "#555",
      marginBottom: 8,
    },

    description: {
      fontSize: 14,
      color: "#666",
      lineHeight: 21,
      marginBottom: 12,
    },

    button: {
      backgroundColor: "#111",
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 12,
    },

    buttonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },

    logHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    clear: {
      color: "#d00",
      fontWeight: "600",
    },

    empty: {
      color: "#999",
      fontSize: 14,
    },

    log: {
      fontSize: 13,
      color: "#333",
      lineHeight: 20,
      marginBottom: 6,
    },

  });