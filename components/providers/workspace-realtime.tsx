'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createNotificationSocket } from '@/lib/realtime/notifications';
import { canCatchUpQuery, notificationAffectsQuery } from '@/lib/realtime/workspace-updates';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationRecord } from '@/types/notification';

const WorkspaceConnection = createContext(false);
export const useWorkspaceConnection = () => useContext(WorkspaceConnection);

export function WorkspaceRealtime({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const account = useAuthStore((s) =>
    s.hasHydrated && s.isAuthenticated && s.user?.status === 'ACTIVE' ? s.user.id : null,
  );
  const role = useAuthStore((s) => s.user?.role);
  const token = useAuthStore((s) => s.accessToken);
  const [connectedToken, setConnectedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !token) return;

    let active = true;
    let socket: ReturnType<typeof createNotificationSocket> | undefined;
    let timer: number | undefined;
    const pending: NotificationRecord[] = [];
    const seen = new Set<string>();
    const current = () => {
      const auth = useAuthStore.getState();
      return active && auth.isAuthenticated && auth.user?.id === account
        && auth.user.role === role && auth.user.status === 'ACTIVE' && auth.accessToken === token;
    };

    const catchUp = (minAge: number) => {
      if (!current() || document.visibilityState === 'hidden' || !navigator.onLine) return;
      void client.refetchQueries({
        type: 'active',
        predicate: (query) => canCatchUpQuery(query.queryKey) && query.state.fetchStatus === 'idle'
          && (query.state.isInvalidated
            || Date.now() - Math.max(query.state.dataUpdatedAt, query.state.errorUpdatedAt) >= minAge),
      }, { cancelRefetch: false });
    };
    const resume = () => catchUp(2_000);

    try {
      socket = createNotificationSocket(token);
      socket.on('notification:ready', (identity) => {
        if (!current() || identity.userId !== account || identity.role !== role) return;
        setConnectedToken(token);
        resume();
      });
      const disconnected = () => {
        if (current()) setConnectedToken(null);
      };
      socket.on('disconnect', disconnected);
      socket.on('connect_error', disconnected);
      socket.on('notification:new', (notification) => {
        if (!current() || notification.userId !== account || seen.has(notification.id)) return;
        seen.add(notification.id);
        if (seen.size > 250) {
          const oldest = seen.values().next();
          if (!oldest.done) seen.delete(oldest.value);
        }
        pending.push(notification);
        if (timer !== undefined) return;
        timer = window.setTimeout(() => {
          timer = undefined;
          if (!current()) return;
          const updates = pending.splice(0);
          void client.invalidateQueries({
            refetchType: document.visibilityState === 'hidden' ? 'none' : 'active',
            predicate: (query) =>
              updates.some((update) => notificationAffectsQuery(update, query.queryKey)),
          });
        }, 120);
      });
      socket.connect();
    } catch {
      socket?.disconnect();
    }

    // Changes without a notification still appear while the portal is open.
    const poll = window.setInterval(() => catchUp(15_000), 15_000);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [account, client, role, token]);

  return (
    <WorkspaceConnection.Provider value={Boolean(account && token && connectedToken === token)}>
      {children}
    </WorkspaceConnection.Provider>
  );
}
