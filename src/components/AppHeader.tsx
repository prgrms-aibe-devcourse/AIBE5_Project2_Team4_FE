import { useEffect, useRef, useState } from 'react';
import './appHeader.css';
import { getUser, logout, type User } from '../store/appAuth';
import { canSendAnnouncement } from '../store/accessControl';
import {
  type AppNotification,
  NOTIFICATION_EVENT,
  formatNotificationTime,
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationRead,
  sendAnnouncement,
} from '../store/notificationStore';

interface HeaderProps {
  activePage?: string;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v2.13c0 .84-.24 1.66-.7 2.37L5.47 14.8A1.5 1.5 0 0 0 6.74 17h10.52a1.5 1.5 0 0 0 1.27-2.2l-1.33-2.05a4.4 4.4 0 0 1-.7-2.37V8.25a4.5 4.5 0 0 0-4.5-4.5Zm0 17.25a2.25 2.25 0 0 1-2.12-1.5h4.24A2.25 2.25 0 0 1 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AppHeader({ activePage }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementFeedback, setAnnouncementFeedback] = useState('');
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncHeaderState = () => {
      const nextUser = getUser();
      setUser(nextUser);
      setNotifications(getNotificationsForUser(nextUser?.email));
    };

    syncHeaderState();
    window.addEventListener(NOTIFICATION_EVENT, syncHeaderState as EventListener);
    window.addEventListener('storage', syncHeaderState);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, syncHeaderState as EventListener);
      window.removeEventListener('storage', syncHeaderState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
        setAnnouncementOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function closePanels() {
    setDropdownOpen(false);
    setNotificationOpen(false);
    setAnnouncementOpen(false);
  }

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  function handleNotificationToggle() {
    setNotificationOpen((open) => !open);
    setDropdownOpen(false);
    setAnnouncementOpen(false);
  }

  function handleProfileToggle() {
    setDropdownOpen((open) => !open);
    setNotificationOpen(false);
    setAnnouncementOpen(false);
  }

  function handleNotificationSelect(notification: AppNotification) {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    setNotificationOpen(false);
    if (notification.link) {
      window.location.href = notification.link;
    }
  }

  function handleMarkAllAsRead() {
    if (!user) {
      return;
    }

    markAllNotificationsAsRead(user.email);
  }

  function handleAnnouncementOpen() {
    setAnnouncementOpen(true);
    setDropdownOpen(false);
    setNotificationOpen(false);
    setAnnouncementFeedback('');
  }

  function handleAnnouncementSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canSendAnnouncement(user)) {
      return;
    }

    const title = announcementTitle.trim();
    const message = announcementMessage.trim();
    if (!title || !message) {
      return;
    }

    const sentCount = sendAnnouncement(user.name, title, message, user.email);
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementFeedback(sentCount > 0 ? `${sentCount}명에게 공지를 발송했습니다.` : '발송 대상이 없습니다.');
  }

  return (
    <nav className="header">
      <div className="header-container">
        <a href="/"><img src="/logo.png" alt="logo" className="header-logo" /></a>
        <ul className="header-menu">
          <li><a href="/#home" className={activePage === 'home' ? 'active' : ''}>HOME</a></li>
          <li><a href="/#services" className={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
          <li><a href="/#about" className={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
          <li><a href="/#contact" className={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
          <li><a href="/freelancers" className={activePage === 'freelancers' ? 'active' : ''}>FREELANCERS</a></li>
        </ul>

        {user ? (
          <div className="header-actions" ref={actionsRef}>
            <button
              type="button"
              className={`header-notification-btn${notificationOpen ? ' active' : ''}`}
              onClick={handleNotificationToggle}
              aria-label="알림 열기"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="header-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notificationOpen && (
              <div className="header-panel header-notification-panel">
                <div className="header-panel-head">
                  <div>
                    <p className="header-panel-eyebrow">Notification Center</p>
                    <h3>알림</h3>
                  </div>
                  <button type="button" className="header-panel-action" onClick={handleMarkAllAsRead}>
                    모두 읽음
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="header-panel-empty">도착한 알림이 없습니다.</p>
                ) : (
                  <div className="header-notification-list">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`header-notification-item${notification.read ? '' : ' unread'}`}
                        onClick={() => handleNotificationSelect(notification)}
                      >
                        <div className="header-notification-top">
                          <strong>{notification.title}</strong>
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                        </div>
                        <p className="header-notification-message">{notification.message}</p>
                        <span className="header-notification-meta">
                          {notification.link ? '관련 화면으로 이동' : notification.read ? '읽음' : '읽지 않음'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {announcementOpen && canSendAnnouncement(user) && (
              <div className="header-panel header-announcement-panel">
                <div className="header-panel-head">
                  <div>
                    <p className="header-panel-eyebrow">System Notice</p>
                    <h3>공지 발송</h3>
                  </div>
                  <button type="button" className="header-panel-action" onClick={closePanels}>
                    닫기
                  </button>
                </div>

                <form className="header-announcement-form" onSubmit={handleAnnouncementSubmit}>
                  <input
                    type="text"
                    className="header-announcement-input"
                    placeholder="공지 제목"
                    value={announcementTitle}
                    onChange={(event) => setAnnouncementTitle(event.target.value)}
                  />
                  <textarea
                    className="header-announcement-textarea"
                    placeholder="공지 내용을 입력하세요."
                    rows={4}
                    value={announcementMessage}
                    onChange={(event) => setAnnouncementMessage(event.target.value)}
                  />
                  <div className="header-announcement-footer">
                    <p className="header-announcement-feedback">{announcementFeedback}</p>
                    <button type="submit" className="header-announcement-submit">발송</button>
                  </div>
                </form>
              </div>
            )}

            <div className="header-user-area">
              <button type="button" className="header-profile" onClick={handleProfileToggle}>
                <span className="header-username">{user.name}</span>
                {user.avatar
                  ? <img src={user.avatar} alt="profile" className="header-avatar-img" />
                  : <div className="header-avatar">{user.name[0]}</div>
                }
              </button>
              {dropdownOpen && (
                <div className="header-dropdown">
                  <a href="/mypage" className="header-dropdown-item">마이페이지</a>
                  <a href="/project" className="header-dropdown-item">프로젝트</a>
                  {canSendAnnouncement(user) && (
                    <button type="button" className="header-dropdown-item" onClick={handleAnnouncementOpen}>
                      공지 발송
                    </button>
                  )}
                  <button type="button" className="header-dropdown-item danger" onClick={handleLogout}>로그아웃</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <a href="/login"><button type="button" className="header-login-btn">LOGIN</button></a>
        )}
      </div>
    </nav>
  );
}
