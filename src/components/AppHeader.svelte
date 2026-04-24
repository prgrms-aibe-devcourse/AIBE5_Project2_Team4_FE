<script lang="ts">
  import { onMount } from 'svelte';
  import './appHeader.css';
  import { AUTH_USER_EVENT, getUser, logout, type User } from '../store/appAuth';
  import { canSendAnnouncement, effectiveNoticeRole } from '../store/accessControl';
  import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';
  import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationSummaryResponse,
  } from '../api/notifications';

  export let activePage: string = '';

  let user: User | null = null;
  let theme: AppTheme = 'dark';
  let notifications: NotificationSummaryResponse[] = [];
  let unreadCount = 0;
  let dropdownOpen = false;
  let notificationOpen = false;

  function formatNotificationTime(createdAt: string) {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(createdAt));
  }

  function getNotificationLink(notification: NotificationSummaryResponse): string | null {
    switch (notification.notificationType) {
      case 'NOTICE':
        return notification.relatedNoticeId ? `/announcement?noticeId=${notification.relatedNoticeId}` : '/announcement';
      case 'VERIFICATION_APPROVED':
      case 'VERIFICATION_REJECTED':
        return '/mypage?tab=certify';
      case 'PROPOSAL_RECEIVED':
      case 'PROPOSAL_ACCEPTED':
        return notification.relatedProjectId ? `/project?projectId=${notification.relatedProjectId}` : '/project';
      case 'PROJECT_STATUS_CHANGED':
      case 'REVIEW_REQUEST':
        return notification.relatedProjectId ? `/project?projectId=${notification.relatedProjectId}` : '/project';
      default:
        return null;
    }
  }

  function isNoticeVisibleToRole(notification: NotificationSummaryResponse): boolean {
    if (notification.notificationType !== 'NOTICE') return true;
    const text = `${notification.title} ${notification.content}`;
    const hasFR = text.includes('[FR]');
    const hasUSR = text.includes('[USR]');
    if (!hasFR && !hasUSR) return true;
    const role = effectiveNoticeRole(user);
    if (hasFR) return role === 'ROLE_FREELANCER';
    return role === 'ROLE_USER';
  }

  function getNotificationMeta(notification: NotificationSummaryResponse): string {
    if (!notification.isRead) {
      return '읽지 않음';
    }

    return getNotificationLink(notification) ? '관련 화면으로 이동' : '읽음';
  }

  async function refreshNotifications(nextUser: User | null) {
    if (!nextUser) {
      notifications = [];
      unreadCount = 0;
      return;
    }

    try {
      const response = await getNotifications({ page: 0, size: 20 });
      notifications = response.content.filter(isNoticeVisibleToRole);
      unreadCount = notifications.filter((n) => !n.isRead).length;
    } catch {
      notifications = [];
      unreadCount = 0;
    }
  }

  async function syncHeaderState() {
    user = getUser();
    theme = getTheme();
    await refreshNotifications(user);
  }

  onMount(() => {
    void syncHeaderState();

    const handleChange = () => {
      void syncHeaderState();
    };

    const handleFocus = () => {
      void syncHeaderState();
    };

    window.addEventListener(THEME_EVENT, handleChange as EventListener);
    window.addEventListener(AUTH_USER_EVENT, handleChange as EventListener);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(THEME_EVENT, handleChange as EventListener);
      window.removeEventListener(AUTH_USER_EVENT, handleChange as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  });

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function closePanels() {
    dropdownOpen = false;
    notificationOpen = false;
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    notificationOpen = false;
  }

  async function toggleNotifications() {
    notificationOpen = !notificationOpen;
    dropdownOpen = false;
    if (notificationOpen) {
      await refreshNotifications(user);
    }
  }

  async function handleNotificationSelect(notification: NotificationSummaryResponse) {
    if (!notification.isRead) {
      await markNotificationRead(notification.notificationId);
      await refreshNotifications(user);
    }

    notificationOpen = false;
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

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-actions')) {
      closePanels();
    }
  }

  function handleThemeToggle() {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    theme = nextTheme;
  }
</script>

<svelte:window onclick={handleClickOutside} />

<nav class="header">
  <div class="header-container">
    <a href="/" class="header-logo-wrap">
      <img src="/logo.png" alt="logo" class="header-logo" />
      <span class="header-logo-text">이음</span>
    </a>
    <ul class="header-menu">
      <li><a href="/" class={activePage === 'home' ? 'active' : ''}>HOME</a></li>
      <li><a href="/#services" class={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
      <li><a href="/#about" class={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
      <li><a href="/#contact" class={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
      <li><a href="/freelancers" class={activePage === 'freelancers' ? 'active' : ''}>MATES</a></li>
      <li><a href="/announcement" class={activePage === 'announcement' ? 'active' : ''}>ANNOUNCEMENT</a></li>
    </ul>

    {#if user}
      <div class="header-actions">
        <button
          type="button"
          class="header-theme-btn"
          onclick={handleThemeToggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          type="button"
          class={`header-notification-btn${notificationOpen ? ' active' : ''}`}
          onclick={toggleNotifications}
          aria-label="알림 열기"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v2.13c0 .84-.24 1.66-.7 2.37L5.47 14.8A1.5 1.5 0 0 0 6.74 17h10.52a1.5 1.5 0 0 0 1.27-2.2l-1.33-2.05a4.4 4.4 0 0 1-.7-2.37V8.25a4.5 4.5 0 0 0-4.5-4.5Zm0 17.25a2.25 2.25 0 0 1-2.12-1.5h4.24A2.25 2.25 0 0 1 12 21Z"
              fill="currentColor"
            />
          </svg>
          {#if unreadCount > 0}
            <span class="header-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          {/if}
        </button>

        {#if notificationOpen}
          <div class="header-panel header-notification-panel">
            <div class="header-panel-head">
              <div>
                <p class="header-panel-eyebrow">Notification Center</p>
                <h3>알림</h3>
              </div>
              <button type="button" class="header-panel-action" onclick={handleMarkAllAsRead}>모두 읽음</button>
            </div>

            {#if notifications.length === 0}
              <p class="header-panel-empty">표시할 알림이 없습니다.</p>
            {:else}
              <div class="header-notification-list">
                {#each notifications as notification (notification.notificationId)}
                  <button
                    type="button"
                    class={`header-notification-item${notification.isRead ? '' : ' unread'}`}
                    onclick={() => handleNotificationSelect(notification)}
                  >
                    <div class="header-notification-top">
                      <strong>{notification.title}</strong>
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                    </div>
                    <p class="header-notification-message">{notification.content}</p>
                    <span class="header-notification-meta">{getNotificationMeta(notification)}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <div class="header-user-area">
          <button type="button" class="header-profile" onclick={toggleDropdown}>
            <span class="header-username">{user.name}</span>
            {#if user.avatar}
              <img src={user.avatar} alt="profile" class="header-avatar-img" />
            {:else}
              <div class="header-avatar">{user.name[0]}</div>
            {/if}
          </button>
          {#if dropdownOpen}
            <div class="header-dropdown">
              <a href="/mypage" class="header-dropdown-item">마이페이지</a>
              {#if user.role !== 'ROLE_ADMIN'}
                <a href="/project" class="header-dropdown-item">프로젝트</a>
              {/if}
              {#if canSendAnnouncement(user)}
                <a href="/announcement" class="header-dropdown-item">공지 관리</a>
              {/if}
              <button type="button" class="header-dropdown-item danger" onclick={handleLogout}>로그아웃</button>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="header-actions">
        <button
          type="button"
          class="header-theme-btn"
          onclick={handleThemeToggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <a href="/login"><button type="button" class="header-login-btn">LOGIN</button></a>
      </div>
    {/if}
  </div>
</nav>
