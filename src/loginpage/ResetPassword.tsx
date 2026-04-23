import { useEffect, useState } from 'react';
import './login.css';
import { resetPassword } from '../api/auth';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '비밀번호 재설정에 실패했습니다.';
}

export default function ResetPassword() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const resetToken = new URLSearchParams(window.location.search).get('token')?.trim() ?? '';

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

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken) {
      setError('비밀번호 재설정 토큰이 없습니다. 이메일의 링크로 다시 접속해 주세요.');
      return;
    }

    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword.length > 72) {
      setError('새 비밀번호는 72자 이하로 입력해 주세요.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({ resetToken, newPassword });
      setSuccess('비밀번호가 재설정되었습니다. 로그인 페이지로 이동합니다.');
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
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
        <div className="login-header">
          <h1>비밀번호 재설정</h1>
          <p>새 비밀번호를 입력해 주세요</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="new-password">새 비밀번호</label>
            <input
              id="new-password"
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError('');
                setSuccess('');
              }}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="new-password-confirm">새 비밀번호 입력 확인</label>
            <input
              id="new-password-confirm"
              type="password"
              placeholder="새 비밀번호를 다시 입력하세요"
              value={newPasswordConfirm}
              onChange={(event) => {
                setNewPasswordConfirm(event.target.value);
                setError('');
                setSuccess('');
              }}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button type="submit" className="login-btn" disabled={submitting || !!success}>
            {submitting ? '재설정 중...' : '비밀번호 재설정'}
          </button>
        </form>

        <button
          type="button"
          className="find-pw-back"
          onClick={() => {
            window.location.href = '/login';
          }}
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
