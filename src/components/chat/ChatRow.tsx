import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Chat } from "../../types/chat";
import CharacterAvatar from "../character/CharacterAvatar";

import { useTheme } from "../../context/ThemeContext";

type Props = {
  chat: Chat;
  onPress: () => void;
};

export default function ChatRow({
  chat,
  onPress,
}: Props) {
  const {
    isDark,
    themeImage,
  } = useTheme();

  const formattedTime =
    chat.lastMessageTime
      ? new Date(
          chat.lastMessageTime
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const isCharacter =
    chat.type === "character";

  const colors = {
    text: isDark
      ? "#FFFFFF"
      : "#111111",

    secondary: isDark
      ? "#B5B5B5"
      : "#777777",

    container: themeImage
      ? "rgba(255,255,255,0.08)"
      : isDark
      ? "#1E1E1E"
      : "#FFFFFF",

    pressed: isDark
      ? "#292929"
      : "#F3F3F3",

    groupAvatar: isDark
      ? "#3A2B47"
      : "#E9DDF8",
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor:
            colors.container,
        },
        pressed && {
          backgroundColor:
            colors.pressed,
        },
      ]}
    >
      {/* AVATAR */}

      <View style={styles.avatarWrapper}>
        {isCharacter ||
        chat.avatarUri ? (
          <CharacterAvatar
            avatar={chat.avatar}
            avatarUri={chat.avatarUri}
            size={56}
          />
        ) : (
          <View
            style={[
              styles.groupAvatar,
              {
                backgroundColor:
                  colors.groupAvatar,
              },
            ]}
          >
            <Text
              style={
                styles.groupAvatarText
              }
            >
              👥
            </Text>
          </View>
        )}
      </View>

      {/* CHAT CONTENT */}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {chat.name}
          </Text>

          <Text
            style={[
              styles.time,
              {
                color:
                  chat.unreadCount > 0
                    ? "#9B4DCA"
                    : colors.secondary,
              },
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.message,
              {
                color:
                  colors.secondary,
              },
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage ||
              "No messages yet"}
          </Text>

          {chat.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text
                style={styles.badgeText}
              >
                {chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingVertical: 10,

    minHeight: 78,
  },

  avatarWrapper: {
    width: 56,
    height: 56,

    marginRight: 14,
  },

  groupAvatar: {
    width: 56,
    height: 56,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",
  },

  groupAvatarText: {
    fontSize: 28,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 5,
  },

  name: {
    flex: 1,

    fontSize: 17,
    fontWeight: "600",

    marginRight: 10,
  },

  time: {
    fontSize: 12,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  message: {
    flex: 1,

    fontSize: 14,

    marginRight: 8,
  },

  badge: {
    minWidth: 20,
    height: 20,

    borderRadius: 10,

    paddingHorizontal: 5,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#7B2CBF",
  },

  badgeText: {
    color: "#FFFFFF",

    fontSize: 11,
    fontWeight: "700",
  },
});