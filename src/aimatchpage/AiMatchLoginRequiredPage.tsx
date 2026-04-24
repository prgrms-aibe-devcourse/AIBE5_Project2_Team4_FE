import { useEffect } from 'react';
import './aiMatchLoginRequired.css';
import AppHeader from '../components/AppHeader';
import { getUser } from '../store/appAuth';

function LockIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 10V7.75a4.5 4.5 0 0 1 9 0V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 13.5v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AiMatchLoginRequiredPage() {
  useEffect(() => {
    if (getUser()) {
      window.location.replace('/ai-match');
    }
  }, []);

  return (
    <div className="amlr-page">
      <AppHeader activePage="freelancers" />

      <main className="amlr-content">
        <section className="amlr-panel" aria-labelledby="amlr-title">
          <div className="amlr-icon">
            <LockIcon />
          </div>
          <p className="amlr-eyebrow">AI Match</p>
          <h1 id="amlr-title" className="amlr-title">로그인이 필요합니다</h1>
          <p className="amlr-text">
            AI 매칭은 로그인한 사용자만 이용할 수 있어요.
            로그인 후 다시 들어오면 조건에 맞는 메이트 추천을 바로 확인할 수 있습니다.
          </p>

          <div className="amlr-actions">
            <a href="/login" className="amlr-btn amlr-btn--primary">로그인하러 가기</a>
            <a href="/" className="amlr-btn amlr-btn--secondary">메인으로</a>
          </div>
        </section>
      </main>
    </div>
  );
}
