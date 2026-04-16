export type UserRole = 'ROLE_USER' | 'ROLE_FREELANCER' | 'ROLE_ADMIN';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  portfolio?: string;                                       // 업로드된 포트폴리오 파일명
  portfolioStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  basicVerifyStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  bio?: string;                                             // 자기소개
  avatar?: string;
}

export function getUser(): User | null {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return null;
  const user = JSON.parse(stored);
  // role 없는 구 데이터 마이그레이션
  if (!user.role) {
    user.role = 'ROLE_USER' satisfies UserRole;
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
  return user;
}

export function setUser(user: User): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem('auth_user');
}
