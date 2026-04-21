/* eslint-disable @typescript-eslint/no-unused-vars */

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderEmail: string;
  text: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  userEmail: string;
  userName: string;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
}

export const CHAT_EVENT = 'stella:chat-message';
export const CHAT_OPEN_EVENT = 'stella:open-chat';

export function makeConvId(userEmail: string, freelancerId: number): string {
  return `disabled-${encodeURIComponent(userEmail)}-${freelancerId}`;
}

export function registerConversation(_conv: Conversation): void {}

export function getMessages(_conversationId: string): ChatMessage[] {
  return [];
}

export function sendChatMessage(_conversationId: string, _senderEmail: string, _text: string): ChatMessage {
  return {
    id: 'disabled',
    conversationId: _conversationId,
    senderEmail: _senderEmail,
    text: _text,
    sentAt: new Date(0).toISOString(),
  };
}

export function markAsRead(_conversationId: string, _userEmail: string): void {}

export function getUnreadCount(_conversationId: string, _userEmail: string): number {
  return 0;
}

export function getConversationsFor(_email: string, _role: string): Conversation[] {
  return [];
}
