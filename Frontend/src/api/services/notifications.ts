import { http } from "../client";
import type { NotificationSummary } from "../types";

export const notificationsApi = {
  mine: (take = 50) =>
    http.get<NotificationSummary>("/Notifications/Mine", { params: { take } }),

  unreadCount: () => http.get<number>("/Notifications/UnreadCount"),

  markRead: (id: number) =>
    http.post<void>("/Notifications/MarkRead", { params: { id } }),

  markAllRead: () => http.post<void>("/Notifications/MarkAllRead"),
};
