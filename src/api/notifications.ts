import { requestJson } from './client';
import type { NotificationPageResponse } from './types';

export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROJECT_STATUS_CHANGED'
  | 'REVIEW_REQUEST'
  | 'NOTICE'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED';

export interface NotificationSummaryResponse {
  notificationId: number;
  notificationType: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedProjectId?: number | null;
  relatedProposalId?: number | null;
  relatedReviewId?: number | null;
  relatedNoticeId?: number | null;
  relatedVerificationId?: number | null;
  createdAt: string;
  readAt?: string | null;
}

export type NotificationDetailResponse = NotificationSummaryResponse;

export interface NotificationReadResponse {
  notificationId: number;
  isRead: boolean;
}

export interface NotificationBulkReadResponse {
  readCount: number;
}

export function getNotifications(params: {
  isRead?: boolean;
  page?: number;
  size?: number;
} = {}): Promise<NotificationPageResponse<NotificationSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.isRead != null) search.set('isRead', String(params.isRead));
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<NotificationPageResponse<NotificationSummaryResponse>>(
    `/api/v1/notifications${query ? `?${query}` : ''}`,
  );
}

export function getNotification(notificationId: number): Promise<NotificationDetailResponse> {
  return requestJson<NotificationDetailResponse>(`/api/v1/notifications/${notificationId}`);
}

export function markNotificationRead(notificationId: number): Promise<NotificationReadResponse> {
  return requestJson<NotificationReadResponse>(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(): Promise<NotificationBulkReadResponse> {
  return requestJson<NotificationBulkReadResponse>('/api/v1/notifications/read-all', {
    method: 'PATCH',
  });
}
