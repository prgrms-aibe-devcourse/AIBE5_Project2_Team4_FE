const KAKAO_STATE_KEY = 'kakao_oauth_state';
const DEFAULT_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js';
const DEFAULT_REDIRECT_PATH = '/login/kakao/callback';
const DEFAULT_SCOPE = 'account_email,profile_nickname';

interface KakaoAuthorizeOptions {
  redirectUri: string;
  state: string;
  scope?: string;
}

interface KakaoSdk {
  init(key: string): void;
  isInitialized(): boolean;
  Auth: {
    authorize(options: KakaoAuthorizeOptions): void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

function envValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function getKakaoJavaScriptKey(): string {
  const key = envValue(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY);
  if (!key) {
    throw new Error('VITE_KAKAO_JAVASCRIPT_KEY is not configured.');
  }

  return key;
}

function getSdkUrl(): string {
  return envValue(import.meta.env.VITE_KAKAO_SDK_URL) || DEFAULT_SDK_URL;
}

export function getKakaoRedirectUri(): string {
  const configuredRedirectUri = envValue(import.meta.env.VITE_KAKAO_REDIRECT_URI);
  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  return `${window.location.origin}${DEFAULT_REDIRECT_PATH}`;
}

function createState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Kakao SDK.')), { once: true });
      if (window.Kakao) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Kakao SDK.'));
    document.head.appendChild(script);
  });
}

async function getKakaoSdk(): Promise<KakaoSdk> {
  if (!window.Kakao) {
    await loadScript(getSdkUrl());
  }

  if (!window.Kakao) {
    throw new Error('Kakao SDK is not available.');
  }

  return window.Kakao;
}

export async function startKakaoAuthorization(): Promise<void> {
  const kakaoSdk = await getKakaoSdk();
  if (!kakaoSdk.isInitialized()) {
    kakaoSdk.init(getKakaoJavaScriptKey());
  }

  const state = createState();
  const authorizeOptions: KakaoAuthorizeOptions = {
    redirectUri: getKakaoRedirectUri(),
    state,
  };

  const scope = envValue(import.meta.env.VITE_KAKAO_SCOPE) || DEFAULT_SCOPE;
  if (scope) {
    authorizeOptions.scope = scope;
  }

  sessionStorage.setItem(KAKAO_STATE_KEY, state);
  kakaoSdk.Auth.authorize(authorizeOptions);
}

export function validateKakaoState(receivedState: string | null): void {
  const expectedState = sessionStorage.getItem(KAKAO_STATE_KEY);
  sessionStorage.removeItem(KAKAO_STATE_KEY);

  if (!expectedState || !receivedState || expectedState !== receivedState) {
    throw new Error('Kakao login state is invalid. Please try again.');
  }
}
