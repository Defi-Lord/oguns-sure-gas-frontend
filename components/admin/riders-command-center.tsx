'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bike,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Save,
  ToggleLeft,
  ToggleRight,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import { api, getApiErrorMessage } from '@/lib/api/client';
import type {
  Rider,
  RiderBranch,
  RiderDelivery,
  RiderDeliveryStatus,
  RidersResponse,
} from '@/types/rider';

interface BranchesResponse {
  success: boolean;
  message: string;
  data: {
    branches: RiderBranch[];
  };
}

interface RiderMutationResponse {
  success: boolean;
  message: string;
  data: {
    rider: Rider;
  };
}

interface RiderProfileForm {
  branchId: string;
  vehicleType: string;
  vehicleNumber: string;
}

const ACTIVE_DELIVERY_STATUSES =
  new Set<RiderDeliveryStatus>([
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
  ]);

function fullName(rider: Rider) {
  return `${rider.user.firstName} ${rider.user.lastName}`.trim();
}

function activeDeliveries(rider: Rider) {
  return rider.deliveries.filter((delivery) =>
    ACTIVE_DELIVERY_STATUSES.has(delivery.status),
  );
}

function deliveryCount(
  rider: Rider,
  status: RiderDeliveryStatus,
) {
  return rider.deliveries.filter(
    (delivery) => delivery.status === status,
  ).length;
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusClasses(status: string) {
  switch (status) {
    case 'ACTIVE':
    case 'DELIVERED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'ASSIGNED':
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700';

    case 'FAILED':
    case 'SUSPENDED':
      return 'border-red-200 bg-red-50 text-red-700';

    case 'CANCELLED':
    case 'INACTIVE':
      return 'border-slate-200 bg-slate-100 text-slate-600';

    default:
      return 'border-slate-200 bg-white text-slate-600';
  }
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClasses(
        status,
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof UsersRound;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DeliveryRow({
  delivery,
}: {
  delivery: RiderDelivery;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Delivery
          </p>

          <p className="mt-1 max-w-[250px] truncate text-sm font-bold text-slate-900">
            {delivery.id}
          </p>
        </div>

        <StatusBadge status={delivery.status} />
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-400">
            Created
          </p>
          <p className="mt-1 text-slate-700">
            {formatDate(delivery.createdAt)}
          </p>
        </div>

        <div>
          <p className="font-semibold text-slate-400">
            Picked up
          </p>
          <p className="mt-1 text-slate-700">
            {formatDate(delivery.pickupTime)}
          </p>
        </div>

        <div>
          <p className="font-semibold text-slate-400">
            Delivered
          </p>
          <p className="mt-1 text-slate-700">
            {formatDate(delivery.deliveredTime)}
          </p>
        </div>
      </div>

      {delivery.deliveryNotes ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          {delivery.deliveryNotes}
        </p>
      ) : null}
    </div>
  );
}

export function RidersCommandCenter() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] =
    useState('ALL');

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] = useState<
    'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
  >('ALL');

  const [accountFilter, setAccountFilter] =
    useState('ALL');

  const [selectedRider, setSelectedRider] =
    useState<Rider | null>(null);

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [profileForm, setProfileForm] =
    useState<RiderProfileForm>({
      branchId: '',
      vehicleType: '',
      vehicleNumber: '',
    });

  const [profileMessage, setProfileMessage] =
    useState<string | null>(null);

  const [availabilityMessage, setAvailabilityMessage] =
    useState<string | null>(null);

  const ridersQuery = useQuery({
    queryKey: ['admin-riders'],

    queryFn: async () => {
      const response =
        await api.get<RidersResponse>('/riders');

      return response.data.data.riders;
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['admin-rider-branches'],

    queryFn: async () => {
      const response =
        await api.get<BranchesResponse>('/branches');

      return response.data.data.branches;
    },

    staleTime: 60_000,
  });

  const profileMutation = useMutation({
    mutationFn: async ({
      riderId,
      values,
    }: {
      riderId: string;
      values: {
        branchId: string | null;
        vehicleType: string | null;
        vehicleNumber: string | null;
      };
    }) => {
      const response =
        await api.patch<RiderMutationResponse>(
          `/riders/${riderId}`,
          values,
        );

      return response.data;
    },

    onSuccess: async (response) => {
      setSelectedRider(response.data.rider);
      setIsEditingProfile(false);
      setProfileMessage(response.message);
      setAvailabilityMessage(null);

      await queryClient.invalidateQueries({
        queryKey: ['admin-riders'],
      });
    },

    onError: (error) => {
      setProfileMessage(getApiErrorMessage(error));
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async ({
      riderId,
      isAvailable,
    }: {
      riderId: string;
      isAvailable: boolean;
    }) => {
      const response =
        await api.patch<RiderMutationResponse>(
          `/riders/${riderId}/availability`,
          {
            isAvailable,
          },
        );

      return response.data;
    },

    onSuccess: async (response) => {
      setSelectedRider(response.data.rider);
      setAvailabilityMessage(response.message);
      setProfileMessage(null);

      await queryClient.invalidateQueries({
        queryKey: ['admin-riders'],
      });
    },

    onError: (error) => {
      setAvailabilityMessage(
        getApiErrorMessage(error),
      );
    },
  });

  const riders = ridersQuery.data ?? [];

  const branchOptions =
    branchesQuery.data ?? [];

  const branches = useMemo(
    () =>
      branchOptions.map((branch) => [
        branch.id,
        branch.name,
      ] as const),
    [branchOptions],
  );

  useEffect(() => {
    if (!selectedRider) {
      setIsEditingProfile(false);
      setProfileMessage(null);
      setAvailabilityMessage(null);
      return;
    }

    setProfileForm({
      branchId: selectedRider.branchId ?? '',
      vehicleType:
        selectedRider.vehicleType ?? '',
      vehicleNumber:
        selectedRider.vehicleNumber ?? '',
    });
  }, [selectedRider]);

  const saveRiderProfile = () => {
    if (!selectedRider) return;

    const vehicleType =
      profileForm.vehicleType.trim();

    const vehicleNumber =
      profileForm.vehicleNumber.trim();

    setProfileMessage(null);

    profileMutation.mutate({
      riderId: selectedRider.id,
      values: {
        branchId:
          profileForm.branchId || null,
        vehicleType:
          vehicleType || null,
        vehicleNumber:
          vehicleNumber || null,
      },
    });
  };

  const changeAvailability = (
    isAvailable: boolean,
  ) => {
    if (!selectedRider) return;

    setAvailabilityMessage(null);

    availabilityMutation.mutate({
      riderId: selectedRider.id,
      isAvailable,
    });
  };

  const accountStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          riders.map(
            (rider) => rider.user.status,
          ),
        ),
      ).sort(),
    [riders],
  );

  const filteredRiders = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return riders.filter((rider) => {
      const searchable = [
        fullName(rider),
        rider.user.email,
        rider.user.phone ?? '',
        rider.vehicleType ?? '',
        rider.vehicleNumber ?? '',
        rider.branch.name,
        rider.branch.code,
        rider.branch.city,
        rider.branch.state,
      ]
        .join(' ')
        .toLowerCase();

      if (
        term &&
        !searchable.includes(term)
      ) {
        return false;
      }

      if (
        branchFilter !== 'ALL' &&
        rider.branchId !== branchFilter
      ) {
        return false;
      }

      if (
        availabilityFilter ===
          'AVAILABLE' &&
        !rider.isAvailable
      ) {
        return false;
      }

      if (
        availabilityFilter ===
          'UNAVAILABLE' &&
        rider.isAvailable
      ) {
        return false;
      }

      if (
        accountFilter !== 'ALL' &&
        rider.user.status !== accountFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    riders,
    search,
    branchFilter,
    availabilityFilter,
    accountFilter,
  ]);

  const availableCount =
    riders.filter(
      (rider) => rider.isAvailable,
    ).length;

  const activeDispatchCount =
    riders.filter(
      (rider) =>
        activeDeliveries(rider).length > 0,
    ).length;

  const activeAccountCount =
    riders.filter(
      (rider) =>
        rider.user.status === 'ACTIVE',
    ).length;

  if (ridersQuery.isLoading) {
    return (
      <section className="space-y-5 py-5 sm:py-6">
        <div className="h-28 animate-pulse rounded-[28px] bg-slate-100" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[24px] bg-slate-100"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-[28px] bg-slate-100" />
      </section>
    );
  }

  if (ridersQuery.isError) {
    return (
      <section className="py-6">
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <CircleAlert className="mt-0.5 h-6 w-6 text-red-600" />

            <div>
              <h1 className="text-lg font-black text-red-950">
                Unable to load riders
              </h1>

              <p className="mt-1 text-sm text-red-700">
                {getApiErrorMessage(
                  ridersQuery.error,
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  void ridersQuery.refetch()
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-5 py-5 sm:py-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Activity className="h-3.5 w-3.5" />
                Rider operations
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Riders
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor rider accounts, branch
                assignment, vehicle details,
                availability and delivery workload
                from one operational view.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void ridersQuery.refetch()
              }
              disabled={ridersQuery.isFetching}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  ridersQuery.isFetching
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total riders"
            value={riders.length}
            description="Registered rider profiles"
            icon={UsersRound}
          />

          <MetricCard
            label="Available"
            value={availableCount}
            description="Marked available for assignment"
            icon={CheckCircle2}
          />

          <MetricCard
            label="Active dispatch"
            value={activeDispatchCount}
            description="Riders with active delivery workload"
            icon={Truck}
          />

          <MetricCard
            label="Active accounts"
            value={activeAccountCount}
            description="Rider user accounts currently active"
            icon={ShieldCheck}
          />
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(150px,auto))]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search rider, phone, vehicle or branch..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <select
                value={branchFilter}
                onChange={(event) =>
                  setBranchFilter(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">
                  All branches
                </option>

                {branches.map(
                  ([id, name]) => (
                    <option
                      key={id}
                      value={id}
                    >
                      {name}
                    </option>
                  ),
                )}
              </select>

              <select
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(
                    event.target
                      .value as typeof availabilityFilter,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">
                  All availability
                </option>
                <option value="AVAILABLE">
                  Available
                </option>
                <option value="UNAVAILABLE">
                  Unavailable
                </option>
              </select>

              <select
                value={accountFilter}
                onChange={(event) =>
                  setAccountFilter(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">
                  All accounts
                </option>

                {accountStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-5 py-4">
                    Rider
                  </th>
                  <th className="px-5 py-4">
                    Branch
                  </th>
                  <th className="px-5 py-4">
                    Vehicle
                  </th>
                  <th className="px-5 py-4">
                    Availability
                  </th>
                  <th className="px-5 py-4">
                    Workload
                  </th>
                  <th className="px-5 py-4">
                    Account
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>

              <tbody>
                {filteredRiders.map(
                  (rider) => {
                    const active =
                      activeDeliveries(
                        rider,
                      );

                    return (
                      <tr
                        key={rider.id}
                        onClick={() =>
                          setSelectedRider(
                            rider,
                          )
                        }
                        className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {fullName(rider)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {rider.user.phone ??
                              rider.user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {
                              rider.branch
                                .name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              rider.branch
                                .city
                            }
                            ,{' '}
                            {
                              rider.branch
                                .state
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {rider.vehicleType ??
                              'Not set'}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {rider.vehicleNumber ??
                              'No vehicle number'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                              rider.isAvailable
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rider.isAvailable
                              ? 'Available'
                              : 'Unavailable'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800">
                            {active.length}{' '}
                            active
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {deliveryCount(
                              rider,
                              'DELIVERED',
                            )}{' '}
                            delivered ·{' '}
                            {deliveryCount(
                              rider,
                              'FAILED',
                            )}{' '}
                            failed
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              rider.user
                                .status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredRiders.map(
              (rider) => {
                const active =
                  activeDeliveries(rider);

                return (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() =>
                      setSelectedRider(
                        rider,
                      )
                    }
                    className="w-full p-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          {fullName(
                            rider,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            rider.branch
                              .name
                          }
                        </p>
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          rider.isAvailable
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rider.isAvailable
                          ? 'Available'
                          : 'Unavailable'}
                      </span>

                      <StatusBadge
                        status={
                          rider.user.status
                        }
                      />

                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        {active.length}{' '}
                        active delivery
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <p className="font-semibold text-slate-400">
                          Vehicle
                        </p>
                        <p className="mt-1 text-slate-700">
                          {rider.vehicleType ??
                            'Not set'}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-400">
                          Vehicle no.
                        </p>
                        <p className="mt-1 text-slate-700">
                          {rider.vehicleNumber ??
                            'Not set'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>

          {filteredRiders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <UsersRound className="mx-auto h-9 w-9 text-slate-300" />

              <p className="mt-3 font-bold text-slate-800">
                No riders match these
                filters
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Adjust your search or
                filters to see more rider
                profiles.
              </p>
            </div>
          ) : null}

          <div className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500">
            Showing {filteredRiders.length}{' '}
            of {riders.length} riders
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedRider ? (
          <>
            <motion.button
              type="button"
              aria-label="Close rider details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setSelectedRider(null)
              }
              className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px]"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 34,
              }}
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-slate-200 bg-slate-50 shadow-2xl sm:max-w-xl"
            >
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Rider profile
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      {fullName(
                        selectedRider,
                      )}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Rider ID ·{' '}
                      {selectedRider.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRider(
                        null,
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Availability
                    </p>

                    <p
                      className={`mt-2 text-sm font-black ${
                        selectedRider.isAvailable
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {selectedRider.isAvailable
                        ? 'Available'
                        : 'Unavailable'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Active workload
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-900">
                      {
                        activeDeliveries(
                          selectedRider,
                        ).length
                      }{' '}
                      {activeDeliveries(
                        selectedRider,
                      ).length === 1
                        ? 'delivery'
                        : 'deliveries'}
                    </p>
                  </div>
                </div>

                {selectedRider.isAvailable &&
                activeDeliveries(
                  selectedRider,
                ).length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    <div className="flex gap-3">
                      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />

                      <div>
                        <p className="font-black">
                          Availability mismatch
                        </p>

                        <p className="mt-1">
                          This rider is marked
                          available while handling
                          an active delivery. Mark
                          the rider unavailable to
                          reconcile the dispatch
                          state.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="flex items-center gap-2 font-black text-slate-900">
                        {selectedRider.isAvailable ? (
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                        Availability management
                      </h3>

                      <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
                        Controls whether this rider
                        can receive a new delivery
                        assignment.
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-black ${
                        selectedRider.isAvailable
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedRider.isAvailable
                        ? 'Available'
                        : 'Unavailable'}
                    </span>
                  </div>

                  {activeDeliveries(
                    selectedRider,
                  ).length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                      <span className="font-black">
                        Active dispatch:
                      </span>{' '}
                      {activeDeliveries(
                        selectedRider,
                      ).length}{' '}
                      delivery
                      {activeDeliveries(
                        selectedRider,
                      ).length === 1
                        ? ''
                        : 'ies'}{' '}
                      currently in progress.
                      The backend will prevent this
                      rider from being marked
                      available until active work is
                      cleared.
                    </div>
                  ) : null}

                  <div className="mt-4">
                    {selectedRider.isAvailable ? (
                      <button
                        type="button"
                        onClick={() =>
                          changeAvailability(false)
                        }
                        disabled={
                          availabilityMutation.isPending
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ToggleLeft className="h-4 w-4" />

                        {availabilityMutation.isPending
                          ? 'Updating...'
                          : 'Mark unavailable'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          changeAvailability(true)
                        }
                        disabled={
                          availabilityMutation.isPending ||
                          activeDeliveries(
                            selectedRider,
                          ).length > 0
                        }
                        title={
                          activeDeliveries(
                            selectedRider,
                          ).length > 0
                            ? 'This rider has an active delivery.'
                            : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ToggleRight className="h-4 w-4" />

                        {availabilityMutation.isPending
                          ? 'Updating...'
                          : 'Mark available'}
                      </button>
                    )}

                    {!selectedRider.isAvailable &&
                    activeDeliveries(
                      selectedRider,
                    ).length > 0 ? (
                      <div className="mt-3 flex max-w-lg items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />

                        <span>
                          This rider cannot be
                          marked available until
                          the active delivery is
                          completed, failed or
                          cancelled.
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {availabilityMessage ? (
                    <div
                      className={`mt-4 rounded-xl border px-3 py-2.5 text-xs font-semibold leading-5 ${
                        availabilityMutation.isError
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {availabilityMessage}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="flex items-center gap-2 font-black text-slate-900">
                        <Pencil className="h-4 w-4" />
                        Rider profile
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Manage branch assignment and
                        vehicle information.
                      </p>
                    </div>

                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm({
                            branchId:
                              selectedRider.branchId ??
                              '',
                            vehicleType:
                              selectedRider.vehicleType ??
                              '',
                            vehicleNumber:
                              selectedRider.vehicleNumber ??
                              '',
                          });
                          setProfileMessage(null);
                          setIsEditingProfile(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {isEditingProfile ? (
                    <div className="mt-5 space-y-4">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500">
                          Assigned branch
                        </span>

                        <select
                          value={profileForm.branchId}
                          onChange={(event) =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                branchId:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          disabled={
                            branchesQuery.isLoading ||
                            profileMutation.isPending
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                        >
                          <option value="">
                            No branch assigned
                          </option>

                          {branchOptions.map(
                            (branch) => (
                              <option
                                key={branch.id}
                                value={branch.id}
                              >
                                {branch.name} ·{' '}
                                {branch.code}
                              </option>
                            ),
                          )}
                        </select>

                        {branchesQuery.isError ? (
                          <span className="mt-2 block text-xs font-semibold text-red-600">
                            {getApiErrorMessage(
                              branchesQuery.error,
                            )}
                          </span>
                        ) : null}
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-slate-500">
                          Vehicle type
                        </span>

                        <input
                          value={
                            profileForm.vehicleType
                          }
                          onChange={(event) =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                vehicleType:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          maxLength={50}
                          disabled={
                            profileMutation.isPending
                          }
                          placeholder="e.g. Motorcycle"
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-50"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-slate-500">
                          Vehicle number
                        </span>

                        <input
                          value={
                            profileForm.vehicleNumber
                          }
                          onChange={(event) =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                vehicleNumber:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          maxLength={30}
                          disabled={
                            profileMutation.isPending
                          }
                          placeholder="e.g. TEST-001"
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-50"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={
                            saveRiderProfile
                          }
                          disabled={
                            profileMutation.isPending ||
                            branchesQuery.isLoading
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />

                          {profileMutation.isPending
                            ? 'Saving...'
                            : 'Save profile'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm({
                              branchId:
                                selectedRider.branchId ??
                                '',
                              vehicleType:
                                selectedRider.vehicleType ??
                                '',
                              vehicleNumber:
                                selectedRider.vehicleNumber ??
                                '',
                            });
                            setProfileMessage(null);
                            setIsEditingProfile(false);
                          }}
                          disabled={
                            profileMutation.isPending
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Branch
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selectedRider.branch
                            ?.name ?? 'Not set'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Vehicle type
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selectedRider.vehicleType ??
                            'Not set'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Vehicle number
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selectedRider.vehicleNumber ??
                            'Not set'}
                        </p>
                      </div>
                    </div>
                  )}

                  {profileMessage ? (
                    <div
                      className={`mt-4 rounded-xl border px-3 py-2.5 text-xs font-semibold leading-5 ${
                        profileMutation.isError
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {profileMessage}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 font-black text-slate-900">
                    <UserRound className="h-4 w-4" />
                    Account & contact
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="break-all">
                        {
                          selectedRider
                            .user.email
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>
                        {selectedRider
                          .user.phone ??
                          'No phone number'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <StatusBadge
                        status={
                          selectedRider
                            .user.status
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 font-black text-slate-900">
                    <Bike className="h-4 w-4" />
                    Vehicle
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Type
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {selectedRider
                          .vehicleType ??
                          'Not set'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Number
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {selectedRider
                          .vehicleNumber ??
                          'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 font-black text-slate-900">
                    <Building2 className="h-4 w-4" />
                    Assigned branch
                  </h3>

                  <p className="mt-4 font-bold text-slate-900">
                    {
                      selectedRider.branch
                        .name
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedRider.branch
                        .code
                    }
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {
                      selectedRider.branch
                        .city
                    }
                    ,{' '}
                    {
                      selectedRider.branch
                        .state
                    }
                  </p>

                  <div className="mt-3">
                    <StatusBadge
                      status={
                        selectedRider.branch
                          .isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'
                      }
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-black text-slate-900">
                      <Truck className="h-4 w-4" />
                      Recent deliveries
                    </h3>

                    <span className="text-xs font-semibold text-slate-500">
                      {
                        selectedRider
                          .deliveries.length
                      }{' '}
                      returned
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-blue-50 p-3 text-center">
                      <p className="text-lg font-black text-blue-700">
                        {
                          activeDeliveries(
                            selectedRider,
                          ).length
                        }
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                        Active
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-lg font-black text-emerald-700">
                        {deliveryCount(
                          selectedRider,
                          'DELIVERED',
                        )}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        Delivered
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 p-3 text-center">
                      <p className="text-lg font-black text-red-700">
                        {deliveryCount(
                          selectedRider,
                          'FAILED',
                        )}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                        Failed
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedRider
                      .deliveries.length ? (
                      selectedRider.deliveries.map(
                        (delivery) => (
                          <DeliveryRow
                            key={
                              delivery.id
                            }
                            delivery={
                              delivery
                            }
                          />
                        ),
                      )
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                        No recent deliveries
                        returned for this
                        rider.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 font-black text-slate-900">
                    <Clock3 className="h-4 w-4" />
                    Profile timestamps
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Created
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDate(
                          selectedRider
                            .createdAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Last updated
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDate(
                          selectedRider
                            .updatedAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
                  Rider management controls are
                  limited to profile and
                  availability administration.
                  Pickup, transit, delivery
                  completion and gas verification
                  remain rider-operated actions.
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
