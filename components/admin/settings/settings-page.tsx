'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Gift,
  Landmark,
  Loader2,
  MapPin,
  MapPinned,
  PackageSearch,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from 'lucide-react';

import {
  getManagementBranches,
  updateBranch,
} from '@/lib/api/branches';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  createDeliveryZone,
  getDeliveryZones,
  getPlatformFeeConfig,
  getSettingsProfile,
  updateDeliveryZone,
  updatePlatformFeeConfig,
  updateSettingsProfile,
} from '@/lib/api/settings';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  Branch,
  UpdateBranchInput,
} from '@/types/branch';

import type {
  CreateDeliveryZoneInput,
  DeliveryZone,
  PlatformFeeConfig,
  SettingsProfile,
  UpdateDeliveryZoneInput,
} from '@/types/settings';

type SettingsSection =
  | 'ACCOUNT'
  | 'BRANCH'
  | 'DELIVERY'
  | 'PLATFORM';

interface BranchFormState {
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

interface ZoneFormState {
  name: string;
  code: string;
  area: string;
  city: string;
  state: string;
  deliveryFee: string;
}

const EMPTY_BRANCH_FORM:
  BranchFormState = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
  };

const EMPTY_ZONE_FORM:
  ZoneFormState = {
    name: '',
    code: '',
    area: '',
    city: '',
    state: '',
    deliveryFee: '',
  };

const formatMoney =
  (
    value:
      number,
  ): string =>
    new Intl.NumberFormat(
      'en-NG',
      {
        style:
          'currency',
        currency:
          'NGN',
        maximumFractionDigits:
          0,
      },
    ).format(value);

const formatPlatformMoney =
  (
    value:
      number,
  ): string =>
    new Intl.NumberFormat(
      'en-NG',
      {
        style:
          'currency',
        currency:
          'NGN',
        minimumFractionDigits:
          2,
        maximumFractionDigits:
          2,
      },
    ).format(value);

const formatDate =
  (
    value?:
      string,
  ): string => {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '—';
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
  };

const nullableText =
  (
    value:
      string,
  ): string | null =>
    value.trim() ||
    null;

const optionalCoordinate =
  (
    value:
      string,
    label:
      string,
  ): number | null => {
    const clean =
      value.trim();

    if (!clean) {
      return null;
    }

    const number =
      Number(clean);

    if (
      !Number.isFinite(
        number,
      )
    ) {
      throw new Error(
        `${label} must be a valid number.`,
      );
    }

    return number;
  };

const profileInitials =
  (
    profile:
      SettingsProfile | null,
  ): string => {
    if (!profile) {
      return 'SA';
    }

    const first =
      profile.firstName
        ?.trim()
        .charAt(0) ??
      '';

    const last =
      profile.lastName
        ?.trim()
        .charAt(0) ??
      '';

    return (
      `${first}${last}` ||
      'SA'
    ).toUpperCase();
  };

function SectionTab({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        'rounded-3xl border p-4 text-left transition md:p-5',
        active
          ? 'border-emerald-300 bg-emerald-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40',
      ].join(' ')}
    >
      <div
        className={[
          'flex size-10 items-center justify-center rounded-2xl',
          active
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-600',
        ].join(' ')}
      >
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-950">
        {label}
      </p>

      <p className="mt-1 hidden text-xs leading-5 text-slate-500 lg:block">
        {description}
      </p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type =
    'text',
  disabled =
    false,
  helper,
}: {
  label: string;
  value: string;
  onChange?: (
    value: string,
  ) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={
          onChange
            ? (
                event,
              ) =>
                onChange(
                  event.target
                    .value,
                )
            : undefined
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />

      {helper && (
        <p className="text-[11px] leading-5 text-slate-400">
          {helper}
        </p>
      )}
    </label>
  );
}

function Notice({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

      <p className="flex-1">
        {message}
      </p>

      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={
          onClose
        }
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function ErrorBanner({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>
        {message}
      </p>
    </div>
  );
}

function AccountSettings({
  profile,
  isLoading,
  error,
  onSaved,
}: {
  profile:
    SettingsProfile | null;
  isLoading: boolean;
  error:
    string | null;
  onSaved: (
    profile:
      SettingsProfile,
  ) => void;
}) {
  const queryClient =
    useQueryClient();

  const setUser =
    useAuthStore(
      (
        state,
      ) =>
        state.setUser,
    );

  const [
    firstName,
    setFirstName,
  ] =
    useState('');

  const [
    lastName,
    setLastName,
  ] =
    useState('');

  const [
    phone,
    setPhone,
  ] =
    useState('');

  const [
    formError,
    setFormError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- editable form state is intentionally synchronized from asynchronously loaded profile data. */
      if (!profile) {
        return;
      }

      setFirstName(
        profile.firstName,
      );
      setLastName(
        profile.lastName,
      );
      setPhone(
        profile.phone ??
          '',
      );
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      profile,
    ],
  );

  const mutation =
    useMutation({
      mutationFn:
        updateSettingsProfile,

      onSuccess:
        async (
          updated,
        ) => {
          setUser(
            updated,
          );

          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin-session',
              ],
            });

          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin',
                'settings',
                'profile',
              ],
            });

          setFormError(
            null,
          );
          onSaved(
            updated,
          );
        },

      onError:
        (
          mutationError,
        ) => {
          setFormError(
            getApiErrorMessage(
              mutationError,
            ),
          );
        },
    });

  const save =
    () => {
      setFormError(
        null,
      );

      const cleanFirst =
        firstName.trim();

      const cleanLast =
        lastName.trim();

      if (
        cleanFirst.length <
          2 ||
        cleanFirst.length >
          50
      ) {
        setFormError(
          'First name must be between 2 and 50 characters.',
        );
        return;
      }

      if (
        cleanLast.length <
          2 ||
        cleanLast.length >
          50
      ) {
        setFormError(
          'Last name must be between 2 and 50 characters.',
        );
        return;
      }

      const cleanPhone =
        phone.trim();

      if (
        cleanPhone &&
        (
          cleanPhone.length <
            7 ||
          cleanPhone.length >
            20
        )
      ) {
        setFormError(
          'Phone number must be between 7 and 20 characters.',
        );
        return;
      }

      mutation.mutate({
        firstName:
          cleanFirst,
        lastName:
          cleanLast,
        phone:
          cleanPhone ||
          null,
      });
    };

  if (
    isLoading
  ) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="size-5 animate-spin text-emerald-600" />
          Loading account settings...
        </div>
      </div>
    );
  }

  if (
    error ||
    !profile
  ) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <ErrorBanner
          message={
            error ??
            'Unable to load your administrator profile.'
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex size-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-cyan-500 text-2xl font-semibold text-white shadow-lg shadow-emerald-500/20">
          {
            profileInitials(
              profile,
            )
          }
        </div>

        <h2 className="mt-5 text-xl font-semibold text-slate-950">
          {profile.firstName}{' '}
          {profile.lastName}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {profile.email}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Super Admin
          </span>

          <span
            className={[
              'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
              profile.status ===
              'ACTIVE'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            ].join(' ')}
          >
            {
              profile.status
            }
          </span>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            Protected administrator account
          </div>

          {profile.updatedAt && (
            <p>
              Last profile update:{' '}
              <span className="font-medium text-slate-700">
                {
                  formatDate(
                    profile.updatedAt,
                  )
                }
              </span>
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Administrator profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Update the contact information attached to your Super Admin
            account. Your login email is read-only in the current account API.
          </p>
        </div>

        {formError && (
          <div className="mt-5">
            <ErrorBanner
              message={
                formError
              }
            />
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="First name"
            value={
              firstName
            }
            onChange={
              setFirstName
            }
          />

          <Field
            label="Last name"
            value={
              lastName
            }
            onChange={
              setLastName
            }
          />

          <Field
            label="Email"
            value={
              profile.email
            }
            disabled
            helper="Email changes are not exposed by the current profile API."
          />

          <Field
            label="Phone"
            value={
              phone
            }
            onChange={
              setPhone
            }
            placeholder="e.g. 08012345678"
          />
        </div>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={
              save
            }
            disabled={
              mutation
                .isPending
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation
              .isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            Save profile
          </button>
        </div>
      </section>
    </div>
  );
}

function BranchOperations({
  branches,
  selectedBranchId,
  onSelectedBranchId,
  isLoading,
  error,
  onSaved,
}: {
  branches:
    Branch[];
  selectedBranchId:
    string;
  onSelectedBranchId:
    (
      value:
        string,
    ) => void;
  isLoading:
    boolean;
  error:
    string | null;
  onSaved:
    (
      message:
        string,
    ) => void;
}) {
  const queryClient =
    useQueryClient();

  const selectedBranch =
    branches.find(
      (
        branch,
      ) =>
        branch.id ===
        selectedBranchId,
    ) ??
    null;

  const [
    form,
    setForm,
  ] =
    useState<BranchFormState>(
      EMPTY_BRANCH_FORM,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- editable branch draft intentionally follows the selected branch. */
      if (
        !selectedBranch
      ) {
        setForm(
          EMPTY_BRANCH_FORM,
        );
        return;
      }

      setForm({
        name:
          selectedBranch.name,
        code:
          selectedBranch.code,
        address:
          selectedBranch.address,
        city:
          selectedBranch.city,
        state:
          selectedBranch.state,
        phone:
          selectedBranch.phone ??
          '',
        email:
          selectedBranch.email ??
          '',
        latitude:
          selectedBranch.latitude ===
          null
            ? ''
            : String(
                selectedBranch.latitude,
              ),
        longitude:
          selectedBranch.longitude ===
          null
            ? ''
            : String(
                selectedBranch.longitude,
              ),
        bankName:
          selectedBranch.bankName ??
          '',
        bankAccountName:
          selectedBranch.bankAccountName ??
          '',
        bankAccountNumber:
          selectedBranch.bankAccountNumber ??
          '',
      });

      setFormError(
        null,
      );
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      selectedBranch,
    ],
  );

  const updateMutation =
    useMutation({
      mutationFn:
        ({
          branchId,
          input,
        }: {
          branchId:
            string;
          input:
            UpdateBranchInput;
        }) =>
          updateBranch(
            branchId,
            input,
          ),

      onSuccess:
        async (
          updated,
        ) => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'admin',
                  'branches',
                  'management',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'branches',
                ],
              }),
          ]);

          setFormError(
            null,
          );

          onSaved(
            `${updated.name} was updated successfully.`,
          );
        },

      onError:
        (
          mutationError,
        ) => {
          setFormError(
            getApiErrorMessage(
              mutationError,
            ),
          );
        },
    });

  const save =
    () => {
      if (
        !selectedBranch
      ) {
        return;
      }

      setFormError(
        null,
      );

      if (
        form.name
          .trim()
          .length <
        2
      ) {
        setFormError(
          'Branch name is required.',
        );
        return;
      }

      if (
        !form.code
          .trim()
      ) {
        setFormError(
          'Branch code is required.',
        );
        return;
      }

      if (
        !form.address
          .trim() ||
        !form.city
          .trim() ||
        !form.state
          .trim()
      ) {
        setFormError(
          'Address, city and state are required.',
        );
        return;
      }

      if (
        form.email
          .trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim(),
        )
      ) {
        setFormError(
          'Enter a valid branch email address.',
        );
        return;
      }

      let latitude:
        number | null;

      let longitude:
        number | null;

      try {
        latitude =
          optionalCoordinate(
            form.latitude,
            'Latitude',
          );

        longitude =
          optionalCoordinate(
            form.longitude,
            'Longitude',
          );
      } catch (
        coordinateError
      ) {
        setFormError(
          coordinateError instanceof
            Error
            ? coordinateError.message
            : 'Invalid branch coordinates.',
        );
        return;
      }

      updateMutation.mutate({
        branchId:
          selectedBranch.id,

        input: {
          name:
            form.name.trim(),
          code:
            form.code.trim(),
          address:
            form.address.trim(),
          city:
            form.city.trim(),
          state:
            form.state.trim(),
          phone:
            nullableText(
              form.phone,
            ),
          email:
            nullableText(
              form.email,
            ),
          latitude,
          longitude,
          bankName:
            nullableText(
              form.bankName,
            ),
          bankAccountName:
            nullableText(
              form.bankAccountName,
            ),
          bankAccountNumber:
            nullableText(
              form.bankAccountNumber,
            ),
        },
      });
    };

  const toggleStatus =
    () => {
      if (
        !selectedBranch
      ) {
        return;
      }

      const activating =
        !selectedBranch.isActive;

      if (
        !activating
      ) {
        const confirmed =
          window.confirm(
            `Deactivate ${selectedBranch.name}? The backend will block this if the branch still has active orders or deliveries.`,
          );

        if (
          !confirmed
        ) {
          return;
        }
      }

      updateMutation.mutate({
        branchId:
          selectedBranch.id,
        input: {
          isActive:
            activating,
        },
      });
    };

  if (
    isLoading
  ) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
        <Loader2 className="size-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <ErrorBanner
          message={
            error
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Building2 className="size-4 text-emerald-600" />
              Branch configuration
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage the business identity, location, contact, banking and
              operational status for a branch.
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Branch
            </span>

            <select
              value={
                selectedBranchId
              }
              onChange={(
                event,
              ) =>
                onSelectedBranchId(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                Select branch
              </option>

              {branches.map(
                (
                  branch,
                ) => (
                  <option
                    key={
                      branch.id
                    }
                    value={
                      branch.id
                    }
                  >
                    {
                      branch.name
                    }{' '}
                    ({branch.code})
                    {
                      branch.isActive
                        ? ''
                        : ' — Inactive'
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      {!selectedBranch ? (
        <section className="flex min-h-80 flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
            <Building2 className="size-6" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-slate-950">
            Choose a branch
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Select the branch whose operating information you want to manage.
          </p>
        </section>
      ) : (
        <>
          {formError && (
            <ErrorBanner
              message={
                formError
              }
            />
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Business & location
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    These details are used by the branch management and
                    fulfillment flows.
                  </p>
                </div>

                <span
                  className={[
                    'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold',
                    selectedBranch.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700',
                  ].join(' ')}
                >
                  {
                    selectedBranch.isActive
                      ? 'Active'
                      : 'Inactive'
                  }
                </span>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field
                  label="Branch name"
                  value={
                    form.name
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          value,
                      }),
                    )
                  }
                />

                <Field
                  label="Branch code"
                  value={
                    form.code
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        code:
                          value,
                      }),
                    )
                  }
                />

                <div className="md:col-span-2">
                  <Field
                    label="Address"
                    value={
                      form.address
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          address:
                            value,
                        }),
                      )
                    }
                  />
                </div>

                <Field
                  label="City"
                  value={
                    form.city
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        city:
                          value,
                      }),
                    )
                  }
                />

                <Field
                  label="State"
                  value={
                    form.state
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        state:
                          value,
                      }),
                    )
                  }
                />

                <Field
                  label="Phone"
                  value={
                    form.phone
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        phone:
                          value,
                      }),
                    )
                  }
                />

                <Field
                  label="Email"
                  value={
                    form.email
                  }
                  type="email"
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        email:
                          value,
                      }),
                    )
                  }
                />

                <Field
                  label="Latitude"
                  value={
                    form.latitude
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        latitude:
                          value,
                      }),
                    )
                  }
                  placeholder="e.g. 6.6847"
                />

                <Field
                  label="Longitude"
                  value={
                    form.longitude
                  }
                  onChange={(
                    value,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        longitude:
                          value,
                      }),
                    )
                  }
                  placeholder="e.g. 3.1986"
                />
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <Landmark className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Branch banking
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Account information associated with this branch.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <Field
                    label="Bank name"
                    value={
                      form.bankName
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          bankName:
                            value,
                        }),
                      )
                    }
                  />

                  <Field
                    label="Account name"
                    value={
                      form.bankAccountName
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          bankAccountName:
                            value,
                        }),
                      )
                    }
                  />

                  <Field
                    label="Account number"
                    value={
                      form.bankAccountNumber
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          bankAccountNumber:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Branch status
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Inactive branches are unavailable to operational flows.
                    </p>
                  </div>

                  <Power
                    className={[
                      'size-5',
                      selectedBranch.isActive
                        ? 'text-emerald-600'
                        : 'text-rose-600',
                    ].join(' ')}
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    toggleStatus
                  }
                  disabled={
                    updateMutation
                      .isPending
                  }
                  className={[
                    'mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition disabled:opacity-50',
                    selectedBranch.isActive
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                  ].join(' ')}
                >
                  {updateMutation
                    .isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {
                    selectedBranch.isActive
                      ? 'Deactivate branch'
                      : 'Reactivate branch'
                  }
                </button>

                <p className="mt-3 text-[11px] leading-5 text-slate-400">
                  Deactivation is protected by the backend and will be rejected
                  while the branch has active orders or deliveries.
                </p>
              </section>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={
                save
              }
              disabled={
                updateMutation
                  .isPending
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {updateMutation
                .isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              Save branch settings
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryZoneEditor({
  open,
  branch,
  editing,
  onClose,
  onSaved,
}: {
  open:
    boolean;
  branch:
    Branch | null;
  editing:
    DeliveryZone | null;
  onClose:
    () => void;
  onSaved:
    (
      message:
        string,
    ) => void;
}) {
  const queryClient =
    useQueryClient();

  const [
    form,
    setForm,
  ] =
    useState<ZoneFormState>(
      EMPTY_ZONE_FORM,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- modal draft is intentionally reset when its editing target/open state changes. */
      if (
        !open
      ) {
        return;
      }

      if (
        editing
      ) {
        setForm({
          name:
            editing.name,
          code:
            editing.code,
          area:
            editing.area,
          city:
            editing.city,
          state:
            editing.state,
          deliveryFee:
            String(
              editing.deliveryFee,
            ),
        });
      } else {
        setForm({
          ...EMPTY_ZONE_FORM,
          city:
            branch?.city ??
            '',
          state:
            branch?.state ??
            '',
        });
      }

      setError(
        null,
      );
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      branch,
      editing,
      open,
    ],
  );

  const createMutation =
    useMutation({
      mutationFn:
        createDeliveryZone,

      onSuccess:
        async (
          zone,
        ) => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin',
                'settings',
                'delivery-zones',
              ],
            });

          onSaved(
            `${zone.name} delivery zone was created.`,
          );
          onClose();
        },

      onError:
        (
          mutationError,
        ) =>
          setError(
            getApiErrorMessage(
              mutationError,
            ),
          ),
    });

  const updateMutation =
    useMutation({
      mutationFn:
        ({
          id,
          input,
        }: {
          id: string;
          input:
            UpdateDeliveryZoneInput;
        }) =>
          updateDeliveryZone(
            id,
            input,
          ),

      onSuccess:
        async (
          zone,
        ) => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin',
                'settings',
                'delivery-zones',
              ],
            });

          onSaved(
            `${zone.name} delivery zone was updated.`,
          );
          onClose();
        },

      onError:
        (
          mutationError,
        ) =>
          setError(
            getApiErrorMessage(
              mutationError,
            ),
          ),
    });

  if (
    !open
  ) {
    return null;
  }

  const saving =
    createMutation
      .isPending ||
    updateMutation
      .isPending;

  const save =
    () => {
      if (
        !branch
      ) {
        setError(
          'Choose a branch first.',
        );
        return;
      }

      setError(
        null,
      );

      const name =
        form.name.trim();
      const code =
        form.code.trim();
      const area =
        form.area.trim();
      const city =
        form.city.trim();
      const state =
        form.state.trim();
      const deliveryFee =
        Number(
          form.deliveryFee,
        );

      if (
        !name ||
        !code ||
        !area ||
        !city ||
        !state
      ) {
        setError(
          'Name, code, area, city and state are required.',
        );
        return;
      }

      if (
        !Number.isFinite(
          deliveryFee,
        ) ||
        deliveryFee <
          0
      ) {
        setError(
          'Enter a valid delivery fee.',
        );
        return;
      }

      if (
        editing
      ) {
        updateMutation
          .mutate({
            id:
              editing.id,
            input: {
              name,
              code,
              area,
              city,
              state,
              deliveryFee,
            },
          });

        return;
      }

      const input:
        CreateDeliveryZoneInput =
        {
          branchId:
            branch.id,
          name,
          code,
          area,
          city,
          state,
          deliveryFee,
        };

      createMutation
        .mutate(
          input,
        );
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close delivery zone editor"
        className="absolute inset-0"
        onClick={
          onClose
        }
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
              <Truck className="size-3.5" />
              Delivery pricing
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {editing
                ? 'Edit delivery zone'
                : 'Add delivery zone'}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {branch?.name ??
                'Selected branch'}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={
              onClose
            }
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-5 p-6">
          {error && (
            <ErrorBanner
              message={
                error
              }
            />
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Zone name"
              value={
                form.name
              }
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    name:
                      value,
                  }),
                )
              }
              placeholder="e.g. Ota Central"
            />

            <Field
              label="Zone code"
              value={
                form.code
              }
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    code:
                      value,
                  }),
                )
              }
              placeholder="e.g. OTA-CENTRAL"
            />

            <Field
              label="Area"
              value={
                form.area
              }
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    area:
                      value,
                  }),
                )
              }
              placeholder="Customer address area"
            />

            <Field
              label="Delivery fee"
              value={
                form.deliveryFee
              }
              type="number"
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    deliveryFee:
                      value,
                  }),
                )
              }
              placeholder="0"
            />

            <Field
              label="City"
              value={
                form.city
              }
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    city:
                      value,
                  }),
                )
              }
            />

            <Field
              label="State"
              value={
                form.state
              }
              onChange={(
                value,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,
                    state:
                      value,
                  }),
                )
              }
            />
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-800">
            Checkout resolves delivery fees from active delivery zones that
            match the customer&apos;s area, city and state for the fulfillment
            branch.
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                save
              }
              disabled={
                saving
              }
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              {editing
                ? 'Save zone'
                : 'Create zone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliverySettings({
  branches,
  selectedBranchId,
  onSelectedBranchId,
  branchLoading,
  branchError,
  onSaved,
}: {
  branches:
    Branch[];
  selectedBranchId:
    string;
  onSelectedBranchId:
    (
      value:
        string,
    ) => void;
  branchLoading:
    boolean;
  branchError:
    string | null;
  onSaved:
    (
      message:
        string,
    ) => void;
}) {
  const queryClient =
    useQueryClient();

  const selectedBranch =
    branches.find(
      (
        branch,
      ) =>
        branch.id ===
        selectedBranchId,
    ) ??
    null;

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    editingZone,
    setEditingZone,
  ] =
    useState<
      DeliveryZone | null
    >(null);

  const zonesQuery =
    useQuery({
      queryKey: [
        'admin',
        'settings',
        'delivery-zones',
        selectedBranchId,
      ],

      queryFn: () =>
        getDeliveryZones({
          branchId:
            selectedBranchId,
        }),

      enabled:
        Boolean(
          selectedBranchId,
        ),
    });

  const toggleMutation =
    useMutation({
      mutationFn:
        (
          zone:
            DeliveryZone,
        ) =>
          updateDeliveryZone(
            zone.id,
            {
              isActive:
                !zone.isActive,
            },
          ),

      onSuccess:
        async (
          zone,
        ) => {
          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin',
                'settings',
                'delivery-zones',
              ],
            });

          onSaved(
            `${zone.name} is now ${
              zone.isActive
                ? 'active'
                : 'inactive'
            }.`,
          );
        },
    });

  const zones =
    zonesQuery.data ??
    [];

  const activeCount =
    zones.filter(
      (
        zone,
      ) =>
        zone.isActive,
    ).length;

  const minFee =
    zones.length
      ? Math.min(
          ...zones.map(
            (
              zone,
            ) =>
              zone.deliveryFee,
          ),
        )
      : 0;

  const maxFee =
    zones.length
      ? Math.max(
          ...zones.map(
            (
              zone,
            ) =>
              zone.deliveryFee,
          ),
        )
      : 0;

  const error =
    branchError ??
    (
      zonesQuery.error
        ? getApiErrorMessage(
            zonesQuery.error,
          )
        : null
    ) ??
    (
      toggleMutation.error
        ? getApiErrorMessage(
            toggleMutation.error,
          )
        : null
    );

  if (
    branchLoading
  ) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
        <Loader2 className="size-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Truck className="size-4 text-emerald-600" />
                Delivery pricing & coverage
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Configure the service areas checkout uses to determine delivery
                fees for each branch.
              </p>
            </div>

            <select
              value={
                selectedBranchId
              }
              onChange={(
                event,
              ) =>
                onSelectedBranchId(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                Select branch
              </option>

              {branches.map(
                (
                  branch,
                ) => (
                  <option
                    key={
                      branch.id
                    }
                    value={
                      branch.id
                    }
                  >
                    {
                      branch.name
                    }{' '}
                    ({branch.code})
                  </option>
                ),
              )}
            </select>
          </div>
        </section>

        {error && (
          <ErrorBanner
            message={
              error
            }
          />
        )}

        {!selectedBranch ? (
          <section className="flex min-h-80 flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 text-center shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
              <MapPinned className="size-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-950">
              Choose a branch
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Delivery zones and fees are configured branch by branch.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Zones
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {
                    zones.length
                  }
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Active
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  {
                    activeCount
                  }
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Lowest fee
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {
                    formatMoney(
                      minFee,
                    )
                  }
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Highest fee
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {
                    formatMoney(
                      maxFee,
                    )
                  }
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {selectedBranch.name}{' '}
                    service areas
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Active zones participate in checkout delivery-fee
                    resolution.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void zonesQuery
                        .refetch()
                    }
                    disabled={
                      zonesQuery
                        .isFetching
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={[
                        'size-4',
                        zonesQuery
                          .isFetching
                          ? 'animate-spin'
                          : '',
                      ].join(' ')}
                    />
                    Refresh
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingZone(
                        null,
                      );
                      setEditorOpen(
                        true,
                      );
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Plus className="size-4" />
                    Add zone
                  </button>
                </div>
              </header>

              {zonesQuery
                .isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Loader2 className="size-5 animate-spin text-emerald-600" />
                    Loading delivery zones...
                  </div>
                </div>
              ) : zones.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <MapPinned className="size-8 text-slate-300" />
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No delivery zones yet
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Add the first service area and its delivery fee for this
                    branch.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 md:p-6">
                  {zones.map(
                    (
                      zone,
                    ) => (
                      <article
                        key={
                          zone.id
                        }
                        className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-950">
                              {
                                zone.name
                              }
                            </h3>

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {
                                zone.code
                              }
                            </p>
                          </div>

                          <span
                            className={[
                              'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                              zone.isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500',
                            ].join(' ')}
                          >
                            {
                              zone.isActive
                                ? 'Active'
                                : 'Inactive'
                            }
                          </span>
                        </div>

                        <div className="mt-5 rounded-2xl bg-white p-4">
                          <p className="text-xs text-slate-400">
                            Delivery fee
                          </p>
                          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                            {
                              formatMoney(
                                zone.deliveryFee,
                              )
                            }
                          </p>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                          <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                            <span>
                              {
                                zone.area
                              },{' '}
                              {
                                zone.city
                              },{' '}
                              {
                                zone.state
                              }
                            </span>
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingZone(
                                zone,
                              );
                              setEditorOpen(
                                true,
                              );
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation
                                .mutate(
                                  zone,
                                )
                            }
                            disabled={
                              toggleMutation
                                .isPending
                            }
                            className={[
                              'inline-flex h-9 items-center justify-center gap-2 rounded-xl border text-xs font-semibold disabled:opacity-50',
                              zone.isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                            ].join(' ')}
                          >
                            <Power className="size-3.5" />
                            {
                              zone.isActive
                                ? 'Disable'
                                : 'Enable'
                            }
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <DeliveryZoneEditor
        open={
          editorOpen
        }
        branch={
          selectedBranch
        }
        editing={
          editingZone
        }
        onClose={() => {
          setEditorOpen(
            false,
          );
          setEditingZone(
            null,
          );
        }}
        onSaved={
          onSaved
        }
      />
    </>
  );
}

const managementCards = [
  {
    href:
      '/admin/products',
    title:
      'Products & pricing',
    description:
      'Manage product catalogue, gas pricing and product availability.',
    icon:
      PackageSearch,
  },
  {
    href:
      '/admin/inventory',
    title:
      'Inventory controls',
    description:
      'Manage stock levels, low-stock thresholds and branch inventory.',
    icon:
      Boxes,
  },
  {
    href:
      '/admin/campaigns',
    title:
      'Campaigns & giveaways',
    description:
      'Configure promotions, Thursday giveaways, winners and vouchers.',
    icon:
      Gift,
  },
  {
    href:
      '/admin/notifications',
    title:
      'Notifications',
    description:
      'Review operational notifications and live platform events.',
    icon:
      Bell,
  },
];

function PlatformManagement({
  onSaved,
}: {
  onSaved: (
    message:
      string,
  ) => void;
}) {
  const queryClient =
    useQueryClient();

  const [
    percentInput,
    setPercentInput,
  ] =
    useState('');

  const [
    previewSubtotal,
    setPreviewSubtotal,
  ] =
    useState('10000');

  const [
    formError,
    setFormError,
  ] =
    useState<
      string | null
    >(null);

  const platformFeeQuery =
    useQuery({
      queryKey: [
        'admin',
        'settings',
        'platform-fee',
      ],
      queryFn:
        getPlatformFeeConfig,
      staleTime:
        30_000,
    });

  const platformFee =
    platformFeeQuery.data ??
    null;

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- editable fee draft intentionally hydrates from the live backend configuration. */
      if (
        !platformFee
      ) {
        return;
      }

      setPercentInput(
        platformFee.percent.toFixed(
          2,
        ),
      );
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      platformFee,
    ],
  );

  const mutation =
    useMutation({
      mutationFn:
        updatePlatformFeeConfig,

      onSuccess:
        async (
          updated:
            PlatformFeeConfig,
        ) => {
          setPercentInput(
            updated.percent.toFixed(
              2,
            ),
          );

          setFormError(
            null,
          );

          await queryClient
            .invalidateQueries({
              queryKey: [
                'admin',
                'settings',
                'platform-fee',
              ],
            });

          onSaved(
            `Platform service fee updated to ${updated.percent.toFixed(
              2,
            )}%. New checkouts will use this rate.`,
          );
        },

      onError:
        (
          mutationError,
        ) => {
          setFormError(
            getApiErrorMessage(
              mutationError,
            ),
          );
        },
    });

  const draftPercent =
    Number(
      percentInput,
    );

  const cleanPreviewSubtotal =
    Number(
      previewSubtotal
        .replace(
          /,/g,
          '',
        )
        .trim(),
    );

  const previewAmount =
    Number.isFinite(
      cleanPreviewSubtotal,
    ) &&
    cleanPreviewSubtotal >=
      0 &&
    Number.isFinite(
      draftPercent,
    )
      ? cleanPreviewSubtotal *
        draftPercent /
        100
      : 0;

  const unchanged =
    platformFee
      ? Number.isFinite(
          draftPercent,
        ) &&
        Math.abs(
          draftPercent -
            platformFee.percent,
        ) <
          0.0001
      : true;

  const savePlatformFee =
    () => {
      setFormError(
        null,
      );

      const clean =
        percentInput.trim();

      if (
        !/^\d+(?:\.\d{1,2})?$/.test(
          clean,
        )
      ) {
        setFormError(
          'Enter a percentage with no more than 2 decimal places.',
        );
        return;
      }

      const percent =
        Number(clean);

      const min =
        platformFee
          ?.minPercent ??
        0;

      const max =
        platformFee
          ?.maxPercent ??
        10;

      if (
        !Number.isFinite(
          percent,
        ) ||
        percent <
          min ||
        percent >
          max
      ) {
        setFormError(
          `Platform fee must be between ${min.toFixed(
            2,
          )}% and ${max.toFixed(
            2,
          )}%.`,
        );
        return;
      }

      if (
        platformFee &&
        Math.abs(
          percent -
            platformFee.percent,
        ) <
          0.0001
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Change the platform service fee from ${
            platformFee
              ?.percent.toFixed(
                2,
              ) ??
            '3.00'
          }% to ${percent.toFixed(
            2,
          )}%?\n\nThis applies only to new checkouts. Existing checkout and order snapshots keep the fee they were created with.`,
        );

      if (
        !confirmed
      ) {
        return;
      }

      mutation.mutate({
        percent,
      });
    };

  const resetDraft =
    () => {
      if (
        !platformFee
      ) {
        return;
      }

      setPercentInput(
        platformFee.percent.toFixed(
          2,
        ),
      );
      setFormError(
        null,
      );
    };

  const queryError =
    platformFeeQuery.error
      ? getApiErrorMessage(
          platformFeeQuery.error,
        )
      : null;

  const updatedByName =
    platformFee
      ?.updatedBy
      ? `${platformFee.updatedBy.firstName} ${platformFee.updatedBy.lastName}`.trim()
      : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <div className="p-6 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <CircleDollarSign className="size-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-950">
                      Platform service fee
                    </h2>

                    {platformFee && (
                      <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        Live · {platformFee.percent.toFixed(2)}%
                      </span>
                    )}
                  </div>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Set the company-wide percentage charged on merchandise after
                    campaign discounts. The backend snapshots the rate and amount
                    on every new checkout and finalized order.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  platformFeeQuery.refetch()
                }
                disabled={
                  platformFeeQuery
                    .isFetching
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={[
                    'size-3.5',
                    platformFeeQuery
                      .isFetching
                      ? 'animate-spin'
                      : '',
                  ].join(' ')}
                />
                Refresh
              </button>
            </div>

            {platformFeeQuery.isLoading ? (
              <div className="mt-7 flex min-h-40 items-center justify-center rounded-3xl border border-emerald-100 bg-white/70">
                <Loader2 className="size-5 animate-spin text-emerald-600" />
              </div>
            ) : queryError ? (
              <div className="mt-6">
                <ErrorBanner
                  message={
                    queryError
                  }
                />
              </div>
            ) : platformFee ? (
              <>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-emerald-100 bg-white/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Current fee
                    </p>

                    <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-700">
                      {platformFee.percent.toFixed(2)}%
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Active for new checkouts
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Allowed range
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {platformFee.minPercent.toFixed(2)}% –{' '}
                      {platformFee.maxPercent.toFixed(2)}%
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Up to 2 decimal places
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Fee basis
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      Discounted merchandise
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Subtotal minus campaign discount
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Snapshot policy
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      Immutable per checkout
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Historical orders do not change
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          Change service fee
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Saving updates the rate used by new checkouts only.
                        </p>
                      </div>

                      <ShieldCheck className="size-5 text-emerald-600" />
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-end">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Platform fee percentage
                        </span>

                        <input
                          type="range"
                          min={
                            platformFee.minPercent
                          }
                          max={
                            platformFee.maxPercent
                          }
                          step="0.01"
                          value={
                            Number.isFinite(
                              draftPercent,
                            )
                              ? draftPercent
                              : platformFee.percent
                          }
                          onChange={(
                            event,
                          ) => {
                            setPercentInput(
                              Number(
                                event.target
                                  .value,
                              ).toFixed(
                                2,
                              ),
                            );
                            setFormError(
                              null,
                            );
                          }}
                          className="h-11 w-full accent-emerald-600"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Exact %
                        </span>

                        <div className="relative">
                          <input
                            type="number"
                            min={
                              platformFee.minPercent
                            }
                            max={
                              platformFee.maxPercent
                            }
                            step="0.01"
                            inputMode="decimal"
                            value={
                              percentInput
                            }
                            onChange={(
                              event,
                            ) => {
                              setPercentInput(
                                event.target
                                  .value,
                              );
                              setFormError(
                                null,
                              );
                            }}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          />

                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">
                            %
                          </span>
                        </div>
                      </label>
                    </div>

                    {formError && (
                      <div className="mt-4">
                        <ErrorBanner
                          message={
                            formError
                          }
                        />
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <p className="text-xs leading-5 text-slate-500">
                        A confirmation is required before a financial setting is
                        changed. Every update is written to the audit log.
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={
                            resetDraft
                          }
                          disabled={
                            mutation
                              .isPending ||
                            unchanged
                          }
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reset
                        </button>

                        <button
                          type="button"
                          onClick={
                            savePlatformFee
                          }
                          disabled={
                            mutation
                              .isPending ||
                            unchanged
                          }
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {mutation
                            .isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}

                          Save fee
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                      Checkout preview
                    </p>

                    <h3 className="mt-2 text-sm font-semibold text-slate-950">
                      What the customer pays
                    </h3>

                    <label className="mt-5 block space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Discounted merchandise
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={
                          previewSubtotal
                        }
                        onChange={(
                          event,
                        ) =>
                          setPreviewSubtotal(
                            event.target
                              .value,
                          )
                        }
                        className="h-11 w-full rounded-2xl border border-cyan-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </label>

                    <div className="mt-5 rounded-2xl border border-white bg-white/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500">
                          Fee at{' '}
                          {Number.isFinite(
                            draftPercent,
                          )
                            ? draftPercent.toFixed(
                                2,
                              )
                            : '—'}
                          %
                        </span>

                        <strong className="text-lg text-emerald-700">
                          {formatPlatformMoney(
                            previewAmount,
                          )}
                        </strong>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">
                          Merchandise + service fee
                        </span>

                        <strong className="text-sm text-slate-950">
                          {formatPlatformMoney(
                            Math.max(
                              0,
                              Number.isFinite(
                                cleanPreviewSubtotal,
                              )
                                ? cleanPreviewSubtotal
                                : 0,
                            ) +
                              previewAmount,
                          )}
                        </strong>
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                      Delivery and cross-branch charges are added separately and
                      are not included in the platform-fee percentage.
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="border-t border-emerald-100 bg-[#063c34] p-6 text-white xl:border-l xl:border-t-0 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Fee policy
            </p>

            <h3 className="mt-3 text-xl font-semibold">
              Applied only where intended
            </h3>

            <div className="mt-6 space-y-3">
              {[
                {
                  label:
                    'Merchandise after discounts',
                  included:
                    true,
                },
                {
                  label:
                    'Delivery fees',
                  included:
                    false,
                },
                {
                  label:
                    'Cross-branch fees',
                  included:
                    false,
                },
                {
                  label:
                    'Rider tips',
                  included:
                    false,
                },
              ].map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.label
                    }
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          'flex size-8 shrink-0 items-center justify-center rounded-xl',
                          item.included
                            ? 'bg-emerald-300 text-[#063c34]'
                            : 'bg-white/10 text-white/60',
                        ].join(' ')}
                      >
                        {item.included ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <X className="size-4" />
                        )}
                      </div>

                      <span className="text-sm text-white/90">
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={[
                        'rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]',
                        item.included
                          ? 'bg-emerald-300 text-[#063c34]'
                          : 'bg-white/10 text-white/55',
                      ].join(' ')}
                    >
                      {item.included
                        ? 'Included'
                        : 'Excluded'}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold text-white">
                Last configuration update
              </p>

              <p className="mt-2 text-xs leading-5 text-emerald-50/65">
                {platformFee
                  ?.updatedAt
                  ? formatDate(
                      platformFee.updatedAt,
                    )
                  : 'Using the platform default configuration.'}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-50/65">
                {updatedByName
                  ? `Updated by ${updatedByName}.`
                  : 'No administrator update has been recorded yet.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Settings2 className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Platform management
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Operational areas that already have dedicated management
              workspaces stay in those workspaces. Settings links you directly
              to the real controls instead of duplicating or pretending to
              configure them here.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {managementCards.map(
          (
            item,
          ) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                    <Icon className="size-5" />
                  </div>

                  <ExternalLink className="size-4 text-slate-300 transition group-hover:text-emerald-600" />
                </div>

                <h3 className="mt-5 font-semibold text-slate-950">
                  {
                    item.title
                  }
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {
                    item.description
                  }
                </p>
              </Link>
            );
          },
        )}
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-sky-700" />

          <div>
            <h3 className="text-sm font-semibold text-sky-950">
              Finance controls are separate
            </h3>

            <p className="mt-1 text-xs leading-5 text-sky-800">
              Payments, settlements and payouts have dedicated financial
              workflows and will be exposed in the Finance workspace rather
              than mixed into general Settings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SettingsPage() {
  const [
    section,
    setSection,
  ] =
    useState<SettingsSection>(
      'ACCOUNT',
    );

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] =
    useState('');

  const [
    notice,
    setNotice,
  ] =
    useState<
      string | null
    >(null);

  const profileQuery =
    useQuery({
      queryKey: [
        'admin',
        'settings',
        'profile',
      ],
      queryFn:
        getSettingsProfile,
    });

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
        30_000,
    });

  const branches =
    useMemo(
      () =>
        branchesQuery.data ??
        [],
      [
        branchesQuery.data,
      ],
    );

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- initial branch selection is derived once data becomes available. */
      if (
        selectedBranchId ||
        branches.length ===
          0
      ) {
        return;
      }

      const preferred =
        branches.find(
          (
            branch,
          ) =>
            branch.isActive,
        ) ??
        branches[0];

      if (
        preferred
      ) {
        setSelectedBranchId(
          preferred.id,
        );
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [
      branches,
      selectedBranchId,
    ],
  );

  const profileError =
    profileQuery.error
      ? getApiErrorMessage(
          profileQuery.error,
        )
      : null;

  const branchesError =
    branchesQuery.error
      ? getApiErrorMessage(
          branchesQuery.error,
        )
      : null;

  const tabs =
    useMemo(
      () => [
        {
          id:
            'ACCOUNT' as const,
          label:
            'My Account',
          description:
            'Administrator profile and contact details.',
          icon:
            <UserRound className="size-5" />,
        },
        {
          id:
            'BRANCH' as const,
          label:
            'Branch Operations',
          description:
            'Business identity, banking, location and status.',
          icon:
            <Building2 className="size-5" />,
        },
        {
          id:
            'DELIVERY' as const,
          label:
            'Delivery & Fees',
          description:
            'Service areas and checkout delivery pricing.',
          icon:
            <Truck className="size-5" />,
        },
        {
          id:
            'PLATFORM' as const,
          label:
            'Platform Management',
          description:
            'Platform fee and links to operational workspaces.',
          icon:
            <Settings2 className="size-5" />,
        },
      ],
      [],
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <Settings2 className="size-4" />
            Administration
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            Manage your administrator account, branch operating details,
            banking information, delivery zones and the live platform service
            fee used by new checkouts.
          </p>
        </div>
      </section>

      {notice && (
        <Notice
          message={
            notice
          }
          onClose={() =>
            setNotice(
              null,
            )
          }
        />
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tabs.map(
          (
            tab,
          ) => (
            <SectionTab
              key={
                tab.id
              }
              active={
                section ===
                tab.id
              }
              icon={
                tab.icon
              }
              label={
                tab.label
              }
              description={
                tab.description
              }
              onClick={() => {
                setSection(
                  tab.id,
                );
                setNotice(
                  null,
                );
              }}
            />
          ),
        )}
      </section>

      {section ===
        'ACCOUNT' && (
        <AccountSettings
          profile={
            profileQuery.data ??
            null
          }
          isLoading={
            profileQuery
              .isLoading
          }
          error={
            profileError
          }
          onSaved={() =>
            setNotice(
              'Administrator profile updated successfully.',
            )
          }
        />
      )}

      {section ===
        'BRANCH' && (
        <BranchOperations
          branches={
            branches
          }
          selectedBranchId={
            selectedBranchId
          }
          onSelectedBranchId={
            setSelectedBranchId
          }
          isLoading={
            branchesQuery
              .isLoading
          }
          error={
            branchesError
          }
          onSaved={
            setNotice
          }
        />
      )}

      {section ===
        'DELIVERY' && (
        <DeliverySettings
          branches={
            branches
          }
          selectedBranchId={
            selectedBranchId
          }
          onSelectedBranchId={
            setSelectedBranchId
          }
          branchLoading={
            branchesQuery
              .isLoading
          }
          branchError={
            branchesError
          }
          onSaved={
            setNotice
          }
        />
      )}

      {section ===
        'PLATFORM' && (
        <PlatformManagement
          onSaved={
            setNotice
          }
        />
      )}
    </div>
  );
}
