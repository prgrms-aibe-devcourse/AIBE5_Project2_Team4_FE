<script lang="ts">
  import { onMount } from 'svelte';
  import './main.css';
  import AppHeader from '../components/AppHeader.svelte';

  let video: HTMLVideoElement;
  let rafId: number;
  let contactSubmitted = false;
  let contactError = '';

  function handleMouseMove(e: MouseEvent) {
    if (!video?.duration) return;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      video.currentTime = (e.clientX / window.innerWidth) * video.duration;
    });
  }

  function handleContactSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim();
    if (!name || !email || !message) {
      contactError = '이름, 이메일, 문의 내용을 모두 입력해 주세요.';
      contactSubmitted = false;
      return;
    }

    contactError = '';
    const subject = encodeURIComponent(`[이음 문의] ${name}`);
    const body = encodeURIComponent([
      `이름: ${name}`,
      `이메일: ${email}`,
      '',
      message,
    ].join('\n'));

    window.location.href = `mailto:hello@ieum.kr?subject=${subject}&body=${body}`;
    contactSubmitted = true;
    form.reset();
  }

  onMount(async () => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    const chatRoot = document.createElement('div');
    document.body.appendChild(chatRoot);
    const { createRoot, createElement } = await Promise.all([
      import('react-dom/client').then((m) => m.createRoot),
      import('react').then((m) => m.createElement),
    ]).then(([cr, ce]) => ({ createRoot: cr, createElement: ce }));
    const { default: ChatWidget } = await import('../components/ChatWidget');
    createRoot(chatRoot).render(createElement(ChatWidget));
  });
</script>

<svelte:window onmousemove={handleMouseMove} />

<div class="main-page">
  <AppHeader activePage="home" />

  <section class="hero-section" id="home">
    <div class="hero-content">
      <div class="text-container">
        <h1 class="greeting">믿을 수 있는 연결, 이음</h1>
        <p class="description">
          이음은 생활 지원이 필요한 분과 믿을 수 있는 메이트를 연결하는 매칭 플랫폼입니다.
          프로젝트를 등록하고, 검증된 메이트를 직접 탐색해 제안해보세요.
        </p>
        <div class="button-group">
          <button class="btn-primary" onclick={() => window.location.href = '/ai-match'}>AI 추천</button>
          <button class="btn-secondary" onclick={() => window.location.href = '/project'}>프로젝트 등록하기</button>
          <button class="btn-secondary" onclick={() => window.location.href = '/freelancers'}>메이트 둘러보기</button>
        </div>
      </div>
    </div>

    <div class="character-container">
      <div class="character-placeholder">
        <video bind:this={video} muted preload="auto" playsinline class="character-video">
          <source src="/stella-main.webm" type="video/webm" />
        </video>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section class="services-section" id="services">
    <div class="section-container">
      <h2 class="section-title">SERVICES</h2>
      <p class="section-subtitle">이음과 함께할 수 있는 것들</p>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">✦</div>
          <h3>프로젝트 등록</h3>
          <p>필요한 생활 지원 내용을 간편하게 등록하고 원하는 메이트에게 제안해보세요.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">◈</div>
          <h3>메이트 탐색 · 제안</h3>
          <p>메이트의 프로필과 경력을 직접 확인하고, 나에게 맞는 동행자를 선택하세요.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">⬡</div>
          <h3>검증 · 리뷰 체계</h3>
          <p>메이트 검증과 완료 후 리뷰 시스템으로 믿을 수 있는 매칭 환경을 제공합니다.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section class="about-section" id="about">
    <div class="section-container">
      <div class="about-grid">
        <div class="about-text">
          <h2 class="section-title">ABOUT</h2>
          <p class="about-description">
            이음은 생활 지원을 단순 심부름이 아닌 신뢰 기반의 재능 거래로 연결합니다.
            등록부터 매칭, 완료, 리뷰까지 하나의 흐름으로 이어지는 플랫폼입니다.
          </p>
          <ul class="about-list">
            <li>사용자가 직접 메이트를 탐색하고 제안하는 주도형 매칭</li>
            <li>검증 시스템으로 신뢰할 수 있는 메이트 선택</li>
            <li>프로젝트 상태 관리와 리뷰로 투명한 서비스 운영</li>
          </ul>
        </div>
        <div class="about-stats">
          <div class="stat-item">
            <span class="stat-number">5단계</span>
            <span class="stat-label">체계적인 프로젝트 흐름</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">메이트 신원 검증</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">실시간</span>
            <span class="stat-label">프로젝트 상태 관리</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">역할</span>
            <span class="stat-label">사용자 · 메이트 · 관리자</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="contact-section" id="contact">
    <div class="section-container">
      <h2 class="section-title">CONTACT</h2>
      <p class="section-subtitle">궁금한 점이 있으신가요?</p>
      <div class="contact-grid">
        <div class="contact-info">
          <div class="contact-item">
            <span class="contact-label">이메일</span>
            <span class="contact-value">hello@ieum.kr</span>
          </div>
          <div class="contact-item">
            <span class="contact-label">운영시간</span>
            <span class="contact-value">평일 09:00 – 18:00</span>
          </div>
          <div class="contact-item">
            <span class="contact-label">응답시간</span>
            <span class="contact-value">영업일 기준 24시간 내</span>
          </div>
        </div>
        <form class="contact-form" onsubmit={handleContactSubmit}>
          <input type="text" name="name" placeholder="이름" class="form-input" />
          <input type="email" name="email" placeholder="이메일" class="form-input" />
          <textarea name="message" placeholder="문의 내용을 입력해주세요" class="form-textarea" rows="4"></textarea>
          {#if contactError}
            <p class="contact-error">{contactError}</p>
          {/if}
          {#if contactSubmitted}
            <p class="contact-success">메일 작성창을 열었습니다. 보내기만 누르면 문의가 전달됩니다.</p>
          {/if}
          <button type="submit" class="btn-primary">보내기</button>
        </form>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="section-container">
      <p class="footer-text">© 2026 이음. All rights reserved.</p>
    </div>
  </footer>
</div>
