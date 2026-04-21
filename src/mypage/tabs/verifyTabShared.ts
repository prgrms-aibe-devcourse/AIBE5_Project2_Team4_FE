export type VerifyStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const STATUS_LABEL: Record<Exclude<VerifyStatus, 'ALL'>, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};
