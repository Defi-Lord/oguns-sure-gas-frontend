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
  Bike,
  CircleAlert,
  Loader2,
  UserRoundPlus,
} from 'lucide-react';

import {
  provisionRider,
} from '@/lib/api/provisioning';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  RiderBranch,
} from '@/types/rider';

import type {
  ManagedInvitation,
  ProvisionRiderInput,
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

interface RiderInviteForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branchId: string;
  vehicleType: string;
  vehicleNumber: string;
}

const EMPTY_FORM:
  RiderInviteForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    branchId: '',
    vehicleType: '',
    vehicleNumber: '',
  };

export function InviteRiderDialog({
  open,
  onOpenChange,
  branches,
  onProvisioned,
}: {
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  branches: RiderBranch[];
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
    RiderInviteForm
  >(EMPTY_FORM);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const activeBranches =
    branches.filter(
      (branch) =>
        branch.isActive,
    );

  const mutation =
    useMutation({
      mutationFn:
        provisionRider,

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
      keyof RiderInviteForm,
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

    const vehicleType =
      form.vehicleType.trim();

    const vehicleNumber =
      form.vehicleNumber.trim();

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
        'Enter a valid rider email address.',
      );

      return;
    }

    if (!form.branchId) {
      setErrorMessage(
        'Select the rider branch.',
      );

      return;
    }

    const input:
      ProvisionRiderInput = {
        branchId:
          form.branchId,

        firstName,
        lastName,
        email,

        ...(phone
          ? {
              phone,
            }
          : {}),

        ...(vehicleType
          ? {
              vehicleType,
            }
          : {}),

        ...(vehicleNumber
          ? {
              vehicleNumber,
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
          <div className="flex size-12 items-center justify-center rounded-[17px] bg-blue-50 text-blue-700">
            <Bike className="size-5" />
          </div>

          <DialogTitle className="mt-3 font-serif text-2xl">
            Invite rider
          </DialogTitle>

          <DialogDescription>
            Create the Rider login account and
            rider profile together. The rider
            starts inactive and unavailable until
            they accept the invitation.
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
                placeholder="rider@example.com"
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>
                Branch
              </Label>

              <select
                required
                value={
                  form.branchId
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'branchId',
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">
                  Select branch
                </option>

                {activeBranches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {branch.name}
                      {' Â· '}
                      {branch.code}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label>
                Vehicle type
              </Label>

              <Input
                value={
                  form.vehicleType
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'vehicleType',
                    event.target.value,
                  )
                }
                placeholder="Motorcycle"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Vehicle number
              </Label>

              <Input
                value={
                  form.vehicleNumber
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'vehicleNumber',
                    event.target.value,
                  )
                }
                placeholder="ABC-123"
              />
            </div>
          </div>

          {activeBranches.length ===
          0 ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-700">
              No active branch is available.
              Reactivate or create a branch before
              inviting a rider.
            </div>
          ) : (
            <div className="rounded-[20px] border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-700">
              Rider availability starts OFF.
              Delivery assignment remains blocked
              until the rider activates their
              account and is later marked
              available.
            </div>
          )}

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
                activeBranches.length ===
                  0
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
                  Create rider invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}