<script lang="ts">
  import { onMount } from 'svelte';
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
    sendAnnouncement,
  } from '../store/notificationStore';

  export let activePage: string = '';

  let user: User | null = null;
  let theme: AppTheme = 'dark';
  let notifications: AppNotification[] = [];
  let dropdownOpen = false;
  let notificationOpen = false;
  let announcementOpen = false;
  let announcementTitle = '';
  let announcementMessage = '';
  let announcementFeedback = '';

  $: unreadCount = notifications.filter((notification) => !notification.read).length;

  function syncHeaderState() {
    user = getUser();
    theme = getTheme();
    notifications = getNotificationsForUser(user?.email);
  }

  onMount(() => {
    syncHeaderState();

    const handleChange = () => {
      syncHeaderState();
    };

    window.addEventListener(NOTIFICATION_EVENT, handleChange as EventListener);
    window.addEventListener(THEME_EVENT, handleChange as EventListener);
    window.addEventListener(AUTH_USER_EVENT, handleChange as EventListener);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleChange as EventListener);
      window.removeEventListener(THEME_EVENT, handleChange as EventListener);
      window.removeEventListener(AUTH_USER_EVENT, handleChange as EventListener);
      window.removeEventListener('storage', handleChange);
    };
  });

  function closePanels() {
    dropdownOpen = false;
    notificationOpen = false;
    announcementOpen = false;
  }

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    notificationOpen = false;
    announcementOpen = false;
  }

  function toggleNotifications() {
    notificationOpen = !notificationOpen;
    dropdownOpen = false;
    announcementOpen = false;
  }

  function openAnnouncementPanel() {
    announcementOpen = true;
    dropdownOpen = false;
    notificationOpen = false;
    announcementFeedback = '';
  }

  function handleNotificationSelect(notification: AppNotification) {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    notificationOpen = false;
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

  function handleAnnouncementSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!canSendAnnouncement(user)) {
      return;
    }

    const title = announcementTitle.trim();
    const message = announcementMessage.trim();
    if (!title || !message) {
      return;
    }

    const sentCount = sendAnnouncement(user.name, title, message, user.email);
    announcementTitle = '';
    announcementMessage = '';
    announcementFeedback = sentCount > 0 ? `${sentCount}명에게 공지를 발송했습니다.` : '발송 대상이 없습니다.';
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
      <li><a href="/#home" class={activePage === 'home' ? 'active' : ''}>HOME</a></li>
      <li><a href="/#services" class={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
      <li><a href="/#about" class={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
      <li><a href="/#contact" class={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
      <li><a href="/freelancers" class={activePage === 'freelancers' ? 'active' : ''}>HELPERS</a></li>
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
              <p class="header-panel-empty">도착한 알림이 없습니다.</p>
            {:else}
              <div class="header-notification-list">
                {#each notifications as notification (notification.id)}
                  <button
                    type="button"
                    class={`header-notification-item${notification.read ? '' : ' unread'}`}
                    onclick={() => handleNotificationSelect(notification)}
                  >
                    <div class="header-notification-top">
                      <strong>{notification.title}</strong>
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                    </div>
                    <p class="header-notification-message">{notification.message}</p>
                    <span class="header-notification-meta">
                      {#if notification.link}
                        관련 화면으로 이동
                      {:else if notification.read}
                        읽음
                      {:else}
                        읽지 않음
                      {/if}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if announcementOpen && canSendAnnouncement(user)}
          <div class="header-panel header-announcement-panel">
            <div class="header-panel-head">
              <div>
                <p class="header-panel-eyebrow">System Notice</p>
                <h3>공지 발송</h3>
              </div>
              <button type="button" class="header-panel-action" onclick={closePanels}>닫기</button>
            </div>

            <form class="header-announcement-form" onsubmit={handleAnnouncementSubmit}>
              <input
                type="text"
                class="header-announcement-input"
                placeholder="공지 제목"
                bind:value={announcementTitle}
              />
              <textarea
                class="header-announcement-textarea"
                placeholder="공지 내용을 입력하세요."
                rows="4"
                bind:value={announcementMessage}
              ></textarea>
              <div class="header-announcement-footer">
                <p class="header-announcement-feedback">{announcementFeedback}</p>
                <button type="submit" class="header-announcement-submit">발송</button>
              </div>
            </form>
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
              <a href="/project" class="header-dropdown-item">프로젝트</a>
              {#if canSendAnnouncement(user)}
                <button type="button" class="header-dropdown-item" onclick={openAnnouncementPanel}>공지 발송</button>
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
