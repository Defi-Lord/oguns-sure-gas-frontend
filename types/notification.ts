export type NotificationType =
  | 'ORDER'
  | 'DELIVERY'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'PROMOTION';

export type NotificationJsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type NotificationJsonValue =
  | NotificationJsonPrimitive
  | NotificationJsonValue[]
  | { [key: string]: NotificationJsonValue };

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationJsonValue | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListFilters {
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
}

export interface NotificationListResponse {
  success: true;
  message: string;
  data: { notifications: NotificationRecord[] };
}

export interface UnreadNotificationListResponse {
  success: true;
  message: string;
  data: {
    notifications: NotificationRecord[];
    unreadCount: number;
  };
}

export interface UnreadNotificationCountResponse {
  success: true;
  message: string;
  data: { count: number };
}

export interface NotificationResponse {
  success: true;
  message: string;
  data: { notification: NotificationRecord };
}

export interface MarkAllNotificationsReadResponse {
  success: true;
  message: string;
  data: { updatedCount: number };
}

export interface DeleteNotificationResponse {
  success: true;
  message: string;
  data: {
    id: string;
    deleted: true;
  };
}

export interface NotificationRealtimeReady {
  userId: string;
  role: string;
  branchId: string | null;
}
