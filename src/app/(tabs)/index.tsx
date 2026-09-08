import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import {
  getCharacters,
  initializeCharacters,
} from "@/services/characterService";

import {
  getRecentChats,
  RecentChat,
} from "@/services/chatService";

import ChatRow from "../../components/chat/ChatRow";
import { Chat } from "../../types/chat";

export default function HomeScreen() {
  const [characters, setCharacters] =
    useState<ReturnType<typeof getCharacters>>([]);

  const [recentChats, setRecentChats] =
    useState<RecentChat[]>([]);

  const [deletedGroupIds, setDeletedGroupIds] =
    useState<string[]>([]);

  const [groupAvatars, setGroupAvatars] =
    useState<Record<string, string>>({});

  const { user } = useAuth();
  const { isDark } = useTheme();

  // ==========================================================
  // THEME COLORS
  // ==========================================================

  const backgroundColor = isDark
    ? "#111111"
    : "#FFFFFF";

  const headerBorderColor = isDark
    ? "#2A2A2A"
    : "#E5E5E5";

  const titleColor = isDark
    ? "#FFFFFF"
    : "#111111";

  const iconColor = isDark
    ? "#FFFFFF"
    : "#222222";

  // ==========================================================
  // LOAD CHARACTERS + RECENT CHATS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadHomeData = async () => {
        await initializeCharacters();

        const loadedCharacters =
          getCharacters();

        const loadedRecentChats =
          await getRecentChats();

        const groupIds = [
          "girls-group",
          "boys-group",
          "study-group",
        ];

        const loadedGroupAvatars: Record<
          string,
          string
        > = {};

        for (const groupId of groupIds) {
          const avatar =
            await AsyncStorage.getItem(
              `@priya_companion_group_avatar_${groupId}`
            );

          if (avatar) {
            loadedGroupAvatars[groupId] =
              avatar;
          }
        }

        const deletedGroups: string[] = [];

        for (const groupId of groupIds) {
          const deleted =
            await AsyncStorage.getItem(
              `@priya_companion_deleted_${groupId}`
            );

          if (deleted === "true") {
            deletedGroups.push(groupId);
          }
        }

        if (active) {
          setCharacters(
            loadedCharacters
          );

          setGroupAvatars(
            loadedGroupAvatars
          );

          setDeletedGroupIds(
            deletedGroups
          );

          setRecentChats(
            loadedRecentChats
          );
        }
      };

      loadHomeData();

      return () => {
        active = false;
      };
    }, [])
  );

  // ==========================================================
  // CREATE CHARACTER CHAT LIST
  // ==========================================================

  const characterChats: Chat[] =
    characters.map((character) => {
      const recent =
        recentChats.find(
          (chat) =>
            chat.chatId ===
            character.id
        );

      return {
        id: character.id,

        type: "character",

        name: character.name,

        /*
         * If this character has been messaged,
         * show the latest saved message.
         *
         * Otherwise show the default preview.
         */
        lastMessage:
          recent?.lastMessage ??
          (
            character.id === "priya"
              ? "Dei enna panra? 😂"
              : "New character created"
          ),

        /*
         * If there is a recent message,
         * use its actual time.
         */
        lastMessageTime:
          recent?.lastMessageTime ??
          (
            character.id === "priya"
              ? Date.now() -
                2 * 60 * 1000
              : character.createdAt
          ),

        unreadCount:
          character.id === "priya"
            ? 2
            : 0,

        avatar:
          character.avatar,

        avatarUri:
          character.avatarUri,
      };
    });

  // ==========================================================
  // GROUP CHATS
  // ==========================================================

  const groupChats: Chat[] = [
    {
      id: "girls-group",
      type: "group",
      name: "Girls Group",

      lastMessage:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "girls-group"
        )?.lastMessage ??
        "Bhanu: 😂😂",

      lastMessageTime:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "girls-group"
        )?.lastMessageTime ??
        Date.now() -
          60 * 60 * 1000,

      unreadCount: 0,
    },

    {
      id: "boys-group",
      type: "group",
      name: "Boys Group",

      lastMessage:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "boys-group"
        )?.lastMessage ??
        "Enga da?",

      lastMessageTime:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "boys-group"
        )?.lastMessageTime ??
        Date.now() -
          2 * 60 * 60 * 1000,

      unreadCount: 0,
    },

    {
      id: "study-group",
      type: "group",
      name: "Study Group",

      lastMessage:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "study-group"
        )?.lastMessage ??
        "SQL JOIN tomorrow",

      lastMessageTime:
        recentChats.find(
          (chat) =>
            chat.chatId ===
            "study-group"
        )?.lastMessageTime ??
        Date.now() -
          3 * 60 * 60 * 1000,

      unreadCount: 0,
    },
  ];

  const visibleGroupChats =
    groupChats.filter(
      (group) =>
        !deletedGroupIds.includes(
          group.id
        )
    );

  // ==========================================================
  // COMBINE + SORT LIKE WHATSAPP
  // ==========================================================

  const chats: Chat[] = [
    ...characterChats,
    ...visibleGroupChats,
  ].sort((a, b) => {
    const timeA =
      a.lastMessageTime ?? 0;

    const timeB =
      b.lastMessageTime ?? 0;

    return timeB - timeA;
  });

  // ==========================================================
  // OPEN CHAT
  // ==========================================================

  const openChat = (
    chatId: string
  ) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chatId,
      },
    });
  };

  // ==========================================================
  // USER AVATAR
  // ==========================================================

  const userEmail =
    user?.email ?? "";

  const userInitial =
    userEmail.length > 0
      ? userEmail
          .charAt(0)
          .toUpperCase()
      : "U";

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
      edges={["top"]}
    >
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <View
        style={[
          styles.header,
          {
            borderBottomColor:
              headerBorderColor,
          },
        ]}
      >
        {/* TITLE */}

        <Text
          style={[
            styles.title,
            {
              color: titleColor,
            },
          ]}
        >
          Chats
        </Text>

        <View style={styles.actions}>

          {/* ============================================ */}
          {/* ACCOUNT AVATAR */}
          {/* ============================================ */}

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() => {
              router.push(
                "/account"
              );
            }}
          >
            <View
              style={
                styles.profileAvatar
              }
            >
              <Text
                style={
                  styles.profileAvatarText
                }
              >
                {userInitial}
              </Text>
            </View>
          </Pressable>

          {/* ============================================ */}
          {/* CREATE CHARACTER */}
          {/* ============================================ */}

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() => {
              router.push(
                "/create-character"
              );
            }}
          >
            <Text
              style={[
                styles.plusIcon,
                {
                  color: iconColor,
                },
              ]}
            >
              +
            </Text>
          </Pressable>

          {/* ============================================ */}
          {/* MORE / SETTINGS */}
          {/* ============================================ */}

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() => {
              router.push(
                "/settings"
              );
            }}
          >
            <Text
              style={[
                styles.moreIcon,
                {
                  color: iconColor,
                },
              ]}
            >
              ⋮
            </Text>
          </Pressable>

        </View>
      </View>

      {/* ================================================== */}
      {/* CHAT LIST */}
      {/* ================================================== */}

      <FlatList
        data={chats}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={({ item }) => (
          <ChatRow
            chat={item}
            onPress={() =>
              openChat(item.id)
            }
          />
        )}
        contentContainerStyle={
          styles.chatListContent
        }
        showsVerticalScrollIndicator={
          false
        }
      />
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  chatListContent: {
    paddingBottom: 20,
  },

  header: {
    height: 64,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ========================================================
  // PROFILE
  // ========================================================

  profileButton: {
    width: 42,
    height: 42,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 2,
  },

  profileAvatar: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: "#7B2CBF",

    justifyContent: "center",
    alignItems: "center",
  },

  profileAvatarText: {
    color: "#FFFFFF",

    fontSize: 16,
    fontWeight: "700",
  },

  // ========================================================
  // ACTION BUTTONS
  // ========================================================

  actionButton: {
    width: 42,
    height: 42,

    justifyContent: "center",
    alignItems: "center",
  },

  plusIcon: {
    fontSize: 30,
    fontWeight: "300",
  },

  moreIcon: {
    fontSize: 26,
  },

  // ========================================================
  // PRESS EFFECT
  // ========================================================

  pressed: {
    opacity: 0.55,
  },

  // ========================================================
  // UNUSED / FUTURE
  // ========================================================

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});