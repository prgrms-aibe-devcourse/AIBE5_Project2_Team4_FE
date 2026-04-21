import { useEffect, useState } from 'react';
import './register.css';
import { signup } from '../store/appAuth';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '회원가입에 실패했습니다.';
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.startsWith('02')) {
    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}-${digits.slice(2, -4)}-${digits.slice(-4)}`;
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const syncTheme = () => setThemeState(getTheme());
    syncTheme();
    window.addEventListener(THEME_EVENT, syncTheme as EventListener);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme as EventListener);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    const trimmedPhone = phone.trim();
    const phoneDigits = trimmedPhone.replace(/\D/g, '');

    if (!trimmedPhone) {
      setError('전화번호를 입력해 주세요.');
      return;
    }

    if (!/^0\d{8,10}$/.test(phoneDigits)) {
      setError('전화번호 형식을 확인해 주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: trimmedPhone,
        password,
      });
      setSuccess(true);
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <button
        type="button"
        className="register-theme-toggle"
        onClick={handleThemeToggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="register-card">
        <div className="register-header">
          <h1>회원가입</h1>
          <p>이음 서비스에 오신 것을 환영합니다</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="reg-name">이름</label>
            <input
              id="reg-name"
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">이메일</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-phone">전화번호</label>
            <input
              id="reg-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(event) => {
                setPhone(formatPhone(event.target.value));
                setError('');
              }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">비밀번호</label>
            <input
              id="reg-password"
              type="password"
              placeholder="6자 이상 입력하세요"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password-confirm">비밀번호 확인</label>
            <input
              id="reg-password-confirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={passwordConfirm}
              onChange={(event) => {
                setPasswordConfirm(event.target.value);
                setError('');
              }}
              required
            />
          </div>

          {error && <p className="register-error">{error}</p>}
          {success && <p className="register-success">회원가입 완료! 로그인 페이지로 이동합니다...</p>}

          <button type="submit" className="register-btn" disabled={success || submitting}>
            {submitting ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="register-footer">
          <span>이미 계정이 있으신가요?</span>
          <a href="/login">로그인</a>
        </div>
      </div>
    </div>
  );
}
