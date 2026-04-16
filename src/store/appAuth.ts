export type UserRole = 'ROLE_USER' | 'ROLE_FREELANCER' | 'ROLE_ADMIN';

export type PortfolioStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BasicVerifyStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  portfolio?: string;
  portfolioStatus?: PortfolioStatus;
  basicVerifyStatus?: BasicVerifyStatus;
  bio?: string;
  avatar?: string;
}

export interface DemoAccount extends User {
  password: string;
}

const AUTH_USER_KEY = 'auth_user';
const KNOWN_USERS_KEY = 'known_users';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: '보호자',
    email: 'user@stella.ai',
    password: 'user1234',
    role: 'ROLE_USER',
  },
  {
    name: '김지수',
    email: 'free@stella.ai',
    password: 'free1234',
    role: 'ROLE_FREELANCER',
    verified: true,
    basicVerifyStatus: 'APPROVED',
    bio: '병원 동행과 일상 지원 경험이 많은 프리랜서입니다.',
  },
  {
    name: '관리자',
    email: 'admin@stella.ai',
    password: 'admin1234',
    role: 'ROLE_ADMIN',
  },
];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function getDefaultKnownUsers(): User[] {
  return DEMO_ACCOUNTS.map(({ password, ...user }) => user);
}

function persistKnownUsers(users: User[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(KNOWN_USERS_KEY, JSON.stringify(users));
}

function upsertKnownUser(user: User): void {
  const knownUsers = getKnownUsers();
  const nextUsers = knownUsers.some((knownUser) => knownUser.email === user.email)
    ? knownUsers.map((knownUser) => (knownUser.email === user.email ? { ...knownUser, ...user } : knownUser))
    : [...knownUsers, user];

  persistKnownUsers(nextUsers);
}

export function getKnownUsers(): User[] {
  const storage = getStorage();
  if (!storage) {
    return getDefaultKnownUsers();
  }

  const stored = storage.getItem(KNOWN_USERS_KEY);
  if (!stored) {
    const defaults = getDefaultKnownUsers();
    persistKnownUsers(defaults);
    return defaults;
  }

  return JSON.parse(stored) as User[];
}

export function getUser(): User | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const stored = storage.getItem(AUTH_USER_KEY);
  if (!stored) {
    return null;
  }

  const user = JSON.parse(stored) as User;
  if (!user.role) {
    user.role = 'ROLE_USER';
  }

  upsertKnownUser(user);
  return user;
}

export function setUser(user: User): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  upsertKnownUser(user);
}

export function logout(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_USER_KEY);
}
