import { requestJson } from './client';
import type { PageResponse } from './types';

export interface ChatConversationCreateRequest {
  targetUserId?: number;
  targetFreelancerProfileId?: number;
}

export interface ChatConversationSummaryResponse {
  conversationId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
  otherUserRoleCode: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface ChatMessageResponse {
  messageId: number;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  senderRoleCode: string;
  content: string;
  readYn: boolean;
  createdAt: string;
  readAt?: string | null;
}

export type ChatMessagesResponse = PageResponse<ChatMessageResponse>;

export interface ChatReadResponse {
  conversationId: number;
  readCount: number;
}

export function getChatConversations(): Promise<ChatConversationSummaryResponse[]> {
  return requestJson<ChatConversationSummaryResponse[]>('/api/v1/chats/conversations');
}

export function createChatConversation(
  request: ChatConversationCreateRequest,
): Promise<ChatConversationSummaryResponse> {
  return requestJson<ChatConversationSummaryResponse>('/api/v1/chats/conversations', {
    method: 'POST',
    body: request,
  });
}

export function getChatMessages(
  conversationId: number,
  params: { page?: number; size?: number } = {},
): Promise<ChatMessagesResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<ChatMessagesResponse>(
    `/api/v1/chats/${conversationId}/messages${query ? `?${query}` : ''}`,
  );
}

export function sendChatMessageRequest(
  conversationId: number,
  content: string,
): Promise<ChatMessageResponse> {
  return requestJson<ChatMessageResponse>(`/api/v1/chats/${conversationId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

export function markChatConversationRead(conversationId: number): Promise<ChatReadResponse> {
  return requestJson<ChatReadResponse>(`/api/v1/chats/${conversationId}/read`, {
    method: 'PATCH',
  });
}
