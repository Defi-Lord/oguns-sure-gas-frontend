'use client';

import {
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import {
  useMutation,
} from '@tanstack/react-query';

import {
  api,
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  LoginRequest,
  LoginResponse,
} from '@/types/auth';

import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

import {
  Button,
} from '@/components/ui/button';

import {
  Input,
} from '@/components/ui/input';

import {
  Label,
} from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();

  const setAuth =
    useAuthStore(
      (state) => state.setAuth,
    );

  const clearAuth =
    useAuthStore(
      (state) => state.clearAuth,
    );

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const loginMutation =
    useMutation({
      mutationFn: async (
        payload: LoginRequest,
      ) => {
        const response =
          await api.post<LoginResponse>(
            '/auth/login',
            payload,
          );

        return response.data;
      },

      onSuccess: (response) => {
        const {
          user,
          tokens,
        } = response.data;

        if (
          user.role !==
          'SUPER_ADMIN'
        ) {
          clearAuth();

          setErrorMessage(
            'This portal is restricted to Super Admin accounts.',
          );

          return;
        }

        if (
          user.status !== 'ACTIVE'
        ) {
          clearAuth();

          setErrorMessage(
            'Your administrator account is not active.',
          );

          return;
        }

        setAuth(user, tokens);

        router.replace(
          '/admin/dashboard',
        );
      },

      onError: (error) => {
        clearAuth();

        setErrorMessage(
          getApiErrorMessage(error),
        );
      },
    });

  const handleSubmit = (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        'Enter your email address.',
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        'Enter your password.',
      );

      return;
    }

    loginMutation.mutate({
      email: normalizedEmail,
      password,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">
          Email address
        </Label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@ogungas.com"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            disabled={
              loginMutation.isPending
            }
            className="h-12 pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            id="password"
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            disabled={
              loginMutation.isPending
            }
            className="h-12 pl-10 pr-11"
          />

          <button
            type="button"
            aria-label={
              showPassword
                ? 'Hide password'
                : 'Show password'
            }
            onClick={() =>
              setShowPassword(
                (value) => !value,
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={
          loginMutation.isPending
        }
        className="h-12 w-full"
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in to Admin'
        )}
      </Button>
    </form>
  );
}