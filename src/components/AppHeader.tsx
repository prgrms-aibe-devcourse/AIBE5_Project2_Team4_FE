import { useEffect, useRef, useState } from 'react';
import './appHeader.css';
import { AUTH_USER_EVENT, getUser, logout, type User } from '../store/appAuth';
import ChatWidget from './ChatWidget';
import { canSendAnnouncement, effectiveNoticeRole } from '../store/accessControl';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationSummaryResponse,
} from '../api/notifications';

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

function formatNotificationTime(createdAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

const NOTIFICATION_TEXT_MAP: Array<[RegExp, string]> = [
  [/\bIN_PROGRESS\b/gi, '진행 중'],
  [/\bACCEPTED\b/gi, '수락됨'],
  [/\bREQUESTED\b/gi, '요청됨'],
  [/\bCOMPLETED\b/gi, '완료됨'],
  [/\bCANCELLED\b/gi, '취소됨'],
  [/\bREJECTED\b/gi, '거절됨'],
  [/\bPENDING\b/gi, '대기 중'],
];

function translateNotificationText(value: string): string {
  return NOTIFICATION_TEXT_MAP.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

const REVIEW_REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: '스팸/홍보',
  ABUSE: '욕설/비방',
  FALSE_INFO: '허위 정보',
  ETC: '기타',
};

function getReviewReportedText(notification: NotificationSummaryResponse): { title: string; content: string } {
  const reviewIdMatch = notification.content.match(/Review #(\d+)/i);
  const projectTitleMatch = notification.content.match(/on project "([^"]+)"/i);
  const reasonTypeMatch = notification.content.match(/reported for ([A-Z_]+)/i);
  const reviewId = notification.relatedReviewId ?? (reviewIdMatch ? Number(reviewIdMatch[1]) : null);
  const projectTitle = projectTitleMatch?.[1]?.trim();
  const reasonLabel = reasonTypeMatch ? REVIEW_REPORT_REASON_LABELS[reasonTypeMatch[1]] : undefined;
  const reviewTarget = `${projectTitle ? `${projectTitle} 프로젝트의 ` : ''}리뷰${reviewId ? ` ${reviewId}번` : ''}`;
  const reasonText = reasonLabel ? ` 신고 사유: ${reasonLabel}.` : '';

  return {
    title: '리뷰 신고가 접수되었습니다.',
    content: `${reviewTarget}이 신고되었습니다.${reasonText} 관리자 신고 처리 화면에서 확인해 주세요.`,
  };
}

function getNotificationDisplayText(notification: NotificationSummaryResponse): { title: string; content: string } {
  if (notification.notificationType === 'REVIEW_REPORTED') {
    return getReviewReportedText(notification);
  }

  return {
    title: translateNotificationText(notification.title),
    content: translateNotificationText(notification.content),
  };
}

function getNotificationLink(notification: NotificationSummaryResponse): string | null {
  switch (notification.notificationType) {
    case 'NOTICE':
      return notification.relatedNoticeId ? `/announcement?noticeId=${notification.relatedNoticeId}` : '/announcement';
    case 'VERIFICATION_APPROVED':
    case 'VERIFICATION_REJECTED':
      return '/mypage?tab=certify';
    case 'REVIEW_REPORTED':
      return notification.relatedReviewId
        ? `/mypage?tab=reports&reviewId=${notification.relatedReviewId}`
        : '/mypage?tab=reports';
    case 'PROPOSAL_RECEIVED':
      // 프리랜서가 받은 제안 목록으로 이동
      return '/project';
    case 'PROPOSAL_ACCEPTED':
      // 프로젝트 오너에게 특정 프로젝트로 이동
      return notification.relatedProjectId ? `/project?projectId=${notification.relatedProjectId}` : '/project';
    case 'PROJECT_STATUS_CHANGED':
    case 'REVIEW_REQUEST':
      return notification.relatedProjectId ? `/project?projectId=${notification.relatedProjectId}` : '/project';
    default:
      return null;
  }
}

function isNoticeVisibleToRole(notification: NotificationSummaryResponse, userRole: string | undefined): boolean {
  if (notification.notificationType !== 'NOTICE') return true;
  const text = `${notification.title} ${notification.content}`;
  const hasFR = text.includes('[FR]');
  const hasUSR = text.includes('[USR]');
  if (!hasFR && !hasUSR) return true;
  if (hasFR) return userRole === 'ROLE_FREELANCER';
  return userRole === 'ROLE_USER';
}


function getNotificationMeta(notification: NotificationSummaryResponse): string {
  if (!notification.isRead) {
    return '읽지 않음';
  }

  const link = getNotificationLink(notification);
  return link ? '관련 화면으로 이동' : '읽음';
}

export default function AppHeader({ activePage }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [notifications, setNotifications] = useState<NotificationSummaryResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  async function refreshNotifications(nextUser: User | null): Promise<void> {
    if (!nextUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getNotifications({ page: 0, size: 20 });
      const visible = response.content.filter((n) => isNoticeVisibleToRole(n, effectiveNoticeRole(nextUser)));
      setNotifications(visible);
      setUnreadCount(response.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    const syncHeaderState = () => {
      const nextUser = getUser();
      setUser(nextUser);
      setThemeState(getTheme());
      void refreshNotifications(nextUser);
    };

    syncHeaderState();
    window.addEventListener(THEME_EVENT, syncHeaderState as EventListener);
    window.addEventListener(AUTH_USER_EVENT, syncHeaderState as EventListener);
    window.addEventListener('focus', syncHeaderState);

    return () => {
      window.removeEventListener(THEME_EVENT, syncHeaderState as EventListener);
      window.removeEventListener(AUTH_USER_EVENT, syncHeaderState as EventListener);
      window.removeEventListener('focus', syncHeaderState);
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

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function handleNotificationToggle() {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);
    setDropdownOpen(false);
    if (nextOpen) {
      void refreshNotifications(user);
    }
  }

  function handleProfileToggle() {
    setDropdownOpen((open) => !open);
    setNotificationOpen(false);
  }

  async function handleNotificationSelect(notification: NotificationSummaryResponse) {
    if (!notification.isRead) {
      await markNotificationRead(notification.notificationId);
      await refreshNotifications(user);
    }

    setNotificationOpen(false);
    const link = getNotificationLink(notification);
    if (link) {
      const nextUrl = new URL(link, window.location.origin);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.pathname === currentUrl.pathname) {
        window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.assign(link);
      }
    }
  }

  async function handleMarkAllAsRead() {
    if (!user) {
      return;
    }

    await markAllNotificationsRead();
    await refreshNotifications(user);
  }

  async function handleDeleteNotification(notificationId: number) {
    await deleteNotification(notificationId);
    await refreshNotifications(user);
  }

  return (
    <>
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
          <li><a href="/announcement" className={activePage === 'announcement' ? 'active' : ''}>ANNOUNCEMENT</a></li>
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
                  <p className="header-panel-empty">표시할 알림이 없습니다.</p>
                ) : (
                  <div className="header-notification-list">
                    {notifications.map((notification) => (
                      <div key={notification.notificationId} className="header-notification-row">
                        <button
                          type="button"
                          className={`header-notification-item${notification.isRead ? '' : ' unread'}`}
                          onClick={() => void handleNotificationSelect(notification)}
                        >
                          <div className="header-notification-top">
                            <strong>{getNotificationDisplayText(notification).title}</strong>
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                          </div>
                          <p className="header-notification-message">{getNotificationDisplayText(notification).content}</p>
                          <span className="header-notification-meta">{getNotificationMeta(notification)}</span>
                        </button>
                        <button
                          type="button"
                          className="header-notification-delete"
                          aria-label="알림 삭제"
                          onClick={() => void handleDeleteNotification(notification.notificationId)}
                        >×</button>
                      </div>
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
                    <a href="/announcement" className="header-dropdown-item">공지 관리</a>
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
    <ChatWidget />
    </>
  );
}
