import { router } from "expo-router";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();

  const backgroundColor =
    isDark ? "#111111" : "#FFFFFF";

  const textColor =
    isDark ? "#FFFFFF" : "#111111";

  const secondaryColor =
    isDark ? "#AAAAAA" : "#666666";

  const cardColor =
    isDark ? "#1C1C1C" : "#F7F7F7";

  const handleSignOut = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert(
                "Sign out failed",
                "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const email =
    user?.email ?? "No email available";

  const initial =
    email.charAt(0).toUpperCase();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
      edges={["top", "bottom"]}
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
          Account
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: "#7B2CBF",
            },
          ]}
        >
          <Text style={styles.avatarText}>
            {initial}
          </Text>
        </View>

        <Text
          style={[
            styles.email,
            { color: textColor },
          ]}
        >
          {email}
        </Text>

        <Text
          style={[
            styles.status,
            { color: secondaryColor },
          ]}
        >
          Signed in
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: cardColor },
          ]}
        >
          <View style={styles.row}>
            <Text
              style={[
                styles.rowTitle,
                { color: textColor },
              ]}
            >
              Email
            </Text>

            <Text
              style={[
                styles.rowValue,
                { color: secondaryColor },
              ]}
            >
              {email}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text
              style={[
                styles.rowTitle,
                { color: textColor },
              ]}
            >
              Authentication
            </Text>

            <Text
              style={[
                styles.rowValue,
                { color: secondaryColor },
              ]}
            >
              {user?.app_metadata
                ?.provider ?? "Email"}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>
            🚪  Sign Out
          </Text>
        </Pressable>
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
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 42,
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "600",
  },

  email: {
    fontSize: 18,
    fontWeight: "600",
  },

  status: {
    fontSize: 14,
    marginTop: 6,
  },

  card: {
    width: "100%",
    borderRadius: 16,
    marginTop: 35,
    paddingHorizontal: 18,
  },

  row: {
    minHeight: 68,
    justifyContent: "center",
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  rowValue: {
    fontSize: 14,
    marginTop: 5,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D5D5D5",
  },

  signOutButton: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  signOutText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "600",
  },
});