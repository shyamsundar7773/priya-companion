import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";

type Props = {
  onSend: (message: string) => void;
};

export default function MessageInput({
  onSend,
}: Props) {
  const [text, setText] = useState("");

  const {
    isDark,
    chatImage,
  } = useTheme();

  const glassWrapper = chatImage
    ? isDark
      ? "rgba(18,18,18,0.62)"
      : "rgba(255,255,255,0.58)"
    : isDark
    ? "rgba(18,18,18,0.96)"
    : "rgba(255,255,255,0.96)";

  const glassInput = chatImage
    ? isDark
      ? "rgba(255,255,255,0.11)"
      : "rgba(255,255,255,0.55)"
    : isDark
    ? "#292929"
    : "#F3F3F3";

  const inputBorder = isDark
    ? "rgba(255,255,255,0.14)"
    : "rgba(0,0,0,0.08)";

  const inputText = isDark
    ? "#FFFFFF"
    : "#222222";

  const placeholder = isDark
    ? "#A8A8A8"
    : "#888888";

  const sendBackground = chatImage
    ? isDark
      ? "rgba(123,44,191,0.82)"
      : "rgba(123,44,191,0.88)"
    : "#7B2CBF";

  const sendMessage = () => {
    const message = text.trim();

    if (!message) return;

    onSend(message);
    setText("");
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor:
            glassWrapper,
        },
      ]}
    >
      <View style={styles.container}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message Priya..."
          placeholderTextColor={
            placeholder
          }
          style={[
            styles.input,
            {
              backgroundColor:
                glassInput,
              color: inputText,
              borderColor:
                inputBorder,
            },
          ]}
          multiline
          textAlignVertical="center"
          returnKeyType="default"
        />

        <Pressable
          onPress={sendMessage}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor:
                sendBackground,
            },
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.sendText}>
            ➤
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 9,

    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderTopColor:
      "rgba(255,255,255,0.10)",
  },

  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  input: {
    flex: 1,

    minHeight: 44,
    maxHeight: 110,

    borderRadius: 22,
    borderWidth: 1,

    paddingHorizontal: 16,
    paddingVertical: 10,

    fontSize: 16,
  },

  sendButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    marginLeft: 8,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.16)",
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.68,
  },
});