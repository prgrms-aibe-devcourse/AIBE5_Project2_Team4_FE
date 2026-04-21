import { useEffect, useRef, useState } from 'react';
import './login.css';
import { validateKakaoState } from '../auth/kakaoOAuth';
import { loginWithKakaoAuthorizationCode } from '../store/appAuth';

const CALLBACK_TIMEOUT_MS = 15_000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '카카오 로그인에 실패했습니다.';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('카카오 로그인 응답 시간이 초과되었습니다. 백엔드 서버와 카카오 키 설정을 확인해 주세요.'));
      }, timeoutMs);
    }),
  ]);
}

export default function KakaoCallback() {
  const startedRef = useRef(false);
  const [message, setMessage] = useState('카카오 로그인을 처리하고 있습니다.');
  const [error, setError] = useState('');

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
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
      setMessage('서비스 로그인을 완료하고 있습니다.');

      await withTimeout(loginWithKakaoAuthorizationCode(code), CALLBACK_TIMEOUT_MS);
      window.location.replace('/');
    }

    void completeLogin().catch((caughtError) => {
      setError(getErrorMessage(caughtError));
    });
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
