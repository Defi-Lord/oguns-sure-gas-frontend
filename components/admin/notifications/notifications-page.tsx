'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertTriangle,
  Bell,
  BellDot,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Gift,
  Inbox,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

import {
  deleteNotification,
  getNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  createNotificationSocket,
} from '@/lib/realtime/notifications';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  NotificationListFilters,
  NotificationRecord,
  NotificationType,
} from '@/types/notification';

const QUERY_ROOT = [
  'admin',
  'notifications',
] as const;

type ReadFilter =
  | 'ALL'
  | 'UNREAD'
  | 'READ';

type TypeFilter =
  | 'ALL'
  | NotificationType;

const TYPE_LABEL: Record<
  NotificationType,
  string
> = {
  ORDER: 'Order',
  DELIVERY: 'Delivery',
  PAYMENT: 'Payment',
  SYSTEM: 'System',
  PROMOTION: 'Promotion',
};

const TYPE_CLASS: Record<
  NotificationType,
  string
> = {
  ORDER:
    'border-sky-200 bg-sky-50 text-sky-700',
  DELIVERY:
    'border-violet-200 bg-violet-50 text-violet-700',
  PAYMENT:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  SYSTEM:
    'border-amber-200 bg-amber-50 text-amber-700',
  PROMOTION:
    'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
};

function typeIcon(
  type: NotificationType,
  className = 'size-4',
): ReactNode {
  if (type === 'ORDER') {
    return (
      <PackageCheck
        className={className}
      />
    );
  }

  if (type === 'DELIVERY') {
    return (
      <Truck
        className={className}
      />
    );
  }

  if (type === 'PAYMENT') {
    return (
      <CircleDollarSign
        className={className}
      />
    );
  }

  if (type === 'PROMOTION') {
    return (
      <Gift
        className={className}
      />
    );
  }

  return (
    <ShieldCheck
      className={className}
    />
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

function formatRelativeTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  const seconds =
    Math.round(
      (
        date.getTime() -
        Date.now()
      ) /
        1_000,
    );

  const formatter =
    new Intl.RelativeTimeFormat(
      'en',
      {
        numeric: 'auto',
      },
    );

  const ranges:
    Array<
      [
        Intl.RelativeTimeFormatUnit,
        number,
      ]
    > = [
      ['year', 31_536_000],
      ['month', 2_592_000],
      ['week', 604_800],
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
    ];

  for (
    const [
      unit,
      divisor,
    ] of ranges
  ) {
    if (
      Math.abs(seconds) >=
      divisor
    ) {
      return formatter.format(
        Math.round(
          seconds /
            divisor,
        ),
        unit,
      );
    }
  }

  return 'just now';
}

function TypeBadge({
  type,
}: {
  type: NotificationType;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        TYPE_CLASS[type],
      ].join(' ')}
    >
      {
        typeIcon(
          type,
          'size-3.5',
        )
      }
      {TYPE_LABEL[type]}
    </span>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RealtimeBadge({
  connected,
}: {
  connected: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
        connected
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-500',
      ].join(' ')}
    >
      {connected ? (
        <Wifi className="size-3.5" />
      ) : (
        <WifiOff className="size-3.5" />
      )}
      {connected
        ? 'Live connected'
        : 'Live reconnecting'}
    </span>
  );
}

export function NotificationsPage() {
  const queryClient =
    useQueryClient();

  const accessToken =
    useAuthStore(
      (state) =>
        state.accessToken,
    );

  const authUser =
    useAuthStore(
      (state) =>
        state.user,
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    readFilter,
    setReadFilter,
  ] =
    useState<ReadFilter>(
      'ALL',
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      'ALL',
    );

  const [
    selectedNotification,
    setSelectedNotification,
  ] =
    useState<
      NotificationRecord | null
    >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] =
    useState(false);

  const [
    notice,
    setNotice,
  ] =
    useState<
      string | null
    >(null);

  const [
    localError,
    setLocalError,
  ] =
    useState<
      string | null
    >(null);

  const serverFilters =
    useMemo<
      NotificationListFilters
    >(
      () => ({
        ...(readFilter ===
        'READ'
          ? {
              isRead: true,
            }
          : {}),

        ...(readFilter ===
        'UNREAD'
          ? {
              isRead: false,
            }
          : {}),

        ...(typeFilter !==
        'ALL'
          ? {
              type:
                typeFilter,
            }
          : {}),

        limit: 100,
      }),
      [
        readFilter,
        typeFilter,
      ],
    );

  const notificationsQuery =
    useQuery({
      queryKey: [
        ...QUERY_ROOT,
        'list',
        serverFilters,
      ],

      queryFn: () =>
        getNotifications(
          serverFilters,
        ),
    });

  const unreadCountQuery =
    useQuery({
      queryKey: [
        ...QUERY_ROOT,
        'unread-count',
      ],

      queryFn:
        getUnreadNotificationCount,

      refetchInterval:
        realtimeConnected
          ? false
          : 30_000,
    });

  const notifications =
    notificationsQuery.data ??
    [];

  const unreadCount =
    unreadCountQuery.data ??
    0;

  const filteredNotifications =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return notifications;
        }

        return notifications.filter(
          (
            notification,
          ) => {
            const payload =
              notification.data
                ? JSON.stringify(
                    notification.data,
                  )
                : '';

            return [
              notification.title,
              notification.message,
              TYPE_LABEL[
                notification.type
              ],
              payload,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query);
          },
        );
      },
      [
        notifications,
        search,
      ],
    );

  const metrics =
    useMemo(
      () => ({
        loaded:
          notifications.length,

        unread:
          unreadCount,

        orders:
          notifications.filter(
            (item) =>
              item.type ===
              'ORDER',
          ).length,

        operations:
          notifications.filter(
            (item) =>
              item.type ===
                'DELIVERY' ||
              item.type ===
                'PAYMENT' ||
              item.type ===
                'SYSTEM',
          ).length,
      }),
      [
        notifications,
        unreadCount,
      ],
    );

  const refreshAll =
    async () => {
      setLocalError(null);

      await queryClient
        .invalidateQueries({
          queryKey:
            QUERY_ROOT,
        });
    };

  useEffect(
    () => {
      if (!accessToken) {
        setRealtimeConnected(
          false,
        );
        return;
      }

      let socket:
        ReturnType<
          typeof createNotificationSocket
        > | null = null;

      try {
        socket =
          createNotificationSocket(
            accessToken,
          );

        socket.on(
          'notification:ready',
          () => {
            setRealtimeConnected(
              true,
            );
          },
        );

        socket.on(
          'notification:new',
          (
            notification,
          ) => {
            setNotice(
              `New ${TYPE_LABEL[
                notification.type
              ].toLowerCase()} notification received.`,
            );

            void queryClient
              .invalidateQueries({
                queryKey:
                  QUERY_ROOT,
              });
          },
        );

        socket.on(
          'connect_error',
          () => {
            setRealtimeConnected(
              false,
            );
          },
        );

        socket.on(
          'disconnect',
          () => {
            setRealtimeConnected(
              false,
            );
          },
        );
      } catch {
        setRealtimeConnected(
          false,
        );
      }

      return () => {
        socket?.disconnect();
      };
    },
    [
      accessToken,
      queryClient,
    ],
  );

  const markOneMutation =
    useMutation({
      mutationFn:
        markNotificationRead,

      onSuccess:
        (
          updated,
        ) => {
          if (
            selectedNotification
              ?.id ===
            updated.id
          ) {
            setSelectedNotification(
              updated,
            );
          }

          setNotice(
            'Notification marked as read.',
          );

          void refreshAll();
        },

      onError:
        (
          error,
        ) => {
          setLocalError(
            getApiErrorMessage(
              error,
            ),
          );
        },
    });

  const markAllMutation =
    useMutation({
      mutationFn:
        markAllNotificationsRead,

      onSuccess:
        (
          updatedCount,
        ) => {
          setNotice(
            updatedCount > 0
              ? `${updatedCount} notification${updatedCount === 1 ? '' : 's'} marked as read.`
              : 'There were no unread notifications to update.',
          );

          void refreshAll();
        },

      onError:
        (
          error,
        ) => {
          setLocalError(
            getApiErrorMessage(
              error,
            ),
          );
        },
    });

  const deleteMutation =
    useMutation({
      mutationFn:
        deleteNotification,

      onSuccess:
        (
          result,
        ) => {
          if (
            selectedNotification
              ?.id ===
            result.id
          ) {
            setSelectedNotification(
              null,
            );
          }

          setNotice(
            'Notification deleted successfully.',
          );

          void refreshAll();
        },

      onError:
        (
          error,
        ) => {
          setLocalError(
            getApiErrorMessage(
              error,
            ),
          );
        },
    });

  const openDetails =
    async (
      notification:
        NotificationRecord,
    ) => {
      setSelectedNotification(
        notification,
      );
      setDetailLoading(true);
      setLocalError(null);

      try {
        let refreshed =
          await getNotification(
            notification.id,
          );

        if (!refreshed.isRead) {
          refreshed =
            await markNotificationRead(
              refreshed.id,
            );

          await refreshAll();
        }

        setSelectedNotification(
          refreshed,
        );
      } catch (
        error
      ) {
        setLocalError(
          getApiErrorMessage(
            error,
          ),
        );
      } finally {
        setDetailLoading(
          false,
        );
      }
    };

  const runDelete =
    (
      notification:
        NotificationRecord,
    ) => {
      const confirmed =
        window.confirm(
          `Delete notification "${notification.title}"?`,
        );

      if (!confirmed) {
        return;
      }

      deleteMutation.mutate(
        notification.id,
      );
    };

  const queryError =
    notificationsQuery.error ||
    unreadCountQuery.error;

  const error =
    localError ||
    (
      queryError
        ? getApiErrorMessage(
            queryError,
          )
        : null
    );

  if (
    notificationsQuery.isLoading &&
    unreadCountQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="size-5 animate-spin text-emerald-600" />
          Loading notification center...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <BellDot className="size-4" />
                Operations inbox
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Notification center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Review system-generated alerts from orders, delivery,
                payment, inventory, campaigns and platform operations.
              </p>

              {authUser && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Signed in as{' '}
                  <span className="text-slate-800">
                    {authUser.email}
                  </span>{' '}
                  · {authUser.role}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <RealtimeBadge
                connected={
                  realtimeConnected
                }
              />

              <button
                type="button"
                onClick={() =>
                  void refreshAll()
                }
                disabled={
                  notificationsQuery.isFetching ||
                  unreadCountQuery.isFetching
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={[
                    'size-4',
                    notificationsQuery.isFetching ||
                    unreadCountQuery.isFetching
                      ? 'animate-spin'
                      : '',
                  ].join(' ')}
                />
                Refresh
              </button>

              <button
                type="button"
                disabled={
                  unreadCount ===
                    0 ||
                  markAllMutation
                    .isPending
                }
                onClick={() =>
                  markAllMutation
                    .mutate()
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markAllMutation
                  .isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                Mark all read
              </button>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                {error}
              </div>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() =>
                  setLocalError(
                    null,
                  )
                }
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )}

          {notice && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                {notice}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() =>
                  setNotice(
                    null,
                  )
                }
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Loaded"
            value={
              metrics.loaded
            }
            description="Notifications returned by the current server filters, up to 100."
            icon={
              <Inbox className="size-5" />
            }
          />

          <MetricCard
            title="Unread"
            value={
              metrics.unread
            }
            description="Authoritative unread count for the signed-in administrator."
            icon={
              <BellDot className="size-5" />
            }
          />

          <MetricCard
            title="Order alerts"
            value={
              metrics.orders
            }
            description="Order notifications inside the current loaded result."
            icon={
              <PackageCheck className="size-5" />
            }
          />

          <MetricCard
            title="Operations"
            value={
              metrics.operations
            }
            description="Delivery, payment and system alerts in the current result."
            icon={
              <Sparkles className="size-5" />
            }
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_210px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search title, message, type or payload..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <select
                value={
                  readFilter
                }
                onChange={(
                  event,
                ) =>
                  setReadFilter(
                    event.target
                      .value as
                      ReadFilter,
                  )
                }
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="ALL">
                  All read states
                </option>
                <option value="UNREAD">
                  Unread only
                </option>
                <option value="READ">
                  Read only
                </option>
              </select>

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event,
                ) =>
                  setTypeFilter(
                    event.target
                      .value as
                      TypeFilter,
                  )
                }
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="ALL">
                  All notification types
                </option>

                {(
                  Object.keys(
                    TYPE_LABEL,
                  ) as
                    NotificationType[]
                ).map(
                  (
                    type,
                  ) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {
                        TYPE_LABEL[
                          type
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {notificationsQuery
            .isFetching &&
          !notificationsQuery
            .isLoading ? (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-xs font-medium text-slate-500 md:px-6">
              <Loader2 className="size-3.5 animate-spin" />
              Refreshing notifications...
            </div>
          ) : null}

          {filteredNotifications
            .length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Bell className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No notifications found
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no notification records matching the current search and filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications
                .map(
                  (
                    notification,
                  ) => {
                    const markBusy =
                      markOneMutation
                        .isPending &&
                      markOneMutation
                        .variables ===
                        notification.id;

                    const deleteBusy =
                      deleteMutation
                        .isPending &&
                      deleteMutation
                        .variables ===
                        notification.id;

                    return (
                      <article
                        key={
                          notification.id
                        }
                        className={[
                          'relative p-5 transition md:p-6',
                          notification.isRead
                            ? 'bg-white hover:bg-slate-50/80'
                            : 'bg-emerald-50/35 hover:bg-emerald-50/60',
                        ].join(' ')}
                      >
                        {!notification.isRead && (
                          <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                        )}

                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-4">
                              <div
                                className={[
                                  'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border',
                                  TYPE_CLASS[
                                    notification.type
                                  ],
                                ].join(' ')}
                              >
                                {
                                  typeIcon(
                                    notification.type,
                                    'size-5',
                                  )
                                }
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-slate-950">
                                    {
                                      notification.title
                                    }
                                  </h3>

                                  <TypeBadge
                                    type={
                                      notification.type
                                    }
                                  />

                                  {!notification.isRead && (
                                    <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                                      New
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                                  {
                                    notification.message
                                  }
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="size-3.5" />
                                    {
                                      formatRelativeTime(
                                        notification.createdAt,
                                      )
                                    }
                                    {' · '}
                                    {
                                      formatDate(
                                        notification.createdAt,
                                      )
                                    }
                                  </span>

                                  {notification.isRead &&
                                  notification.readAt ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Check className="size-3.5" />
                                      Read{' '}
                                      {
                                        formatDate(
                                          notification.readAt,
                                        )
                                      }
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                void openDetails(
                                  notification,
                                )
                              }
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Eye className="size-4" />
                              Details
                            </button>

                            {!notification.isRead && (
                              <button
                                type="button"
                                disabled={
                                  markBusy
                                }
                                onClick={() =>
                                  markOneMutation
                                    .mutate(
                                      notification.id,
                                    )
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                              >
                                {markBusy ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Check className="size-4" />
                                )}
                                Mark read
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={
                                deleteBusy
                              }
                              onClick={() =>
                                runDelete(
                                  notification,
                                )
                              }
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              {deleteBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm"
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
            <button
              type="button"
              aria-label="Close notification details"
              className="absolute inset-0"
              onClick={() =>
                setSelectedNotification(
                  null,
                )
              }
            />

            <motion.aside
              initial={{
                x: 48,
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: 48,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
            >
              <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Notification record
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {
                      selectedNotification.title
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close details"
                  onClick={() =>
                    setSelectedNotification(
                      null,
                    )
                  }
                  className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X className="size-4" />
                </button>
              </header>

              <div className="space-y-6 p-6">
                {detailLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" />
                    Refreshing notification...
                  </div>
                )}

                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        'flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-white',
                        TYPE_CLASS[
                          selectedNotification.type
                        ],
                      ].join(' ')}
                    >
                      {
                        typeIcon(
                          selectedNotification.type,
                          'size-5',
                        )
                      }
                    </div>

                    <div>
                      <TypeBadge
                        type={
                          selectedNotification.type
                        }
                      />
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {
                          selectedNotification.message
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {
                        formatDate(
                          selectedNotification.createdAt,
                        )
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Read state
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {
                        selectedNotification.isRead
                          ? 'Read'
                          : 'Unread'
                      }
                    </p>
                    {selectedNotification.readAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        {
                          formatDate(
                            selectedNotification.readAt,
                          )
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notification ID
                  </p>
                  <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                    {
                      selectedNotification.id
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Event payload
                  </p>

                  {selectedNotification.data ? (
                    <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                      {
                        JSON.stringify(
                          selectedNotification.data,
                          null,
                          2,
                        )
                      }
                    </pre>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No structured payload was attached to this notification.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  {!selectedNotification.isRead && (
                    <button
                      type="button"
                      disabled={
                        markOneMutation
                          .isPending
                      }
                      onClick={() =>
                        markOneMutation
                          .mutate(
                            selectedNotification.id,
                          )
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <Check className="size-4" />
                      Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      deleteMutation
                        .isPending
                    }
                    onClick={() =>
                      runDelete(
                        selectedNotification,
                      )
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    Delete notification
                  </button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
