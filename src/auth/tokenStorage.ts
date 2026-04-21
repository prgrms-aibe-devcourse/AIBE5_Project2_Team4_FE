const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getAccessToken(): string | null {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken(): string | null {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasAnyToken(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
