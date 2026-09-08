import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";

import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ExternalLink,
} from "@/components/external-link";

import {
  ThemedText,
} from "@/components/themed-text";

import {
  Collapsible,
} from "@/components/ui/collapsible";

import {
  WebBadge,
} from "@/components/web-badge";

import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";

import ThemeBackground from "../../components/theme/ThemeBackground";
import { useTheme } from "../../context/ThemeContext";

export default function TabTwoScreen() {
  const safeAreaInsets =
    useSafeAreaInsets();

  const {
    isDark,
  } = useTheme();

  const insets = {
    ...safeAreaInsets,
    bottom:
      safeAreaInsets.bottom +
      BottomTabInset +
      Spacing.three,
  };

  const contentPlatformStyle =
    Platform.select({
      android: {
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      },

      web: {
        paddingTop: Spacing.six,
        paddingBottom: Spacing.four,
      },
    });

  return (
    <ThemeBackground>
      <ScrollView
        style={styles.scrollView}
        contentInset={insets}
        contentContainerStyle={[
          styles.contentContainer,
          contentPlatformStyle,
        ]}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor:
                "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.titleContainer,
            ]}
          >
            <ThemedText
              type="subtitle"
              style={{
                color: isDark
                  ? "#FFFFFF"
                  : "#111111",
              }}
            >
              Explore
            </ThemedText>

            <ThemedText
              style={[
                styles.centerText,
                {
                  color: isDark
                    ? "#CCCCCC"
                    : "#555555",
                },
              ]}
            >
              This starter app includes
              example{"\n"}code to help you
              get started.
            </ThemedText>

            <ExternalLink
              href="https://docs.expo.dev"
              asChild
            >
              <Pressable
                style={({ pressed }) =>
                  pressed &&
                  styles.pressed
                }
              >
                <View
                  style={[
                    styles.linkButton,
                    {
                      backgroundColor:
                        isDark
                          ? "#292929"
                          : "#F2F2F2",
                    },
                  ]}
                >
                  <ThemedText type="link">
                    Expo documentation
                  </ThemedText>

                  <SymbolView
                    tintColor={
                      isDark
                        ? "#FFFFFF"
                        : "#111111"
                    }
                    name={{
                      ios: "arrow.up.right.square",
                      android: "link",
                      web: "link",
                    }}
                    size={12}
                  />
                </View>
              </Pressable>
            </ExternalLink>
          </View>

          <View
            style={
              styles.sectionsWrapper
            }
          >
            <Collapsible
              title="File-based routing"
            >
              <ThemedText type="small">
                This app has two screens:
                {" "}
                <ThemedText type="code">
                  src/app/index.tsx
                </ThemedText>
                {" "}
                and{" "}
                <ThemedText type="code">
                  src/app/explore.tsx
                </ThemedText>
              </ThemedText>

              <ThemedText type="small">
                The layout file in{" "}
                <ThemedText type="code">
                  src/app/_layout.tsx
                </ThemedText>{" "}
                sets up the tab navigator.
              </ThemedText>

              <ExternalLink
                href="https://docs.expo.dev/router/introduction"
              >
                <ThemedText type="linkPrimary">
                  Learn more
                </ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible
              title="Android, iOS, and web support"
            >
              <View
                style={[
                  styles.collapsibleContent,
                  {
                    backgroundColor:
                      isDark
                        ? "#1E1E1E"
                        : "#F5F5F5",
                  },
                ]}
              >
                <ThemedText type="small">
                  You can open this project
                  on Android, iOS, and web.
                </ThemedText>

                <Image
                  source={require("@/assets/images/tutorial-web.png")}
                  style={
                    styles.imageTutorial
                  }
                />
              </View>
            </Collapsible>

            <Collapsible
              title="Images"
            >
              <ThemedText type="small">
                For static images, you can
                use the{" "}
                <ThemedText type="code">
                  @2x
                </ThemedText>{" "}
                and{" "}
                <ThemedText type="code">
                  @3x
                </ThemedText>{" "}
                suffixes to provide files
                for different screen
                densities.
              </ThemedText>

              <Image
                source={require("@/assets/images/react-logo.png")}
                style={styles.imageReact}
              />

              <ExternalLink
                href="https://reactnative.dev/docs/images"
              >
                <ThemedText type="linkPrimary">
                  Learn more
                </ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible
              title="Light and dark mode components"
            >
              <ThemedText type="small">
                This template has light and
                dark mode support.
              </ThemedText>

              <ExternalLink
                href="https://docs.expo.dev/develop/user-interface/color-themes/"
              >
                <ThemedText type="linkPrimary">
                  Learn more
                </ThemedText>
              </ExternalLink>
            </Collapsible>

            <Collapsible
              title="Animations"
            >
              <ThemedText type="small">
                This template includes an
                example of an animated
                component.
              </ThemedText>
            </Collapsible>
          </View>

          {Platform.OS === "web" && (
            <WebBadge />
          )}
        </View>
      </ScrollView>
    </ThemeBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },

  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },

  titleContainer: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal:
      Spacing.four,
    paddingVertical:
      Spacing.six,
  },

  centerText: {
    textAlign: "center",
  },

  pressed: {
    opacity: 0.7,
  },

  linkButton: {
    flexDirection: "row",
    paddingHorizontal:
      Spacing.four,
    paddingVertical:
      Spacing.two,
    borderRadius:
      Spacing.five,
    justifyContent:
      "center",
    gap: Spacing.one,
    alignItems: "center",
  },

  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal:
      Spacing.four,
    paddingTop:
      Spacing.three,
  },

  collapsibleContent: {
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
  },

  imageTutorial: {
    width: "100%",
    aspectRatio: 296 / 171,
    borderRadius:
      Spacing.three,
    marginTop:
      Spacing.two,
  },

  imageReact: {
    width: 100,
    height: 100,
    alignSelf: "center",
  },
});