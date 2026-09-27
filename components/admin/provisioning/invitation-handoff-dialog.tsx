'use client';

import {
  useState,
} from 'react';

import {
  Check,
  Clock3,
  Copy,
  Link2,
  ShieldCheck,
} from 'lucide-react';

import {
  Button,
} from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type {
  ManagedInvitationHandoff,
} from '@/types/provisioning';

function formatInviteExpiry(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      dateStyle:
        'medium',
      timeStyle:
        'short',
    },
  ).format(date);
}

function roleLabel(
  role:
    ManagedInvitationHandoff[
      'account'
    ]['role'],
) {
  return role ===
    'BRANCH_MANAGER'
    ? 'Branch Manager'
    : 'Rider';
}

export function InvitationHandoffDialog({
  open,
  onOpenChange,
  invitation,
}: {
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  invitation:
    | ManagedInvitationHandoff
    | null;
}) {
  const [
    copied,
    setCopied,
  ] = useState<
    | 'token'
    | 'link'
    | null
  >(null);

  const handleOpenChange = (
    nextOpen: boolean,
  ) => {
    if (!nextOpen) {
      setCopied(null);
    }

    onOpenChange(
      nextOpen,
    );
  };

  const copyValue =
    async (
      value: string,
      kind:
        | 'token'
        | 'link',
    ) => {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(
        kind,
      );
    };

  if (!invitation) {
    return null;
  }

  const relativeInviteUrl =
    `/invite/accept?token=${encodeURIComponent(
      invitation.invitationToken,
    )}`;

  const label =
    roleLabel(
      invitation.account.role,
    );

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-slate-200 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex size-12 items-center justify-center rounded-[17px] bg-emerald-50 text-emerald-700">
            <ShieldCheck className="size-5" />
          </div>

          <DialogTitle className="mt-3 font-serif text-2xl">
            {label} invitation ready
          </DialogTitle>

          <DialogDescription>
            Share this invitation securely with{' '}
            {invitation.account.firstName}{' '}
            {invitation.account.lastName}.
            The account stays inactive until the
            invitation is accepted and a password
            is created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Pending activation
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {invitation.account.email}
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <Clock3 className="size-4 text-emerald-700" />
              Expires{' '}
              {formatInviteExpiry(
                invitation.inviteExpiresAt,
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
              Invitation token
            </label>

            <textarea
              readOnly
              value={
                invitation.invitationToken
              }
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-5 text-slate-700 outline-none"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void copyValue(
                  invitation.invitationToken,
                  'token',
                )
              }
              className="mt-3"
            >
              {copied ===
              'token' ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied ===
              'token'
                ? 'Token copied'
                : 'Copy token'}
            </Button>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
              Recommended handoff
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Send the secure acceptance link.
              It opens the MySureGas password
              setup screen and activates the
              account only after successful
              acceptance.
            </p>

            <Button
              type="button"
              onClick={() => {
                const absoluteUrl =
                  `${window.location.origin}${relativeInviteUrl}`;

                void copyValue(
                  absoluteUrl,
                  'link',
                );
              }}
              className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {copied ===
              'link' ? (
                <Check className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}

              {copied ===
              'link'
                ? 'Acceptance link copied'
                : 'Copy acceptance link'}
            </Button>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            For security, do not post invitation
            tokens publicly. If the invitation
            expires, Super Admin can issue a new
            one from the relevant manager or rider
            workspace.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}