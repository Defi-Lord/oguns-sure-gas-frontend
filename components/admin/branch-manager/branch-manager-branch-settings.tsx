'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  Building2,
  Landmark,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
} from 'lucide-react';

import {
  updateBranch,
} from '@/lib/api/branches';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  Branch,
  UpdateBranchInput,
} from '@/types/branch';

interface BranchManagerBranchSettingsProps {
  branch: Branch | null;
  isLoading: boolean;
  error: string | null;
  onSaved: (message: string) => void;
}

interface FormState {
  name: string;
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

const EMPTY_FORM: FormState = {
  name: '',
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

const nullableText = (
  value: string,
): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseCoordinate = (
  value: string,
  label: string,
  min: number,
  max: number,
): number | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const number = Number(trimmed);

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    throw new Error(
      `${label} must be between ${min} and ${max}.`,
    );
  }

  return number;
};

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

export function BranchManagerBranchSettings({
  branch,
  isLoading,
  error,
  onSaved,
}: BranchManagerBranchSettingsProps) {
  const queryClient = useQueryClient();

  const user = useAuthStore(
    (state) => state.user,
  );

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const [form, setForm] = useState<FormState>(
    EMPTY_FORM,
  );

  const [formError, setFormError] = useState<string | null>(
    null,
  );

  useEffect(
    () => {
      /* eslint-disable react-hooks/set-state-in-effect -- form draft intentionally follows the authenticated manager branch. */
      if (!branch) {
        setForm(EMPTY_FORM);
        return;
      }

      setForm({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        phone: branch.phone ?? '',
        email: branch.email ?? '',
        latitude:
          branch.latitude === null
            ? ''
            : String(branch.latitude),
        longitude:
          branch.longitude === null
            ? ''
            : String(branch.longitude),
        bankName: branch.bankName ?? '',
        bankAccountName: branch.bankAccountName ?? '',
        bankAccountNumber: branch.bankAccountNumber ?? '',
      });

      setFormError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    },
    [branch],
  );

  const mutation = useMutation({
    mutationFn: (input: UpdateBranchInput) => {
      if (!branch) {
        throw new Error(
          'Managed branch is unavailable.',
        );
      }

      return updateBranch(
        branch.id,
        input,
      );
    },

    onSuccess: async (updated) => {
      if (
        user?.managedBranch?.id === updated.id
      ) {
        setUser({
          ...user,
          managedBranch: {
            ...user.managedBranch,
            name: updated.name,
            code: updated.code,
            isActive: updated.isActive,
          },
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            'branch-manager',
            'settings',
            'managed-branch',
            updated.id,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ['branches'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['admin-session'],
        }),
      ]);

      setFormError(null);
      onSaved(
        'Branch operating details updated successfully.',
      );
    },

    onError: (mutationError) => {
      setFormError(
        getApiErrorMessage(mutationError),
      );
    },
  });

  const save = () => {
    if (!branch) {
      return;
    }

    setFormError(null);

    if (form.name.trim().length < 2) {
      setFormError(
        'Branch name is required.',
      );
      return;
    }

    if (
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      setFormError(
        'Address, city and state are required.',
      );
      return;
    }

    if (
      form.phone.trim() &&
      form.phone.trim().length < 7
    ) {
      setFormError(
        'Enter a valid branch phone number.',
      );
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setFormError(
        'Enter a valid branch email address.',
      );
      return;
    }

    if (
      form.bankName.trim() &&
      form.bankName.trim().length < 2
    ) {
      setFormError(
        'Bank name must contain at least 2 characters.',
      );
      return;
    }

    if (
      form.bankAccountName.trim() &&
      form.bankAccountName.trim().length < 2
    ) {
      setFormError(
        'Account name must contain at least 2 characters.',
      );
      return;
    }

    if (
      form.bankAccountNumber.trim() &&
      form.bankAccountNumber.trim().length < 5
    ) {
      setFormError(
        'Account number must contain at least 5 characters.',
      );
      return;
    }

    let latitude: number | null;
    let longitude: number | null;

    try {
      latitude = parseCoordinate(
        form.latitude,
        'Latitude',
        -90,
        90,
      );

      longitude = parseCoordinate(
        form.longitude,
        'Longitude',
        -180,
        180,
      );
    } catch (coordinateError) {
      setFormError(
        coordinateError instanceof Error
          ? coordinateError.message
          : 'Invalid branch coordinates.',
      );
      return;
    }

    mutation.mutate({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      phone: nullableText(form.phone),
      email: nullableText(form.email),
      latitude,
      longitude,
      bankName: nullableText(form.bankName),
      bankAccountName: nullableText(form.bankAccountName),
      bankAccountNumber: nullableText(form.bankAccountNumber),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
        <Loader2 className="size-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">
        {error}
      </section>
    );
  }

  if (!branch) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm font-medium text-amber-800">
        Managed branch details are unavailable.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {formError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {formError}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Building2 className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Own branch operations
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Edit operational details for your assigned branch only.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Code: {branch.code}
            </span>
            <span
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                branch.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              ].join(' ')}
            >
              {branch.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
          Branch code, manager assignment and activation status are protected Super Admin controls and cannot be changed here.
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <MapPin className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">
                Business & location
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Customer-facing identity, branch contact and fulfillment location.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Branch name"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  phone: value,
                }))
              }
            />

            <div className="md:col-span-2">
              <Field
                label="Address"
                value={form.address}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    address: value,
                  }))
                }
              />
            </div>

            <Field
              label="City"
              value={form.city}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  city: value,
                }))
              }
            />

            <Field
              label="State"
              value={form.state}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  state: value,
                }))
              }
            />

            <div className="md:col-span-2">
              <Field
                label="Branch email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />
            </div>

            <Field
              label="Latitude"
              value={form.latitude}
              placeholder="e.g. 6.6847"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  latitude: value,
                }))
              }
            />

            <Field
              label="Longitude"
              value={form.longitude}
              placeholder="e.g. 3.1986"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  longitude: value,
                }))
              }
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
                <h3 className="font-semibold text-slate-950">
                  Reference banking
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Internal bank master information associated with this branch.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Field
                label="Bank name"
                value={form.bankName}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    bankName: value,
                  }))
                }
              />

              <Field
                label="Account name"
                value={form.bankAccountName}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    bankAccountName: value,
                  }))
                }
              />

              <Field
                label="Account number"
                value={form.bankAccountNumber}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    bankAccountNumber: value,
                  }))
                }
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              These fields do not replace the verified payout recipient. Provider payout destinations and transfer execution remain Super Admin-only.
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <p className="text-xs leading-5 text-emerald-800">
                Backend ownership checks enforce this branch even if a request is manually altered. Cross-branch edits and protected-field updates are rejected.
              </p>
            </div>
          </section>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={mutation.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save own branch
        </button>
      </div>
    </div>
  );
}