'use client';

import {
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  useMutation,
} from '@tanstack/react-query';

import {
  CircleAlert,
  Loader2,
  UserRoundPlus,
} from 'lucide-react';

import {
  provisionBranchManager,
} from '@/lib/api/provisioning';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  Branch,
} from '@/types/branch';

import type {
  ManagedInvitation,
  ProvisionBranchManagerInput,
} from '@/types/provisioning';

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

import {
  Input,
} from '@/components/ui/input';

import {
  Label,
} from '@/components/ui/label';

interface ManagerInviteForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EMPTY_FORM:
  ManagerInviteForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

export function InviteBranchManagerDialog({
  branch,
  open,
  onOpenChange,
  onProvisioned,
}: {
  branch: Branch;
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  onProvisioned: (
    invitation:
      ManagedInvitation,
  ) =>
    | void
    | Promise<void>;
}) {
  const [
    form,
    setForm,
  ] = useState<
    ManagerInviteForm
  >(EMPTY_FORM);

  const [
    replacementConfirmed,
    setReplacementConfirmed,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const existingManager =
    branch.manager;

  const mutation =
    useMutation({
      mutationFn:
        provisionBranchManager,

      onSuccess:
        async (
          invitation,
        ) => {
          setErrorMessage(
            null,
          );

          await onProvisioned(
            invitation,
          );

          setForm(
            EMPTY_FORM,
          );

          setReplacementConfirmed(
            false,
          );

          onOpenChange(
            false,
          );
        },

      onError: (error) => {
        setErrorMessage(
          getApiErrorMessage(
            error,
          ),
        );
      },
    });

  const closeDialog = (
    nextOpen: boolean,
  ) => {
    if (
      !nextOpen &&
      !mutation.isPending
    ) {
      setForm(
        EMPTY_FORM,
      );

      setReplacementConfirmed(
        false,
      );

      setErrorMessage(
        null,
      );
    }

    onOpenChange(
      nextOpen,
    );
  };

  const setField = (
    field:
      keyof ManagerInviteForm,
    value: string,
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      }),
    );
  };

  const submit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage(
      null,
    );

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const phone =
      form.phone.trim();

    if (
      firstName.length <
        2 ||
      lastName.length <
        2
    ) {
      setErrorMessage(
        'First name and last name must each contain at least 2 characters.',
      );

      return;
    }

    if (
      !email ||
      !email.includes(
        '@',
      )
    ) {
      setErrorMessage(
        'Enter a valid manager email address.',
      );

      return;
    }

    if (!branch.isActive) {
      setErrorMessage(
        'Reactivate this branch before inviting a manager.',
      );

      return;
    }

    if (
      existingManager &&
      !replacementConfirmed
    ) {
      setErrorMessage(
        'Confirm the manager replacement before continuing.',
      );

      return;
    }

    const input:
      ProvisionBranchManagerInput = {
        branchId:
          branch.id,

        firstName,
        lastName,
        email,

        ...(phone
          ? {
              phone,
            }
          : {}),

        ...(existingManager
          ? {
              replaceExistingManager:
                true,
            }
          : {}),
      };

    mutation.mutate(
      input,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        closeDialog
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-slate-200 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex size-12 items-center justify-center rounded-[17px] bg-violet-50 text-violet-700">
            <UserRoundPlus className="size-5" />
          </div>

          <DialogTitle className="mt-3 font-serif text-2xl">
            {existingManager
              ? 'Replace branch manager'
              : 'Invite branch manager'}
          </DialogTitle>

          <DialogDescription>
            {existingManager
              ? `Provision a new Branch Manager for ${branch.name}. The existing assignment will be replaced only after you confirm below.`
              : `Provision a secure Branch Manager account for ${branch.name}.`}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            submit
          }
          className="space-y-5 px-6 py-6 sm:px-8"
        >
          {errorMessage ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          {existingManager ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                Current manager
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {existingManager.firstName}{' '}
                {existingManager.lastName}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {existingManager.email}
              </p>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                First name
              </Label>

              <Input
                required
                value={
                  form.firstName
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'firstName',
                    event.target.value,
                  )
                }
                placeholder="First name"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Last name
              </Label>

              <Input
                required
                value={
                  form.lastName
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'lastName',
                    event.target.value,
                  )
                }
                placeholder="Last name"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Email
              </Label>

              <Input
                required
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'email',
                    event.target.value,
                  )
                }
                placeholder="manager@example.com"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Phone
              </Label>

              <Input
                value={
                  form.phone
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'phone',
                    event.target.value,
                  )
                }
                placeholder="080..."
              />
            </div>
          </div>

          {existingManager ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  replacementConfirmed
                }
                onChange={(
                  event,
                ) =>
                  setReplacementConfirmed(
                    event.target.checked,
                  )
                }
                className="mt-1 size-4 rounded border-slate-300"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Confirm manager replacement
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  The new account will become this
                  branch&apos;s manager immediately
                  in a pending activation state.
                  The previous manager may be
                  deactivated if they manage no
                  other branch.
                </span>
              </span>
            </label>
          ) : null}

          <div className="rounded-[20px] border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-700">
            The invitee chooses their own password.
            Super Admin never needs to create or
            know the manager&apos;s password.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={
                mutation.isPending
              }
              onClick={() =>
                closeDialog(
                  false,
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !branch.isActive
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating invitation...
                </>
              ) : (
                <>
                  <UserRoundPlus className="size-4" />
                  {existingManager
                    ? 'Replace & invite'
                    : 'Create invitation'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}