export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
};
