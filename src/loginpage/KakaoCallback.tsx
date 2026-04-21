import { useEffect, useState } from 'react';
import './login.css';
import { exchangeKakaoAuthorizationCode, validateKakaoState } from '../auth/kakaoOAuth';
import { loginWithKakaoAccessToken } from '../store/appAuth';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '카카오 로그인에 실패했습니다.';
}

export default function KakaoCallback() {
  const [message, setMessage] = useState('카카오 로그인을 처리하고 있습니다.');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function completeLogin() {
      const params = new URLSearchParams(window.location.search);
      const kakaoError = params.get('error');
      if (kakaoError) {
        throw new Error(params.get('error_description') || kakaoError);
      }

      const code = params.get('code');
      if (!code) {
        throw new Error('카카오 인증 코드가 전달되지 않았습니다.');
      }

      validateKakaoState(params.get('state'));
      const kakaoAccessToken = await exchangeKakaoAuthorizationCode(code);
      if (!cancelled) {
        setMessage('서비스 로그인을 완료하고 있습니다.');
      }

      await loginWithKakaoAccessToken(kakaoAccessToken);
      window.location.replace('/');
    }

    void completeLogin().catch((caughtError) => {
      if (!cancelled) {
        setError(getErrorMessage(caughtError));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>카카오 로그인</h1>
          <p>{error || message}</p>
        </div>

        {error ? (
          <>
            <p className="login-error">{error}</p>
            <button type="button" className="login-btn" onClick={() => window.location.replace('/login')}>
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <div className="kakao-callback-spinner" aria-label="Loading" />
        )}
      </div>
    </div>
  );
}
