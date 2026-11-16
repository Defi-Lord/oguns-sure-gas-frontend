import axios from 'axios';
import { installSessionInterceptors } from './session-interceptors';

import { useAuthStore } from '@/stores/auth-store';

import type {
  ApiErrorResponse,
  RefreshResponse,
} from '@/types/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not configured.',
  );
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type':
      'application/json',
  },
  timeout: 20_000,
});

installSessionInterceptors(
  api,
  () => {
    const state = useAuthStore.getState();
    return {
      key: JSON.stringify([state.sessionVersion, state.isAuthenticated,
        state.user?.id, state.user?.role, state.user?.status, state.user?.managedBranch?.id]),
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      setTokens: state.setTokens,
      clearAuth: state.clearAuth,
    };
  },
  async (refreshToken) => {
    const response = await axios.post<RefreshResponse>(
      `${API_URL}/auth/refresh`, { refreshToken }, { timeout: 20_000 },
    );
    return response.data.data.tokens;
  },
);

export const getApiErrorMessage = (
  error: unknown,
): string => {
  if (axios.isAxiosError(error)) {
    const apiError =
      error.response
        ?.data as
        | ApiErrorResponse
        | undefined;

    if (
      apiError?.message &&
      typeof apiError.message ===
        'string'
    ) {
      return apiError.message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The request took too long. Please try again.';
    }

    if (!error.response) {
      return 'Unable to reach the server. Please check your connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};