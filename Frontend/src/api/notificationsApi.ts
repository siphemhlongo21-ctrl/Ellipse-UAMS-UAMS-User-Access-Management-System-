import { apiRequest } from "./http";

export interface AppNotificationDetails {
  id: number;
  requestId?: number | null;
  requestNumber?: string | null;
  category: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
  items: AppNotificationDetails[];
}

export function getMyNotifications(take = 50) {
  return apiRequest<NotificationSummary>("/api/Notifications/Mine", {
    query: { take },
  });
}

export function getUnreadNotificationCount() {
  return apiRequest<number>("/api/Notifications/UnreadCount");
}

export function markNotificationRead(id: number) {
  return apiRequest<unknown>("/api/Notifications/MarkRead", {
    method: "POST",
    query: { id },
  });
}

export function markAllNotificationsRead() {
  return apiRequest<unknown>("/api/Notifications/MarkAllRead", {
    method: "POST",
  });
}
