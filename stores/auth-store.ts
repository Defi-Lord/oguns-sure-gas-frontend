'use client';

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
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        hasHydrated: false,

        setAuth: (user, tokens) => {
          set({
            user,
            accessToken:
              tokens.accessToken,
            refreshToken:
              tokens.refreshToken,
            isAuthenticated: true,
          });
        },

        setUser: (user) => {
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
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
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