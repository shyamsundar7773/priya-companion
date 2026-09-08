import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import CharacterAvatar from "../character/CharacterAvatar";

type Props = {
  name: string;
  avatar?: string;
  avatarUri?: string;
  isCharacter?: boolean;
  onChangePhoto?: (uri: string) => void;
  onDeleteChat?: () => void;
  onDeleteContact?: () => void;
};

export default function ChatHeader({
  name,
  avatar,
  avatarUri,
  onChangePhoto,
  onDeleteChat,
  onDeleteContact,
}: Props) {
  const { isDark, chatImage } = useTheme();

  const glassBackground = chatImage
    ? isDark
      ? "rgba(18,18,18,0.58)"
      : "rgba(255,255,255,0.55)"
    : isDark
    ? "rgba(30,30,30,0.96)"
    : "rgba(255,255,255,0.96)";

  const borderColor = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(0,0,0,0.08)";

  const textColor = isDark
    ? "#FFFFFF"
    : "#111111";

  const secondaryColor = isDark
    ? "#BDBDBD"
    : "#777777";

  const changePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo access to change the photo."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        onChangePhoto?.(
          result.assets[0].uri
        );
      }
    } catch (error) {
      console.error(
        "Failed to change photo:",
        error
      );
    }
  };

  const openMenu = () => {
    Alert.alert(
      name,
      "Choose an action",
      [
        {
          text: "Change Photo",
          onPress: changePhoto,
        },
        {
          text: "Delete Chat",
          onPress: () =>
            onDeleteChat?.(),
        },
        {
          text: "Delete Contact",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Contact",
              `Are you sure you want to delete ${name}?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () =>
                    onDeleteContact?.(),
                },
              ]
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            glassBackground,
          borderBottomColor:
            borderColor,
        },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.backText,
            {
              color: textColor,
            },
          ]}
        >
          ‹
        </Text>
      </Pressable>

      <Pressable
        onPress={changePhoto}
        style={styles.avatarContainer}
      >
        <CharacterAvatar
          avatar={avatar}
          avatarUri={avatarUri}
          size={44}
        />
      </Pressable>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            {
              color: textColor,
            },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text
          style={[
            styles.status,
            {
              color: secondaryColor,
            },
          ]}
        >
          online
        </Text>
      </View>

      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [
          styles.menuButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.menuText,
            {
              color: textColor,
            },
          ]}
        >
          ⋮
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 42,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },

  backText: {
    fontSize: 38,
    fontWeight: "300",
    marginTop: -5,
  },

  avatarContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  info: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 21,
  },

  status: {
    fontSize: 12,
    marginTop: 1,
  },

  menuButton: {
    width: 42,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  menuText: {
    fontSize: 28,
    fontWeight: "500",
  },

  pressed: {
    opacity: 0.6,
  },
});