'use client';

import {
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import Link from 'next/link';

import {
  useSearchParams,
} from 'next/navigation';

import {
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import {
  acceptManagedInvitation,
} from '@/lib/api/provisioning';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  AcceptManagedInvitationResult,
} from '@/types/provisioning';

import {
  Button,
} from '@/components/ui/button';

import {
  Input,
} from '@/components/ui/input';

import {
  Label,
} from '@/components/ui/label';

export function AcceptManagedInvite() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams
      .get('token')
      ?.trim() ??
    '';

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const [
    accepted,
    setAccepted,
  ] = useState<
    AcceptManagedInvitationResult
      | null
  >(null);

  const submit = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage(
      null,
    );

    if (!token) {
      setErrorMessage(
        'This invitation link is missing its secure token.',
      );

      return;
    }

    if (
      password.length <
        8
    ) {
      setErrorMessage(
        'Password must contain at least 8 characters.',
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        'The password confirmation does not match.',
      );

      return;
    }

    setSubmitting(
      true,
    );

    try {
      const result =
        await acceptManagedInvitation(
          {
            token,
            password,
          },
        );

      setAccepted(
        result,
      );

      setPassword('');
      setConfirmPassword('');

      window.history.replaceState(
        null,
        '',
        '/invite/accept',
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
        ),
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  };

  if (accepted) {
    const isManager =
      accepted.account.role ===
      'BRANCH_MANAGER';

    return (
      <main className="min-h-screen bg-[linear-gradient(145deg,#f8fbf9_0%,#eef8f2_48%,#ffffff_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[78vh] max-w-xl items-center">
          <section className="w-full rounded-[32px] border border-white/80 bg-white p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="flex size-14 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Account activated
            </p>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-950">
              Welcome to MySureGas
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {accepted.account.firstName}{' '}
              {accepted.account.lastName},
              your{' '}
              {isManager
                ? 'Branch Manager'
                : 'Rider'}{' '}
              account is now active.
            </p>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">
                Sign-in email
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {accepted.account.email}
              </p>
            </div>

            {isManager ? (
              <Link
                href="/admin/login"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Go to admin sign in
              </Link>
            ) : (
              <div className="mt-6 rounded-[22px] border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-700">
                Your Rider account is ready.
                Use this email and the password
                you just created when signing in
                to the MySureGas Rider interface.
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#f8fbf9_0%,#eef8f2_48%,#ffffff_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[78vh] max-w-xl items-center">
        <section className="w-full rounded-[32px] border border-white/80 bg-white p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="flex size-14 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-700">
            <KeyRound className="size-6" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Secure invitation
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-950">
            Activate your MySureGas account
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Create your password to accept this
            managed account invitation. The
            invitation can only be used while the
            account is still pending activation.
          </p>

          {!token ? (
            <div className="mt-6 flex items-start gap-3 rounded-[20px] border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              This invitation link is incomplete.
              Ask the MySureGas administrator for
              a fresh invitation link.
            </div>
          ) : (
            <form
              onSubmit={
                submit
              }
              className="mt-7 space-y-5"
            >
              {errorMessage ? (
                <div className="flex items-start gap-3 rounded-[20px] border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>
                  Create password
                </Label>

                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  minLength={8}
                  maxLength={72}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Confirm password
                </Label>

                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  minLength={8}
                  maxLength={72}
                  placeholder="Repeat your password"
                />
              </div>

              <div className="flex items-start gap-3 rounded-[20px] border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-700">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Your password is sent only to the
                MySureGas API over the configured
                secure connection. Super Admin
                does not receive your password.
              </div>

              <Button
                type="submit"
                disabled={
                  submitting
                }
                className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Activating account...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Activate account
                  </>
                )}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}