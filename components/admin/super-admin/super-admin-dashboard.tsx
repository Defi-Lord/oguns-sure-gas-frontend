'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Clock3,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Truck,
  WalletCards,
} from 'lucide-react';

import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

type Counts = Record<string, number>;

interface Overview {
  orders: {
    total: number;
    statusCounts: Counts;
    grossOrderValue: number;
    averageOrderValue: number;
  };
  revenue: {
    paidRevenue: number;
    paidOrderCount: number;
  };
  customers: {
    orderingCustomers: number;
    newCustomers: number | null;
  };
  deliveries: {
    total: number;
    statusCounts: Counts;
    averageDeliveryMinutes: number;
  };
  inventory: {
    totalInventoryLines: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customer?: {
    firstName?: string;
    lastName?: string;
  } | null;
  fulfillmentBranch?: {
    name?: string;
    code?: string;
  } | null;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function rangeToday() {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return {
    key: from.toISOString().slice(0, 10),
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function pretty(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function badge(value: string) {
  if (['DELIVERED', 'COMPLETED', 'PAID'].includes(value)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['FAILED', 'CANCELLED'].includes(value)) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (
    ['PROCESSING', 'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(value)
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function Metric({
  label,
  value,
  helper,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.04)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-emerald-100/45 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700">
            <Icon className="size-[18px]" />
          </div>
          <Link href={href} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            Open <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
      </div>
    </motion.article>
  );
}

export function SuperAdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const range = useMemo(() => rangeToday(), []);

  const analytics = useQuery({
    queryKey: ['super-admin', 'dashboard', 'analytics', range.key],
    queryFn: async () => {
      const response = await api.get<{ data: Overview }>('/analytics/overview', {
        params: { from: range.from, to: range.to },
      });
      return response.data.data;
    },
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const orders = useQuery({
    queryKey: ['super-admin', 'dashboard', 'orders'],
    queryFn: async () => {
      const response = await api.get<{ data: { orders: Order[] } }>('/orders');
      return response.data.data.orders ?? [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const branches = useQuery({
    queryKey: ['super-admin', 'dashboard', 'branches'],
    queryFn: async () => {
      const response = await api.get<{ data: { branches: Branch[] } }>('/branches/management');
      return response.data.data.branches ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const data = analytics.data;
  const branchRows = branches.data ?? [];
  const activeBranches = branchRows.filter((branch) => branch.isActive).length;
  const deliveryCounts = data?.deliveries.statusCounts ?? {};
  const activeDeliveries = Math.max(
    0,
    (data?.deliveries.total ?? 0) -
      (deliveryCounts.DELIVERED ?? 0) -
      (deliveryCounts.FAILED ?? 0) -
      (deliveryCounts.CANCELLED ?? 0),
  );

  /*
   * Backend lowStockCount already includes quantity <= 0,
   * so adding outOfStockCount would double-count those lines.
   */
  const inventoryAlerts =
    data?.inventory.lowStockCount ?? 0;
  const recentOrders = (orders.data ?? []).slice(0, 6);
  const error = analytics.error ?? orders.error ?? branches.error;
  const refreshing = analytics.isFetching || orders.isFetching || branches.isFetching;

  const refresh = () => {
    void Promise.all([
      analytics.refetch(),
      orders.refetch(),
      branches.refetch(),
    ]);
  };

  return (
    <div className="space-y-5 pb-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[30px] border border-emerald-100 bg-[linear-gradient(120deg,#ffffff_0%,#f4fbf7_52%,#e6f8ef_100%)] p-6 shadow-[0_16px_55px_rgba(15,23,42,0.05)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              Global command center
            </div>
            <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Good to see you, {user?.firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Live company-wide operations across all MySureGas branches.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh company
          </button>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {getApiErrorMessage(error)}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Orders today"
          value={analytics.isLoading ? '...' : String(data?.orders.total ?? 0)}
          helper="Orders created across the company today."
          href="/admin/orders"
          icon={ShoppingBag}
        />
        <Metric
          label="Active deliveries"
          value={analytics.isLoading ? '...' : String(activeDeliveries)}
          helper="Deliveries currently active across all branches."
          href="/admin/deliveries"
          icon={Truck}
        />
        <Metric
          label="Paid revenue today"
          value={analytics.isLoading ? '...' : money.format(data?.revenue.paidRevenue ?? 0)}
          helper="Confirmed paid revenue for today."
          href="/admin/finance"
          icon={WalletCards}
        />
        <Metric
          label="Branch network"
          value={branches.isLoading ? '...' : `${activeBranches}/${branchRows.length}`}
          helper="Active branches versus configured branches."
          href="/admin/branches"
          icon={Building2}
        />
        <Metric
          label="Inventory alerts"
          value={analytics.isLoading ? '...' : String(inventoryAlerts)}
          helper="Low-stock and out-of-stock lines."
          href="/admin/inventory"
          icon={Boxes}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700">
              <Clock3 className="size-[18px]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-950">Recent company orders</h2>
              <p className="mt-1 text-xs text-slate-400">Latest orders across the branch network.</p>
            </div>
            <Link href="/admin/orders" className="ml-auto hidden items-center gap-2 text-xs font-semibold text-emerald-700 sm:flex">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-emerald-600" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">No orders found.</div>
            ) : (
              recentOrders.map((order) => {
                const customer = [order.customer?.firstName, order.customer?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Customer';

                return (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {customer}
                        {order.fulfillmentBranch?.name ? ` Â· ${order.fulfillmentBranch.name}` : ''}
                      </p>
                    </div>
                    <span className={`hidden rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:inline-flex ${badge(order.status)}`}>
                      {pretty(order.status)}
                    </span>
                    <p className="shrink-0 text-sm font-semibold text-slate-800">
                      {money.format(Number(order.totalAmount ?? 0))}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-violet-50 text-violet-700">
              <BarChart3 className="size-[18px]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-950">Operations pulse</h2>
              <p className="mt-1 text-xs text-slate-400">Live company health for today.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Ordering customers</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {analytics.isLoading ? '...' : data?.customers.orderingCustomers ?? 0}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Average order value</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {analytics.isLoading ? '...' : money.format(data?.orders.averageOrderValue ?? 0)}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Average delivery time</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {analytics.isLoading ? '...' : `${Math.round(data?.deliveries.averageDeliveryMinutes ?? 0)} min`}
              </p>
            </div>
            <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
              Open full analytics <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}