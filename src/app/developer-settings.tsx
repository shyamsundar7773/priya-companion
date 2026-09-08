
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";

export default function DeveloperSettingsScreen() {
  const { isDark } = useTheme();

  const [debugMode, setDebugMode] =
    React.useState(false);

  const [showLogs, setShowLogs] =
    React.useState(false);

  const backgroundColor =
    isDark ? "#111111" : "#FFFFFF";

  const textColor =
    isDark ? "#FFFFFF" : "#111111";

  const secondaryColor =
    isDark ? "#AAAAAA" : "#666666";

  const cardColor =
    isDark ? "#1C1C1C" : "#F7F7F7";

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text
            style={[
              styles.backText,
              { color: textColor },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: textColor },
          ]}
        >
          Developer Settings
        </Text>
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.warning,
            { color: secondaryColor },
          ]}
        >
          Developer options are intended
          for testing and debugging.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: cardColor },
          ]}
        >
          <View style={styles.row}>
            <View>
              <Text
                style={[
                  styles.rowTitle,
                  { color: textColor },
                ]}
              >
                Debug Mode
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: secondaryColor },
                ]}
              >
                Enable additional debugging
              </Text>
            </View>

            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View>
              <Text
                style={[
                  styles.rowTitle,
                  { color: textColor },
                ]}
              >
                Show AI Logs
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: secondaryColor },
                ]}
              >
                Show AI request information
              </Text>
            </View>

            <Switch
              value={showLogs}
              onValueChange={setShowLogs}
            />
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: cardColor },
          ]}
        >
          <Text
            style={[
              styles.infoTitle,
              { color: textColor },
            ]}
          >
            AI Provider
          </Text>

          <Text
            style={[
              styles.infoText,
              { color: secondaryColor },
            ]}
          >
            Groq → Gemini fallback
          </Text>
        </View>

       
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
  },

  backText: {
    fontSize: 38,
    fontWeight: "300",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  content: {
    padding: 16,
  },

  warning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  card: {
    borderRadius: 16,
    paddingHorizontal: 18,
  },

  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 5,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D5D5D5",
  },

  infoCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  infoText: {
    marginTop: 6,
    fontSize: 14,
  },

  });

