import {
  analyzeShortTermMessage,
} from "@/services/shortTermMemoryAnalyzer";

import { generateResponse } from "../../services/aiBrain";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import ChatHeader from "../../components/chat/ChatHeader";
import MessageBubble from "../../components/chat/MessageBubble";
import MessageInput from "../../components/chat/MessageInput";
import ChatBackground from "../../components/theme/ChatBackground";

import { useTheme } from "../../context/ThemeContext";

import {
  getCharacterById,
  removeCharacter,
  updateCharacter,
} from "../../services/characterService";

import {
  removeRecentChat,
  updateRecentChat,
} from "../../services/chatService";

import { analyzeMessage } from "../../services/memoryAnalyzer";

import {
  deleteConversation,
  getOrCreateCharacterConversation,
} from "../../services/conversationService";

import {
  deleteMessage,
  getConversationMessages,
  saveMessage,
} from "../../services/messageRepository";

// ============================================================
// MESSAGE TYPE
// ============================================================

type Message = {
  id: string;
  text: string;
  isMine: boolean;
  time: string;
};

// ============================================================
// DATABASE MESSAGE TYPE
// ============================================================

type DatabaseChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

// ============================================================
// INITIAL MESSAGES
// ============================================================

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Dei enna panra? 😂",
    isMine: false,
    time: "12:20 PM",
  },
  {
    id: "2",
    text: "Onnum illa di, summa iruken 😌",
    isMine: true,
    time: "12:21 PM",
  },
  {
    id: "3",
    text: "Aama romba busy pola 😂",
    isMine: false,
    time: "12:22 PM",
  },
];

// ============================================================
// DATABASE MESSAGE → UI MESSAGE
// ============================================================

function databaseMessageToUIMessage(
  message: DatabaseChatMessage
): Message | null {
  if (message.role === "system") {
    return null;
  }

  const date = new Date(message.createdAt);

  return {
    id: message.id,
    text: message.content,
    isMine: message.role === "user",
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ============================================================
// RECONCILE ORPHANED MESSAGES
// ============================================================
//
// Explicit pending message:
// metadata.aiPending === true
//
// Legacy message:
// old user message created before aiPending existed.
//
// We only remove a legacy user message when another USER
// message immediately follows it. This avoids deleting a
// legitimate final user message.
//
// ============================================================

async function reconcilePendingMessages(
  messages: DatabaseChatMessage[]
): Promise<DatabaseChatMessage[]> {
  const cleanedMessages = [...messages];

  console.log(
    "🧹 RECONCILIATION START:",
    cleanedMessages.length,
    "messages"
  );

  // ==========================================================
  // 1. EXPLICIT PENDING MESSAGES
  // ==========================================================

  for (
    let i = cleanedMessages.length - 1;
    i >= 0;
    i--
  ) {
    const message = cleanedMessages[i];

    if (
      message.role !== "user" ||
      message.metadata?.aiPending !== true
    ) {
      continue;
    }

    const hasAssistantAfter =
      cleanedMessages
        .slice(i + 1)
        .some(
          (item) =>
            item.role === "assistant"
        );

    if (!hasAssistantAfter) {
      console.log(
        "🧹 ORPHANED PENDING MESSAGE FOUND:",
        message.content
      );

      try {
        await deleteMessage(
          message.id
        );

        cleanedMessages.splice(
          i,
          1
        );

        console.log(
          "🧹 ORPHANED PENDING MESSAGE REMOVED:",
          message.content
        );
      } catch (error) {
        console.error(
          "🧹 FAILED TO REMOVE PENDING MESSAGE:",
          error
        );
      }
    }
  }

  // ==========================================================
  // 2. LEGACY ORPHANED USER MESSAGE
  // ==========================================================
  //
  // Older messages were created before aiPending existed.
  //
  // If the conversation currently ends with a USER message,
  // and that message is old enough to no longer be an active
  // request, treat it as an abandoned/orphaned message.
  //
  // This specifically cleans old messages such as:
  //
  // user: Enna panra
  //
  // with no assistant response.
  //
  // ==========================================================

  if (cleanedMessages.length > 0) {
    const lastMessage =
      cleanedMessages[
        cleanedMessages.length - 1
      ];

    if (
      lastMessage.role === "user" &&
      lastMessage.metadata?.aiPending !== true
    ) {
      const createdTime =
        new Date(
          lastMessage.createdAt
        ).getTime();

      const messageAge =
        Date.now() - createdTime;

      // Wait at least 10 seconds before considering
      // a legacy final user message abandoned.
      const LEGACY_ORPHAN_DELAY =
        10 * 1000;

      if (
        !Number.isNaN(createdTime) &&
        messageAge >=
          LEGACY_ORPHAN_DELAY
      ) {
        console.log(
          "🧹 LEGACY FINAL ORPHAN FOUND:",
          lastMessage.content
        );

        try {
          await deleteMessage(
            lastMessage.id
          );

          cleanedMessages.pop();

          console.log(
            "🧹 LEGACY FINAL ORPHAN REMOVED:",
            lastMessage.content
          );
        } catch (error) {
          console.error(
            "🧹 FAILED TO REMOVE LEGACY FINAL ORPHAN:",
            error
          );
        }
      }
    }
  }

  // ==========================================================
  // 3. CLEAN UP LEGACY CONSECUTIVE USER MESSAGES
  // ==========================================================

  for (
    let i = 0;
    i < cleanedMessages.length - 1;
    i++
  ) {
    const message =
      cleanedMessages[i];

    const nextMessage =
      cleanedMessages[i + 1];

    if (
      message.role !== "user"
    ) {
      continue;
    }

    if (
      message.metadata?.aiPending === true
    ) {
      continue;
    }

    if (
      nextMessage.role !== "user"
    ) {
      continue;
    }

    console.log(
      "🧹 LEGACY CONSECUTIVE ORPHAN FOUND:",
      message.content
    );

    try {
      await deleteMessage(
        message.id
      );

      cleanedMessages.splice(
        i,
        1
      );

      console.log(
        "🧹 LEGACY CONSECUTIVE ORPHAN REMOVED:",
        message.content
      );

      i--;
    } catch (error) {
      console.error(
        "🧹 FAILED TO REMOVE LEGACY ORPHAN:",
        error
      );
    }
  }

  console.log(
    "🧹 RECONCILIATION COMPLETE:",
    cleanedMessages.length,
    "messages"
  );

  return cleanedMessages;
}

// ============================================================
// CHAT SCREEN
// ============================================================

export default function ChatScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const {
    isDark,
    chatImage,
  } = useTheme();

  // ==========================================================
  // CHARACTER
  // ==========================================================

  const character =
    typeof id === "string"
      ? getCharacterById(id)
      : undefined;

  console.log(
    "🔎 CHAT DEBUG:",
    {
      routeId: id,
      characterFound: !!character,
      characterName: character?.name,
      characterId: character?.id,
    }
  );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    showScrollButton,
    setShowScrollButton,
  ] = useState(false);

  const [
    photoUri,
    setPhotoUri,
  ] = useState<string | undefined>(
    character?.avatarUri
  );

  const [
    conversationId,
    setConversationId,
  ] = useState<string | null>(null);

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  // ==========================================================
  // SCROLL REFS
  // ==========================================================

  const scrollViewRef =
    useRef<ScrollView>(null);

  const contentHeightRef =
    useRef(0);

  const viewportHeightRef =
    useRef(0);

  const currentOffsetRef =
    useRef(0);

  const initialScrollDoneRef =
    useRef(false);

  const scrollTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  // ==========================================================
  // LEGACY GROUP STORAGE
  // ==========================================================

  const messageStorageKey =
    `@priya_companion_messages_${id}`;

  // ==========================================================
  // CHAT NAME
  // ==========================================================

  const chatName =
    character?.name ??
    (id === "girls-group"
      ? "Girls Group"
      : id === "boys-group"
      ? "Boys Group"
      : "Study Group");

  // ==========================================================
  // LOAD CHARACTER CONVERSATION
  // ==========================================================

  useEffect(() => {
    if (!id || !character) {
      return;
    }

    let mounted = true;

    initialScrollDoneRef.current =
      false;

    const loadConversation =
      async () => {
        try {
          console.log(
            "💬 Loading conversation for:",
            character.name
          );

          // --------------------------------------------------
          // GET OR CREATE CONVERSATION
          // --------------------------------------------------

          const conversation =
            await getOrCreateCharacterConversation(
              id,
              character.name
            );

          if (!mounted) {
            return;
          }

          setConversationId(
            conversation.id
          );

          console.log(
            "💬 Conversation ID:",
            conversation.id
          );

          // --------------------------------------------------
          // LOAD DATABASE MESSAGES
          // --------------------------------------------------

          const databaseMessages =
            await getConversationMessages(
              conversation.id,
              100
            );

          if (!mounted) {
            return;
          }

          // --------------------------------------------------
          // RECONCILE ORPHANS
          // --------------------------------------------------

          const reconciledMessages =
            await reconcilePendingMessages(
              databaseMessages
            );

          if (!mounted) {
            return;
          }

          // --------------------------------------------------
          // DEBUG LAST 10 MESSAGES
          // --------------------------------------------------

          console.log(
            "🔍 LAST 10 DATABASE MESSAGES:"
          );

          reconciledMessages
            .slice(-10)
            .forEach(
              (message, index) => {
                console.log(
                  index,
                  message.role,
                  message.content,
                  message.metadata
                );
              }
            );

          console.log(
            "💬 Messages after reconciliation:",
            reconciledMessages.length
          );

          // --------------------------------------------------
          // CONVERT TO UI MESSAGES
          // --------------------------------------------------

          const uiMessages =
            reconciledMessages
              .map(
                databaseMessageToUIMessage
              )
              .filter(
                (
                  message
                ): message is Message =>
                  message !== null
              );

          setMessages(
            uiMessages
          );

          console.log(
            "💬 Loaded messages:",
            uiMessages.length
          );
        } catch (error) {
          console.error(
            "❌ Failed to load Supabase conversation:",
            error
          );

          if (mounted) {
            setMessages([]);
            setConversationId(null);

            Alert.alert(
              "Chat Error",
              "Could not load your conversation. Please try again."
            );
          }
        }
      };

    loadConversation();

    return () => {
      mounted = false;

      if (scrollTimerRef.current) {
        clearTimeout(
          scrollTimerRef.current
        );

        scrollTimerRef.current =
          null;
      }
    };
  }, [
    id,
    character?.id,
  ]);

  // ==========================================================
  // LOAD LEGACY GROUP MESSAGES
  // ==========================================================

  useEffect(() => {
    if (!id || character) {
      return;
    }

    let mounted = true;

    initialScrollDoneRef.current =
      false;

    const loadGroupMessages =
      async () => {
        try {
          const stored =
            await AsyncStorage.getItem(
              messageStorageKey
            );

          if (!mounted) {
            return;
          }

          if (stored) {
            const parsed: Message[] =
              JSON.parse(stored);

            if (
              Array.isArray(parsed)
            ) {
              setMessages(parsed);
              return;
            }
          }

          setMessages(
            initialMessages
          );
        } catch (error) {
          console.error(
            "Failed to load group messages:",
            error
          );

          if (mounted) {
            setMessages(
              initialMessages
            );
          }
        }
      };

    loadGroupMessages();

    return () => {
      mounted = false;

      if (scrollTimerRef.current) {
        clearTimeout(
          scrollTimerRef.current
        );

        scrollTimerRef.current =
          null;
      }
    };
  }, [
    id,
    character,
    messageStorageKey,
  ]);

  // ==========================================================
  // LOAD GROUP PHOTO
  // ==========================================================

  useEffect(() => {
    if (!id || character) {
      return;
    }

    const loadGroupPhoto =
      async () => {
        try {
          const storedPhoto =
            await AsyncStorage.getItem(
              `@priya_companion_group_avatar_${id}`
            );

          if (storedPhoto) {
            setPhotoUri(
              storedPhoto
            );
          }
        } catch (error) {
          console.error(
            "Failed to load chat photo:",
            error
          );
        }
      };

    loadGroupPhoto();
  }, [
    id,
    character,
  ]);

  // ==========================================================
  // SAVE LEGACY GROUP MESSAGES
  // ==========================================================

  useEffect(() => {
    if (
      character ||
      messages.length === 0
    ) {
      return;
    }

    const saveGroupMessages =
      async () => {
        try {
          await AsyncStorage.setItem(
            messageStorageKey,
            JSON.stringify(messages)
          );
        } catch (error) {
          console.error(
            "Failed to save group messages:",
            error
          );
        }
      };

    saveGroupMessages();
  }, [
    messages,
    messageStorageKey,
    character,
  ]);

  // ==========================================================
  // SCROLL TO LATEST
  // ==========================================================

  const scrollToLatest = (
    animated = true
  ) => {
    if (scrollTimerRef.current) {
      clearTimeout(
        scrollTimerRef.current
      );

      scrollTimerRef.current =
        null;
    }

    scrollTimerRef.current =
      setTimeout(() => {
        requestAnimationFrame(
          () => {
            scrollViewRef.current?.scrollToEnd(
              {
                animated,
              }
            );

            requestAnimationFrame(
              () => {
                scrollViewRef.current?.scrollToEnd(
                  {
                    animated,
                  }
                );

                currentOffsetRef.current =
                  Math.max(
                    0,
                    contentHeightRef.current -
                      viewportHeightRef.current
                  );

                setShowScrollButton(
                  false
                );
              }
            );
          }
        );
      }, 50);
  };

  // ==========================================================
  // INITIAL OPENING
  // ==========================================================

  useEffect(() => {
    if (
      messages.length === 0 ||
      initialScrollDoneRef.current
    ) {
      return;
    }

    if (
      contentHeightRef.current <=
      viewportHeightRef.current
    ) {
      initialScrollDoneRef.current =
        true;

      setShowScrollButton(
        false
      );

      return;
    }

    initialScrollDoneRef.current =
      true;

    scrollToLatest(false);
  }, [
    messages.length,
  ]);

  // ==========================================================
  // CURRENT TIME
  // ==========================================================

  const getCurrentTime = () =>
    new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage = async (
    text: string
  ) => {
    const cleanText =
      text.trim();

    if (!cleanText) {
      return;
    }

    if (isSending) {
      return;
    }

    if (!id) {
      return;
    }

    setIsSending(true);

    const messageTime =
      Date.now();

    // ========================================================
    // CHARACTER CHAT
    // ========================================================

    if (character) {
      let savedUserMessageId:
        string | null = null;

      try {
        // ----------------------------------------------------
        // ENSURE CONVERSATION EXISTS
        // ----------------------------------------------------

        let activeConversationId =
          conversationId;

        if (!activeConversationId) {
          const conversation =
            await getOrCreateCharacterConversation(
              id,
              character.name
            );

          activeConversationId =
            conversation.id;

          setConversationId(
            conversation.id
          );
        }

        // ----------------------------------------------------
        // SAVE USER MESSAGE
        // ----------------------------------------------------
        //
        // aiPending:true means the message is waiting
        // for the AI response.
        //

        const savedUserMessage =
          await saveMessage({
            conversationId:
              activeConversationId,

            characterId:
              id,

            role:
              "user",

            content:
              cleanText,

            metadata: {
              source: "chat",
              aiPending: true,
            },
          });

        savedUserMessageId =
          savedUserMessage.id;

        console.log(
          "💾 USER MESSAGE SAVED:",
          savedUserMessage.id
        );

        // ----------------------------------------------------
        // SHORT-TERM MEMORY ANALYSIS
        // ----------------------------------------------------

        try {
          await analyzeShortTermMessage(
            id,
            activeConversationId,
            cleanText
          );
        } catch (memoryError) {
          console.error(
            "❌ Short-term memory analysis failed:",
            memoryError
          );
        }

        // ----------------------------------------------------
        // DISPLAY USER MESSAGE
        // ----------------------------------------------------

        const userMessage: Message = {
          id:
            savedUserMessage.id,

          text:
            cleanText,

          isMine:
            true,

          time:
            new Date(
              savedUserMessage.createdAt
            ).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
        };

        const nextMessages = [
          ...messages,
          userMessage,
        ];

        setMessages(
          nextMessages
        );

        scrollToLatest(true);

        // ----------------------------------------------------
        // RECENT CHAT
        // ----------------------------------------------------

        updateRecentChat(
          id,
          cleanText,
          messageTime
        );

        // ----------------------------------------------------
        // LEGACY MEMORY ANALYSIS
        // ----------------------------------------------------

        try {
          await analyzeMessage(
            id,
            cleanText
          );
        } catch (error) {
          console.error(
            "🧠 Memory analysis failed:",
            error
          );
        }

        // ----------------------------------------------------
        // RECENT CONVERSATION CONTEXT
        // ----------------------------------------------------

        const recentMessages =
          nextMessages
            .slice(-10)
            .map(
              (message) =>
                message.text
            );

        // ----------------------------------------------------
        // AI RESPONSE
        // ----------------------------------------------------

        console.log(
          "🚀 AI GENERATION STARTING:",
          cleanText
        );

        const aiResponse =
          await generateResponse({
            characterId:
              id,

            conversationId:
              activeConversationId,

            userMessage:
              cleanText,

            recentMessages,
          });

        console.log(
          "🚀 AI GENERATION COMPLETED:",
          aiResponse
        );

        // ----------------------------------------------------
        // SAVE ASSISTANT MESSAGE
        // ----------------------------------------------------

        console.log(
          "💾 SAVING ASSISTANT MESSAGE..."
        );

        const savedAssistantMessage =
          await saveMessage({
            conversationId:
              activeConversationId,

            characterId:
              id,

            role:
              "assistant",

            content:
              aiResponse.text,

            metadata: {
              source:
                aiResponse.source,

              memoryUsed:
                aiResponse.memoryUsed,
            },
          });

        console.log(
          "💾 ASSISTANT MESSAGE SAVED:",
          savedAssistantMessage.id
        );

        // ----------------------------------------------------
        // DISPLAY AI RESPONSE
        // ----------------------------------------------------

        const priyaReply: Message = {
          id:
            savedAssistantMessage.id,

          text:
            aiResponse.text,

          isMine:
            false,

          time:
            new Date(
              savedAssistantMessage.createdAt
            ).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
        };

        const finalMessages = [
          ...nextMessages,
          priyaReply,
        ];

        setMessages(
          finalMessages
        );

        updateRecentChat(
          id,
          priyaReply.text,
          Date.now()
        );

        scrollToLatest(true);
      } catch (error) {
        console.error(
          "🤖 Chat send failed:",
          error
        );

        // ----------------------------------------------------
        // REMOVE ORPHANED USER MESSAGE
        // ----------------------------------------------------

        if (savedUserMessageId) {
          try {
            await deleteMessage(
              savedUserMessageId
            );

            setMessages(
              (currentMessages) =>
                currentMessages.filter(
                  (message) =>
                    message.id !==
                    savedUserMessageId
                )
            );

            console.log(
              "🧹 ORPHANED USER MESSAGE REMOVED:",
              savedUserMessageId
            );
          } catch (deleteError) {
            console.error(
              "❌ Failed to remove orphaned message:",
              deleteError
            );
          }
        }

        Alert.alert(
          "Message Error",
          "Your message could not be completed. Please try again."
        );
      } finally {
        setIsSending(false);
      }

      return;
    }

    // ========================================================
    // LEGACY GROUP CHAT
    // ========================================================

    try {
      const userMessage: Message = {
        id:
          `user-${messageTime}`,

        text:
          cleanText,

        isMine:
          true,

        time:
          getCurrentTime(),
      };

      const nextMessages = [
        ...messages,
        userMessage,
      ];

      setMessages(
        nextMessages
      );

      scrollToLatest(true);

      updateRecentChat(
        id,
        cleanText,
        messageTime
      );
    } catch (error) {
      console.error(
        "Failed to send group message:",
        error
      );
    } finally {
      setIsSending(false);
    }
  };

  // ==========================================================
  // CHANGE PHOTO
  // ==========================================================

  const handleChangePhoto =
    async (uri: string) => {
      if (!id) {
        return;
      }

      try {
        if (character) {
          setPhotoUri(uri);

          await updateCharacter(
            id,
            {
              avatarUri: uri,
            }
          );

          return;
        }

        await AsyncStorage.setItem(
          `@priya_companion_group_avatar_${id}`,
          uri
        );

        setPhotoUri(uri);
      } catch (error) {
        console.error(
          "Failed to update chat photo:",
          error
        );
      }
    };

  // ==========================================================
  // DELETE CHAT
  // ==========================================================

  const deleteChat = () => {
    Alert.alert(
      "Delete Chat",
      `Delete all messages with ${chatName}?`,
      [
        {
          text:
            "Cancel",

          style:
            "cancel",
        },

        {
          text:
            "Delete",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                // --------------------------------------------
                // CHARACTER CHAT
                // --------------------------------------------

                if (
                  character &&
                  conversationId
                ) {
                  await deleteConversation(
                    conversationId
                  );

                  setMessages([]);

                  setConversationId(
                    null
                  );

                  await removeRecentChat(
                    id as string
                  );

                  router.back();

                  return;
                }

                // --------------------------------------------
                // LEGACY GROUP CHAT
                // --------------------------------------------

                await AsyncStorage.removeItem(
                  messageStorageKey
                );

                await removeRecentChat(
                  id as string
                );

                setMessages([]);

                router.back();
              } catch (error) {
                console.error(
                  "Failed to delete chat:",
                  error
                );

                Alert.alert(
                  "Delete Error",
                  "Could not delete the chat. Please try again."
                );
              }
            },
        },
      ]
    );
  };

  // ==========================================================
  // DELETE CONTACT
  // ==========================================================

  const deleteContact =
    async () => {
      if (!id) {
        return;
      }

      try {
        // ----------------------------------------------------
        // CHARACTER
        // ----------------------------------------------------

        if (character) {
          if (conversationId) {
            try {
              await deleteConversation(
                conversationId
              );
            } catch (error) {
              console.error(
                "Failed to delete character conversation:",
                error
              );
            }
          }

          await removeRecentChat(
            id
          );

          await removeCharacter(
            id
          );

          router.back();

          return;
        }

        // ----------------------------------------------------
        // LEGACY GROUP
        // ----------------------------------------------------

        await AsyncStorage.removeItem(
          messageStorageKey
        );

        await removeRecentChat(
          id
        );

        await AsyncStorage.removeItem(
          `@priya_companion_group_avatar_${id}`
        );

        await AsyncStorage.setItem(
          `@priya_companion_deleted_${id}`,
          "true"
        );

        router.back();
      } catch (error) {
        console.error(
          "Failed to delete chat/contact:",
          error
        );
      }
    };

  // ==========================================================
  // SCROLL HANDLER
  // ==========================================================

  const handleScroll = (
    event: any
  ) => {
    const {
      contentOffset,
      contentSize,
      layoutMeasurement,
    } = event.nativeEvent;

    const offsetY =
      contentOffset.y;

    const contentHeight =
      contentSize.height;

    const viewportHeight =
      layoutMeasurement.height;

    contentHeightRef.current =
      contentHeight;

    viewportHeightRef.current =
      viewportHeight;

    currentOffsetRef.current =
      offsetY;

    const maxOffset =
      Math.max(
        0,
        contentHeight -
          viewportHeight
      );

    const distanceFromBottom =
      maxOffset -
      offsetY;

    const shouldShow =
      maxOffset > 0 &&
      distanceFromBottom > 80;

    setShowScrollButton(
      shouldShow
    );
  };

  // ==========================================================
  // CONTENT SIZE
  // ==========================================================

  const handleContentSizeChange =
    (
      width: number,
      height: number
    ) => {
      contentHeightRef.current =
        height;

      if (
        messages.length > 0 &&
        !initialScrollDoneRef.current
      ) {
        if (
          height >
          viewportHeightRef.current
        ) {
          initialScrollDoneRef.current =
            true;

          requestAnimationFrame(
            () => {
              scrollViewRef.current?.scrollToEnd(
                {
                  animated:
                    false,
                }
              );

              requestAnimationFrame(
                () => {
                  scrollViewRef.current?.scrollToEnd(
                    {
                      animated:
                        false,
                    }
                  );

                  setShowScrollButton(
                    false
                  );
                }
              );
            }
          );
        } else {
          initialScrollDoneRef.current =
            true;

          setShowScrollButton(
            false
          );
        }
      }
    };

  // ==========================================================
  // LAYOUT
  // ==========================================================

  const handleLayout = (
    event: any
  ) => {
    const height =
      event.nativeEvent.layout
        .height;

    viewportHeightRef.current =
      height;

    if (
      messages.length > 0 &&
      !initialScrollDoneRef.current &&
      contentHeightRef.current >
        height
    ) {
      initialScrollDoneRef.current =
        true;

      requestAnimationFrame(
        () => {
          scrollViewRef.current?.scrollToEnd(
            {
              animated:
                false,
            }
          );

          requestAnimationFrame(
            () => {
              scrollViewRef.current?.scrollToEnd(
                {
                  animated:
                    false,
                }
              );

              setShowScrollButton(
                false
              );
            }
          );
        }
      );
    }
  };

  // ==========================================================
  // DYNAMIC CHAT COLORS
  // ==========================================================

  const pageBackground =
    isDark
      ? "#121212"
      : "#FFFFFF";

  const scrollButtonBackground =
    chatImage
      ? isDark
        ? "rgba(35,35,35,0.72)"
        : "rgba(255,255,255,0.68)"
      : isDark
      ? "#2A2A2A"
      : "#FFFFFF";

  const scrollButtonBorder =
    isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)";

  const scrollArrowColor =
    isDark
      ? "#FFFFFF"
      : "#555555";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            pageBackground,
        },
      ]}
      edges={[
        "top",
        "bottom",
      ]}
    >
      <KeyboardAvoidingView
        style={
          styles.keyboard
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <ChatHeader
          name={
            chatName
          }
          avatar={
            character?.avatar
          }
          avatarUri={
            photoUri
          }
          isCharacter={
            !!character
          }
          onChangePhoto={
            handleChangePhoto
          }
          onDeleteChat={
            deleteChat
          }
          onDeleteContact={
            deleteContact
          }
        />

        {/* ====================================================
            CHAT BACKGROUND
        ==================================================== */}

        <ChatBackground>
          <View
            style={
              styles.chatArea
            }
            onLayout={
              handleLayout
            }
          >
            <ScrollView
              ref={
                scrollViewRef
              }
              style={
                styles.scrollView
              }
              contentContainerStyle={
                styles.messages
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={
                16
              }
              onScroll={
                handleScroll
              }
              onContentSizeChange={
                handleContentSizeChange
              }
            >
              {messages.map(
                (item) => (
                  <MessageBubble
                    key={
                      item.id
                    }
                    text={
                      item.text
                    }
                    isUser={
                      item.isMine
                    }
                    time={
                      item.time
                    }
                  />
                )
              )}
            </ScrollView>

            {/* ==================================================
                SCROLL TO BOTTOM
            ================================================== */}

            {
              showScrollButton && (
                <Pressable
                  onPress={() => {
                    setShowScrollButton(
                      false
                    );

                    scrollToLatest(
                      true
                    );
                  }}
                  style={({
                    pressed,
                  }) => [
                    styles.downButton,

                    {
                      backgroundColor:
                        scrollButtonBackground,

                      borderColor:
                        scrollButtonBorder,
                    },

                    pressed &&
                      styles.downButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.downArrow,
                      {
                        color:
                          scrollArrowColor,
                      },
                    ]}
                  >
                    ↓
                  </Text>
                </Pressable>
              )
            }
          </View>
        </ChatBackground>

        {/* ====================================================
            MESSAGE INPUT
        ==================================================== */}

        <MessageInput
          onSend={
            sendMessage
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    keyboard: {
      flex: 1,
    },

    chatArea: {
      flex: 1,
      position:
        "relative",
      backgroundColor:
        "transparent",
    },

    scrollView: {
      flex: 1,
      backgroundColor:
        "transparent",
    },

    messages: {
      paddingTop:
        10,
      paddingBottom:
        90,
    },

    downButton: {
      position:
        "absolute",

      right:
        16,

      bottom:
        18,

      width:
        44,

      height:
        44,

      borderRadius:
        22,

      justifyContent:
        "center",

      alignItems:
        "center",

      borderWidth:
        1,

      elevation:
        6,

      shadowColor:
        "#000000",

      shadowOffset: {
        width:
          0,

        height:
          2,
      },

      shadowOpacity:
        0.22,

      shadowRadius:
        5,
    },

    downButtonPressed: {
      opacity:
        0.65,
    },

    downArrow: {
      fontSize:
        25,

      fontWeight:
        "600",

      marginTop:
        -4,
    },
  });