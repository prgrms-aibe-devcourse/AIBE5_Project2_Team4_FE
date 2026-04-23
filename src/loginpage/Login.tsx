import { useEffect, useState } from 'react';
import './login.css';
import { startKakaoAuthorization } from '../auth/kakaoOAuth';
import { forgotPassword, login } from '../store/appAuth';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';
import { ApiError } from '../api/types';

function getErrorMessage(error: unknown, fallback = '로그인에 실패했습니다.'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getFindPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 404 || error.code.includes('NOT_FOUND'))) {
    return '존재하지 않는 이메일입니다.';
  }

  return getErrorMessage(error, '비밀번호 재설정 안내 발송에 실패했습니다.');
}

export default function Login() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'login' | 'findPassword'>('login');
  const [findEmail, setFindEmail] = useState('');
  const [findMessage, setFindMessage] = useState('');
  const [findMessageType, setFindMessageType] = useState<'error' | 'success'>('error');
  const [findSubmitting, setFindSubmitting] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setThemeState(getTheme());
    };

    syncTheme();
    window.addEventListener(THEME_EVENT, syncTheme as EventListener);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme as EventListener);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      window.location.href = '/';
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleKakaoLogin() {
    setError('');

    void startKakaoAuthorization().catch((caughtError) => {
      setError(getErrorMessage(caughtError));
    });
  }

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  async function handleFindPassword(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = findEmail.trim();
    if (!normalizedEmail) {
      setFindMessageType('error');
      setFindMessage('이메일을 입력해 주세요.');
      return;
    }

    setFindMessage('');
    setFindSubmitting(true);

    try {
      await forgotPassword(normalizedEmail);
      setFindMessageType('success');
      setFindMessage('입력한 이메일로 비밀번호 재설정 안내를 보냈습니다. 메일함을 확인해 주세요.');
    } catch (caughtError) {
      setFindMessageType('error');
      setFindMessage(getFindPasswordErrorMessage(caughtError));
    } finally {
      setFindSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className="login-theme-toggle"
        onClick={handleThemeToggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <div className="login-card">
        {view === 'login' ? (
          <>
            <div className="login-header">
              <h1>로그인</h1>
              <p>서비스를 이용하려면 로그인하세요</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  required
                />
              </div>

              <div className="input-group">
                <div className="login-pw-label-row">
                  <label htmlFor="password">비밀번호</label>
                  <button
                    type="button"
                    className="find-pw-link"
                    onClick={() => {
                      setView('findPassword');
                      setFindMessage('');
                      setFindMessageType('error');
                      setFindEmail('');
                    }}
                  >
                    비밀번호 찾기
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  required
                />
              </div>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-btn" disabled={submitting}>
                {submitting ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="login-divider">
              <span>또는</span>
            </div>

            <button
              type="button"
              className="kakao-login-btn"
              onClick={handleKakaoLogin}
            >
              <svg className="kakao-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.636 5.076 4.1 6.544L5.1 21l4.476-2.97A11.1 11.1 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"
                  fill="currentColor"
                />
              </svg>
              카카오로 로그인
            </button>

            <div className="login-footer">
              <span>계정이 없으신가요?</span>
              <a href="/register">회원가입</a>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>비밀번호 찾기</h1>
              <p>가입한 이메일을 입력하면 재설정 안내를 확인할 수 있습니다</p>
            </div>

            <form className="login-form" onSubmit={handleFindPassword}>
              <div className="input-group">
                <label htmlFor="find-email">이메일</label>
                <input
                  id="find-email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={findEmail}
                  onChange={(event) => {
                    setFindEmail(event.target.value);
                    setFindMessage('');
                    setFindMessageType('error');
                  }}
                  required
                  autoFocus
                />
              </div>

              {findMessage && (
                <p className={findMessageType === 'success' ? 'login-success' : 'login-error'}>
                  {findMessage}
                </p>
              )}

              <button type="submit" className="login-btn" disabled={findSubmitting}>
                {findSubmitting ? '발송 중...' : '이메일 발송'}
              </button>
            </form>

            <button
              type="button"
              className="find-pw-back"
              onClick={() => {
                setView('login');
                setFindMessage('');
                setFindMessageType('error');
                setFindEmail('');
              }}
            >
              ← 로그인으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
