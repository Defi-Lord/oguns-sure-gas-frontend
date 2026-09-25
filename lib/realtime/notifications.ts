import {
  io,
  type Socket,
} from 'socket.io-client';

import type {
  NotificationRecord,
  NotificationRealtimeReady,
} from '@/types/notification';

interface NotificationServerToClientEvents {
  'notification:ready': (
    payload: NotificationRealtimeReady,
  ) => void;

  'notification:new': (
    notification: NotificationRecord,
  ) => void;
}

type NotificationSocket =
  Socket<
    NotificationServerToClientEvents,
    Record<string, never>
  >;

const getSocketOrigin = (): string => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured.',
    );
  }

  const parsed =
    new URL(apiUrl);

  return `${parsed.protocol}//${parsed.host}`;
};

export const createNotificationSocket = (
  accessToken: string,
): NotificationSocket => {
  return io(
    getSocketOrigin(),
    {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 8_000,
      timeout: 20_000,
    },
  );
};
