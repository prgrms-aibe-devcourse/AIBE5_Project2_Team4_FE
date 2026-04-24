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

const STORAGE_MESSAGES = 'stella_chat_messages';
const STORAGE_CONVS = 'stella_chat_conversations';
const STORAGE_READ = 'stella_chat_read';

export function makeConvId(userEmail: string, freelancerId: number): string {
  return `conv-${encodeURIComponent(userEmail)}-${freelancerId}`;
}

function loadMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    return raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

function saveMessages(data: Record<string, ChatMessage[]>): void {
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(data));
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVS);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]): void {
  localStorage.setItem(STORAGE_CONVS, JSON.stringify(convs));
}

function loadReadTimestamps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_READ);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveReadTimestamps(data: Record<string, string>): void {
  localStorage.setItem(STORAGE_READ, JSON.stringify(data));
}

export function registerConversation(conv: Conversation): void {
  const convs = loadConversations();
  if (!convs.find((c) => c.id === conv.id)) {
    convs.push(conv);
    saveConversations(convs);
  }
}

export function getMessages(conversationId: string): ChatMessage[] {
  const data = loadMessages();
  return data[conversationId] ?? [];
}

export function sendChatMessage(
  conversationId: string,
  senderEmail: string,
  text: string,
): ChatMessage {
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversationId,
    senderEmail,
    text,
    sentAt: new Date().toISOString(),
  };

  const data = loadMessages();
  if (!data[conversationId]) {
    data[conversationId] = [];
  }
  data[conversationId].push(msg);
  saveMessages(data);

  window.dispatchEvent(new CustomEvent(CHAT_EVENT, { detail: msg }));
  return msg;
}

export function markAsRead(conversationId: string, userEmail: string): void {
  const key = `${conversationId}::${userEmail}`;
  const data = loadReadTimestamps();
  data[key] = new Date().toISOString();
  saveReadTimestamps(data);
}

export function getUnreadCount(conversationId: string, userEmail: string): number {
  const key = `${conversationId}::${userEmail}`;
  const data = loadReadTimestamps();
  const lastRead = data[key];
  const messages = getMessages(conversationId);

  if (!lastRead) {
    return messages.filter((m) => m.senderEmail !== userEmail).length;
  }
  return messages.filter((m) => m.senderEmail !== userEmail && m.sentAt > lastRead).length;
}

export function getConversationsFor(email: string, _role: string): Conversation[] {
  return loadConversations().filter(
    (c) => c.userEmail === email || c.freelancerEmail === email,
  );
}
