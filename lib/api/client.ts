import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

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

interface RetryableRequest
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;

let refreshPromise:
  | Promise<string>
  | null = null;

const refreshAccessToken =
  async (): Promise<string> => {
    const {
      refreshToken,
      setTokens,
      clearAuth,
    } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();

      throw new Error(
        'No refresh token available.',
      );
    }

    try {
      const response =
        await axios.post<RefreshResponse>(
          `${API_URL}/auth/refresh`,
          {
            refreshToken,
          },
          {
            headers: {
              'Content-Type':
                'application/json',
            },
            timeout: 20_000,
          },
        );

      const tokens =
        response.data.data.tokens;

      setTokens(tokens);

      return tokens.accessToken;
    } catch (error) {
      clearAuth();

      throw error;
    }
  };

api.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig,
  ) => {
    const { accessToken } =
      useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
);

api.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError<ApiErrorResponse>,
  ) => {
    const originalRequest =
      error.config as
        | RetryableRequest
        | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const requestUrl =
      originalRequest.url ?? '';

    if (
      requestUrl.includes(
        '/auth/login',
      ) ||
      requestUrl.includes(
        '/auth/refresh',
      )
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise =
          refreshAccessToken().finally(
            () => {
              isRefreshing = false;
              refreshPromise = null;
            },
          );
      }

      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(
        refreshError,
      );
    }
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