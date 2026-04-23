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
  phone: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface KakaoLoginRequest {
  accessToken?: string;
  authorizationCode?: string;
}

export function login(request: { email: string; password: string }): Promise<AuthTokenResponse> {
  return requestJson<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
    retryOnAuthFailure: false,
  });
}

export function kakaoLogin(request: KakaoLoginRequest): Promise<AuthTokenResponse> {
  return requestJson<AuthTokenResponse>('/api/v1/auth/oauth/kakao', {
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

export function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
  return requestJson<void>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: request,
    auth: false,
    retryOnAuthFailure: false,
  });
}

export function resetPassword(request: ResetPasswordRequest): Promise<void> {
  return requestJson<void>('/api/v1/auth/reset-password', {
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
