import type { User, UserRole } from './appAuth';
import type { Project, ProjectStatus } from './appProjectStore';
import type { ReviewRecord } from './appReviewStore';

export interface RouteAccessResult {
  allowed: boolean;
  code?: 401 | 403;
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

export function canCreateProject(user: User | null): boolean {
  return hasRole(user, 'ROLE_USER');
}

export function canManageProjectStatus(user: User | null, project: Project): boolean {
  if (!user) {
    return false;
  }

  if (user.role === 'ROLE_ADMIN') {
    return true;
  }

  if (user.role === 'ROLE_FREELANCER') {
    return project.freelancerEmail === user.email;
  }

  return false;
}

export function canCancelProject(user: User | null, project: Project): boolean {
  if (!user) {
    return false;
  }

  if (user.role === 'ROLE_ADMIN') {
    return true;
  }

  return user.role === 'ROLE_USER' && project.requesterEmail === user.email && project.status === 'REQUESTED';
}

export function canEditProject(user: User | null, project: Project): boolean {
  if (!user) return false;
  return user.role === 'ROLE_USER' && project.requesterEmail === user.email && project.status === 'REQUESTED';
}

export function canWriteReview(user: User | null, project: Project): boolean {
  if (!user) {
    return false;
  }

  return user.role === 'ROLE_USER'
    && project.requesterEmail === user.email
    && project.status === 'COMPLETED';
}

export function canModifyOwnReview(user: User | null, review: ReviewRecord): boolean {
  if (!user) {
    return false;
  }

  return user.role === 'ROLE_ADMIN' || review.authorEmail === user.email;
}

export function canReportReview(user: User | null, review: ReviewRecord): boolean {
  if (!user) {
    return false;
  }

  return review.authorEmail !== user.email;
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

export function canTransitionProjectTo(project: Project, nextStatus: ProjectStatus): boolean {
  if (project.status === 'ACCEPTED' && nextStatus === 'IN_PROGRESS') {
    return true;
  }

  if (project.status === 'IN_PROGRESS' && nextStatus === 'COMPLETED') {
    return true;
  }

  return false;
}
