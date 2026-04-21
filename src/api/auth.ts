import { requestJson } from './client';

export interface AuthUserResponse {
  userId: number;
  email: string;
  name: string;
  roleCode: string;
}

export interface AuthTokenResponse {
  tokenType: string;
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: AuthUserResponse;
}

export interface AuthSignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  intro?: string;
}

export interface AuthSignupResponse {
  userId: number;
  email: string;
  name: string;
  roleCode: string;
}

export interface AuthLogoutResponse {
  revokedRefreshTokenCount: number;
}

export function login(request: { email: string; password: string }): Promise<AuthTokenResponse> {
  return requestJson<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
    retryOnAuthFailure: false,
  });
}

export function refresh(refreshToken: string): Promise<AuthTokenResponse> {
  return requestJson<AuthTokenResponse>('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
    retryOnAuthFailure: false,
  });
}

export function signup(request: AuthSignupRequest): Promise<AuthSignupResponse> {
  return requestJson<AuthSignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: request,
    auth: false,
    retryOnAuthFailure: false,
  });
}

export function logout(): Promise<AuthLogoutResponse> {
  return requestJson<AuthLogoutResponse>('/api/v1/auth/logout', {
    method: 'POST',
    retryOnAuthFailure: false,
  });
}
