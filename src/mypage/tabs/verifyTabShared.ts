export type VerifyStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const STATUS_LABEL: Record<Exclude<VerifyStatus, 'ALL'>, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export type VerificationType = 'BASIC_IDENTITY' | 'LICENSE' | 'CAREGIVER';

export const VERIFICATION_TYPE_LABEL: Record<VerificationType, string> = {
  BASIC_IDENTITY: '기본 신원',
  LICENSE: '자격증',
  CAREGIVER: '요양보호사',
};
