/* eslint-disable @typescript-eslint/no-unused-vars */

export type AnnouncementTarget = 'ALL' | 'ROLE_USER' | 'ROLE_FREELANCER';
export type AnnouncementType = 'GENERAL' | 'URGENT' | 'SYSTEM' | 'EVENT';

export interface AnnouncementRecord {
  id: string;
  senderName: string;
  senderEmail: string;
  title: string;
  message: string;
  target: AnnouncementTarget;
  announcementType: AnnouncementType;
  sentAt: string;
  recipientCount: number;
  scheduled: boolean;
  scheduledAt?: string;
}

export type NotificationType =
  | 'PROJECT_STATUS'
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'REVIEW_REPORTED'
  | 'FREELANCER_STATUS'
  | 'ANNOUNCEMENT';

export interface AppNotification {
  id: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface NewNotification {
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const NOTIFICATION_EVENT = 'stella:notifications-changed';

// Legacy compatibility shim. Live notifications/notices now come from src/api/notifications.ts and src/api/notices.ts.
export function getNotificationsForUser(_userEmail?: string | null): AppNotification[] {
  return [];
}

export function getUnreadNotificationCount(_userEmail?: string | null): number {
  return 0;
}

export function createNotification(_notification: NewNotification): AppNotification {
  throw new Error('notificationStore mock is removed. Use src/api/notifications.ts.');
}

export function createNotifications(_notifications: NewNotification[]): void {}

export function markNotificationRead(_notificationId: string): void {}

export function markAllNotificationsAsRead(_userEmail: string): void {}

export function sendAnnouncement(
  _senderName: string,
  _title: string,
  _message: string,
  _senderEmail?: string,
): number {
  return 0;
}

export function getAnnouncementHistory(): AnnouncementRecord[] {
  return [];
}

export function sendAnnouncementWithOptions(
  _senderName: string,
  _senderEmail: string,
  _title: string,
  _message: string,
  _target: AnnouncementTarget,
  _announcementType: AnnouncementType,
  _scheduledAt?: string,
): number {
  return 0;
}

export function formatNotificationTime(createdAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}
