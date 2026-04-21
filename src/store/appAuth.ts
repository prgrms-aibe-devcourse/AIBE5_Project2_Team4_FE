import {
  bootstrapAuthSession,
  clearSession,
  getCurrentUser,
  loginSession,
  logoutSession,
  signupSession,
  updateCurrentUser,
} from '../auth/authSession';
import { normalizeUser, type User } from '../auth/user';
import type { AuthSignupRequest, AuthSignupResponse } from '../api/auth';

export type { User, UserRole } from '../auth/user';
export { AUTH_USER_EVENT } from '../auth/authSession';

export function getUser(): User | null {
  return getCurrentUser();
}

export function setUser(user: User): void {
  updateCurrentUser(normalizeUser(user));
}

export function logout(): void {
  void logoutSession();
}

export function clearUserSession(): void {
  clearSession();
}

export function bootstrapSession(): Promise<User | null> {
  return bootstrapAuthSession();
}

export function login(email: string, password: string): Promise<User> {
  return loginSession(email, password);
}

export function signup(request: AuthSignupRequest): Promise<AuthSignupResponse> {
  return signupSession(request);
}

export type PortfolioStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BasicVerifyStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DemoAccount extends User {
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [];

export function getKnownUsers(): User[] {
  const user = getCurrentUser();
  return user ? [user] : [];
}

export function getRegisteredAccounts(): DemoAccount[] {
  return [];
}

export function registerAccount(_account?: Partial<DemoAccount>): { success: boolean; error?: string } {
  void _account;
  return { success: false, error: 'registerAccount mock is removed. Use signup().' };
}

export function findAccount(_email?: string, _password?: string): DemoAccount | null {
  void _email;
  void _password;
  return null;
}

export function findAccountByEmail(_email?: string): DemoAccount | null {
  void _email;
  return null;
}
