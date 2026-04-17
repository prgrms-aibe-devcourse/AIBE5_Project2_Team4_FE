<script lang="ts">
  import { onMount } from 'svelte';
  import './main.css';
  import AppHeader from '../components/AppHeader.svelte';

  let video: HTMLVideoElement;
  let rafId: number;

  function handleMouseMove(e: MouseEvent) {
    if (!video?.duration) return;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      video.currentTime = (e.clientX / window.innerWidth) * video.duration;
    });
  }

  onMount(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  });
</script>

<svelte:window onmousemove={handleMouseMove} />

<div class="main-page">
  <AppHeader activePage="home" />

  <section class="hero-section" id="home">
    <div class="hero-content">
      <div class="text-container">
        <h1 class="greeting">Hej !</h1>
        <p class="description">
          좋은 서비스로 즐겁고 편합니다. 여러가지 서비스를 서비스 것 보실 걸 합니다.
          이 여러 치매 주문을 사용해 드릴 관심이 있습니다. 이 여러 치매 주문을 사용해 주시겠어요?
        </p>
        <div class="button-group">
          <button class="btn-primary">시작하기</button>
          <button class="btn-secondary">자세히 보기</button>
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
      <p class="section-subtitle">Stella와 함께할 수 있는 것들</p>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">✦</div>
          <h3>AI 매칭</h3>
          <p>Stella가 제안에 알맞는 동행자를 매칭해줍니다.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">◈</div>
          <h3>제안 등록</h3>
          <p>동행이 필요한 서비스를 등록해보세요.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">⬡</div>
          <h3>헬퍼 검증</h3>
          <p>헬퍼의 프로필을 열람하여 자신의 제안에 알맞는 동행자를 선택하세요.</p>
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
            Stella는 당신의 일상에 자연스럽게 녹아드는 AI 동반자입니다.
            단순한 도구가 아닌, 함께 성장하고 소통하는 존재로 설계되었습니다.
          </p>
          <ul class="about-list">
            <li>24시간 언제든 함께하는 AI</li>
            <li>사용할수록 나를 더 잘 아는 개인화</li>
            <li>안전하고 신뢰할 수 있는 데이터 보호</li>
          </ul>
        </div>
        <div class="about-stats">
          <div class="stat-item">
            <span class="stat-number">10K+</span>
            <span class="stat-label">활성 사용자</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">98%</span>
            <span class="stat-label">만족도</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">서비스 운영</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">5ms</span>
            <span class="stat-label">평균 응답속도</span>
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
            <span class="contact-value">hello@stella.ai</span>
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
        <form class="contact-form">
          <input type="text" placeholder="이름" class="form-input" />
          <input type="email" placeholder="이메일" class="form-input" />
          <textarea placeholder="문의 내용을 입력해주세요" class="form-textarea" rows="4"></textarea>
          <button type="submit" class="btn-primary">보내기</button>
        </form>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="section-container">
      <p class="footer-text">© 2025 Stella. All rights reserved.</p>
    </div>
  </footer>
</div>
