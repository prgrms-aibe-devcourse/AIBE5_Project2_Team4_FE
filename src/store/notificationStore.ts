import { getKnownUsers } from './appAuth';

export type NotificationType =
  | 'PROJECT_STATUS'
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
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

const NOTIFICATION_STORAGE_KEY = 'stella_notifications';

export const NOTIFICATION_EVENT = 'stella:notifications-changed';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function emitNotificationChange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

function readNotifications(): AppNotification[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const stored = storage.getItem(NOTIFICATION_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as AppNotification[]) : [];
}

function writeNotifications(notifications: AppNotification[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  emitNotificationChange();
}

export function getNotificationsForUser(userEmail?: string | null): AppNotification[] {
  if (!userEmail) {
    return [];
  }

  return readNotifications()
    .filter((notification) => notification.userEmail === userEmail)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getUnreadNotificationCount(userEmail?: string | null): number {
  return getNotificationsForUser(userEmail).filter((notification) => !notification.read).length;
}

export function createNotification(notification: NewNotification): AppNotification {
  const nextNotification: AppNotification = {
    ...notification,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  writeNotifications([nextNotification, ...readNotifications()]);
  return nextNotification;
}

export function createNotifications(notifications: NewNotification[]): void {
  if (notifications.length === 0) {
    return;
  }

  const nextNotifications = notifications.map<AppNotification>((notification, index) => ({
    ...notification,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${index}`,
    createdAt: new Date().toISOString(),
    read: false,
  }));

  writeNotifications([...nextNotifications, ...readNotifications()]);
}

export function markNotificationRead(notificationId: string): void {
  writeNotifications(
    readNotifications().map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    ),
  );
}

export function markAllNotificationsAsRead(userEmail: string): void {
  writeNotifications(
    readNotifications().map((notification) =>
      notification.userEmail === userEmail ? { ...notification, read: true } : notification,
    ),
  );
}

export function sendAnnouncement(
  senderName: string,
  title: string,
  message: string,
  senderEmail?: string,
): number {
  const recipients = getKnownUsers().filter((user) => user.email !== senderEmail);

  createNotifications(
    recipients.map((user) => ({
      userEmail: user.email,
      type: 'ANNOUNCEMENT',
      title,
      message: `${message}\n\n발송자: ${senderName}`,
      link: '/',
    })),
  );

  return recipients.length;
}

export function formatNotificationTime(createdAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}
