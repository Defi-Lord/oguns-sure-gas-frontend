import { api } from '@/lib/api/client';

import type {
  DeleteNotificationResponse,
  MarkAllNotificationsReadResponse,
  NotificationListFilters,
  NotificationListResponse,
  NotificationRecord,
  NotificationResponse,
  UnreadNotificationCountResponse,
  UnreadNotificationListResponse,
} from '@/types/notification';

export const getNotifications = async (
  filters: NotificationListFilters = {},
): Promise<NotificationRecord[]> => {
  const response =
    await api.get<NotificationListResponse>(
      '/notifications',
      {
        params: {
          ...(filters.isRead !== undefined
            ? { isRead: String(filters.isRead) }
            : {}),
          ...(filters.type
            ? { type: filters.type }
            : {}),
          limit: filters.limit ?? 100,
        },
      },
    );

  return response.data.data.notifications;
};

export const getUnreadNotifications =
  async (): Promise<{
    notifications: NotificationRecord[];
    unreadCount: number;
  }> => {
    const response =
      await api.get<UnreadNotificationListResponse>(
        '/notifications/unread',
      );

    return response.data.data;
  };

export const getUnreadNotificationCount =
  async (): Promise<number> => {
    const response =
      await api.get<UnreadNotificationCountResponse>(
        '/notifications/unread/count',
      );

    return response.data.data.count;
  };

export const getNotification = async (
  notificationId: string,
): Promise<NotificationRecord> => {
  const response =
    await api.get<NotificationResponse>(
      `/notifications/${notificationId}`,
    );

  return response.data.data.notification;
};

export const markNotificationRead = async (
  notificationId: string,
): Promise<NotificationRecord> => {
  const response =
    await api.patch<NotificationResponse>(
      `/notifications/${notificationId}/read`,
    );

  return response.data.data.notification;
};

export const markAllNotificationsRead =
  async (): Promise<number> => {
    const response =
      await api.patch<MarkAllNotificationsReadResponse>(
        '/notifications/read-all',
      );

    return response.data.data.updatedCount;
  };

export const deleteNotification = async (
  notificationId: string,
): Promise<{
  id: string;
  deleted: true;
}> => {
  const response =
    await api.delete<DeleteNotificationResponse>(
      `/notifications/${notificationId}`,
    );

  return response.data.data;
};
