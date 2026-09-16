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
  AlertCircle,
  ArrowRight,
  Banknote,
  Bike,
  Box,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Flame,
  Loader2,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';

import {
  api,
} from '@/lib/api/client';

import type {
  Order,
  OrdersResponse,
  OrderStatus,
  PaymentStatus,
} from '@/types/order';

interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
  };
}

interface RiderSummary {
  id: string;
  branchId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    role: string;
  };
}

interface RidersResponse {
  success: boolean;
  message: string;
  data: {
    riders: RiderSummary[];
  };
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
  };
}

const orderStatusTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: [
    'CONFIRMED',
    'CANCELLED',
  ],

  CONFIRMED: [
    'PROCESSING',
    'CANCELLED',
  ],

  PROCESSING: [
    'READY_FOR_PICKUP',
    'CANCELLED',
  ],

  READY_FOR_PICKUP: [],

  // Delivery operations own the workflow after pickup readiness.
  // Rider assignment synchronizes the order to ASSIGNED, and subsequent
  // delivery status changes synchronize the order automatically.
  ASSIGNED: [],
  OUT_FOR_DELIVERY: [],

  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};
const orderStatuses: Array<{
  label: string;
  value: 'ALL' | OrderStatus;
}> = [
  {
    label: 'All orders',
    value: 'ALL',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Confirmed',
    value: 'CONFIRMED',
  },
  {
    label: 'Processing',
    value: 'PROCESSING',
  },
  {
    label: 'Ready',
    value: 'READY_FOR_PICKUP',
  },
  {
    label: 'Assigned',
    value: 'ASSIGNED',
  },
  {
    label: 'Out for delivery',
    value: 'OUT_FOR_DELIVERY',
  },
  {
    label: 'Delivered',
    value: 'DELIVERED',
  },
  {
    label: 'Cancelled',
    value: 'CANCELLED',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
];

const paymentStatuses: Array<{
  label: string;
  value: 'ALL' | PaymentStatus;
}> = [
  {
    label: 'All payments',
    value: 'ALL',
  },
  {
    label: 'Paid',
    value: 'PAID',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Processing',
    value: 'PROCESSING',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
  {
    label: 'Refunded',
    value: 'REFUNDED',
  },
];

const formatMoney = (
  amount: number | string | null | undefined,
) => {
  const numericAmount = Number(amount ?? 0);

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(
    Number.isFinite(numericAmount)
      ? numericAmount
      : 0,
  );
};

const formatDate = (
  value: string | null | undefined,
) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
};

const formatShortDate = (
  value: string,
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
};

const formatLabel = (
  value: string,
) =>
  value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');

const getOrderStatusClasses = (
  status: OrderStatus,
) => {
  switch (status) {
    case 'DELIVERED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';

    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300';

    case 'CONFIRMED':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300';

    case 'PROCESSING':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300';

    case 'READY_FOR_PICKUP':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';

    case 'ASSIGNED':
    case 'OUT_FOR_DELIVERY':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300';

    case 'CANCELLED':
    case 'FAILED':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300';

    default:
      return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';
  }
};

const getPaymentClasses = (
  status?: PaymentStatus,
) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-500';

    case 'PENDING':
    case 'PROCESSING':
      return 'bg-amber-500';

    case 'FAILED':
      return 'bg-rose-500';

    case 'REFUNDED':
      return 'bg-violet-500';

    default:
      return 'bg-slate-400';
  }
};

const getCustomerName = (
  order: Order,
) =>
  [
    order.customer?.firstName,
    order.customer?.lastName,
  ]
    .filter(Boolean)
    .join(' ') || 'Customer';

function OrderStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.04em]',
        getOrderStatusClasses(status),
      ].join(' ')}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {formatLabel(status)}
    </span>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.28,
      }}
      className="group relative min-w-0 overflow-hidden rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.055)] backdrop-blur-xl sm:p-5 dark:border-white/8 dark:bg-white/[0.045]"
    >
      <div
        className={[
          'absolute -right-10 -top-10 size-28 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]',
          accent,
        ].join(' ')}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.11em] text-slate-400 dark:text-slate-500">
            {label}
          </p>

          <p className="mt-3 break-words text-[24px] font-semibold leading-none tracking-[-0.045em] text-slate-950 dark:text-white sm:text-[30px]">
            {value}
          </p>

          <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            {caption}
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.055)] dark:border-white/8 dark:bg-white/[0.045]">
      <div className="space-y-1 p-3 sm:p-4">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="grid animate-pulse grid-cols-[1fr_110px] gap-4 rounded-[18px] px-3 py-4 lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.8fr_120px]"
          >
            <div className="h-4 rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="h-4 rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="hidden h-4 rounded-full bg-slate-100 dark:bg-white/8 lg:block" />
            <div className="hidden h-4 rounded-full bg-slate-100 dark:bg-white/8 lg:block" />
            <div className="hidden h-4 rounded-full bg-slate-100 dark:bg-white/8 lg:block" />
            <div className="h-7 rounded-full bg-slate-100 dark:bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/75 px-6 text-center dark:border-white/10 dark:bg-white/[0.035]">
      <div className="relative flex size-20 items-center justify-center rounded-[26px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShoppingBag className="size-8" />

        <span className="absolute -right-1 -top-1 size-4 animate-pulse rounded-full border-4 border-white bg-emerald-500 dark:border-[#071814]" />
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {filtered
          ? 'No matching orders'
          : 'No orders yet'}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {filtered
          ? 'Nothing matches the current search and filters. Clear them to return to the complete operational feed.'
          : 'Customer orders will appear here as soon as they begin flowing through the Ogun Gas platform.'}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-full bg-[#0b5f46] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084d3a]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function OrderDetailsDrawer({
  order,
  onClose,
  onStatusChange,
  onAssignRider,
  updatingStatus,
  assigningRider,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (
    order: Order,
    status: OrderStatus,
  ) => void;
  onAssignRider: (order: Order) => void;
  updatingStatus: boolean;
  assigningRider: boolean;
}) {
  return (
    <AnimatePresence>
      {order ? (
        <>
          <motion.button
            type="button"
            aria-label="Close order details"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-[2px]"
          />

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
              stiffness: 340,
              damping: 34,
            }}
            className="fixed inset-y-0 right-0 z-[80] w-full overflow-y-auto border-l border-white/70 bg-[#f7faf9]/98 shadow-[-24px_0_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:max-w-[560px] dark:border-white/8 dark:bg-[#071814]/98"
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-[#f7faf9]/90 px-4 py-4 backdrop-blur-xl sm:px-6 dark:border-white/8 dark:bg-[#071814]/90">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      {order.orderNumber}
                    </p>

                    <OrderStatusBadge
                      status={order.status}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Created {formatDate(order.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0b654a] via-[#087255] to-[#0b5a45] p-5 text-white shadow-[0_20px_55px_rgba(5,92,68,0.22)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100/75">
                      Order total
                    </p>

                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                      {formatMoney(order.totalAmount)}
                    </p>
                  </div>

                  <div className="flex size-12 items-center justify-center rounded-[18px] bg-white/12 ring-1 ring-white/15">
                    <ReceiptText className="size-5" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/12 pt-4 text-xs">
                  <div>
                    <p className="text-emerald-100/60">
                      Items
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.items.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-emerald-100/60">
                      Payment
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.payment?.status
                        ? formatLabel(order.payment.status)
                        : 'Not available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-emerald-100/60">
                      Delivery
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.delivery?.status
                        ? formatLabel(order.delivery.status)
                        : 'Pending'}
                    </p>
                  </div>
                </div>
              </section>
              {order.status === 'READY_FOR_PICKUP' ? (
                <section className="rounded-[24px] border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-500/15 dark:bg-emerald-500/[0.055]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                        Delivery assignment
                      </p>
                      <h3 className="mt-1.5 font-semibold text-slate-950 dark:text-white">
                        Assign an available rider
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Only available riders from {order.fulfillmentBranch.name} will be shown. Assignment is validated by the backend and synchronizes the delivery and order automatically.
                      </p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-white text-emerald-700 shadow-sm dark:bg-white/8 dark:text-emerald-300">
                      <Bike className="size-4" />
                    </div>
                  </div>

                  {order.delivery ? (
                    <button
                      type="button"
                      disabled={assigningRider}
                      onClick={() => onAssignRider(order)}
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#0b5f46] px-5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-[#084d3a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigningRider ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Bike className="size-3.5" />
                      )}
                      Assign rider
                    </button>
                  ) : (
                    <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      This order has no delivery record yet, so a rider cannot be assigned from the Orders command center.
                    </div>
                  )}
                </section>
              ) : order.status === 'ASSIGNED' || order.status === 'OUT_FOR_DELIVERY' ? (
                <section className="rounded-[24px] border border-sky-200/70 bg-sky-50/60 p-5 dark:border-sky-500/15 dark:bg-sky-500/[0.055]">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-white text-sky-700 shadow-sm dark:bg-white/8 dark:text-sky-300">
                      <Truck className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        Delivery workflow active
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        This order is now controlled by its delivery workflow. Delivery progress will synchronize the order status automatically.
                      </p>
                    </div>
                  </div>
                </section>
              ) : orderStatusTransitions[
                order.status
              ].length > 0 ? (
                <section className="rounded-[24px] border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-500/15 dark:bg-emerald-500/[0.055]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                        Order actions
                      </p>

                      <h3 className="mt-1.5 font-semibold text-slate-950 dark:text-white">
                        Move this order forward
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Only transitions allowed by the backend workflow are available.
                      </p>
                    </div>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-white text-emerald-700 shadow-sm dark:bg-white/8 dark:text-emerald-300">
                      <PackageCheck className="size-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {orderStatusTransitions[
                      order.status
                    ].map(
                      (nextStatus) => {
                        const destructive =
                          nextStatus ===
                            'CANCELLED' ||
                          nextStatus ===
                            'FAILED';

                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            disabled={
                              updatingStatus
                            }
                            onClick={() =>
                              onStatusChange(
                                order,
                                nextStatus,
                              )
                            }
                            className={[
                              'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
                              destructive
                                ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-500/20 dark:bg-white/5 dark:text-rose-300 dark:hover:bg-rose-500/10'
                                : 'bg-[#0b5f46] text-white shadow-md shadow-emerald-900/10 hover:bg-[#084d3a]',
                            ].join(' ')}
                          >
                            {updatingStatus ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : nextStatus ===
                              'DELIVERED' ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}

                            {formatLabel(
                              nextStatus,
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>
              ) : (
                <section className="rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-5 dark:border-white/8 dark:bg-white/[0.035]">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-white text-slate-500 shadow-sm dark:bg-white/8 dark:text-slate-300">
                      <CheckCircle2 className="size-4" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        Workflow complete
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        This order is in a terminal state and has no further status actions.
                      </p>
                    </div>
                  </div>
                </section>
              )}


              <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/8 dark:bg-white/[0.045]">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    Customer
                  </h3>
                </div>

                <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {getCustomerName(order)}
                </p>

                <div className="mt-3 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0" />
                    <span className="truncate">
                      {order.customer.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" />
                    <span>
                      {order.customer.phone || 'No phone number'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/8 dark:bg-white/[0.045]">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    Fulfilment & delivery
                  </h3>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">
                      Branch
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {order.fulfillmentBranch.name}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {order.fulfillmentBranch.address},{' '}
                      {order.fulfillmentBranch.city},{' '}
                      {order.fulfillmentBranch.state}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 dark:border-white/8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">
                      Customer address
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {order.deliveryAddress.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {order.deliveryAddress.addressLine}
                      {order.deliveryAddress.area
                        ? `, ${order.deliveryAddress.area}`
                        : ''}
                      , {order.deliveryAddress.city},{' '}
                      {order.deliveryAddress.state}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/8 dark:bg-white/[0.045]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Box className="size-4 text-emerald-600" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">
                      Order items
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
                    {order.items.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-[18px] bg-slate-50 p-3.5 dark:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.quantity}{' '}
                            {item.product.unit} x{' '}
                            {formatMoney(item.unitPrice)}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-slate-950 dark:text-white">
                          {formatMoney(item.totalPrice)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/8 dark:bg-white/[0.045]">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    Payment
                  </h3>
                </div>

                {order.payment ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">
                        Status
                      </span>

                      <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        <span
                          className={[
                            'size-2 rounded-full',
                            getPaymentClasses(order.payment.status),
                          ].join(' ')}
                        />
                        {formatLabel(order.payment.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">
                        Method
                      </span>

                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatLabel(order.payment.method)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">
                        Reference
                      </span>

                      <span className="max-w-[60%] truncate font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {order.payment.reference}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">
                        Amount
                      </span>

                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatMoney(order.payment.amount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    No payment record is attached to this order.
                  </p>
                )}
              </section>

              <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/8 dark:bg-white/[0.045]">
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    Financial breakdown
                  </h3>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      Subtotal
                    </span>
                    <span className="font-medium">
                      {formatMoney(order.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      Delivery fee
                    </span>
                    <span className="font-medium">
                      {formatMoney(order.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      Cross-branch fee
                    </span>
                    <span className="font-medium">
                      {formatMoney(order.crossBranchFee)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      Discount
                    </span>
                    <span className="font-medium">
                      -{formatMoney(order.discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base dark:border-white/8">
                    <span className="font-semibold">
                      Total
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatMoney(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </section>

              {order.notes ? (
                <section className="rounded-[24px] border border-amber-200/60 bg-amber-50/70 p-5 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-300">
                    Customer note
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {order.notes}
                  </p>
                </section>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function OrdersCommandCenter() {
  const queryClient =
    useQueryClient();

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<
    'ALL' | OrderStatus
  >('ALL');

  const [
    selectedPayment,
    setSelectedPayment,
  ] = useState<
    'ALL' | PaymentStatus
  >('ALL');

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState('ALL');

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState<Order | null>(
    null,
  );

  const [
    assignmentOrder,
    setAssignmentOrder,
  ] = useState<Order | null>(null);

  const [
    selectedRiderId,
    setSelectedRiderId,
  ] = useState('');

  const [
    assignmentError,
    setAssignmentError,
  ] = useState('');

  const ordersQuery =
    useQuery({
      queryKey: [
        'admin-orders',
      ],

      queryFn: async () => {
        const response =
          await api.get<OrdersResponse>(
            '/orders',
          );

        return (
          response.data.data
            .orders ?? []
        );
      },

      staleTime: 20_000,

      refetchOnWindowFocus:
        false,
    });

  const orders =
    ordersQuery.data ?? [];

  const branches =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      orders.forEach(
        (order) => {
          if (
            order.fulfillmentBranch
          ) {
            map.set(
              order.fulfillmentBranch.id,
              order.fulfillmentBranch.name,
            );
          }
        },
      );

      return Array.from(
        map.entries(),
      )
        .map(
          ([id, name]) => ({
            id,
            name,
          }),
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
          ),
        );
    }, [orders]);

  const filteredOrders =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const matchesStatus =
            selectedStatus ===
              'ALL' ||
            order.status ===
              selectedStatus;

          const matchesPayment =
            selectedPayment ===
              'ALL' ||
            order.payment?.status ===
              selectedPayment;

          const matchesBranch =
            selectedBranch ===
              'ALL' ||
            order.fulfillmentBranchId ===
              selectedBranch;

          const searchableText =
            [
              order.orderNumber,
              order.customer?.firstName,
              order.customer?.lastName,
              order.customer?.email,
              order.customer?.phone,
              order.fulfillmentBranch?.name,
              ...order.items.map(
                (item) =>
                  item.product?.name,
              ),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch,
            );

          return (
            matchesStatus &&
            matchesPayment &&
            matchesBranch &&
            matchesSearch
          );
        },
      );
    }, [
      orders,
      search,
      selectedBranch,
      selectedPayment,
      selectedStatus,
    ]);

  const metrics =
    useMemo(() => {
      const now =
        new Date();

      const todayStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

      const ordersToday =
        orders.filter(
          (order) =>
            new Date(
              order.createdAt,
            ) >= todayStart,
        );

      const active =
        orders.filter(
          (order) =>
            [
              'CONFIRMED',
              'PROCESSING',
              'READY_FOR_PICKUP',
              'ASSIGNED',
              'OUT_FOR_DELIVERY',
            ].includes(
              order.status,
            ),
        );

      const delivered =
        orders.filter(
          (order) =>
            order.status ===
            'DELIVERED',
        );

      const paidRevenue =
        orders.reduce(
          (total, order) =>
            order.payment
              ?.status ===
            'PAID'
              ? total +
                Number(
                  order.payment
                    .amount ??
                    order.totalAmount,
                )
              : total,
          0,
        );

      return {
        total: orders.length,
        today:
          ordersToday.length,
        pending:
          orders.filter(
            (order) =>
              order.status ===
              'PENDING',
          ).length,
        active:
          active.length,
        delivered:
          delivered.length,
        paidRevenue,
      };
    }, [orders]);

  const ridersQuery = useQuery({
    queryKey: [
      'assignment-riders',
      assignmentOrder?.fulfillmentBranchId,
    ],
    enabled: Boolean(assignmentOrder?.fulfillmentBranchId),
    queryFn: async () => {
      if (!assignmentOrder) {
        return [];
      }

      const response = await api.get<RidersResponse>('/riders', {
        params: {
          branchId: assignmentOrder.fulfillmentBranchId,
          isAvailable: true,
        },
      });

      return response.data.data.riders ?? [];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const assignRiderMutation = useMutation({
    mutationFn: async ({
      order,
      riderId,
    }: {
      order: Order;
      riderId: string;
    }) => {
      if (!order.delivery?.id) {
        throw new Error('This order does not have a delivery record.');
      }

      await api.patch(`/deliveries/${order.delivery.id}/rider`, {
        riderId,
      });

      const refreshed = await api.get<OrderResponse>(`/orders/${order.id}`);
      return refreshed.data.data.order;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<Order[]>(
        ['admin-orders'],
        (currentOrders) =>
          currentOrders?.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order,
          ) ?? [updatedOrder],
      );

      setSelectedOrder(updatedOrder);
      setAssignmentOrder(null);
      setSelectedRiderId('');
      setAssignmentError('');

      void queryClient.invalidateQueries({
        queryKey: ['admin-orders'],
      });
    },
    onError: (error) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'The rider could not be assigned. Please try again.')
          : error instanceof Error
            ? error.message
            : 'The rider could not be assigned. Please try again.';

      setAssignmentError(message);
    },
  });

  const statusMutation =
    useMutation({
      mutationFn: async ({
        orderId,
        status,
      }: {
        orderId: string;
        status: OrderStatus;
      }) => {
        const response =
          await api.patch<UpdateOrderStatusResponse>(
            `/orders/${orderId}/status`,
            {
              status,
            },
          );

        return response.data.data
          .order;
      },

      onSuccess: (
        updatedOrder,
      ) => {
        queryClient.setQueryData<
          Order[]
        >(
          [
            'admin-orders',
          ],
          (currentOrders) => {
            if (!currentOrders) {
              return [
                updatedOrder,
              ];
            }

            return currentOrders.map(
              (order) =>
                order.id ===
                updatedOrder.id
                  ? updatedOrder
                  : order,
            );
          },
        );

        setSelectedOrder(
          updatedOrder,
        );

        void queryClient.invalidateQueries({
          queryKey: [
            'admin-orders',
          ],
        });
      },
    });

  const handleStatusChange = (
    order: Order,
    status: OrderStatus,
  ) => {
    const allowed =
      orderStatusTransitions[
        order.status
      ].includes(status);

    if (!allowed) {
      return;
    }

    const destructive =
      status === 'CANCELLED' ||
      status === 'FAILED';

    const confirmed =
      window.confirm(
        destructive
          ? `Confirm ${formatLabel(status).toLowerCase()} for ${order.orderNumber}? This changes the operational state of the order.`
          : `Move ${order.orderNumber} from ${formatLabel(order.status)} to ${formatLabel(status)}?`,
      );

    if (!confirmed) {
      return;
    }

    statusMutation.mutate({
      orderId: order.id,
      status,
    });
  };
  const openRiderAssignment = (order: Order) => {
    if (!order.delivery?.id || order.status !== 'READY_FOR_PICKUP') {
      return;
    }

    setSelectedRiderId('');
    setAssignmentError('');
    setAssignmentOrder(order);
  };

  const closeRiderAssignment = () => {
    if (assignRiderMutation.isPending) {
      return;
    }

    setAssignmentOrder(null);
    setSelectedRiderId('');
    setAssignmentError('');
  };

  const confirmRiderAssignment = () => {
    if (!assignmentOrder || !selectedRiderId) {
      return;
    }

    const rider = ridersQuery.data?.find(
      (candidate) => candidate.id === selectedRiderId,
    );

    if (!rider) {
      setAssignmentError('Select an available rider before continuing.');
      return;
    }

    const riderName = [rider.user.firstName, rider.user.lastName]
      .filter(Boolean)
      .join(' ');

    const confirmed = window.confirm(
      `Assign ${riderName || 'this rider'} to ${assignmentOrder.orderNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    setAssignmentError('');
    assignRiderMutation.mutate({
      order: assignmentOrder,
      riderId: selectedRiderId,
    });
  };

  const filtersActive =
    Boolean(
      search.trim(),
    ) ||
    selectedStatus !== 'ALL' ||
    selectedPayment !== 'ALL' ||
    selectedBranch !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSelectedPayment('ALL');
    setSelectedBranch('ALL');
  };

  return (
    <>
      <div className="relative min-w-0 py-4 sm:py-5 lg:py-6">
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-100/80 bg-gradient-to-br from-white via-[#f7fffb] to-[#e9f8f1] px-4 py-5 shadow-[0_22px_70px_rgba(13,94,69,0.07)] sm:px-6 sm:py-6 lg:px-8 dark:border-emerald-500/10 dark:from-white/[0.06] dark:via-emerald-500/[0.045] dark:to-white/[0.025]">
          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                -30,
                25,
                -30,
              ],
              y: [
                10,
                -16,
                10,
              ],
              rotate: [
                0,
                8,
                0,
              ],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-emerald-400/10 blur-3xl"
          />

          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                15,
                -25,
                15,
              ],
              y: [
                0,
                18,
                0,
              ],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute -bottom-28 left-[35%] size-64 rounded-full bg-cyan-300/10 blur-3xl"
          />

          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Orders command center
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b5f46] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-900/10">
                  <Sparkles className="size-3" />
                  Live operations
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-[28px] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[36px] lg:text-[42px] dark:text-white">
                Every order.
                <span className="text-emerald-700 dark:text-emerald-300">
                  {' '}One operational view.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px] dark:text-slate-400">
                Monitor customer orders, payments, fulfilment branches and delivery progress across Ogun&apos;s Sure Gas.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                ordersQuery.refetch()
              }
              disabled={
                ordersQuery.isFetching
              }
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 xl:self-center dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300"
            >
              {ordersQuery.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}

              Refresh orders
            </button>
          </div>
        </section>

        <section className="mt-4 grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
          <StatCard
            label="All orders"
            value={metrics.total}
            caption={`${metrics.today} created today`}
            icon={<ShoppingBag className="size-5" />}
            accent="bg-emerald-500"
          />

          <StatCard
            label="Pending"
            value={metrics.pending}
            caption="Awaiting confirmation"
            icon={<Clock3 className="size-5" />}
            accent="bg-amber-500"
          />

          <StatCard
            label="Active flow"
            value={metrics.active}
            caption="Currently in fulfilment"
            icon={<Truck className="size-5" />}
            accent="bg-sky-500"
          />

          <StatCard
            label="Delivered"
            value={metrics.delivered}
            caption="Completed orders"
            icon={<PackageCheck className="size-5" />}
            accent="bg-violet-500"
          />

          <div className="col-span-2 xl:col-span-1">
            <StatCard
              label="Paid value"
              value={formatMoney(
                metrics.paidRevenue,
              )}
              caption="Across loaded orders"
              icon={<WalletCards className="size-5" />}
              accent="bg-cyan-500"
            />
          </div>
        </section>

        <section className="mt-4 min-w-0 rounded-[26px] border border-white/80 bg-white/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-4 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search order, customer, phone, email or product..."
                className="h-11 w-full rounded-[15px] border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 dark:border-white/8 dark:bg-white/[0.035] dark:text-white dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.055]"
              />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:shrink-0">
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={selectedBranch}
                  onChange={(event) =>
                    setSelectedBranch(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full min-w-0 appearance-none rounded-[15px] border border-slate-200 bg-slate-50/80 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 xl:w-[190px] dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-200"
                >
                  <option value="ALL">
                    All branches
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={selectedPayment}
                  onChange={(event) =>
                    setSelectedPayment(
                      event.target.value as
                        | 'ALL'
                        | PaymentStatus,
                    )
                  }
                  className="h-11 w-full min-w-0 appearance-none rounded-[15px] border border-slate-200 bg-slate-50/80 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 xl:w-[170px] dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-200"
                >
                  {paymentStatuses.map(
                    (payment) => (
                      <option
                        key={payment.value}
                        value={payment.value}
                      >
                        {payment.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
            <div className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Filter className="size-3.5" />
              Status
            </div>

            {orderStatuses.map(
              (status) => {
                const active =
                  selectedStatus ===
                  status.value;

                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() =>
                      setSelectedStatus(
                        status.value,
                      )
                    }
                    className={[
                      'shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition',
                      active
                        ? 'bg-[#0b5f46] text-white shadow-md shadow-emerald-900/10'
                        : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700 dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:text-emerald-300',
                    ].join(' ')}
                  >
                    {status.label}
                  </button>
                );
              },
            )}

            {filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Clear
              </button>
            ) : null}
          </div>
        </section>

        <div className="mt-4">
          {ordersQuery.isLoading ? (
            <LoadingState />
          ) : ordersQuery.isError ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-rose-200/70 bg-rose-50/60 px-6 text-center dark:border-rose-500/15 dark:bg-rose-500/[0.05]">
              <div className="flex size-16 items-center justify-center rounded-[22px] bg-white text-rose-600 shadow-sm dark:bg-white/5 dark:text-rose-300">
                <AlertCircle className="size-7" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
                Orders couldn&apos;t be loaded
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                The admin interface could not reach the Orders API. Your session or backend connection may need attention.
              </p>

              <button
                type="button"
                onClick={() =>
                  ordersQuery.refetch()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0b5f46] px-5 py-2.5 text-sm font-semibold text-white"
              >
                <RefreshCw className="size-4" />
                Try again
              </button>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <EmptyState
              filtered={
                filtersActive
              }
              onClear={
                clearFilters
              }
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-[0_20px_65px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:block dark:border-white/8 dark:bg-white/[0.045]">
                <div className="grid grid-cols-[1.15fr_1.15fr_1fr_0.75fr_0.75fr_130px_44px] items-center gap-4 border-b border-slate-100 bg-slate-50/65 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:border-white/8 dark:bg-white/[0.025]">
                  <span>Order</span>
                  <span>Customer</span>
                  <span>Branch</span>
                  <span>Payment</span>
                  <span>Total</span>
                  <span>Status</span>
                  <span />
                </div>

                <div>
                  {filteredOrders.map(
                    (order) => (
                      <button
                        type="button"
                        key={order.id}
                        onClick={() =>
                          setSelectedOrder(
                            order,
                          )
                        }
                        className="group grid w-full grid-cols-[1.15fr_1.15fr_1fr_0.75fr_0.75fr_130px_44px] items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-emerald-50/45 dark:border-white/6 dark:hover:bg-emerald-500/[0.045]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {order.orderNumber}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <CalendarDays className="size-3" />
                            {formatShortDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {getCustomerName(order)}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-400">
                            {order.customer.phone ||
                              order.customer.email}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                            {order.fulfillmentBranch.name}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-400">
                            {order.fulfillmentBranch.city}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span
                              className={[
                                'size-2 shrink-0 rounded-full',
                                getPaymentClasses(
                                  order.payment?.status,
                                ),
                              ].join(' ')}
                            />

                            {order.payment?.status
                              ? formatLabel(
                                  order.payment.status,
                                )
                              : 'No payment'}
                          </p>
                        </div>

                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {formatMoney(order.totalAmount)}
                        </p>

                        <div>
                          <OrderStatusBadge
                            status={order.status}
                          />
                        </div>

                        <div className="flex size-9 items-center justify-center rounded-full text-slate-400 transition group-hover:bg-white group-hover:text-emerald-700 group-hover:shadow-sm dark:group-hover:bg-white/8 dark:group-hover:text-emerald-300">
                          <ChevronRight className="size-4" />
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="grid min-w-0 gap-3 lg:hidden">
                {filteredOrders.map(
                  (order) => (
                    <motion.button
                      layout
                      type="button"
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(
                          order,
                        )
                      }
                      className="min-w-0 overflow-hidden rounded-[22px] border border-white/80 bg-white/90 p-4 text-left shadow-[0_14px_45px_rgba(15,23,42,0.05)] dark:border-white/8 dark:bg-white/[0.045]"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {order.orderNumber}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {formatShortDate(order.createdAt)}
                          </p>
                        </div>

                        <OrderStatusBadge
                          status={order.status}
                        />
                      </div>

                      <div className="mt-4 flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <UserRound className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {getCustomerName(order)}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {order.fulfillmentBranch.name}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-[17px] bg-slate-50 p-3 dark:bg-white/[0.035]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Payment
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span
                              className={[
                                'size-1.5 rounded-full',
                                getPaymentClasses(
                                  order.payment?.status,
                                ),
                              ].join(' ')}
                            />
                            {order.payment?.status
                              ? formatLabel(
                                  order.payment.status,
                                )
                              : 'Unavailable'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-950 dark:text-white">
                            {formatMoney(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {order.items.length}{' '}
                          {order.items.length === 1
                            ? 'item'
                            : 'items'}
                        </span>

                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                          View order
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </motion.button>
                  ),
                )}
              </div>

              <div className="mt-3 flex flex-col justify-between gap-2 px-1 text-xs text-slate-400 sm:flex-row sm:items-center">
                <p>
                  Showing{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {filteredOrders.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {orders.length}
                  </span>{' '}
                  loaded orders
                </p>

                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Backend data connected
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() =>
          setSelectedOrder(null)
        }
        onStatusChange={handleStatusChange}
        onAssignRider={openRiderAssignment}
        updatingStatus={statusMutation.isPending}
        assigningRider={assignRiderMutation.isPending}
      />

      <AnimatePresence>
        {assignmentOrder ? (
          <>
            <motion.button
              type="button"
              aria-label="Close rider assignment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRiderAssignment}
              className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[3px]"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Assign rider"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="fixed inset-x-3 bottom-3 z-[100] max-h-[88vh] overflow-hidden rounded-[28px] border border-white/80 bg-[#f7faf9] shadow-[0_30px_100px_rgba(2,44,33,0.28)] sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(680px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 dark:border-white/10 dark:bg-[#071814]"
            >
              <div className="border-b border-slate-200/70 bg-white/75 px-5 py-5 backdrop-blur-xl sm:px-6 dark:border-white/8 dark:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex size-10 items-center justify-center rounded-[15px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Bike className="size-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                          Rider assignment
                        </p>
                        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                          {assignmentOrder.orderNumber}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Available riders for {assignmentOrder.fulfillmentBranch.name}. The backend will verify branch membership, account status, availability and active-delivery constraints before assignment.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeRiderAssignment}
                    disabled={assignRiderMutation.isPending}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[52vh] overflow-y-auto p-4 sm:p-5">
                {ridersQuery.isLoading ? (
                  <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                    Loading available riders...
                  </div>
                ) : ridersQuery.isError ? (
                  <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    Available riders could not be loaded.
                    <button
                      type="button"
                      onClick={() => ridersQuery.refetch()}
                      className="ml-2 font-bold underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </div>
                ) : (ridersQuery.data?.length ?? 0) === 0 ? (
                  <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <Bike className="size-7 text-slate-400" />
                    <p className="mt-3 font-semibold text-slate-950 dark:text-white">
                      No available riders
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                      There are currently no available riders returned for this fulfilment branch.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ridersQuery.data?.map((rider) => {
                      const active = selectedRiderId === rider.id;
                      const riderName = [rider.user.firstName, rider.user.lastName]
                        .filter(Boolean)
                        .join(' ') || 'Rider';

                      return (
                        <button
                          key={rider.id}
                          type="button"
                          onClick={() => {
                            setSelectedRiderId(rider.id);
                            setAssignmentError('');
                          }}
                          className={[
                            'rounded-[20px] border p-4 text-left transition',
                            active
                              ? 'border-emerald-400 bg-emerald-50 shadow-[0_12px_35px_rgba(5,150,105,0.10)] ring-4 ring-emerald-500/5 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                              : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-emerald-500/20',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[#0b5f46] text-sm font-bold text-white">
                                {rider.user.firstName?.charAt(0) || 'R'}
                                {rider.user.lastName?.charAt(0) || ''}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                  {riderName}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {rider.user.phone || rider.user.email}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-white/8">
                            <div>
                              <p className="text-slate-400">Vehicle</p>
                              <p className="mt-1 truncate font-semibold text-slate-700 dark:text-slate-300">
                                {rider.vehicleType || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Vehicle no.</p>
                              <p className="mt-1 truncate font-semibold text-slate-700 dark:text-slate-300">
                                {rider.vehicleNumber || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {assignmentError ? (
                  <div className="mt-4 flex items-start gap-2 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {assignmentError}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 bg-white/75 px-4 py-4 sm:px-5 dark:border-white/8 dark:bg-white/[0.035]">
                <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                  {(ridersQuery.data?.length ?? 0)} available rider{(ridersQuery.data?.length ?? 0) === 1 ? '' : 's'}
                </p>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={closeRiderAssignment}
                    disabled={assignRiderMutation.isPending}
                    className="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRiderAssignment}
                    disabled={!selectedRiderId || assignRiderMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0b5f46] px-5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-[#084d3a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assignRiderMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Confirm assignment
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}








