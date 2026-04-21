const KAKAO_STATE_KEY = 'kakao_oauth_state';
const DEFAULT_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
const DEFAULT_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const DEFAULT_REDIRECT_PATH = '/login/kakao/callback';
const DEFAULT_SCOPE = 'account_email profile_nickname';

interface KakaoTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function envValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function getKakaoRestApiKey(): string {
  const key = envValue(import.meta.env.VITE_KAKAO_REST_API_KEY);
  if (!key) {
    throw new Error('VITE_KAKAO_REST_API_KEY is not configured.');
  }

  return key;
}

function getAuthorizeUrl(): string {
  return envValue(import.meta.env.VITE_KAKAO_AUTHORIZE_URL) || DEFAULT_AUTHORIZE_URL;
}

function getTokenUrl(): string {
  return envValue(import.meta.env.VITE_KAKAO_TOKEN_URL) || DEFAULT_TOKEN_URL;
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

function readErrorMessage(payload: KakaoTokenResponse | string): string {
  if (typeof payload === 'string') {
    return payload;
  }

  return payload.error_description || payload.error || 'Kakao token request failed.';
}

export function startKakaoAuthorization(): void {
  const state = createState();
  const authorizeUrl = new URL(getAuthorizeUrl());
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', getKakaoRestApiKey());
  authorizeUrl.searchParams.set('redirect_uri', getKakaoRedirectUri());
  authorizeUrl.searchParams.set('state', state);

  const scope = envValue(import.meta.env.VITE_KAKAO_SCOPE) || DEFAULT_SCOPE;
  if (scope) {
    authorizeUrl.searchParams.set('scope', scope);
  }

  sessionStorage.setItem(KAKAO_STATE_KEY, state);
  window.location.href = authorizeUrl.toString();
}

export function validateKakaoState(receivedState: string | null): void {
  const expectedState = sessionStorage.getItem(KAKAO_STATE_KEY);
  sessionStorage.removeItem(KAKAO_STATE_KEY);

  if (!expectedState || !receivedState || expectedState !== receivedState) {
    throw new Error('Kakao login state is invalid. Please try again.');
  }
}

export async function exchangeKakaoAuthorizationCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getKakaoRestApiKey(),
    redirect_uri: getKakaoRedirectUri(),
    code,
  });

  const response = await fetch(getTokenUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json() as KakaoTokenResponse
    : await response.text();

  if (!response.ok) {
    throw new Error(readErrorMessage(payload));
  }

  if (typeof payload === 'string' || !payload.access_token) {
    throw new Error('Kakao access token was not returned.');
  }

  return payload.access_token;
}
