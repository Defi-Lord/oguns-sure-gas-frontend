'use client';

import { clearBrowserPush } from '@/lib/notifications/push-session';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  AuthTokens,
  AuthUser,
} from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  sessionVersion: number;

  setAuth: (
    user: AuthUser,
    tokens: AuthTokens,
  ) => void;

  setUser: (
    user: AuthUser | null,
  ) => void;

  setTokens: (
    tokens: AuthTokens,
  ) => void;

  clearAuth: () => void;

  setHasHydrated: (
    value: boolean,
  ) => void;
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        hasHydrated: false,
        sessionVersion: 0,

        setAuth: (user, tokens) => {
          if (get().user && (get().user?.id !== user.id || get().user?.role !== user.role)) clearBrowserPush(get().accessToken);
          set((state) => ({
            sessionVersion: state.sessionVersion + 1,
            user,
            accessToken:
              tokens.accessToken,
            refreshToken:
              tokens.refreshToken,
            isAuthenticated: true,
          }));
        },

        setUser: (user) => {
          if (!user || (get().user && (get().user?.id !== user.id || get().user?.role !== user.role))) clearBrowserPush(get().accessToken);
          set({
            user,
            isAuthenticated:
              Boolean(user),
          });
        },

        setTokens: (tokens) => {
          set({
            accessToken:
              tokens.accessToken,
            refreshToken:
              tokens.refreshToken,
          });
        },

        clearAuth: () => {
          clearBrowserPush(get().accessToken);
          set((state) => ({
            sessionVersion: state.sessionVersion + 1,
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          }));
        },

        setHasHydrated: (value) => {
          set({
            hasHydrated: value,
          });
        },
      }),
      {
        name: 'ogun-gas-admin-auth',

        partialize: (state) => ({
          user: state.user,
          accessToken:
            state.accessToken,
          refreshToken:
            state.refreshToken,
          isAuthenticated:
            state.isAuthenticated,
        }),

        onRehydrateStorage:
          () => (state) => {
            state?.setHasHydrated(
              true,
            );
          },
      },
    ),
  );