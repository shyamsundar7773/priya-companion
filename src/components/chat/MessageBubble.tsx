import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";

type Props = {
  text: string;
  isUser: boolean;
  time: string;
};

export default function MessageBubble({
  text,
  isUser,
  time,
}: Props) {
  const {
    isDark,
    chatImage,
  } = useTheme();

  const priyaBackground =
    chatImage
      ? isDark
        ? "rgba(40,40,40,0.58)"
        : "rgba(255,255,255,0.62)"
      : isDark
      ? "#292929"
      : "#F0F0F0";

  const priyaBorder =
    chatImage
      ? isDark
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.72)"
      : "transparent";

  const priyaText = isDark
    ? "#FFFFFF"
    : "#222222";

  const priyaTime = isDark
    ? "#BDBDBD"
    : "#777777";

  const userBackground =
    chatImage
      ? "rgba(123,44,191,0.78)"
      : "#7B2CBF";

  return (
    <View
      style={[
        styles.row,
        isUser
          ? styles.userRow
          : styles.priyaRow,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [
                styles.userBubble,
                {
                  backgroundColor:
                    userBackground,
                },
              ]
            : [
                styles.priyaBubble,
                {
                  backgroundColor:
                    priyaBackground,
                  borderColor:
                    priyaBorder,
                },
              ],
        ]}
      >
        <View style={styles.messageLine}>
          <Text
            style={[
              styles.text,
              isUser
                ? styles.userText
                : {
                    color: priyaText,
                  },
            ]}
          >
            {text}
          </Text>

          <Text
            style={[
              styles.time,
              isUser
                ? styles.userTime
                : {
                    color: priyaTime,
                  },
            ]}
          >
            {time}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    paddingHorizontal: 14,
    marginVertical: 4,
  },

  userRow: {
    alignItems: "flex-end",
  },

  priyaRow: {
    alignItems: "flex-start",
  },

  bubble: {
    maxWidth: "82%",

    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,

    borderRadius: 18,
  },

  userBubble: {
    borderBottomRightRadius: 5,

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
  },

  priyaBubble: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
  },

  messageLine: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  text: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
  },

  userText: {
    color: "#FFFFFF",
  },

  time: {
    fontSize: 10,
    marginLeft: 8,
    marginBottom: 1,
  },

  userTime: {
    color: "#E8D9F5",
  },
});