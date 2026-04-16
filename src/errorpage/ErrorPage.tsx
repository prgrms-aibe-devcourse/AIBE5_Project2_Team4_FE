import './error.css';
import { useEffect, useState } from 'react';
import { getTheme, setTheme, THEME_EVENT, type AppTheme } from '../store/theme';

interface ErrorAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ErrorConfig {
  symbol: string;
  title: string;
  description: string;
  action: ErrorAction;
}

const ERROR_MAP: Record<number, ErrorConfig> = {
  400: {
    symbol: '✦',
    title: '잘못된 요청',
    description: '요청 형식이 올바르지 않습니다.\n입력값을 확인한 뒤 다시 시도해 주세요.',
    action: { label: '이전 페이지로', onClick: () => history.back() },
  },
  401: {
    symbol: '◈',
    title: '로그인이 필요합니다',
    description: '이 페이지에 접근하려면 먼저 로그인해야 합니다.',
    action: { label: '로그인하기', href: '/login' },
  },
  403: {
    symbol: '⬡',
    title: '접근 권한 없음',
    description: '해당 페이지에 접근할 권한이 없습니다.\n계정의 역할(Role)을 확인해 주세요.',
    action: { label: '홈으로 돌아가기', href: '/' },
  },
  404: {
    symbol: '⊘',
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지가 존재하지 않거나\n이동되었을 수 있습니다.',
    action: { label: '홈으로 돌아가기', href: '/' },
  },
  500: {
    symbol: '⚠',
    title: '서버 오류',
    description: '서버에서 예기치 않은 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.',
    action: { label: '새로고침', onClick: () => location.reload() },
  },
};

const FALLBACK: ErrorConfig = {
  symbol: '?',
  title: '알 수 없는 오류',
  description: '예기치 않은 오류가 발생했습니다.',
  action: { label: '홈으로 돌아가기', href: '/' },
};

export default function ErrorPage() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const params = new URLSearchParams(window.location.search);
  const code = Number(params.get('code')) || 404;
  const config = ERROR_MAP[code] ?? FALLBACK;
  const { action } = config;

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

  return (
    <div className="error-page">
      <button
        type="button"
        className="error-theme-toggle"
        onClick={handleThemeToggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <div className="error-card">
        <div className={`error-symbol error-symbol--${code}`}>{config.symbol}</div>
        <p className={`error-code error-code--${code}`}>{code}</p>
        <h1 className="error-title">{config.title}</h1>
        <p className="error-description">
          {config.description.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>
        {action.onClick ? (
          <button className={`error-btn error-btn--${code}`} onClick={action.onClick}>
            {action.label}
          </button>
        ) : (
          <a href={action.href} className={`error-btn error-btn--${code}`}>
            {action.label}
          </a>
        )}
      </div>
    </div>
  );
}
