import type { ProjectStatus } from '../api/projects';
import type { ProposalStatus } from '../api/proposals';
import type { ReportReasonType, ReportStatus } from '../api/reports';
import type { VerificationStatus, VerificationType } from '../api/verifications';

export type UserRoleCode = 'ROLE_USER' | 'ROLE_FREELANCER' | 'ROLE_ADMIN';

const ROLE_LABELS: Record<UserRoleCode, string> = {
  ROLE_USER: '일반 사용자',
  ROLE_FREELANCER: '메이트',
  ROLE_ADMIN: '관리자',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  REQUESTED: '요청',
  ACCEPTED: '수락',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
  CANCELLED: '취소됨',
};

const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  BASIC_IDENTITY: '기본 신원',
  LICENSE: '자격증',
  CAREGIVER: '요양보호사',
};

const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

const REPORT_REASON_LABELS: Record<ReportReasonType, string> = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/비방',
  FALSE_INFO: '허위 정보',
  ETC: '기타',
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기 중',
  RESOLVED: '처리됨',
  REJECTED: '반려됨',
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return '-';
  return ROLE_LABELS[role as UserRoleCode] ?? role;
}

export function projectStatusLabel(status: ProjectStatus | string | null | undefined): string {
  if (!status) return '-';
  return PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status;
}

export function proposalStatusLabel(status: ProposalStatus | string | null | undefined): string {
  if (!status) return '-';
  return PROPOSAL_STATUS_LABELS[status as ProposalStatus] ?? status;
}

export function verificationTypeLabel(type: VerificationType | string | null | undefined): string {
  if (!type) return '-';
  return VERIFICATION_TYPE_LABELS[type as VerificationType] ?? type;
}

export function verificationStatusLabel(status: VerificationStatus | string | null | undefined): string {
  if (!status) return '-';
  return VERIFICATION_STATUS_LABELS[status as VerificationStatus] ?? status;
}

export function reportReasonLabel(reason: ReportReasonType | string | null | undefined): string {
  if (!reason) return '-';
  return REPORT_REASON_LABELS[reason as ReportReasonType] ?? reason;
}

export function reportStatusLabel(status: ReportStatus | string | null | undefined): string {
  if (!status) return '-';
  return REPORT_STATUS_LABELS[status as ReportStatus] ?? status;
}
