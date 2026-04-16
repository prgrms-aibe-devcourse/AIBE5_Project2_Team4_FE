<script lang="ts">
  import { onMount } from 'svelte';
  import './header.css';
  import { getUser, logout, type User } from '../store/auth';

  export let activePage: string = '';

  let user: User | null = null;
  let dropdownOpen = false;

  onMount(() => {
    user = getUser();
  });

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.header-user-area')) {
      dropdownOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<nav class="header">
  <div class="header-container">
    <a href="/"><img src="/logo.png" alt="logo" class="header-logo" /></a>
    <ul class="header-menu">
      <li><a href="/#home" class={activePage === 'home' ? 'active' : ''}>HOME</a></li>
      <li><a href="/#services" class={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
      <li><a href="/#about" class={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
      <li><a href="/#contact" class={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
      <li><a href="/freelancers" class={activePage === 'freelancers' ? 'active' : ''}>HELPERS</a></li>
    </ul>

    {#if user}
      <div class="header-user-area">
        <button class="header-profile" onclick={toggleDropdown}>
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
            <a href="/project" class="header-dropdown-item">내 프로젝트</a>
            <button class="header-dropdown-item danger" onclick={handleLogout}>로그아웃</button>
          </div>
        {/if}
      </div>
    {:else}
      <a href="/login"><button class="header-login-btn">LOGIN</button></a>
    {/if}
  </div>
</nav>
