import type { User, UserRole } from './appAuth';
import type { ProjectStatus } from '../api/projects';

export interface RouteAccessResult {
  allowed: boolean;
  code?: 401 | 403;
}

export interface ReviewAccessTarget {
  reviewerUserId?: number | null;
}

const AUTH_REQUIRED_PATHS = new Set(['/mypage', '/project']);

export function hasRole(user: User | null, ...roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}

export function canAccessRoute(path: string, user: User | null): RouteAccessResult {
  if (!AUTH_REQUIRED_PATHS.has(path)) {
    return { allowed: true };
  }

  if (!user) {
    return { allowed: false, code: 401 };
  }

  return { allowed: true };
}

export function canModifyOwnReview(user: User | null, review: ReviewAccessTarget): boolean {
  if (!user) {
    return false;
  }

  return user.role === 'ROLE_ADMIN' || review.reviewerUserId === user.userId;
}

export function canReportReview(user: User | null, review: ReviewAccessTarget): boolean {
  if (!user) {
    return false;
  }

  return review.reviewerUserId !== user.userId;
}

export function canModerateReviews(user: User | null): boolean {
  return hasRole(user, 'ROLE_ADMIN');
}

export function canManageVerification(user: User | null): boolean {
  return hasRole(user, 'ROLE_ADMIN');
}

export function canSendAnnouncement(user: User | null): boolean {
  return hasRole(user, 'ROLE_ADMIN');
}

/** 공지 대상 필터링용 실효 역할 — 미인증 프리랜서는 ROLE_USER로 취급 */
export function effectiveNoticeRole(user: User | null): string | undefined {
  if (!user) return undefined;
  if (user.role === 'ROLE_FREELANCER' && !user.verified) return 'ROLE_USER';
  return user.role;
}

export function canTransitionProjectTo(
  currentStatus: ProjectStatus,
  nextStatus: 'IN_PROGRESS' | 'COMPLETED',
): boolean {
  if (currentStatus === 'ACCEPTED' && nextStatus === 'IN_PROGRESS') {
    return true;
  }

  if (currentStatus === 'IN_PROGRESS' && nextStatus === 'COMPLETED') {
    return true;
  }

  return false;
}
