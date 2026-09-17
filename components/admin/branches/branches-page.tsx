'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Edit3,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

import {
  createBranch,
  getManagementBranches,
  updateBranch,
} from '@/lib/api/branches';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
} from '@/types/branch';

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

const entrance = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

function BranchStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em]',
        active
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-rose-100 bg-rose-50 text-rose-600',
      ].join(' ')}
    >
      <motion.span
        animate={
          active
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(16,185,129,0)',
                  '0 0 0 5px rgba(16,185,129,0.09)',
                  '0 0 0 0 rgba(16,185,129,0)',
                ],
              }
            : undefined
        }
        transition={{
          duration: 2.3,
          repeat: Infinity,
        }}
        className={[
          'size-1.5 rounded-full',
          active
            ? 'bg-emerald-500'
            : 'bg-rose-500',
        ].join(' ')}
      />

      {active
        ? 'Active'
        : 'Inactive'}
    </div>
  );
}

function BranchCard({
  branch,
  index,
  onOpenWorkspace,
}: {
  branch: Branch;
  index: number;
  onOpenWorkspace: (
    branch: Branch,
  ) => void;
}) {
  return (
    <motion.article
      variants={entrance}
      initial="hidden"
      animate="visible"
      transition={{
        duration: 0.45,
        delay:
          Math.min(
            index * 0.06,
            0.3,
          ),
      }}
      whileHover={{
        y: -5,
      }}
      className="group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-emerald-100/50 blur-3xl transition duration-500 group-hover:scale-125" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: -5,
                scale: 1.05,
              }}
              className="flex size-12 items-center justify-center rounded-[17px] bg-emerald-50 text-emerald-700"
            >
              <Building2 className="size-5" />
            </motion.div>

            <div>
              <h3 className="font-serif text-lg font-semibold tracking-tight text-slate-950">
                {branch.name}
              </h3>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {branch.code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenWorkspace(
                branch,
              )
            }
            aria-label={
              `Open ${branch.name} workspace`
            }
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <MoreHorizontal className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5">
          <BranchStatus
            active={branch.isActive}
          />
        </div>

        <div className="mt-6 space-y-3.5">
          <div className="flex items-start gap-3 text-sm text-slate-500">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />

            <div>
              <p className="font-medium text-slate-700">
                {branch.city}
                {', '}
                {branch.state}
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-400">
                {branch.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Phone className="size-4 text-slate-400" />

            <span>
              {branch.phone ??
                'No branch phone'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Mail className="size-4 text-slate-400" />

            <span className="truncate">
              {branch.email ??
                'No branch email'}
            </span>
          </div>
        </div>

        <div className="my-5 border-t border-slate-100" />

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-slate-50 text-slate-500">
            <UserRound className="size-[17px]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              Branch manager
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
              {branch.manager
                ? `${branch.manager.firstName} ${branch.manager.lastName}`
                : 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/45 px-6 py-4">
        <button
          type="button"
          onClick={() =>
            onOpenWorkspace(
              branch,
            )
          }
          className="group/link flex w-full items-center justify-between text-xs font-semibold text-emerald-700"
        >
          Open branch workspace

          <ChevronRight className="size-4 transition-transform group-hover/link:translate-x-1" />
        </button>
      </div>
    </motion.article>
  );
}

interface FormState {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}

const initialFormState:
  FormState = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: 'Ogun',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
  };

function CreateBranchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (
    value: boolean,
  ) => void;
}) {
  const queryClient =
    useQueryClient();

  const [form, setForm] =
    useState<FormState>(
      initialFormState,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const createMutation =
    useMutation({
      mutationFn:
        createBranch,

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'branches',
          ],
        });

        setForm(
          initialFormState,
        );

        setErrorMessage(
          null,
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

  const setField = (
    field:
      keyof FormState,
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

  const handleSubmit = (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage(
      null,
    );

    const input:
      CreateBranchInput = {
        name:
          form.name.trim(),

        code:
          form.code
            .trim()
            .toUpperCase(),

        address:
          form.address.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),
      };

    if (
      form.phone.trim()
    ) {
      input.phone =
        form.phone.trim();
    }

    if (
      form.email.trim()
    ) {
      input.email =
        form.email
          .trim()
          .toLowerCase();
    }

    if (
      form.latitude.trim()
    ) {
      input.latitude =
        Number(
          form.latitude,
        );
    }

    if (
      form.longitude.trim()
    ) {
      input.longitude =
        Number(
          form.longitude,
        );
    }

    if (
      form.bankName.trim()
    ) {
      input.bankName =
        form.bankName.trim();
    }

    if (
      form.bankAccountName.trim()
    ) {
      input.bankAccountName =
        form.bankAccountName.trim();
    }

    if (
      form.bankAccountNumber.trim()
    ) {
      input.bankAccountNumber =
        form.bankAccountNumber.trim();
    }

    createMutation.mutate(
      input,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-slate-200 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex size-12 items-center justify-center rounded-[17px] bg-emerald-50 text-emerald-700">
            <Building2 className="size-5" />
          </div>

          <DialogTitle className="mt-3 font-serif text-2xl">
            Add new branch
          </DialogTitle>

          <DialogDescription>
            Create a new Ogun&apos;s
            Sure Gas operating
            location.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="px-6 py-6 sm:px-8"
        >
          {errorMessage ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Branch name
              </Label>

              <Input
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'name',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ogun Gas - Ota"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Branch code
              </Label>

              <Input
                value={
                  form.code
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'code',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="OTA-01"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Full address
              </Label>

              <Input
                value={
                  form.address
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'address',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Full branch address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                City
              </Label>

              <Input
                value={
                  form.city
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'city',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ota"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                State
              </Label>

              <Input
                value={
                  form.state
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'state',
                    event
                      .target
                      .value,
                  )
                }
                required
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
                    event
                      .target
                      .value,
                  )
                }
                placeholder="080..."
              />
            </div>

            <div className="space-y-2">
              <Label>
                Email
              </Label>

              <Input
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'email',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="branch@ogungas.com"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Latitude
              </Label>

              <Input
                type="number"
                step="any"
                value={
                  form.latitude
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'latitude',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="6.6840"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Longitude
              </Label>

              <Input
                type="number"
                step="any"
                value={
                  form.longitude
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'longitude',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="3.2030"
              />
            </div>
          </div>

          <div className="my-7 border-t border-slate-100" />

          <div className="mb-4 flex items-center gap-2">
            <Landmark className="size-4 text-emerald-700" />

            <h3 className="text-sm font-semibold text-slate-900">
              Settlement details
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Bank name
              </Label>

              <Input
                value={
                  form.bankName
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'bankName',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Bank"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Account number
              </Label>

              <Input
                value={
                  form.bankAccountNumber
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'bankAccountNumber',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="0000000000"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Account name
              </Label>

              <Input
                value={
                  form.bankAccountName
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'bankAccountName',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Ogun's Sure Gas"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                createMutation.isPending
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating branch...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Create branch
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function branchToForm(
  branch: Branch,
): FormState {
  return {
    name:
      branch.name,
    code:
      branch.code,
    address:
      branch.address,
    city:
      branch.city,
    state:
      branch.state,
    phone:
      branch.phone ?? '',
    email:
      branch.email ?? '',
    latitude:
      branch.latitude === null
        ? ''
        : String(
            branch.latitude,
          ),
    longitude:
      branch.longitude === null
        ? ''
        : String(
            branch.longitude,
          ),
    bankName:
      branch.bankName ?? '',
    bankAccountName:
      branch.bankAccountName ?? '',
    bankAccountNumber:
      branch.bankAccountNumber ?? '',
  };
}

function formatBranchDate(
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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

function BranchWorkspace({
  branch,
  onClose,
  onBranchUpdated,
}: {
  branch: Branch;
  onClose: () => void;
  onBranchUpdated: (
    branch: Branch,
  ) => void;
}) {
  const queryClient =
    useQueryClient();

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    confirmingStatus,
    setConfirmingStatus,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<FormState>(
    () =>
      branchToForm(
        branch,
      ),
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  );

  const setField = (
    field:
      keyof FormState,
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

  const syncQueries =
    async (
      updated:
        Branch,
    ) => {
      onBranchUpdated(
        updated,
      );

      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'branches',
        ],
      });
    };

  const editMutation =
    useMutation({
      mutationFn:
        (
          input:
            UpdateBranchInput,
        ) =>
          updateBranch(
            branch.id,
            input,
          ),

      onSuccess:
        async (
          updated,
        ) => {
          setErrorMessage(
            null,
          );

          setSuccessMessage(
            'Branch details updated successfully.',
          );

          setEditing(
            false,
          );

          setForm(
            branchToForm(
              updated,
            ),
          );

          await syncQueries(
            updated,
          );
        },

      onError: (error) => {
        setSuccessMessage(
          null,
        );

        setErrorMessage(
          getApiErrorMessage(
            error,
          ),
        );
      },
    });

  const statusMutation =
    useMutation({
      mutationFn: () =>
        updateBranch(
          branch.id,
          {
            isActive:
              !branch.isActive,
          },
        ),

      onSuccess:
        async (
          updated,
        ) => {
          setErrorMessage(
            null,
          );

          setSuccessMessage(
            updated.isActive
              ? 'Branch reactivated successfully.'
              : 'Branch deactivated successfully.',
          );

          setConfirmingStatus(
            false,
          );

          setForm(
            branchToForm(
              updated,
            ),
          );

          await syncQueries(
            updated,
          );
        },

      onError: (error) => {
        setSuccessMessage(
          null,
        );

        setErrorMessage(
          getApiErrorMessage(
            error,
          ),
        );

        setConfirmingStatus(
          false,
        );
      },
    });

  const submitEdit = (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage(
      null,
    );

    setSuccessMessage(
      null,
    );

    const latitude =
      form.latitude.trim()
        ? Number(
            form.latitude,
          )
        : null;

    const longitude =
      form.longitude.trim()
        ? Number(
            form.longitude,
          )
        : null;

    if (
      latitude !== null &&
      !Number.isFinite(
        latitude,
      )
    ) {
      setErrorMessage(
        'Latitude must be a valid number.',
      );

      return;
    }

    if (
      longitude !== null &&
      !Number.isFinite(
        longitude,
      )
    ) {
      setErrorMessage(
        'Longitude must be a valid number.',
      );

      return;
    }

    const input:
      UpdateBranchInput = {
        name:
          form.name.trim(),
        code:
          form.code
            .trim()
            .toUpperCase(),
        address:
          form.address.trim(),
        city:
          form.city.trim(),
        state:
          form.state.trim(),
        phone:
          form.phone.trim() ||
          null,
        email:
          form.email.trim()
            .toLowerCase() ||
          null,
        latitude,
        longitude,
        bankName:
          form.bankName.trim() ||
          null,
        bankAccountName:
          form.bankAccountName.trim() ||
          null,
        bankAccountNumber:
          form.bankAccountNumber.trim() ||
          null,
      };

    editMutation.mutate(
      input,
    );
  };

  const managerName =
    branch.manager
      ? `${branch.manager.firstName} ${branch.manager.lastName}`
      : 'Not assigned';

  const isBusy =
    editMutation.isPending ||
    statusMutation.isPending;

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-[2px]"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <motion.aside
        initial={{
          x: '100%',
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: '100%',
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-[#fbfcfb] shadow-[-24px_0_80px_rgba(15,23,42,0.12)] sm:max-w-2xl"
      >
        <div className="border-b border-slate-200/80 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <BranchStatus
                  active={
                    branch.isActive
                  }
                />

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {branch.code}
                </span>
              </div>

              <h2 className="mt-3 truncate font-serif text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {branch.name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Branch workspace
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              aria-label="Close branch workspace"
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {errorMessage ? (
            <div className="mb-5 flex items-start gap-3 rounded-[18px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />

              <p>
                {errorMessage}
              </p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-5 flex items-start gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              <p>
                {successMessage}
              </p>
            </div>
          ) : null}

          {editing ? (
            <form
              onSubmit={
                submitEdit
              }
              className="space-y-6"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Edit branch
                </p>

                <h3 className="mt-2 font-serif text-xl font-semibold text-slate-950">
                  Operating profile
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Update branch identity, contact, location and settlement details.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Branch name
                  </Label>

                  <Input
                    required
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'name',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Branch code
                  </Label>

                  <Input
                    required
                    value={
                      form.code
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'code',
                        event.target.value,
                      )
                    }
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
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Email
                  </Label>

                  <Input
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
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Address
                  </Label>

                  <Input
                    required
                    value={
                      form.address
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'address',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    City
                  </Label>

                  <Input
                    required
                    value={
                      form.city
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'city',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    State
                  </Label>

                  <Input
                    required
                    value={
                      form.state
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'state',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Latitude
                  </Label>

                  <Input
                    inputMode="decimal"
                    value={
                      form.latitude
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'latitude',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Longitude
                  </Label>

                  <Input
                    inputMode="decimal"
                    value={
                      form.longitude
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'longitude',
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Landmark className="size-4 text-emerald-700" />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Settlement details
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Bank name
                    </Label>

                    <Input
                      value={
                        form.bankName
                      }
                      onChange={(
                        event,
                      ) =>
                        setField(
                          'bankName',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Account number
                    </Label>

                    <Input
                      value={
                        form.bankAccountNumber
                      }
                      onChange={(
                        event,
                      ) =>
                        setField(
                          'bankAccountNumber',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>
                      Account name
                    </Label>

                    <Input
                      value={
                        form.bankAccountName
                      }
                      onChange={(
                        event,
                      ) =>
                        setField(
                          'bankAccountName',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    editMutation.isPending
                  }
                  onClick={() => {
                    setForm(
                      branchToForm(
                        branch,
                      ),
                    );

                    setErrorMessage(
                      null,
                    );

                    setEditing(
                      false,
                    );
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    editMutation.isPending
                  }
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Edit3 className="size-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <section className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
                      Overview
                    </p>

                    <h3 className="mt-2 font-serif text-lg font-semibold text-slate-950">
                      Operating location
                    </h3>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-[15px] bg-emerald-50 text-emerald-700">
                    <Building2 className="size-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {branch.city}
                        {', '}
                        {branch.state}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {branch.address}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Latitude
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {branch.latitude ??
                          'Not set'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Longitude
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {branch.longitude ??
                          'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <div className="flex size-10 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                    <Phone className="size-[18px]" />
                  </div>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Contact
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {branch.phone ??
                      'No branch phone'}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-400">
                    {branch.email ??
                      'No branch email'}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                  <div className="flex size-10 items-center justify-center rounded-[14px] bg-violet-50 text-violet-600">
                    <UserRound className="size-[18px]" />
                  </div>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Manager
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {managerName}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-400">
                    {branch.manager?.email ??
                      'No manager assigned'}
                  </p>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[14px] bg-amber-50 text-amber-600">
                    <Landmark className="size-[18px]" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Settlement
                    </p>

                    <h3 className="mt-1 text-sm font-semibold text-slate-900">
                      Bank profile
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Bank
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {branch.bankName ??
                        'Not set'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Account
                    </p>

                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                      {branch.bankAccountNumber ??
                        'Not set'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Name
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {branch.bankAccountName ??
                        'Not set'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                <div className="flex items-center gap-3">
                  <Clock3 className="size-4 text-slate-400" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Record history
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Created
                    </p>

                    <p className="mt-2 text-xs font-medium leading-5 text-slate-700">
                      {formatBranchDate(
                        branch.createdAt,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Last updated
                    </p>

                    <p className="mt-2 text-xs font-medium leading-5 text-slate-700">
                      {formatBranchDate(
                        branch.updatedAt,
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/80 bg-white p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
                    Management
                  </p>

                  <h3 className="mt-2 font-serif text-lg font-semibold text-slate-950">
                    Branch controls
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Update this branch or change whether it can operate on the network.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isBusy
                    }
                    onClick={() => {
                      setForm(
                        branchToForm(
                          branch,
                        ),
                      );

                      setErrorMessage(
                        null,
                      );

                      setSuccessMessage(
                        null,
                      );

                      setEditing(
                        true,
                      );
                    }}
                    className="h-11 justify-start rounded-2xl"
                  >
                    <Edit3 className="size-4" />
                    Edit branch
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isBusy
                    }
                    onClick={() => {
                      setErrorMessage(
                        null,
                      );

                      setSuccessMessage(
                        null,
                      );

                      setConfirmingStatus(
                        true,
                      );
                    }}
                    className={
                      branch.isActive
                        ? 'h-11 justify-start rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                        : 'h-11 justify-start rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }
                  >
                    {branch.isActive ? (
                      <Power className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}

                    {branch.isActive
                      ? 'Deactivate branch'
                      : 'Reactivate branch'}
                  </Button>
                </div>
              </section>
            </div>
          )}
        </div>
      </motion.aside>

      <AnimatePresence>
        {confirmingStatus ? (
          <motion.div
            className="absolute inset-0 z-20 flex items-end justify-center bg-slate-950/30 p-4 sm:items-center"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.98,
              }}
              className="w-full max-w-md rounded-[26px] border border-white/70 bg-white p-6 shadow-2xl"
            >
              <div
                className={[
                  'flex size-11 items-center justify-center rounded-[15px]',
                  branch.isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-700',
                ].join(' ')}
              >
                {branch.isActive ? (
                  <Power className="size-5" />
                ) : (
                  <RotateCcw className="size-5" />
                )}
              </div>

              <h3 className="mt-5 font-serif text-xl font-semibold text-slate-950">
                {branch.isActive
                  ? 'Deactivate branch?'
                  : 'Reactivate branch?'}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {branch.isActive
                  ? 'The backend will block this change if the branch still has active orders or deliveries.'
                  : 'This branch will become active on the operating network again.'}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    statusMutation.isPending
                  }
                  onClick={() =>
                    setConfirmingStatus(
                      false,
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  disabled={
                    statusMutation.isPending
                  }
                  onClick={() =>
                    statusMutation.mutate()
                  }
                  className={
                    branch.isActive
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }
                >
                  {statusMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : branch.isActive ? (
                    <>
                      <Power className="size-4" />
                      Confirm deactivation
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4" />
                      Confirm reactivation
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function BranchesPage() {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState<Branch | null>(
    null,
  );

  const branchesQuery =
    useQuery({
      queryKey: [
        'admin',
        'branches',
        'management',
      ],

      queryFn:
        getManagementBranches,

      staleTime:
        30 * 1000,
    });

  const branches =
    branchesQuery.data ??
    [];

  const filteredBranches =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return branches;
      }

      return branches.filter(
        (branch) =>
          [
            branch.name,
            branch.code,
            branch.city,
            branch.state,
            branch.address,
            branch.manager
              ? `${branch.manager.firstName} ${branch.manager.lastName}`
              : '',
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          ),
      );
    }, [
      branches,
      search,
    ]);

  const activeCount =
    branches.filter(
      (branch) =>
        branch.isActive,
    ).length;

  const managedCount =
    branches.filter(
      (branch) =>
        branch.manager !== null,
    ).length;

  const handleBranchUpdated = (
    updated: Branch,
  ) => {
    setSelectedBranch(
      updated,
    );
  };

  return (
    <>
      <div className="space-y-6">
        <motion.section
          variants={entrance}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.5,
          }}
          className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(120deg,#ffffff_0%,#f6fbf8_55%,#e8f6ef_100%)] p-7 shadow-[0_15px_60px_rgba(15,23,42,0.04)] sm:p-9"
        >
          <div className="absolute -right-16 -top-28 size-80 rounded-full bg-emerald-200/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Network management
              </div>

              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Branch network
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                Manage every Ogun&apos;s
                Sure Gas operating
                location, branch contact,
                manager and settlement
                profile from one place.
              </p>
            </div>

            <Button
              onClick={() =>
                setCreateOpen(
                  true,
                )
              }
              className="h-12 rounded-[15px] bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
            >
              <Plus className="size-4" />
              Add branch
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700">
                <Building2 className="size-[18px]" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Network
              </span>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {branches.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Visible branches
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                <CheckCircle2 className="size-[18px]" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Status
              </span>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {activeCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Active locations
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-[14px] bg-violet-50 text-violet-600">
                <ShieldCheck className="size-[18px]" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Management
              </span>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {managedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Branches with managers
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_50px_rgba(15,23,42,0.025)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-950">
                Operating locations
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Live data from the deployed backend.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Search branches..."
                className="h-11 rounded-2xl pl-11"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() =>
                    setSearch('')
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            {branchesQuery.isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-emerald-600" />

                  <p className="mt-3 text-sm text-slate-400">
                    Loading branch network...
                  </p>
                </div>
              </div>
            ) : branchesQuery.isError ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <CircleAlert className="mx-auto size-6 text-rose-500" />

                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    Unable to load branches
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    The backend could not return the branch network.
                  </p>

                  <Button
                    variant="outline"
                    onClick={() =>
                      branchesQuery.refetch()
                    }
                    className="mt-4"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-700">
                    <Building2 className="size-6" />
                  </div>

                  <h3 className="mt-4 font-serif text-lg font-semibold text-slate-950">
                    No branches found
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {search
                      ? 'No branch matches your search.'
                      : 'Create your first branch to start building the network.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredBranches.map(
                  (
                    branch,
                    index,
                  ) => (
                    <BranchCard
                      key={
                        branch.id
                      }
                      branch={
                        branch
                      }
                      index={
                        index
                      }
                      onOpenWorkspace={
                        setSelectedBranch
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <CreateBranchDialog
        open={createOpen}
        onOpenChange={
          setCreateOpen
        }
      />

      <AnimatePresence>
        {selectedBranch ? (
          <BranchWorkspace
            key={
              selectedBranch.id
            }
            branch={
              selectedBranch
            }
            onClose={() =>
              setSelectedBranch(
                null,
              )
            }
            onBranchUpdated={
              handleBranchUpdated
            }
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}