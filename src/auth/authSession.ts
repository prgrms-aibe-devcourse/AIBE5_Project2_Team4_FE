import { getMyProfile } from '../api/users';
import * as authApi from '../api/auth';
import { registerUnauthorizedHandler } from '../api/client';
import { clearTokens, getRefreshToken, hasAnyToken, setTokens } from './tokenStorage';
import { normalizeUser, type User } from './user';

export const AUTH_USER_EVENT = 'app-auth-user-change';

let currentUser: User | null = null;
let bootstrapPromise: Promise<User | null> | null = null;
let refreshPromise: Promise<boolean> | null = null;
let bootstrapped = false;

function emitUserChange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_USER_EVENT));
}

function setCurrentUser(nextUser: User | null): User | null {
  currentUser = nextUser;
  emitUserChange();
  return currentUser;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function isAuthBootstrapped(): boolean {
  return bootstrapped;
}

export function updateCurrentUser(user: User): User {
  return setCurrentUser(user) as User;
}

export async function refreshAuthToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return false;
  }

  refreshPromise = authApi.refresh(refreshToken)
    .then((response) => {
      setTokens(response.accessToken, response.refreshToken);
      return true;
    })
    .catch(() => {
      clearSession();
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function bootstrapAuthSession(force = false): Promise<User | null> {
  if (bootstrapPromise && !force) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    if (!hasAnyToken()) {
      bootstrapped = true;
      return setCurrentUser(null);
    }

    try {
      const profile = await getMyProfile();
      bootstrapped = true;
      return setCurrentUser(normalizeUser(profile));
    } catch {
      clearSession();
      bootstrapped = true;
      return null;
    }
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}

export async function loginSession(email: string, password: string): Promise<User> {
  const response = await authApi.login({ email, password });
  setTokens(response.accessToken, response.refreshToken);
  const profile = await getMyProfile();
  bootstrapped = true;
  return updateCurrentUser(normalizeUser(profile));
}

export async function kakaoLoginSession(request: authApi.KakaoLoginRequest): Promise<User> {
  const response = await authApi.kakaoLogin(request);
  setTokens(response.accessToken, response.refreshToken);
  const profile = await getMyProfile();
  bootstrapped = true;
  return updateCurrentUser(normalizeUser(profile));
}

export async function signupSession(request: authApi.AuthSignupRequest): Promise<authApi.AuthSignupResponse> {
  return authApi.signup(request);
}

export async function logoutSession(): Promise<void> {
  try {
    if (hasAnyToken()) {
      await authApi.logout();
    }
  } catch {
    // Best effort logout. Local session must still be cleared.
  } finally {
    clearSession();
  }
}

export function clearSession(): void {
  clearTokens();
  bootstrapped = true;
  setCurrentUser(null);
}

registerUnauthorizedHandler(refreshAuthToken);
