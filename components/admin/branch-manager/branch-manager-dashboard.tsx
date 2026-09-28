'use client';

import Link from 'next/link';

import {
  useMemo,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  motion,
} from 'framer-motion';

import {
  ArrowRight,
  Bike,
  Boxes,
  Building2,
  ClipboardList,
  Clock3,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRoundCog,
  WalletCards,
  Bell,
} from 'lucide-react';

import {
  api,
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  useAuthStore,
} from '@/stores/auth-store';

type StatusCounts =
  Record<string, number>;

interface BranchAnalyticsOverview {
  scope: {
    branchId:
      | string
      | null;
    from: string;
    to: string;
  };

  orders: {
    total: number;
    statusCounts:
      StatusCounts;
    grossOrderValue: number;
    subtotal: number;
    discounts: number;
    platformFees: number;
    deliveryFees: number;
    crossBranchFees: number;
    averageOrderValue: number;
  };

  revenue: {
    paidRevenue: number;
    platformFeeRevenue: number;
    paidOrderCount: number;
  };

  customers: {
    newCustomers:
      | number
      | null;
    orderingCustomers: number;
  };

  deliveries: {
    total: number;
    statusCounts:
      StatusCounts;
    averageDeliveryMinutes: number;
  };

  inventory: {
    totalInventoryLines: number;
    lowStockCount: number;
    outOfStockCount: number;
    statusCounts:
      StatusCounts;
  };
}

interface AnalyticsEnvelope {
  success: boolean;
  message: string;
  data:
    BranchAnalyticsOverview;
}

interface BranchOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;

  customer?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

interface OrdersEnvelope {
  success: boolean;
  message: string;

  data: {
    orders:
      BranchOrder[];
  };
}

const money =
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
  );

function dayRange() {
  const now =
    new Date();

  const from =
    new Date(now);

  from.setHours(
    0,
    0,
    0,
    0,
  );

  const to =
    new Date(now);

  to.setHours(
    23,
    59,
    59,
    999,
  );

  return {
    dayKey:
      from
        .toISOString()
        .slice(
          0,
          10,
        ),

    from:
      from.toISOString(),

    to:
      to.toISOString(),
  };
}

function statusLabel(
  status: string,
) {
  return status
    .toLowerCase()
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function statusClasses(
  status: string,
) {
  if (
    [
      'DELIVERED',
      'COMPLETED',
      'PAID',
    ].includes(status)
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    [
      'FAILED',
      'CANCELLED',
    ].includes(status)
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (
    [
      'PROCESSING',
      'READY_FOR_PICKUP',
      'ASSIGNED',
      'OUT_FOR_DELIVERY',
      'IN_TRANSIT',
    ].includes(status)
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          0.38,
      }}
      whileHover={{
        y: -3,
      }}
      className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.04)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="relative">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700">
          <Icon className="size-[18px]" />
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </motion.article>
  );
}

const quickActions = [
  {
    href:
      '/admin/orders',
    label:
      'Orders',
    description:
      'Review and progress branch orders.',
    icon:
      ClipboardList,
  },
  {
    href:
      '/admin/inventory',
    label:
      'Inventory',
    description:
      'Manage stock and low-stock alerts.',
    icon:
      Boxes,
  },
  {
    href:
      '/admin/deliveries',
    label:
      'Deliveries',
    description:
      'Manage dispatch and rider assignments.',
    icon:
      Truck,
  },
  {
    href:
      '/admin/products',
    label:
      'Products',
    description:
      'Manage the branch catalogue.',
    icon:
      PackageSearch,
  },
  {
    href:
      '/admin/staff',
    label:
      'Staff',
    description:
      'Invite and manage branch staff.',
    icon:
      UserRoundCog,
  },
  {
    href:
      '/admin/riders',
    label:
      'Riders',
    description:
      'Invite and operate your branch rider team.',
    icon:
      Bike,
  },
  {
    href:
      '/admin/notifications',
    label:
      'Notifications',
    description:
      'Review your operational alerts.',
    icon:
      Bell,
  },
];

export function BranchManagerDashboard() {
  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const managedBranch =
    user?.managedBranch ??
    null;

  const range =
    useMemo(
      () =>
        dayRange(),
      [],
    );

  const analyticsQuery =
    useQuery({
      queryKey: [
        'branch-manager',
        'dashboard',
        'analytics',
        managedBranch?.id,
        range.dayKey,
      ],

      enabled:
        Boolean(
          managedBranch?.id &&
          managedBranch.isActive,
        ),

      queryFn:
        async () => {
          const response =
            await api.get<AnalyticsEnvelope>(
              '/analytics/overview',
              {
                params: {
                  from:
                    range.from,

                  to:
                    range.to,
                },
              },
            );

          return response.data.data;
        },

      staleTime:
        20_000,

      refetchOnWindowFocus:
        false,
    });

  const ordersQuery =
    useQuery({
      queryKey: [
        'branch-manager',
        'dashboard',
        'orders',
        managedBranch?.id,
      ],

      enabled:
        Boolean(
          managedBranch?.id &&
          managedBranch.isActive,
        ),

      queryFn:
        async () => {
          const response =
            await api.get<OrdersEnvelope>(
              '/orders',
            );

          return (
            response
              .data
              .data
              .orders ??
            []
          );
        },

      staleTime:
        15_000,

      refetchOnWindowFocus:
        false,
    });

  if (!managedBranch) {
    return (
      <section className="mx-auto mt-8 max-w-3xl rounded-[30px] border border-amber-200 bg-amber-50 p-7 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-[17px] bg-white text-amber-700 shadow-sm">
          <Building2 className="size-5" />
        </div>

        <h1 className="mt-5 font-serif text-2xl font-semibold text-slate-950">
          Branch assignment required
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your Branch Manager account is active,
          but no managed branch is attached to
          this session. Ask Super Admin to assign
          your account to a branch before
          operational access continues.
        </p>
      </section>
    );
  }

  if (!managedBranch.isActive) {
    return (
      <section className="mx-auto mt-8 max-w-3xl rounded-[30px] border border-rose-200 bg-rose-50 p-7 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-[17px] bg-white text-rose-700 shadow-sm">
          <Building2 className="size-5" />
        </div>

        <h1 className="mt-5 font-serif text-2xl font-semibold text-slate-950">
          Branch operations are paused
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {managedBranch.name} is currently
          inactive. Operational actions remain
          unavailable until Super Admin
          reactivates the branch.
        </p>
      </section>
    );
  }

  const analytics =
    analyticsQuery.data;

  const recentOrders =
    (
      ordersQuery.data ??
      []
    ).slice(
      0,
      5,
    );

  const deliveryStatuses =
    analytics
      ?.deliveries
      .statusCounts ??
    {};

  const activeDeliveries =
    Math.max(
      0,
      (
        analytics
          ?.deliveries
          .total ??
        0
      ) -
        (
          deliveryStatuses
            .DELIVERED ??
          0
        ) -
        (
          deliveryStatuses
            .FAILED ??
          0
        ) -
        (
          deliveryStatuses
            .CANCELLED ??
          0
        ),
    );

  /*
   * Backend lowStockCount already includes quantity <= 0,
   * so adding outOfStockCount would double-count those lines.
   */
  const inventoryAlerts =
    analytics
      ?.inventory
      .lowStockCount ??
    0;

  const error =
    analyticsQuery.error ??
    ordersQuery.error;

  const isRefreshing =
    analyticsQuery.isFetching ||
    ordersQuery.isFetching;

  const refreshAll =
    () => {
      void Promise.all([
        analyticsQuery.refetch(),
        ordersQuery.refetch(),
      ]);
    };

  return (
    <div className="space-y-5 pb-8">
      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration:
            0.45,
        }}
        className="relative overflow-hidden rounded-[30px] border border-emerald-100 bg-[linear-gradient(120deg,#ffffff_0%,#f4fbf7_52%,#e8f8ef_100%)] p-6 shadow-[0_16px_55px_rgba(15,23,42,0.05)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-200/35 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              Branch command center
            </div>

            <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back,{' '}
              {user?.firstName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              You&apos;re managing{' '}
              <span className="font-semibold text-slate-900">
                {managedBranch.name}
              </span>
              . Every operational view in this
              workspace is restricted to your
              managed branch.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#063c34] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-100">
                {managedBranch.code}
              </span>

              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-700">
                Active branch
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={
              refreshAll
            }
            disabled={
              isRefreshing
            }
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}

            Refresh branch
          </button>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {getApiErrorMessage(
            error,
          )}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Orders today"
          value={
            analyticsQuery.isLoading
              ? '...'
              : String(
                  analytics
                    ?.orders
                    .total ??
                    0,
                )
          }
          description="Orders fulfilled by your branch today."
          icon={
            ShoppingBag
          }
        />

        <MetricCard
          label="Active deliveries"
          value={
            analyticsQuery.isLoading
              ? '...'
              : String(
                  activeDeliveries,
                )
          }
          description="Branch deliveries still in progress."
          icon={Truck}
        />

        <MetricCard
          label="Paid revenue today"
          value={
            analyticsQuery.isLoading
              ? '...'
              : money.format(
                  analytics
                    ?.revenue
                    .paidRevenue ??
                    0,
                )
          }
          description="Paid order revenue for the current day."
          icon={
            WalletCards
          }
        />

        <MetricCard
          label="Inventory alerts"
          value={
            analyticsQuery.isLoading
              ? '...'
              : String(
                  inventoryAlerts,
                )
          }
          description="Low-stock and out-of-stock inventory lines."
          icon={Boxes}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <article className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700">
              <Clock3 className="size-[18px]" />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-950">
                Recent branch orders
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Latest orders visible to your
                managed branch.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="ml-auto hidden items-center gap-2 text-xs font-semibold text-emerald-700 sm:flex"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {ordersQuery.isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-emerald-600" />
              </div>
            ) : recentOrders.length ===
              0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No branch orders yet
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  New paid orders assigned to
                  {` ${managedBranch.name} `}
                  will appear here.
                </p>
              </div>
            ) : (
              recentOrders.map(
                (order) => {
                  const customerName =
                    [
                      order
                        .customer
                        ?.firstName,
                      order
                        .customer
                        ?.lastName,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        ' ',
                      ) ||
                    'Customer';

                  return (
                    <Link
                      key={
                        order.id
                      }
                      href="/admin/orders"
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {customerName}
                        </p>
                      </div>

                      <span
                        className={[
                          'hidden rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:inline-flex',
                          statusClasses(
                            order.status,
                          ),
                        ].join(
                          ' ',
                        )}
                      >
                        {statusLabel(
                          order.status,
                        )}
                      </span>

                      <p className="shrink-0 text-sm font-semibold text-slate-800">
                        {money.format(
                          Number(
                            order.totalAmount ??
                              0,
                          ),
                        )}
                      </p>
                    </Link>
                  );
                },
              )
            )}
          </div>
        </article>

        <article className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-violet-50 text-violet-700">
              <Building2 className="size-[18px]" />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-950">
                Branch workspace
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Core operational areas.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {quickActions.map(
              (item) => {
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
                    className="group flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-emerald-100 hover:bg-emerald-50/60"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition group-hover:text-emerald-700">
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.label}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
                  </Link>
                );
              },
            )}
          </div>
        </article>
      </section>
    </div>
  );
}