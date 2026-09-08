import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;

  themeImage: string | null;
  chatImage: string | null;

  toggleTheme: () => Promise<void>;

  setThemeImage: (uri: string) => Promise<void>;
  removeThemeImage: () => Promise<void>;

  setChatImage: (uri: string) => Promise<void>;
  removeChatImage: () => Promise<void>;
};

const ThemeContext =
  createContext<ThemeContextType | undefined>(
    undefined
  );

const THEME_KEY = "@priya_companion_theme";
const THEME_IMAGE_KEY =
  "@priya_companion_theme_image";
const CHAT_IMAGE_KEY =
  "@priya_companion_chat_image";

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const [theme, setTheme] =
    useState<ThemeMode>("light");

  const [themeImage, setThemeImageState] =
    useState<string | null>(null);

  const [chatImage, setChatImageState] =
    useState<string | null>(null);

  // ============================================================
  // LOAD SAVED SETTINGS
  // ============================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedTheme,
          savedThemeImage,
          savedChatImage,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(
            THEME_IMAGE_KEY
          ),
          AsyncStorage.getItem(
            CHAT_IMAGE_KEY
          ),
        ]);

        if (
          savedTheme === "light" ||
          savedTheme === "dark"
        ) {
          setTheme(savedTheme);
        }

        if (savedThemeImage) {
          setThemeImageState(
            savedThemeImage
          );
        }

        if (savedChatImage) {
          setChatImageState(
            savedChatImage
          );
        }
      } catch (error) {
        console.error(
          "❌ Failed to load theme settings:",
          error
        );
      }
    };

    loadSettings();
  }, []);

  // ============================================================
  // TOGGLE LIGHT / DARK
  // ============================================================

  const toggleTheme = async () => {
    const nextTheme =
      theme === "light"
        ? "dark"
        : "light";

    setTheme(nextTheme);

    try {
      await AsyncStorage.setItem(
        THEME_KEY,
        nextTheme
      );
    } catch (error) {
      console.error(
        "❌ Failed to save theme:",
        error
      );
    }
  };

  // ============================================================
  // THEME IMAGE
  // ============================================================

  const setThemeImage = async (
    uri: string
  ) => {
    setThemeImageState(uri);

    try {
      await AsyncStorage.setItem(
        THEME_IMAGE_KEY,
        uri
      );
    } catch (error) {
      console.error(
        "❌ Failed to save theme image:",
        error
      );
    }
  };

  const removeThemeImage = async () => {
    setThemeImageState(null);

    try {
      await AsyncStorage.removeItem(
        THEME_IMAGE_KEY
      );
    } catch (error) {
      console.error(
        "❌ Failed to remove theme image:",
        error
      );
    }
  };

  // ============================================================
  // CHAT IMAGE
  // ============================================================

  const setChatImage = async (
    uri: string
  ) => {
    setChatImageState(uri);

    try {
      await AsyncStorage.setItem(
        CHAT_IMAGE_KEY,
        uri
      );
    } catch (error) {
      console.error(
        "❌ Failed to save chat image:",
        error
      );
    }
  };

  const removeChatImage = async () => {
    setChatImageState(null);

    try {
      await AsyncStorage.removeItem(
        CHAT_IMAGE_KEY
      );
    } catch (error) {
      console.error(
        "❌ Failed to remove chat image:",
        error
      );
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",

        themeImage,
        chatImage,

        toggleTheme,

        setThemeImage,
        removeThemeImage,

        setChatImage,
        removeChatImage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}