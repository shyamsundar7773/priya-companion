import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useTheme,
} from "../context/ThemeContext";

export default function SettingsScreen() {
  const {
    isDark,
    themeImage,
    chatImage,
    setThemeImage,
    removeThemeImage,
    setChatImage,
    removeChatImage,
    toggleTheme,
  } = useTheme();

  // ============================================================
  // COLORS
  // ============================================================

  const colors = {
    background: isDark
      ? "#121212"
      : "#FFFFFF",

    card: isDark
      ? "#1E1E1E"
      : "#F7F7F7",

    cardBorder: isDark
      ? "#333333"
      : "#E5E5E5",

    text: isDark
      ? "#FFFFFF"
      : "#111111",

    secondary: isDark
      ? "#AAAAAA"
      : "#777777",

    divider: isDark
      ? "#333333"
      : "#E5E5E5",

    inputBackground: isDark
      ? "#292929"
      : "#FFFFFF",
  };

  // ============================================================
  // PICK IMAGE
  // ============================================================

  const pickImage = async (
    type: "theme" | "chat"
  ) => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: "image/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file =
        result.assets?.[0];

      if (!file?.uri) {
        return;
      }

      if (type === "theme") {
        await setThemeImage(file.uri);
      } else {
        await setChatImage(file.uri);
      }
    } catch (error) {
      console.error(
        "❌ Failed to select image:",
        error
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View
          style={[
            styles.header,
            {
              borderBottomColor:
                colors.divider,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text
              style={[
                styles.backText,
                {
                  color: colors.text,
                },
              ]}
            >
              ‹
            </Text>
          </Pressable>

          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Settings
          </Text>

          <View
            style={styles.headerSpace}
          />
        </View>

        {/* ======================================================
            APPEARANCE
        ====================================================== */}

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.secondary,
            },
          ]}
        >
          APPEARANCE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.cardBorder,
            },
          ]}
        >
          <View style={styles.row}>
            <View
              style={styles.rowText}
            >
              <Text
                style={[
                  styles.rowTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Dark Mode
              </Text>

              <Text
                style={[
                  styles.rowDescription,
                  {
                    color:
                      colors.secondary,
                  },
                ]}
              >
                Switch between light and
                dark appearance.
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={
                toggleTheme
              }
              trackColor={{
                false: "#D5D5D5",
                true: "#B57EDC",
              }}
              thumbColor={
                isDark
                  ? "#7B2CBF"
                  : "#FFFFFF"
              }
            />
          </View>
        </View>

        {/* ======================================================
            CUSTOM UI
        ====================================================== */}

        <Text
          style={[
            styles.sectionLabel,
            {
              color:
                colors.secondary,
            },
          ]}
        >
          CUSTOM UI
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.customHeader,
              {
                color: colors.text,
              },
            ]}
          >
            Customize your UI
          </Text>

          <Text
            style={[
              styles.customDescription,
              {
                color:
                  colors.secondary,
              },
            ]}
          >
            Add your own images to customize
            the app background.
          </Text>

          {/* ====================================================
              THEME IMAGE
          ==================================================== */}

          <View
            style={styles.customItem}
          >
            <Text
              style={[
                styles.itemTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Theme Image
            </Text>

            <Text
              style={[
                styles.itemDescription,
                {
                  color:
                    colors.secondary,
                },
              ]}
            >
              Used throughout the app,
              except inside individual
              chats.
            </Text>

            <View
              style={[
                styles.imageBox,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.cardBorder,
                },
              ]}
            >
              {themeImage ? (
                <Image
                  source={{
                    uri: themeImage,
                  }}
                  style={styles.preview}
                />
              ) : (
                <View
                  style={
                    styles.emptyPreview
                  }
                >
                  <Text
                    style={[
                      styles.emptyIcon,
                      {
                        color:
                          colors.secondary,
                      },
                    ]}
                  >
                    🖼️
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color:
                          colors.secondary,
                      },
                    ]}
                  >
                    No theme image
                  </Text>
                </View>
              )}
            </View>

            <View
              style={styles.actionRow}
            >
              <Pressable
                onPress={() =>
                  pickImage("theme")
                }
                style={({ pressed }) => [
                  styles.changeButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.changeText
                  }
                >
                  {themeImage
                    ? "Change"
                    : "Choose Image"}
                </Text>
              </Pressable>

              {themeImage && (
                <Pressable
                  onPress={
                    removeThemeImage
                  }
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.removeText
                    }
                  >
                    Remove
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View
            style={[
              styles.separator,
              {
                backgroundColor:
                  colors.divider,
              },
            ]}
          />

          {/* ====================================================
              CHAT IMAGE
          ==================================================== */}

          <View
            style={styles.customItem}
          >
            <Text
              style={[
                styles.itemTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Chat Image
            </Text>

            <Text
              style={[
                styles.itemDescription,
                {
                  color:
                    colors.secondary,
                },
              ]}
            >
              Used only inside individual
              chat screens.
            </Text>

            <View
              style={[
                styles.imageBox,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.cardBorder,
                },
              ]}
            >
              {chatImage ? (
                <Image
                  source={{
                    uri: chatImage,
                  }}
                  style={styles.preview}
                />
              ) : (
                <View
                  style={
                    styles.emptyPreview
                  }
                >
                  <Text
                    style={[
                      styles.emptyIcon,
                      {
                        color:
                          colors.secondary,
                      },
                    ]}
                  >
                    💬
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color:
                          colors.secondary,
                      },
                    ]}
                  >
                    No chat image
                  </Text>
                </View>
              )}
            </View>

            <View
              style={styles.actionRow}
            >
              <Pressable
                onPress={() =>
                  pickImage("chat")
                }
                style={({ pressed }) => [
                  styles.changeButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.changeText
                  }
                >
                  {chatImage
                    ? "Change"
                    : "Choose Image"}
                </Text>
              </Pressable>

              {chatImage && (
                <Pressable
                  onPress={
                    removeChatImage
                  }
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.removeText
                    }
                  >
                    Remove
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* ======================================================
            DEVELOPER
        ====================================================== */}

        <Text
          style={[
            styles.sectionLabel,
            {
              color:
                colors.secondary,
            },
          ]}
        >
          ADVANCED
        </Text>

        <Pressable
          onPress={() =>
            router.push(
              "/developer-settings"
            )
          }
          style={({ pressed }) => [
            styles.navigationCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.cardBorder,
            },
            pressed &&
              styles.navigationPressed,
          ]}
        >
          <View>
            <Text
              style={[
                styles.rowTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Developer Settings
            </Text>

            <Text
              style={[
                styles.rowDescription,
                {
                  color:
                    colors.secondary,
                },
              ]}
            >
              Debug mode, AI logs and
              provider settings.
            </Text>
          </View>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.secondary,
              },
            ]}
          >
            ›
          </Text>
        </Pressable>

                {/* ======================================================
            STM TEST
        ====================================================== */}

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.secondary,
            },
          ]}
        >
          DEVELOPMENT
        </Text>

        <Pressable
          onPress={() =>
            router.push("/stm-test")
          }
          style={({ pressed }) => [
            styles.navigationCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.cardBorder,
            },
            pressed &&
              styles.navigationPressed,
          ]}
        >
          <View>
            <Text
              style={[
                styles.rowTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              🧠 STM Lifecycle Test
            </Text>

            <Text
              style={[
                styles.rowDescription,
                {
                  color:
                    colors.secondary,
                },
              ]}
            >
              Test short-term memory expiration
              and lifecycle cleanup.
            </Text>
          </View>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.secondary,
              },
            ]}
          >
            ›
          </Text>
        </Pressable>

        {/* ======================================================
            ABOUT
        ====================================================== */}

        <Text
          style={[
            styles.sectionLabel,
            {
              color:
                colors.secondary,
            },
          ]}
        >
          ABOUT
        </Text>

        <View
          style={[
            styles.aboutCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.aboutTitle,
              {
                color: colors.text,
              },
            ]}
          >
            PriyaCompanion
          </Text>

          <Text
            style={[
              styles.aboutText,
              {
                color:
                  colors.secondary,
              },
            ]}
          >
            Your personal AI companion
            application.
          </Text>

          <Text
            style={[
              styles.version,
              {
                color:
                  colors.secondary,
              },
            ]}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
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
    marginTop: -4,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
  },

  headerSpace: {
    width: 42,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 18,
  },

  card: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowText: {
    flex: 1,
    paddingRight: 15,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  rowDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  customHeader: {
    fontSize: 18,
    fontWeight: "700",
  },

  customDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  customItem: {
    marginTop: 20,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },

  imageBox: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  emptyPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  changeButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B2CBF",
    justifyContent: "center",
    alignItems: "center",
  },

  changeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  removeButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D9534F",
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    color: "#D9534F",
    fontSize: 14,
    fontWeight: "700",
  },

  separator: {
    height: 1,
    marginTop: 24,
  },

  pressed: {
    opacity: 0.7,
  },

  navigationCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navigationPressed: {
    opacity: 0.7,
  },

  arrow: {
    fontSize: 30,
    fontWeight: "300",
  },

  aboutCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },

  aboutTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  aboutText: {
    fontSize: 13,
    marginTop: 5,
  },

  version: {
    fontSize: 12,
    marginTop: 12,
  },
});