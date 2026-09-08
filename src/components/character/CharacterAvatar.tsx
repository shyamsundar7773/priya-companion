
import { Image } from "expo-image";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  avatar?: string;
  avatarUri?: string;
  size?: number;
};

export default function CharacterAvatar({
  avatar,
  avatarUri,
  size = 52,
}: Props) {
  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.48,
        }}
      >
        {avatar || "👤"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#E9DDF8",
  },

  placeholder: {
    backgroundColor: "#E9DDF8",
    justifyContent: "center",
    alignItems: "center",
  },
});

