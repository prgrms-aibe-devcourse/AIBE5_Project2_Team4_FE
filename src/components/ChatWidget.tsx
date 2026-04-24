import { useCallback, useEffect, useRef, useState } from 'react';
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

function formatTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function totalUnread(convs: Conversation[], email: string): number {
  return convs.reduce((sum, c) => sum + getUnreadCount(c.id, email), 0);
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
          <div className="chat-widget-avatar">{user.name[0]}</div>
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
            const msgs = getMessages(conv.id);
            const lastMsg = msgs[msgs.length - 1];
            const unread = getUnreadCount(conv.id, user.email);
            const otherName =
              conv.userEmail === user.email ? conv.freelancerName : conv.userName;

            return (
              <button
                key={conv.id}
                type="button"
                className="chat-conv-item"
                onClick={() => onSelect(conv)}
              >
                <div className="chat-conv-avatar">{otherName[0]}</div>
                <div className="chat-conv-body">
                  <div className="chat-conv-row">
                    <span className="chat-conv-name">{otherName}</span>
                    {lastMsg && (
                      <span className="chat-conv-time">{formatTime(lastMsg.sentAt)}</span>
                    )}
                  </div>
                  <div className="chat-conv-row">
                    <span className="chat-conv-last">{lastMsg?.text ?? '메시지가 없습니다'}</span>
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
  onSend: (text: string) => void;
}

function MessageView({ user, conv, messages, onBack, onClose, onSend }: MessageViewProps) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const otherName =
    conv.userEmail === user.email ? conv.freelancerName : conv.userName;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    onSend(text);
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
            <div className="chat-widget-avatar">{otherName[0]}</div>
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
          const isUser = msg.senderEmail === user.email;
          return (
            <div key={msg.id} className={`chat-message${isUser ? ' chat-message--user' : ' chat-message--bot'}`}>
              {!isUser && <div className="chat-bot-avatar">{otherName[0]}</div>}
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

  const refreshConvs = useCallback((u: User | null) => {
    if (!u) {
      setConvs([]);
      return;
    }
    setConvs(getConversationsFor(u.email, u.role));
  }, []);

  const refreshMessages = useCallback((conv: Conversation | null) => {
    if (!conv) {
      setMessages([]);
      return;
    }
    setMessages(getMessages(conv.id));
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const u = getUser();
      setUser(u);
      refreshConvs(u);
    };
    syncUser();
    window.addEventListener(AUTH_USER_EVENT, syncUser as EventListener);
    return () => window.removeEventListener(AUTH_USER_EVENT, syncUser as EventListener);
  }, [refreshConvs]);

  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const msg = (e as CustomEvent<import('../store/chatStore').ChatMessage>).detail;
      refreshConvs(getUser());
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages(getMessages(activeConv.id));
      }
    };
    window.addEventListener(CHAT_EVENT, handleNewMessage);
    return () => window.removeEventListener(CHAT_EVENT, handleNewMessage);
  }, [activeConv, refreshConvs]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const conv = (e as CustomEvent<Conversation>).detail;
      refreshConvs(getUser());
      setActiveConv(conv);
      setMessages(getMessages(conv.id));
      if (user) markAsRead(conv.id, user.email);
      setOpen(true);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handleOpenChat as EventListener);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handleOpenChat as EventListener);
  }, [user, refreshConvs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  const totalUnreadCount = convs.reduce(
    (sum, c) => sum + getUnreadCount(c.id, user.email),
    0,
  );

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      refreshConvs(user);
      setActiveConv(null);
    }
  }

  function handleSelectConv(conv: Conversation) {
    setActiveConv(conv);
    setMessages(getMessages(conv.id));
    markAsRead(conv.id, user!.email);
    refreshConvs(user);
  }

  function handleBack() {
    setActiveConv(null);
    refreshConvs(user);
  }

  function handleClose() {
    setOpen(false);
    setActiveConv(null);
  }

  function handleSend(text: string) {
    if (!activeConv || !user) return;
    sendChatMessage(activeConv.id, user.email, text);
    setMessages(getMessages(activeConv.id));
    refreshConvs(user);
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
