import { CanceledError, isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

type Tokens = { accessToken: string; refreshToken: string };

type Session = {
  key: string;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: Tokens) => void;
  clearAuth: () => void;
};

type RequestWithSession = InternalAxiosRequestConfig & {
  _session?: { key: string; accessToken: string | null };
  _retried?: boolean;
};

export function installSessionInterceptors(
  api: AxiosInstance,
  readSession: () => Session,
  refresh: (refreshToken: string) => Promise<Tokens>,
) {
  let pending: { key: string; refreshToken: string; promise: Promise<string> } | undefined;
  const sessionChanged = () => new CanceledError('Your session changed. Please try again.');
  const currentFor = (request: RequestWithSession) => {
    const current = readSession();
    if (request._session?.key !== current.key) throw sessionChanged();
    return current;
  };

  api.interceptors.request.use(
    (request: RequestWithSession) => {
      const current = readSession();
      if (request._session && request._session.key !== current.key) throw sessionChanged();
      request._session = { key: current.key, accessToken: current.accessToken };
      if (current.accessToken) request.headers.set('Authorization', `Bearer ${current.accessToken}`);
      return request;
    },
    (error: unknown) => { throw error; },
    { synchronous: true },
  );

  api.interceptors.response.use(
    (response) => {
      currentFor(response.config);
      return response;
    },
    async (error: unknown) => {
      if (!isAxiosError(error)) throw error;
      const request = error.config as RequestWithSession | undefined;
      if (!request?._session) throw error;
      const current = currentFor(request);
      const path = request.url ?? '';
      if (error.response?.status !== 401 || request._retried || !request._session.accessToken
        || /\/auth\/(?:login|refresh)(?:[/?#]|$)/.test(path)) throw error;

      request._retried = true;
      // A delayed 401 may arrive after another request has already rotated the token.
      if (current.accessToken && current.accessToken !== request._session.accessToken) {
        return api(request);
      }

      const refreshToken = current.refreshToken;
      if (!refreshToken) {
        current.clearAuth();
        throw error;
      }
      if (pending?.key !== current.key || pending.refreshToken !== refreshToken) {
        const key = current.key;
        const promise = refresh(refreshToken).then((tokens) => {
          const latest = readSession();
          if (latest.key !== key || latest.refreshToken !== refreshToken) throw sessionChanged();
          latest.setTokens(tokens);
          return tokens.accessToken;
        }).catch((cause: unknown) => {
          const latest = readSession();
          if (latest.key !== key || latest.refreshToken !== refreshToken) throw sessionChanged();
          // Outages and timeouts are retryable; only an explicit token rejection signs out.
          if (isAxiosError(cause) && [400, 401, 403].includes(cause.response?.status ?? 0)) {
            latest.clearAuth();
          }
          throw cause;
        }).finally(() => {
          if (pending?.promise === promise) pending = undefined;
        });
        pending = { key, refreshToken, promise };
      }

      await pending.promise;
      currentFor(request);
      return api(request);
    },
  );
}
