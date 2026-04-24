import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import './ChatWidget.css';
import { AUTH_USER_EVENT, getUser, type User } from '../store/appAuth';
import {
  CHAT_EVENT,
  CHAT_OPEN_EVENT,
  getConversationsFor,
  getMessages,
  getUnreadCount,
  markAsRead,
  sendChatMessage,
  type ChatMessage,
  type Conversation,
} from '../store/chatStore';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function initialOf(name: string | null | undefined): string {
  return name?.trim()[0] ?? '?';
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="chat-empty-icon" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ConvListViewProps {
  user: User;
  convs: Conversation[];
  onSelect: (conv: Conversation) => void;
  onClose: () => void;
}

function ConvListView({ user, convs, onSelect, onClose }: ConvListViewProps) {
  return (
    <>
      <div className="chat-widget-header">
        <div className="chat-widget-header-left">
          <div className="chat-widget-avatar">{initialOf(user.name)}</div>
          <div>
            <div className="chat-widget-title">채팅</div>
            <div className="chat-widget-subtitle">{user.name}</div>
          </div>
        </div>
        <button type="button" className="chat-widget-close-btn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
      <div className="chat-conv-list">
        {convs.length === 0 ? (
          <div className="chat-empty">
            <EmptyIcon />
            <p className="chat-empty-title">채팅이 없습니다</p>
            <p className="chat-empty-hint">프리랜서 프로필에서 채팅을 시작할 수 있습니다.</p>
          </div>
        ) : (
          convs.map((conv) => {
            const unread = getUnreadCount(conv);

            return (
              <button
                key={conv.id}
                type="button"
                className="chat-conv-item"
                onClick={() => onSelect(conv)}
              >
                <div className="chat-conv-avatar">{initialOf(conv.otherName)}</div>
                <div className="chat-conv-body">
                  <div className="chat-conv-row">
                    <span className="chat-conv-name">{conv.otherName}</span>
                    {conv.lastMessageAt && (
                      <span className="chat-conv-time">{formatTime(conv.lastMessageAt)}</span>
                    )}
                  </div>
                  <div className="chat-conv-row">
                    <span className="chat-conv-last">{conv.lastMessage ?? '메시지가 없습니다'}</span>
                    {unread > 0 && (
                      <span className="chat-conv-badge">{unread > 9 ? '9+' : unread}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

interface MessageViewProps {
  user: User;
  conv: Conversation;
  messages: ChatMessage[];
  onBack: () => void;
  onClose: () => void;
  onSend: (text: string) => void | Promise<void>;
}

function MessageView({ user, conv, messages, onBack, onClose, onSend }: MessageViewProps) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const otherName = conv.otherName;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void onSend(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  return (
    <>
      <div className="chat-widget-header">
        <div className="chat-widget-header-left">
          <button type="button" className="chat-back-btn" onClick={onBack} aria-label="뒤로">
            <BackIcon />
          </button>
          <div className="chat-widget-header-info">
            <div className="chat-widget-avatar">{initialOf(otherName)}</div>
            <div>
              <div className="chat-widget-title">{otherName}</div>
            </div>
          </div>
        </div>
        <button type="button" className="chat-widget-close-btn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
      <div className="chat-widget-messages">
        {messages.length === 0 && (
          <p className="chat-start-hint">대화를 시작해보세요</p>
        )}
        {messages.map((msg) => {
          const isUser = msg.senderUserId === user.userId;
          return (
            <div key={msg.id} className={`chat-message${isUser ? ' chat-message--user' : ' chat-message--bot'}`}>
              {!isUser && <div className="chat-bot-avatar">{initialOf(otherName)}</div>}
              <div className="chat-bubble-wrap">
                <div className="chat-bubble">{msg.text}</div>
                <span className="chat-timestamp">{formatTime(msg.sentAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-widget-input-area">
        <textarea
          ref={textareaRef}
          className="chat-widget-input"
          placeholder="메시지를 입력하세요..."
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="chat-widget-send-btn"
          disabled={!draft.trim()}
          onClick={submit}
          aria-label="전송"
        >
          <SendIcon />
        </button>
      </div>
    </>
  );
}

export default function ChatWidget() {
  const [user, setUser] = useState<User | null>(getUser);
  const [open, setOpen] = useState(false);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshConvs = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setConvs([]);
      return;
    }

    try {
      setConvs(await getConversationsFor());
    } catch {
      setConvs([]);
    }
  }, []);

  const refreshMessages = useCallback(async (conv: Conversation | null) => {
    if (!conv) {
      setMessages([]);
      return;
    }

    try {
      setMessages(await getMessages(conv.id));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const nextUser = getUser();
      setUser(nextUser);
      void refreshConvs(nextUser);
    };
    syncUser();
    window.addEventListener(AUTH_USER_EVENT, syncUser as EventListener);
    return () => window.removeEventListener(AUTH_USER_EVENT, syncUser as EventListener);
  }, [refreshConvs]);

  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const msg = (e as CustomEvent<ChatMessage>).detail;
      void refreshConvs(getUser());
      if (activeConv && msg.conversationId === activeConv.id) {
        void refreshMessages(activeConv);
      }
    };
    window.addEventListener(CHAT_EVENT, handleNewMessage);
    return () => window.removeEventListener(CHAT_EVENT, handleNewMessage);
  }, [activeConv, refreshConvs, refreshMessages]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const conv = (e as CustomEvent<Conversation>).detail;
      const currentUser = getUser();
      setActiveConv(conv);
      setOpen(true);
      void (async () => {
        await markAsRead(conv.id);
        await refreshMessages(conv);
        await refreshConvs(currentUser);
      })();
    };
    window.addEventListener(CHAT_OPEN_EVENT, handleOpenChat as EventListener);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handleOpenChat as EventListener);
  }, [refreshConvs, refreshMessages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!user) return undefined;

    const intervalId = window.setInterval(() => {
      void refreshConvs(getUser());
      if (activeConv) {
        void refreshMessages(activeConv);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeConv, refreshConvs, refreshMessages, user]);

  if (!user) return null;

  const totalUnreadCount = convs.reduce(
    (sum, c) => sum + getUnreadCount(c),
    0,
  );

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setActiveConv(null);
      setMessages([]);
      void refreshConvs(user);
    }
  }

  function handleSelectConv(conv: Conversation) {
    setActiveConv(conv);
    setMessages([]);
    void (async () => {
      await markAsRead(conv.id);
      await refreshMessages(conv);
      await refreshConvs(user);
    })();
  }

  function handleBack() {
    setActiveConv(null);
    setMessages([]);
    void refreshConvs(user);
  }

  function handleClose() {
    setOpen(false);
    setActiveConv(null);
  }

  async function handleSend(text: string) {
    if (!activeConv || !user) return;
    const conv = activeConv;

    try {
      const message = await sendChatMessage(conv.id, text);
      setMessages((currentMessages) => (
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      ));
      await refreshConvs(user);
    } catch {
      await refreshMessages(conv);
    }
  }

  return (
    <div className="chat-widget-container" ref={containerRef}>
      {open && (
        <div className="chat-widget-panel">
          {activeConv ? (
            <MessageView
              user={user}
              conv={activeConv}
              messages={messages}
              onBack={handleBack}
              onClose={handleClose}
              onSend={handleSend}
            />
          ) : (
            <ConvListView
              user={user}
              convs={convs}
              onSelect={handleSelectConv}
              onClose={handleClose}
            />
          )}
        </div>
      )}
      <button
        type="button"
        className={`chat-widget-toggle${open ? ' chat-widget-toggle--open' : ''}`}
        onClick={handleToggle}
        aria-label={open ? '채팅 닫기' : '채팅 열기'}
      >
        {totalUnreadCount > 0 && !open && (
          <span className="chat-widget-badge">{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</span>
        )}
        <ChatIcon />
      </button>
    </div>
  );
}
