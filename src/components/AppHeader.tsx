import { useEffect, useRef, useState } from 'react';
import './appHeader.css';
import { AUTH_USER_EVENT, getUser, logout, type User } from '../store/appAuth';
import { canSendAnnouncement } from '../store/accessControl';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';
import {
  type AppNotification,
  NOTIFICATION_EVENT,
  formatNotificationTime,
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationRead,
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

function ThemeIcon({ theme }: { theme: AppTheme }) {
  return <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>;
}

export default function AppHeader({ activePage }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncHeaderState = () => {
      const nextUser = getUser();
      setUser(nextUser);
      setThemeState(getTheme());
      setNotifications(getNotificationsForUser(nextUser?.email));
    };

    syncHeaderState();
    window.addEventListener(NOTIFICATION_EVENT, syncHeaderState as EventListener);
    window.addEventListener(THEME_EVENT, syncHeaderState as EventListener);
    window.addEventListener(AUTH_USER_EVENT, syncHeaderState as EventListener);
    window.addEventListener('storage', syncHeaderState);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, syncHeaderState as EventListener);
      window.removeEventListener(THEME_EVENT, syncHeaderState as EventListener);
      window.removeEventListener(AUTH_USER_EVENT, syncHeaderState as EventListener);
      window.removeEventListener('storage', syncHeaderState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  function handleNotificationToggle() {
    setNotificationOpen((open) => !open);
    setDropdownOpen(false);
  }

  function handleProfileToggle() {
    setDropdownOpen((open) => !open);
    setNotificationOpen(false);
  }

  function handleNotificationSelect(notification: AppNotification) {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    setNotificationOpen(false);
    if (notification.link) {
      const nextUrl = new URL(notification.link, window.location.origin);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.pathname === currentUrl.pathname) {
        window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.href = notification.link;
      }
    }
  }

  function handleMarkAllAsRead() {
    if (!user) {
      return;
    }

    markAllNotificationsAsRead(user.email);
  }

  return (
    <nav className="header">
      <div className="header-container">
        <a href="/" className="header-logo-wrap">
          <img src="/logo.png" alt="logo" className="header-logo" />
          <span className="header-logo-text">이음</span>
        </a>
        <ul className="header-menu">
          <li><a href="/" className={activePage === 'home' ? 'active' : ''}>HOME</a></li>
          <li><a href="/#services" className={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
          <li><a href="/#about" className={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
          <li><a href="/#contact" className={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
          <li><a href="/freelancers" className={activePage === 'freelancers' ? 'active' : ''}>MATES</a></li>
        </ul>

        {user ? (
          <div className="header-actions" ref={actionsRef}>
            <button
              type="button"
              className="header-theme-btn"
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                setThemeState(nextTheme);
              }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <ThemeIcon theme={theme} />
            </button>
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
                  {user.role !== 'ROLE_ADMIN' && (
                    <a href="/project" className="header-dropdown-item">프로젝트</a>
                  )}
                  {canSendAnnouncement(user) && (
                    <a href="/announcement" className="header-dropdown-item">공지 발송</a>
                  )}
                  <button type="button" className="header-dropdown-item danger" onClick={handleLogout}>로그아웃</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="header-actions">
            <button
              type="button"
              className="header-theme-btn"
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                setThemeState(nextTheme);
              }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <ThemeIcon theme={theme} />
            </button>
            <a href="/login"><button type="button" className="header-login-btn">LOGIN</button></a>
          </div>
        )}
      </div>
    </nav>
  );
}
