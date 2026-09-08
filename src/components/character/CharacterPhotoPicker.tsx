
import * as ImagePicker from "expo-image-picker";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import CharacterAvatar from "./CharacterAvatar";

type Props = {
  avatar?: string;
  avatarUri?: string;
  onChange: (uri: string | undefined) => void;
};

export default function CharacterPhotoPicker({
  avatar,
  avatarUri,
  onChange,
}: Props) {
  const choosePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo access to choose a profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;

    if (uri) {
      onChange(uri);
    }
  };

  const removePhoto = () => {
    onChange(undefined);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={choosePhoto}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.pressed,
        ]}
      >
        <CharacterAvatar
          avatar={avatar}
          avatarUri={avatarUri}
          size={110}
        />

        <View style={styles.cameraBadge}>
          <Text style={styles.cameraText}>📷</Text>
        </View>
      </Pressable>

      <Text style={styles.changeText}>
        Change Photo
      </Text>

      {avatarUri && (
        <Pressable
          onPress={removePhoto}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.removeText}>
            Remove Photo
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatarButton: {
    position: "relative",
  },

  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7B2CBF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  cameraText: {
    fontSize: 16,
  },

  changeText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#7B2CBF",
  },

  removeButton: {
    marginTop: 8,
  },

  removeText: {
    fontSize: 13,
    color: "#D32F2F",
  },

  pressed: {
    opacity: 0.65,
  },
});

