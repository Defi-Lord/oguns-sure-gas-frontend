'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ReactNode,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  CalendarRange,
  CircleDollarSign,
  Gauge,
  Gift,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  UsersRound,
} from 'lucide-react';

import {
  getBranches,
} from '@/lib/api/branches';

import {
  getAnalytics,
} from '@/lib/api/analytics';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  AnalyticsKind,
  AnalyticsPayloadMap,
  BranchAnalytics,
  CampaignAnalytics,
  DeliveryAnalytics,
  InventoryAnalytics,
  OrderAnalytics,
  OverviewAnalytics,
  PaymentAnalytics,
  ProductAnalytics,
  SalesAnalytics,
  StatusCounts,
} from '@/types/analytics';

interface AnalyticsDefinition {
  kind: AnalyticsKind;
  label: string;
  description: string;
  icon: ReactNode;
  dateAware: boolean;
}

const ANALYTICS:
  AnalyticsDefinition[] = [
    {
      kind: 'overview',
      label: 'Overview',
      description:
        'Executive snapshot across revenue, orders, customers, delivery and stock health.',
      icon:
        <Gauge className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'sales',
      label: 'Sales',
      description:
        'Daily order value, paid revenue and transaction trend.',
      icon:
        <TrendingUp className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'orders',
      label: 'Orders',
      description:
        'Order volume, status mix, campaign use and discount activity.',
      icon:
        <ShoppingBag className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'products',
      label: 'Products',
      description:
        'Top-selling products by revenue and quantity.',
      icon:
        <PackageSearch className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'inventory',
      label: 'Inventory',
      description:
        'Current stock health, low-stock exposure and estimated inventory value.',
      icon:
        <Boxes className="size-4" />,
      dateAware: false,
    },
    {
      kind: 'deliveries',
      label: 'Deliveries',
      description:
        'Delivery status, turnaround time and gas verification performance.',
      icon:
        <Truck className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'payments',
      label: 'Payments',
      description:
        'Payment volume, method mix and paid revenue split.',
      icon:
        <CircleDollarSign className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'campaigns',
      label: 'Campaigns',
      description:
        'Attributed orders, campaign value, vouchers and participation.',
      icon:
        <Gift className="size-4" />,
      dateAware: true,
    },
    {
      kind: 'branches',
      label: 'Branches',
      description:
        'Branch performance across sales, delivery, riders and inventory.',
      icon:
        <Building2 className="size-4" />,
      dateAware: true,
    },
  ];

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
    ).format(
      Number.isFinite(value)
        ? value
        : 0,
    );

const formatNumber =
  (
    value:
      number,
  ): string =>
    new Intl.NumberFormat(
      'en-NG',
      {
        maximumFractionDigits:
          2,
      },
    ).format(
      Number.isFinite(value)
        ? value
        : 0,
    );

const formatDate =
  (
    value:
      string,
  ): string => {
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
        dateStyle:
          'medium',
      },
    ).format(date);
  };

const formatStatus =
  (
    value:
      string,
  ): string =>
    value
      .toLowerCase()
      .split('_')
      .map(
        (
          part,
        ) =>
          part.charAt(0)
            .toUpperCase() +
          part.slice(1),
      )
      .join(' ');

const todayInput =
  (): string => {
    const now =
      new Date();

    const offset =
      now.getTimezoneOffset();

    const local =
      new Date(
        now.getTime() -
          offset *
            60_000,
      );

    return local
      .toISOString()
      .slice(
        0,
        10,
      );
  };

const daysAgoInput =
  (
    days:
      number,
  ): string => {
    const date =
      new Date();

    date.setDate(
      date.getDate() -
        days,
    );

    const offset =
      date.getTimezoneOffset();

    const local =
      new Date(
        date.getTime() -
          offset *
            60_000,
      );

    return local
      .toISOString()
      .slice(
        0,
        10,
      );
  };

const startOfDayIso =
  (
    value:
      string,
  ): string =>
    new Date(
      `${value}T00:00:00`,
    ).toISOString();

const endOfDayIso =
  (
    value:
      string,
  ): string =>
    new Date(
      `${value}T23:59:59.999`,
    ).toISOString();

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {helper}
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CountList({
  title,
  counts,
  emptyLabel =
    'No records',
}: {
  title: string;
  counts: StatusCounts;
  emptyLabel?: string;
}) {
  const entries =
    Object.entries(
      counts,
    ).sort(
      (
        a,
        b,
      ) =>
        b[1] -
        a[1],
    );

  const total =
    entries.reduce(
      (
        sum,
        [
          ,
          count,
        ],
      ) =>
        sum +
        count,
      0,
    );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">
        {title}
      </h3>

      {entries.length ===
      0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {entries.map(
            (
              [
                label,
                count,
              ],
            ) => {
              const width =
                total > 0
                  ? Math.max(
                      4,
                      (
                        count /
                        total
                      ) *
                        100,
                    )
                  : 0;

              return (
                <div
                  key={
                    label
                  }
                >
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium text-slate-600">
                      {
                        formatStatus(
                          label,
                        )
                      }
                    </span>

                    <span className="font-semibold text-slate-900">
                      {
                        formatNumber(
                          count,
                        )
                      }
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{
                        width:
                          `${width}%`,
                      }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function HorizontalBars({
  title,
  rows,
  valueFormatter =
    formatNumber,
}: {
  title: string;
  rows: Array<{
    label: string;
    value: number;
    helper?: string;
  }>;
  valueFormatter?: (
    value:
      number,
  ) => string;
}) {
  const max =
    Math.max(
      ...rows.map(
        (
          row,
        ) =>
          row.value,
      ),
      1,
    );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">
        {title}
      </h3>

      {rows.length ===
      0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No data available.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map(
            (
              row,
            ) => (
              <div
                key={`${row.label}-${row.helper ?? ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {
                        row.label
                      }
                    </p>

                    {row.helper && (
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {
                          row.helper
                        }
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-xs font-semibold text-slate-950">
                    {
                      valueFormatter(
                        row.value,
                      )
                    }
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400"
                    style={{
                      width:
                        `${Math.max(
                          3,
                          (
                            row.value /
                            max
                          ) *
                            100,
                        )}%`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function SalesTrendChart({
  analytics,
}: {
  analytics:
    SalesAnalytics;
}) {
  const max =
    Math.max(
      ...analytics.trend.map(
        (
          point,
        ) =>
          Math.max(
            point.grossOrderValue,
            point.paidRevenue,
          ),
      ),
      1,
    );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Daily sales trend
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Gross order value versus confirmed paid revenue.
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Gross
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan-500" />
            Paid
          </span>
        </div>
      </div>

      {analytics.trend.length ===
      0 ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
          No sales activity in this period.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div
            className="flex min-w-[720px] items-end gap-3"
            style={{
              height:
                280,
            }}
          >
            {analytics.trend.map(
              (
                point,
              ) => (
                <div
                  key={
                    point.date
                  }
                  className="flex h-full min-w-[34px] flex-1 flex-col justify-end"
                  title={`${point.date}: gross ${formatMoney(
                    point.grossOrderValue,
                  )}, paid ${formatMoney(
                    point.paidRevenue,
                  )}`}
                >
                  <div className="flex h-[220px] items-end justify-center gap-1">
                    <div
                      className="w-[42%] rounded-t-md bg-emerald-500"
                      style={{
                        height:
                          `${Math.max(
                            2,
                            (
                              point.grossOrderValue /
                              max
                            ) *
                              100,
                          )}%`,
                      }}
                    />

                    <div
                      className="w-[42%] rounded-t-md bg-cyan-500"
                      style={{
                        height:
                          `${Math.max(
                            2,
                            (
                              point.paidRevenue /
                              max
                            ) *
                              100,
                          )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 truncate text-center text-[10px] text-slate-400">
                    {
                      point.date
                        .slice(
                          5,
                        )
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewView({
  analytics,
}: {
  analytics:
    OverviewAnalytics;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Paid revenue"
          value={
            formatMoney(
              analytics
                .revenue
                .paidRevenue,
            )
          }
          helper={`${formatNumber(
            analytics.revenue
              .paidOrderCount,
          )} paid orders`}
          icon={
            <CircleDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Gross order value"
          value={
            formatMoney(
              analytics
                .orders
                .grossOrderValue,
            )
          }
          helper={`${formatNumber(
            analytics.orders
              .total,
          )} orders · ${formatMoney(
            analytics.orders
              .averageOrderValue,
          )} average`}
          icon={
            <ShoppingBag className="size-5" />
          }
        />

        <MetricCard
          label="Ordering customers"
          value={
            formatNumber(
              analytics
                .customers
                .orderingCustomers,
            )
          }
          helper={
            analytics
              .customers
              .newCustomers ===
            null
              ? 'New-customer metric is company-wide only.'
              : `${formatNumber(
                  analytics
                    .customers
                    .newCustomers,
                )} new customers in scope`
          }
          icon={
            <UsersRound className="size-5" />
          }
        />

        <MetricCard
          label="Avg. delivery"
          value={`${formatNumber(
            analytics
              .deliveries
              .averageDeliveryMinutes,
          )} min`}
          helper={`${formatNumber(
            analytics
              .deliveries
              .total,
          )} deliveries`}
          icon={
            <Truck className="size-5" />
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <CountList
          title="Order status"
          counts={
            analytics
              .orders
              .statusCounts
          }
        />

        <CountList
          title="Delivery status"
          counts={
            analytics
              .deliveries
              .statusCounts
          }
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-950">
            Inventory health
          </h3>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Lines
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {
                  formatNumber(
                    analytics
                      .inventory
                      .totalInventoryLines,
                  )
                }
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                Low stock
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-800">
                {
                  formatNumber(
                    analytics
                      .inventory
                      .lowStockCount,
                  )
                }
              </p>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                Out of stock
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-800">
                {
                  formatNumber(
                    analytics
                      .inventory
                      .outOfStockCount,
                  )
                }
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Discounts
              </p>
              <p className="mt-2 truncate text-lg font-semibold text-emerald-800">
                {
                  formatMoney(
                    analytics
                      .orders
                      .discounts,
                  )
                }
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SalesView({
  analytics,
}: {
  analytics:
    SalesAnalytics;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Orders"
          value={
            formatNumber(
              analytics
                .totals
                .orders,
            )
          }
          helper="Orders created in the selected analytics period."
          icon={
            <ShoppingBag className="size-5" />
          }
        />

        <MetricCard
          label="Gross value"
          value={
            formatMoney(
              analytics
                .totals
                .grossOrderValue,
            )
          }
          helper="Total order value before payment-status confirmation."
          icon={
            <BarChart3 className="size-5" />
          }
        />

        <MetricCard
          label="Paid revenue"
          value={
            formatMoney(
              analytics
                .totals
                .paidRevenue,
            )
          }
          helper="Confirmed PAID order-payment amount."
          icon={
            <CircleDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Average order"
          value={
            formatMoney(
              analytics
                .totals
                .averageOrderValue,
            )
          }
          helper="Average gross order value for the period."
          icon={
            <TrendingUp className="size-5" />
          }
        />
      </section>

      <SalesTrendChart
        analytics={
          analytics
        }
      />
    </div>
  );
}

function OrdersView({
  analytics,
}: {
  analytics:
    OrderAnalytics;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <CountList
        title="Order status distribution"
        counts={
          analytics
            .statusCounts
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <MetricCard
          label="Total orders"
          value={
            formatNumber(
              analytics
                .totalOrders,
            )
          }
          helper="All orders inside the selected scope."
          icon={
            <ShoppingBag className="size-5" />
          }
        />

        <MetricCard
          label="Campaign orders"
          value={
            formatNumber(
              analytics
                .campaignOrderCount,
            )
          }
          helper="Orders attributed to a campaign."
          icon={
            <Gift className="size-5" />
          }
        />

        <MetricCard
          label="Discounted orders"
          value={
            formatNumber(
              analytics
                .discountedOrderCount,
            )
          }
          helper="Orders with a positive discount amount."
          icon={
            <TrendingUp className="size-5" />
          }
        />
      </div>
    </div>
  );
}

function ProductsView({
  analytics,
}: {
  analytics:
    ProductAnalytics;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <HorizontalBars
        title="Top products by sales value"
        rows={
          analytics
            .topBySales
            .map(
              (
                product,
              ) => ({
                label:
                  product.name,
                helper:
                  `${product.sku} · ${product.category.name}`,
                value:
                  product.salesValue,
              }),
            )
        }
        valueFormatter={
          formatMoney
        }
      />

      <HorizontalBars
        title="Top products by quantity"
        rows={
          analytics
            .topByQuantity
            .map(
              (
                product,
              ) => ({
                label:
                  product.name,
                helper:
                  `${product.sku} · ${product.unit}`,
                value:
                  product.quantitySold,
              }),
            )
        }
      />
    </div>
  );
}

function InventoryView({
  analytics,
}: {
  analytics:
    InventoryAnalytics;
}) {
  const lowStock =
    analytics.items
      .filter(
        (
          item,
        ) =>
          item.isLowStock,
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.quantity -
          b.quantity,
      )
      .slice(
        0,
        10,
      );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Inventory lines"
          value={
            formatNumber(
              analytics
                .summary
                .totalInventoryLines,
            )
          }
          helper="Branch-product stock lines currently tracked."
          icon={
            <Boxes className="size-5" />
          }
        />

        <MetricCard
          label="Low stock"
          value={
            formatNumber(
              analytics
                .summary
                .lowStockCount,
            )
          }
          helper="Stock at or below configured low-stock level."
          icon={
            <Activity className="size-5" />
          }
        />

        <MetricCard
          label="Out of stock"
          value={
            formatNumber(
              analytics
                .summary
                .outOfStockCount,
            )
          }
          helper="Inventory lines with zero or negative available quantity."
          icon={
            <PackageSearch className="size-5" />
          }
        />

        <MetricCard
          label="Estimated stock value"
          value={
            formatMoney(
              analytics
                .summary
                .estimatedStockValue,
            )
          }
          helper="Quantity multiplied by configured product unit price."
          icon={
            <CircleDollarSign className="size-5" />
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CountList
          title="Inventory status"
          counts={
            analytics
              .summary
              .statusCounts
          }
        />

        <HorizontalBars
          title="Lowest-stock lines"
          rows={
            lowStock.map(
              (
                item,
              ) => ({
                label:
                  item.product
                    .name,
                helper:
                  `${item.branch.name} · threshold ${formatNumber(
                    item.lowStockLevel,
                  )}`,
                value:
                  Math.max(
                    item.quantity,
                    0,
                  ),
              }),
            )
          }
        />
      </section>
    </div>
  );
}

function DeliveriesView({
  analytics,
}: {
  analytics:
    DeliveryAnalytics;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Deliveries"
          value={
            formatNumber(
              analytics
                .totalDeliveries,
            )
          }
          helper="Deliveries created in the selected period."
          icon={
            <Truck className="size-5" />
          }
        />

        <MetricCard
          label="Avg. delivery time"
          value={`${formatNumber(
            analytics
              .averageDeliveryMinutes,
          )} min`}
          helper="Calculated from deliveries with both pickup and delivered timestamps."
          icon={
            <Activity className="size-5" />
          }
        />

        <MetricCard
          label="Timing samples"
          value={
            formatNumber(
              analytics
                .completedTimingSamples,
            )
          }
          helper="Completed deliveries included in turnaround-time calculation."
          icon={
            <Gauge className="size-5" />
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CountList
          title="Delivery status"
          counts={
            analytics
              .statusCounts
          }
        />

        <CountList
          title="Gas verification"
          counts={
            analytics
              .gasVerificationStatusCounts
          }
          emptyLabel="No gas-verification records in this period."
        />
      </section>
    </div>
  );
}

function PaymentsView({
  analytics,
}: {
  analytics:
    PaymentAnalytics;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Payments"
          value={
            formatNumber(
              analytics
                .totalPayments,
            )
          }
          helper="All payment records inside the selected scope."
          icon={
            <CircleDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Paid amount"
          value={
            formatMoney(
              analytics
                .paidAmount,
            )
          }
          helper="Combined amount for payments currently marked PAID."
          icon={
            <TrendingUp className="size-5" />
          }
        />

        <MetricCard
          label="Order revenue"
          value={
            formatMoney(
              analytics
                .orderPaymentRevenue,
            )
          }
          helper="Paid ORDER payment revenue only."
          icon={
            <ShoppingBag className="size-5" />
          }
        />

        <MetricCard
          label="Tip revenue"
          value={
            formatMoney(
              analytics
                .tipPaymentRevenue,
            )
          }
          helper="Paid TIP payment amount."
          icon={
            <UsersRound className="size-5" />
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <CountList
          title="Payment status"
          counts={
            analytics
              .statusCounts
          }
        />

        <CountList
          title="Payment methods"
          counts={
            analytics
              .methodCounts
          }
        />

        <CountList
          title="Payment types"
          counts={
            analytics
              .paymentTypeCounts
          }
        />
      </section>
    </div>
  );
}

function CampaignsView({
  analytics,
}: {
  analytics:
    CampaignAnalytics;
}) {
  const byValue =
    [...analytics.campaigns]
      .sort(
        (
          a,
          b,
        ) =>
          b.attributedOrderValue -
          a.attributedOrderValue,
      )
      .slice(
        0,
        10,
      );

  const byOrders =
    [...analytics.campaigns]
      .sort(
        (
          a,
          b,
        ) =>
          b.attributedOrders -
          a.attributedOrders,
      )
      .slice(
        0,
        10,
      );

  const totalValue =
    analytics.campaigns.reduce(
      (
        sum,
        campaign,
      ) =>
        sum +
        campaign.attributedOrderValue,
      0,
    );

  const totalRedemptions =
    analytics.campaigns.reduce(
      (
        sum,
        campaign,
      ) =>
        sum +
        campaign.voucherRedemptions,
      0,
    );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Campaigns"
          value={
            formatNumber(
              analytics
                .campaigns
                .length,
            )
          }
          helper="Campaigns created in the selected analytics period."
          icon={
            <Gift className="size-5" />
          }
        />

        <MetricCard
          label="Attributed value"
          value={
            formatMoney(
              totalValue,
            )
          }
          helper="Combined order value attributed to campaigns in scope."
          icon={
            <CircleDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Voucher redemptions"
          value={
            formatNumber(
              totalRedemptions,
            )
          }
          helper="Voucher redemptions attributed to campaigns in the period."
          icon={
            <Activity className="size-5" />
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <HorizontalBars
          title="Campaigns by attributed value"
          rows={
            byValue.map(
              (
                campaign,
              ) => ({
                label:
                  campaign.name,
                helper:
                  `${campaign.code} · ${formatStatus(
                    campaign.status,
                  )}`,
                value:
                  campaign.attributedOrderValue,
              }),
            )
          }
          valueFormatter={
            formatMoney
          }
        />

        <HorizontalBars
          title="Campaigns by attributed orders"
          rows={
            byOrders.map(
              (
                campaign,
              ) => ({
                label:
                  campaign.name,
                helper:
                  `${campaign.code} · ${formatNumber(
                    campaign.voucherRedemptions,
                  )} redemptions`,
                value:
                  campaign.attributedOrders,
              }),
            )
          }
        />
      </section>
    </div>
  );
}

function BranchesView({
  analytics,
}: {
  analytics:
    BranchAnalytics;
}) {
  const byRevenue =
    [...analytics.branches]
      .sort(
        (
          a,
          b,
        ) =>
          b.paidRevenue -
          a.paidRevenue,
      );

  const totalRevenue =
    analytics.branches.reduce(
      (
        sum,
        branch,
      ) =>
        sum +
        branch.paidRevenue,
      0,
    );

  const totalOrders =
    analytics.branches.reduce(
      (
        sum,
        branch,
      ) =>
        sum +
        branch.orders,
      0,
    );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Branches"
          value={
            formatNumber(
              analytics
                .branches
                .length,
            )
          }
          helper="Branches included in the resolved analytics scope."
          icon={
            <Building2 className="size-5" />
          }
        />

        <MetricCard
          label="Paid revenue"
          value={
            formatMoney(
              totalRevenue,
            )
          }
          helper="Combined confirmed order-payment revenue across visible branches."
          icon={
            <CircleDollarSign className="size-5" />
          }
        />

        <MetricCard
          label="Orders"
          value={
            formatNumber(
              totalOrders,
            )
          }
          helper="Combined orders across visible branches in the selected period."
          icon={
            <ShoppingBag className="size-5" />
          }
        />
      </section>

      <HorizontalBars
        title="Branch paid revenue"
        rows={
          byRevenue.map(
            (
              branch,
            ) => ({
              label:
                branch.name,
              helper:
                `${branch.code} · ${branch.city}, ${branch.state} · ${formatNumber(
                  branch.orders,
                )} orders`,
              value:
                branch.paidRevenue,
            }),
          )
        }
        valueFormatter={
          formatMoney
        }
      />
    </div>
  );
}

function AnalyticsBody({
  kind,
  data,
}: {
  kind:
    AnalyticsKind;
  data:
    AnalyticsPayloadMap[AnalyticsKind];
}) {
  if (
    kind ===
    'overview'
  ) {
    return (
      <OverviewView
        analytics={
          data as
            OverviewAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'sales'
  ) {
    return (
      <SalesView
        analytics={
          data as
            SalesAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'orders'
  ) {
    return (
      <OrdersView
        analytics={
          data as
            OrderAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'products'
  ) {
    return (
      <ProductsView
        analytics={
          data as
            ProductAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'inventory'
  ) {
    return (
      <InventoryView
        analytics={
          data as
            InventoryAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'deliveries'
  ) {
    return (
      <DeliveriesView
        analytics={
          data as
            DeliveryAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'payments'
  ) {
    return (
      <PaymentsView
        analytics={
          data as
            PaymentAnalytics
        }
      />
    );
  }

  if (
    kind ===
    'campaigns'
  ) {
    return (
      <CampaignsView
        analytics={
          data as
            CampaignAnalytics
        }
      />
    );
  }

  return (
    <BranchesView
      analytics={
        data as
          BranchAnalytics
      }
    />
  );
}

export function AnalyticsPage() {
  const [
    kind,
    setKind,
  ] =
    useState<AnalyticsKind>(
      'overview',
    );

  const [
    branchId,
    setBranchId,
  ] =
    useState('');

  const [
    fromDate,
    setFromDate,
  ] =
    useState(
      daysAgoInput(
        29,
      ),
    );

  const [
    toDate,
    setToDate,
  ] =
    useState(
      todayInput(),
    );

  const definition =
    useMemo(
      () =>
        ANALYTICS.find(
          (
            item,
          ) =>
            item.kind ===
            kind,
        ) ??
        ANALYTICS[0],
      [
        kind,
      ],
    );

  const dateError =
    definition.dateAware &&
    fromDate >
      toDate
      ? 'The start date cannot be after the end date.'
      : null;

  const branchesQuery =
    useQuery({
      queryKey: [
        'branches',
      ],

      queryFn:
        getBranches,

      staleTime:
        60_000,
    });

  const filters =
    useMemo(
      () => ({
        ...(branchId
          ? {
              branchId,
            }
          : {}),

        ...(definition
          .dateAware
          ? {
              from:
                startOfDayIso(
                  fromDate,
                ),

              to:
                endOfDayIso(
                  toDate,
                ),
            }
          : {}),
      }),
      [
        branchId,
        definition
          .dateAware,
        fromDate,
        toDate,
      ],
    );

  const analyticsQuery =
    useQuery({
      queryKey: [
        'admin',
        'analytics',
        kind,
        filters,
      ],

      queryFn: () =>
        getAnalytics(
          kind,
          filters,
        ),

      enabled:
        !dateError,
    });

  useEffect(
    () => {
      window.scrollTo({
        top: 0,
        behavior:
          'smooth',
      });
    },
    [
      kind,
    ],
  );

  const selectedBranch =
    branchesQuery.data
      ?.find(
        (
          branch,
        ) =>
          branch.id ===
          (
            analyticsQuery
              .data
              ?.scope
              .branchId ??
            branchId
          ),
      );

  const error =
    analyticsQuery.error
      ? getApiErrorMessage(
          analyticsQuery.error,
        )
      : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <BarChart3 className="size-4" />
              Business intelligence
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Analytics command center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Explore company-wide and branch-level performance across sales,
              orders, products, inventory, delivery, payments and campaigns.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void analyticsQuery
                .refetch()
            }
            disabled={
              analyticsQuery
                .isFetching
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={[
                'size-4',
                analyticsQuery
                  .isFetching
                  ? 'animate-spin'
                  : '',
              ].join(' ')}
            />
            Refresh analytics
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
        {ANALYTICS.map(
          (
            item,
          ) => {
            const active =
              item.kind ===
              kind;

            return (
              <button
                key={
                  item.kind
                }
                type="button"
                onClick={() =>
                  setKind(
                    item.kind,
                  )
                }
                className={[
                  'rounded-2xl border p-4 text-left transition',
                  active
                    ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex size-9 items-center justify-center rounded-xl',
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {
                    item.icon
                  }
                </div>

                <p
                  className={[
                    'mt-3 truncate text-sm font-semibold',
                    active
                      ? 'text-emerald-900'
                      : 'text-slate-800',
                  ].join(' ')}
                >
                  {
                    item.label
                  }
                </p>
              </button>
            );
          },
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-950">
            {
              definition.label
            }{' '}
            analytics
          </h2>

          <p className="text-xs leading-5 text-slate-500">
            {
              definition
                .description
            }
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Branch
            </span>

            <select
              value={
                branchId
              }
              onChange={(
                event,
              ) =>
                setBranchId(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                All branches
              </option>

              {(
                branchesQuery
                  .data ??
                []
              ).map(
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
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              From
            </span>

            <input
              type="date"
              value={
                fromDate
              }
              disabled={
                !definition
                  .dateAware
              }
              onChange={(
                event,
              ) =>
                setFromDate(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              To
            </span>

            <input
              type="date"
              value={
                toDate
              }
              disabled={
                !definition
                  .dateAware
              }
              onChange={(
                event,
              ) =>
                setToDate(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-600">
            Scope:{' '}
            {
              selectedBranch
                ?.name ??
              'Company-wide'
            }
          </span>

          {definition
            .dateAware ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-600">
              <CalendarRange className="size-3.5" />
              {
                formatDate(
                  fromDate,
                )
              }{' '}
              —{' '}
              {
                formatDate(
                  toDate,
                )
              }
            </span>
          ) : (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-medium text-sky-700">
              Current inventory snapshot — date range does not apply.
            </span>
          )}
        </div>

        {dateError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {dateError}
          </div>
        )}
      </section>

      {analyticsQuery
        .isLoading ? (
        <section className="flex min-h-[380px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="size-5 animate-spin text-emerald-600" />
            Loading analytics...
          </div>
        </section>
      ) : error ? (
        <section className="flex min-h-[380px] flex-col items-center justify-center rounded-[2rem] border border-rose-100 bg-white px-6 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
            <Activity className="size-6" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Unable to load analytics
          </h3>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void analyticsQuery
                .refetch()
            }
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </section>
      ) : analyticsQuery
          .data ? (
        <AnalyticsBody
          kind={
            kind
          }
          data={
            analyticsQuery
              .data
          }
        />
      ) : null}
    </div>
  );
}
