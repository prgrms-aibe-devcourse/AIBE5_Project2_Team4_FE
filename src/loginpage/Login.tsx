import { useEffect, useState } from 'react';
import './login.css';
import { DEMO_ACCOUNTS, findAccount, findAccountByEmail, setUser, type DemoAccount } from '../store/appAuth';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';

export default function Login() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 비밀번호 찾기
  const [view, setView] = useState<'login' | 'findPassword'>('login');
  const [findEmail, setFindEmail] = useState('');
  const [findResult, setFindResult] = useState<{ found: boolean } | null>(null);

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

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');

    // TODO: POST /api/auth/login { email, password }
    //       → response: { name, email, role, avatar? }
    const matched = findAccount(email, password);

    if (!matched) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    const { password: _password, ...user } = matched;
    void _password;
    setUser(user);
    window.location.href = '/';
  };

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  const handleFindPassword = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const account = findAccountByEmail(findEmail.trim());
    setFindResult({ found: !!account });
  };

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
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>

              <div className="input-group">
                <div className="login-pw-label-row">
                  <label htmlFor="password">비밀번호</label>
                  <button
                    type="button"
                    className="find-pw-link"
                    onClick={() => { setView('findPassword'); setFindResult(null); setFindEmail(''); }}
                  >
                    비밀번호 찾기
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                />
              </div>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-btn">로그인</button>
            </form>

            <div className="login-divider">
              <span>또는</span>
            </div>

            <button type="button" className="kakao-login-btn" onClick={() => alert('카카오 로그인은 준비 중입니다.')}>
              <svg className="kakao-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.636 5.076 4.1 6.544L5.1 21l4.476-2.97A11.1 11.1 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="currentColor"/>
              </svg>
              카카오로 로그인
            </button>

            <div className="login-footer">
              <span>계정이 없으신가요?</span>
              <a href="/register">회원가입</a>
            </div>

            <div className="login-test-hint">
              <p>테스트 계정 (클릭하면 자동 입력)</p>
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.role}
                  type="button"
                  className="test-account-btn"
                  onClick={() => fillAccount(account)}
                >
                  <span className={`test-role-badge test-role-badge--${account.role.toLowerCase().replace('role_', '')}`}>
                    {account.role}
                  </span>
                  <span className="test-account-info">
                    <span>{account.email}</span>
                    <span>{account.password}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>비밀번호 찾기</h1>
              <p>가입한 이메일을 입력하면 재설정 링크를 보내드립니다</p>
            </div>

            {!findResult ? (
              <form className="login-form" onSubmit={handleFindPassword}>
                <div className="input-group">
                  <label htmlFor="find-email">가입 이메일</label>
                  <input
                    id="find-email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={findEmail}
                    onChange={e => setFindEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="login-btn">재설정 링크 보내기</button>
              </form>
            ) : findResult.found ? (
              <div className="find-pw-result">
                <div className="find-pw-success-icon">✓</div>
                <p className="find-pw-result-title">이메일을 확인하세요</p>
                <p className="find-pw-result-desc">
                  <strong>{findEmail}</strong>으로<br />비밀번호 재설정 링크를 보냈습니다.
                </p>
              </div>
            ) : (
              <div className="find-pw-result">
                <div className="find-pw-fail-icon">✕</div>
                <p className="find-pw-result-title">계정을 찾을 수 없습니다</p>
                <p className="find-pw-result-desc">입력한 이메일로 가입된 계정이 없습니다.</p>
                <button
                  type="button"
                  className="login-btn"
                  onClick={() => { setFindResult(null); setFindEmail(''); }}
                >
                  다시 시도
                </button>
              </div>
            )}

            <button
              type="button"
              className="find-pw-back"
              onClick={() => { setView('login'); setFindResult(null); setFindEmail(''); }}
            >
              ← 로그인으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
