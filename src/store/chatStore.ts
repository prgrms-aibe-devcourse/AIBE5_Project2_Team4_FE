import {
  createChatConversation,
  getChatConversations,
  getChatMessages,
  markChatConversationRead,
  sendChatMessageRequest,
  type ChatConversationSummaryResponse,
  type ChatMessageResponse,
} from '../api/chats';

export interface ChatMessage {
  id: string;
  conversationId: string;
  messageId: number;
  senderUserId: number;
  senderName: string;
  senderRoleCode: string;
  text: string;
  sentAt: string;
  read: boolean;
  readAt?: string | null;
}

export interface Conversation {
  id: string;
  conversationId: number;
  otherUserId: number;
  otherName: string;
  otherEmail: string;
  otherRoleCode: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export const CHAT_EVENT = 'stella:chat-message';
export const CHAT_OPEN_EVENT = 'stella:open-chat';

function toConversation(response: ChatConversationSummaryResponse): Conversation {
  return {
    id: String(response.conversationId),
    conversationId: response.conversationId,
    otherUserId: response.otherUserId,
    otherName: response.otherUserName,
    otherEmail: response.otherUserEmail,
    otherRoleCode: response.otherUserRoleCode,
    lastMessage: response.lastMessage,
    lastMessageAt: response.lastMessageAt,
    unreadCount: response.unreadCount,
  };
}

function toMessage(response: ChatMessageResponse): ChatMessage {
  return {
    id: String(response.messageId),
    conversationId: String(response.conversationId),
    messageId: response.messageId,
    senderUserId: response.senderUserId,
    senderName: response.senderName,
    senderRoleCode: response.senderRoleCode,
    text: response.content,
    sentAt: response.createdAt,
    read: response.readYn,
    readAt: response.readAt,
  };
}

function dispatchChatMessage(message: ChatMessage): void {
  window.dispatchEvent(new CustomEvent(CHAT_EVENT, { detail: message }));
}

function dispatchOpenConversation(conversation: Conversation): void {
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: conversation }));
}

export async function getConversationsFor(): Promise<Conversation[]> {
  const conversations = await getChatConversations();
  return conversations.map(toConversation);
}

export async function getMessages(conversationId: string | number): Promise<ChatMessage[]> {
  const response = await getChatMessages(Number(conversationId), { page: 0, size: 100 });
  return response.content.map(toMessage).reverse();
}

export async function sendChatMessage(
  conversationId: string | number,
  text: string,
): Promise<ChatMessage> {
  const message = toMessage(await sendChatMessageRequest(Number(conversationId), text));
  dispatchChatMessage(message);
  return message;
}

export async function markAsRead(conversationId: string | number): Promise<void> {
  await markChatConversationRead(Number(conversationId));
}

export function getUnreadCount(conversation: Conversation): number {
  return conversation.unreadCount;
}

export async function openChatWithFreelancer(freelancerProfileId: number): Promise<Conversation> {
  const conversation = toConversation(await createChatConversation({ targetFreelancerProfileId: freelancerProfileId }));
  dispatchOpenConversation(conversation);
  return conversation;
}
