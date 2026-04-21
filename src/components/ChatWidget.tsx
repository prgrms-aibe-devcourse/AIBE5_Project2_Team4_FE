import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWidget.css';
import { getUser, AUTH_USER_EVENT } from '../store/appAuth';
import type { User } from '../store/appAuth';
import {
  getConversationsFor,
  getMessages,
  sendChatMessage,
  markAsRead,
  getUnreadCount,
  CHAT_EVENT,
  CHAT_OPEN_EVENT,
} from '../store/chatStore';
import type { Conversation, ChatMessage } from '../store/chatStore';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function fmtRecent(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtTime(iso);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function ChatWidget() {
  const [user, setUser] = useState<User | null>(() => getUser());
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = () => setUser(getUser());
    window.addEventListener(AUTH_USER_EVENT, handler);
    return () => window.removeEventListener(AUTH_USER_EVENT, handler);
  }, []);

  const refreshConvs = useCallback(() => {
    if (!user || user.role === 'ROLE_ADMIN') return;
    const convs = getConversationsFor(user.email, user.role);
    convs.sort((a, b) => {
      const aLast = getMessages(a.id).at(-1)?.sentAt ?? '';
      const bLast = getMessages(b.id).at(-1)?.sentAt ?? '';
      return bLast.localeCompare(aLast);
    });
    setConversations(convs);
    setTotalUnread(convs.reduce((n, c) => n + getUnreadCount(c.id, user.email), 0));
  }, [user]);

  const refreshMsgs = useCallback(() => {
    if (!activeConv) return;
    setMessages(getMessages(activeConv.id));
  }, [activeConv]);

  const refreshConvsRef = useRef(refreshConvs);
  const refreshMsgsRef = useRef(refreshMsgs);
  useEffect(() => { refreshConvsRef.current = refreshConvs; }, [refreshConvs]);
  useEffect(() => { refreshMsgsRef.current = refreshMsgs; }, [refreshMsgs]);

  useEffect(() => { refreshConvs(); }, [refreshConvs]);
  useEffect(() => { refreshMsgs(); }, [refreshMsgs]);

  useEffect(() => {
    if (isOpen && view === 'chat' && activeConv && user) {
      markAsRead(activeConv.id, user.email);
      refreshConvs();
    }
  }, [messages, isOpen, view, activeConv, user, refreshConvs]);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [messages, isOpen, view]);

  useEffect(() => {
    if (isOpen && view === 'chat') inputRef.current?.focus();
  }, [isOpen, view, activeConv]);

  // polling + chat event listener — deps [] so interval is never torn down/recreated
  useEffect(() => {
    const tick = setInterval(() => { refreshConvsRef.current(); refreshMsgsRef.current(); }, 5000);
    const handler = () => { refreshConvsRef.current(); refreshMsgsRef.current(); };
    window.addEventListener(CHAT_EVENT, handler);
    return () => { clearInterval(tick); window.removeEventListener(CHAT_EVENT, handler); };
  }, []);

  // Open specific conversation from external trigger (e.g. FreelancerDetailPage)
  useEffect(() => {
    const handler = (e: Event) => {
      const conv = (e as CustomEvent<Conversation>).detail;
      setIsOpen(true);
      setView('chat');
      setActiveConv(conv);
      refreshConvs();
      if (user) markAsRead(conv.id, user.email);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, [user, refreshConvs]);

  const openConv = (conv: Conversation) => {
    setActiveConv(conv);
    setView('chat');
    if (user) markAsRead(conv.id, user.email);
  };

  const handleSend = () => {
    if (!input.trim() || !activeConv || !user) return;
    sendChatMessage(activeConv.id, user.email, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!user || user.role === 'ROLE_ADMIN') return null;

  const partnerName = (conv: Conversation) =>
    user.role === 'ROLE_USER' ? conv.freelancerName : conv.userName;

  const partnerLabel = (_conv: Conversation) =>
    user.role === 'ROLE_USER' ? '메이트' : '보호자';

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-widget-panel">

          {/* Header */}
          <div className="chat-widget-header">
            <div className="chat-widget-header-left">
              {view === 'chat' && (
                <button className="chat-back-btn" onClick={() => setView('list')} aria-label="뒤로">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              <div className="chat-widget-header-info">
                <div className="chat-widget-avatar">
                  {view === 'chat' && activeConv ? partnerName(activeConv)[0] : 'S'}
                </div>
                <div>
                  <div className="chat-widget-title">
                    {view === 'chat' && activeConv ? partnerName(activeConv) : '메시지'}
                  </div>
                  <div className="chat-widget-subtitle">
                    {view === 'chat' && activeConv
                      ? partnerLabel(activeConv)
                      : (user.role === 'ROLE_USER' ? '메이트와 대화' : '보호자와 대화')}
                  </div>
                </div>
              </div>
            </div>
            <button className="chat-widget-close-btn" onClick={() => setIsOpen(false)} aria-label="닫기">✕</button>
          </div>

          {/* Conversation list */}
          {view === 'list' && (
            <div className="chat-conv-list">
              {conversations.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="chat-empty-title">
                    연결된 {user.role === 'ROLE_USER' ? '메이트' : '보호자'}가 없습니다
                  </p>
                  {user.role === 'ROLE_USER' && (
                    <p className="chat-empty-hint">메이트에게 제안을 보내면<br />채팅이 활성화됩니다.</p>
                  )}
                </div>
              ) : (
                conversations.map(conv => {
                  const msgs = getMessages(conv.id);
                  const last = msgs.at(-1);
                  const unread = getUnreadCount(conv.id, user.email);
                  const name = partnerName(conv);
                  return (
                    <button key={conv.id} className="chat-conv-item" onClick={() => openConv(conv)}>
                      <div className="chat-conv-avatar">{name[0]}</div>
                      <div className="chat-conv-body">
                        <div className="chat-conv-row">
                          <span className="chat-conv-name">{name}</span>
                          {last && <span className="chat-conv-time">{fmtRecent(last.sentAt)}</span>}
                        </div>
                        <div className="chat-conv-row">
                          <span className="chat-conv-last">
                            {last
                              ? (last.senderEmail === user.email ? `나: ${last.text}` : last.text)
                              : '대화를 시작해보세요'}
                          </span>
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
          )}

          {/* Chat room */}
          {view === 'chat' && activeConv && (
            <>
              <div className="chat-widget-messages">
                {messages.length === 0 && (
                  <div className="chat-start-hint">{partnerName(activeConv)}님과 대화를 시작해보세요.</div>
                )}
                {messages.map(msg => {
                  const mine = msg.senderEmail === user.email;
                  return (
                    <div key={msg.id} className={`chat-message chat-message--${mine ? 'user' : 'bot'}`}>
                      {!mine && (
                        <div className="chat-bot-avatar">{partnerName(activeConv)[0]}</div>
                      )}
                      <div className="chat-bubble-wrap">
                        <div className="chat-bubble">{msg.text}</div>
                        <div className="chat-timestamp">{fmtTime(msg.sentAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-widget-input-area">
                <textarea
                  ref={inputRef}
                  className="chat-widget-input"
                  placeholder="메시지를 입력하세요..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="chat-widget-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  aria-label="전송"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        className={`chat-widget-toggle ${isOpen ? 'chat-widget-toggle--open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? '채팅 닫기' : '채팅 열기'}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {totalUnread > 0 && !isOpen && (
          <span className="chat-widget-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>
    </div>
  );
}
