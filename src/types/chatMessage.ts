export type ChatMessageRole =
| "user"
| "assistant"
| "system";

export type ChatMessage = {
id: string;
conversationId: string;
userId: string;
characterId: string;

role: ChatMessageRole;
content: string;

metadata?: Record<string, unknown>;

memoryProcessed: boolean;
analyzed: boolean;

createdAt: string;
};
