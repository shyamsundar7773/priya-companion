import AsyncStorage from "@react-native-async-storage/async-storage";

export type RecentChat = {
  chatId: string;
  lastMessage: string;
  lastMessageTime: number;
};

const RECENT_CHATS_KEY =
  "@priya_companion_recent_chats";

/* ============================================================
   GET RECENT CHATS
   ============================================================ */

export async function getRecentChats(): Promise<
  RecentChat[]
> {
  try {
    const stored =
      await AsyncStorage.getItem(
        RECENT_CHATS_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed: RecentChat[] =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Failed to load recent chats:",
      error
    );

    return [];
  }
}

/* ============================================================
   UPDATE RECENT CHAT
   ============================================================ */

export async function updateRecentChat(
  chatId: string,
  lastMessage: string,
  lastMessageTime: number
): Promise<void> {
  try {
    const current =
      await getRecentChats();

    const filtered =
      current.filter(
        (chat) =>
          chat.chatId !== chatId
      );

    const updated: RecentChat[] = [
      {
        chatId,
        lastMessage,
        lastMessageTime,
      },
      ...filtered,
    ];

    await AsyncStorage.setItem(
      RECENT_CHATS_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "Failed to update recent chat:",
      error
    );
  }
}

/* ============================================================
   REMOVE RECENT CHAT
   ============================================================ */

export async function removeRecentChat(
  chatId: string
): Promise<void> {
  try {
    const current =
      await getRecentChats();

    const updated =
      current.filter(
        (chat) =>
          chat.chatId !== chatId
      );

    await AsyncStorage.setItem(
      RECENT_CHATS_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "Failed to remove recent chat:",
      error
    );
  }
}