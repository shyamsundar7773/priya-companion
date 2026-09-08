import {
    ImageBackground,
    StyleSheet,
    View,
} from "react-native";

import { PropsWithChildren } from "react";

import { useTheme } from "../../context/ThemeContext";

export default function ThemeBackground({
  children,
}: PropsWithChildren) {
  const {
    isDark,
    themeImage,
  } = useTheme();

  const backgroundColor =
    isDark
      ? "#121212"
      : "#FFFFFF";

  if (themeImage) {
    return (
      <ImageBackground
        source={{ uri: themeImage }}
        style={styles.background}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: isDark
                ? "rgba(0,0,0,0.42)"
                : "rgba(255,255,255,0.38)",
            },
          ]}
        >
          {children}
        </View>
      </ImageBackground>
    );
  }

  return (
    <View
      style={[
        styles.background,
        {
          backgroundColor,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    flex: 1,
  },
});