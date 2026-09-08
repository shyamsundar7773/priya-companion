export type Chat = {
  id: string;

  type: "character" | "group";

  name: string;

  lastMessage?: string;

  lastMessageTime?: number;

  unreadCount: number;

  avatar?: string;

  avatarUri?: string;
};