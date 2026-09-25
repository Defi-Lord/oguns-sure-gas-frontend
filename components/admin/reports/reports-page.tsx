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
  BarChart3,
  Boxes,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Gift,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  UsersRound,
} from 'lucide-react';

import {
  getBranches,
} from '@/lib/api/branches';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  getReport,
} from '@/lib/api/reports';

import type {
  ReportFilters,
  ReportKind,
  ReportRow,
  ReportSortOrder,
} from '@/types/report';

type CellFormat =
  | 'text'
  | 'currency'
  | 'number'
  | 'date'
  | 'minutes';

interface ColumnDefinition {
  header: string;
  path: string;
  format?: CellFormat;
  badge?: boolean;
}

interface ReportDefinition {
  kind: ReportKind;
  label: string;
  description: string;
  icon: ReactNode;
  dateAware: boolean;
  valuePath?: string;
  columns: ColumnDefinition[];
}

const REPORTS:
  ReportDefinition[] = [
    {
      kind: 'sales',
      label: 'Sales',
      description:
        'Order-level sales, customer, branch and payment detail.',
      icon:
        <BarChart3 className="size-4" />,
      dateAware: true,
      valuePath:
        'totalAmount',
      columns: [
        {
          header:
            'Order',
          path:
            'orderNumber',
        },
        {
          header:
            'Customer',
          path:
            'customer.name',
        },
        {
          header:
            'Branch',
          path:
            'branch.name',
        },
        {
          header:
            'Order status',
          path:
            'orderStatus',
          badge:
            true,
        },
        {
          header:
            'Total',
          path:
            'totalAmount',
          format:
            'currency',
        },
        {
          header:
            'Payment',
          path:
            'payment.status',
          badge:
            true,
        },
        {
          header:
            'Created',
          path:
            'createdAt',
          format:
            'date',
        },
      ],
    },

    {
      kind: 'payments',
      label: 'Payments',
      description:
        'Payment references, types, methods, status and branch attribution.',
      icon:
        <CircleDollarSign className="size-4" />,
      dateAware: true,
      valuePath:
        'amount',
      columns: [
        {
          header:
            'Reference',
          path:
            'reference',
        },
        {
          header:
            'Type',
          path:
            'paymentType',
          badge:
            true,
        },
        {
          header:
            'Branch',
          path:
            'branch.name',
        },
        {
          header:
            'Amount',
          path:
            'amount',
          format:
            'currency',
        },
        {
          header:
            'Method',
          path:
            'method',
        },
        {
          header:
            'Status',
          path:
            'status',
          badge:
            true,
        },
        {
          header:
            'Created',
          path:
            'createdAt',
          format:
            'date',
        },
      ],
    },

    {
      kind: 'inventory',
      label: 'Inventory',
      description:
        'Current stock snapshot, low-stock thresholds and estimated stock value.',
      icon:
        <Boxes className="size-4" />,
      dateAware: false,
      valuePath:
        'estimatedStockValue',
      columns: [
        {
          header:
            'Product',
          path:
            'product.name',
        },
        {
          header:
            'SKU',
          path:
            'product.sku',
        },
        {
          header:
            'Branch',
          path:
            'branch.name',
        },
        {
          header:
            'Quantity',
          path:
            'quantity',
          format:
            'number',
        },
        {
          header:
            'Low stock',
          path:
            'lowStockLevel',
          format:
            'number',
        },
        {
          header:
            'Status',
          path:
            'status',
          badge:
            true,
        },
        {
          header:
            'Stock value',
          path:
            'estimatedStockValue',
          format:
            'currency',
        },
      ],
    },

    {
      kind: 'deliveries',
      label: 'Deliveries',
      description:
        'Delivery status, rider, duration and gas-verification detail.',
      icon:
        <Truck className="size-4" />,
      dateAware: true,
      columns: [
        {
          header:
            'Order',
          path:
            'order.orderNumber',
        },
        {
          header:
            'Branch',
          path:
            'branch.name',
        },
        {
          header:
            'Rider',
          path:
            'rider.name',
        },
        {
          header:
            'Status',
          path:
            'status',
          badge:
            true,
        },
        {
          header:
            'Duration',
          path:
            'durationMinutes',
          format:
            'minutes',
        },
        {
          header:
            'Gas verification',
          path:
            'gasVerification.verificationStatus',
          badge:
            true,
        },
        {
          header:
            'Created',
          path:
            'createdAt',
          format:
            'date',
        },
      ],
    },

    {
      kind: 'products',
      label: 'Products',
      description:
        'Product sales volume and gross sales value across completed order lines.',
      icon:
        <PackageSearch className="size-4" />,
      dateAware: true,
      valuePath:
        'grossSalesValue',
      columns: [
        {
          header:
            'Product',
          path:
            'name',
        },
        {
          header:
            'SKU',
          path:
            'sku',
        },
        {
          header:
            'Category',
          path:
            'category.name',
        },
        {
          header:
            'Quantity sold',
          path:
            'quantitySold',
          format:
            'number',
        },
        {
          header:
            'Gross sales',
          path:
            'grossSalesValue',
          format:
            'currency',
        },
        {
          header:
            'Order lines',
          path:
            'orderLines',
          format:
            'number',
        },
      ],
    },

    {
      kind: 'campaigns',
      label: 'Campaigns',
      description:
        'Campaign entries, vouchers, redemptions and attributed order value.',
      icon:
        <Gift className="size-4" />,
      dateAware: true,
      valuePath:
        'attributedOrderValue',
      columns: [
        {
          header:
            'Campaign',
          path:
            'name',
        },
        {
          header:
            'Code',
          path:
            'code',
        },
        {
          header:
            'Type',
          path:
            'type',
          badge:
            true,
        },
        {
          header:
            'Status',
          path:
            'status',
          badge:
            true,
        },
        {
          header:
            'Entries',
          path:
            'totalEntries',
          format:
            'number',
        },
        {
          header:
            'Vouchers',
          path:
            'issuedVouchers',
          format:
            'number',
        },
        {
          header:
            'Redemptions',
          path:
            'voucherRedemptions',
          format:
            'number',
        },
        {
          header:
            'Orders',
          path:
            'attributedOrders',
          format:
            'number',
        },
        {
          header:
            'Order value',
          path:
            'attributedOrderValue',
          format:
            'currency',
        },
        {
          header:
            'Discount given',
          path:
            'discountGiven',
          format:
            'currency',
        },
      ],
    },

    {
      kind: 'branches',
      label: 'Branches',
      description:
        'Branch-level order value, paid revenue, delivery, stock and rider activity.',
      icon:
        <Building2 className="size-4" />,
      dateAware: true,
      valuePath:
        'paidRevenue',
      columns: [
        {
          header:
            'Branch',
          path:
            'branch.name',
        },
        {
          header:
            'Code',
          path:
            'branch.code',
        },
        {
          header:
            'Orders',
          path:
            'orders',
          format:
            'number',
        },
        {
          header:
            'Gross order value',
          path:
            'grossOrderValue',
          format:
            'currency',
        },
        {
          header:
            'Paid revenue',
          path:
            'paidRevenue',
          format:
            'currency',
        },
        {
          header:
            'Deliveries',
          path:
            'deliveries',
          format:
            'number',
        },
        {
          header:
            'Inventory lines',
          path:
            'inventoryLines',
          format:
            'number',
        },
        {
          header:
            'Riders',
          path:
            'riders',
          format:
            'number',
        },
      ],
    },

    {
      kind: 'rider-tips',
      label: 'Rider tips',
      description:
        'Rider gratuities with customer, delivery, payment and branch context.',
      icon:
        <UsersRound className="size-4" />,
      dateAware: true,
      valuePath:
        'amount',
      columns: [
        {
          header:
            'Customer',
          path:
            'customer.name',
        },
        {
          header:
            'Rider',
          path:
            'rider.name',
        },
        {
          header:
            'Order',
          path:
            'delivery.order.orderNumber',
        },
        {
          header:
            'Branch',
          path:
            'delivery.branch.name',
        },
        {
          header:
            'Amount',
          path:
            'amount',
          format:
            'currency',
        },
        {
          header:
            'Tip status',
          path:
            'status',
          badge:
            true,
        },
        {
          header:
            'Payment',
          path:
            'payment.status',
          badge:
            true,
        },
        {
          header:
            'Created',
          path:
            'createdAt',
          format:
            'date',
        },
      ],
    },
  ];

const getDefinition =
  (
    kind:
      ReportKind,
  ) =>
    REPORTS.find(
      (report) =>
        report.kind ===
        kind,
    ) ??
    REPORTS[0];

const formatCurrency =
  (
    value:
      unknown,
  ): string => {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number,
      )
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-NG',
      {
        style:
          'currency',
        currency:
          'NGN',
        maximumFractionDigits:
          2,
      },
    ).format(number);
  };

const formatNumber =
  (
    value:
      unknown,
  ): string => {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ''
    ) {
      return '—';
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(
        number,
      )
    ) {
      return String(value);
    }

    return new Intl.NumberFormat(
      'en-NG',
      {
        maximumFractionDigits:
          3,
      },
    ).format(number);
  };

const formatDate =
  (
    value:
      unknown,
  ): string => {
    if (
      typeof value !==
        'string' &&
      !(value instanceof Date)
    ) {
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

const getNestedValue =
  (
    row:
      ReportRow,
    path:
      string,
  ): unknown => {
    let current:
      unknown =
      row;

    for (
      const segment of
      path.split('.')
    ) {
      if (
        typeof current !==
          'object' ||
        current ===
          null ||
        Array.isArray(
          current,
        )
      ) {
        return undefined;
      }

      current =
        (
          current as
            Record<
              string,
              unknown
            >
        )[segment];
    }

    return current;
  };

const formatValue =
  (
    value:
      unknown,
    format:
      CellFormat =
      'text',
  ): string => {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ''
    ) {
      return '—';
    }

    if (
      format ===
      'currency'
    ) {
      return formatCurrency(
        value,
      );
    }

    if (
      format ===
      'number'
    ) {
      return formatNumber(
        value,
      );
    }

    if (
      format ===
      'date'
    ) {
      return formatDate(
        value,
      );
    }

    if (
      format ===
      'minutes'
    ) {
      const number =
        Number(value);

      return Number.isFinite(
        number,
      )
        ? `${number} min`
        : '—';
    }

    if (
      typeof value ===
      'object'
    ) {
      try {
        return JSON.stringify(
          value,
        );
      } catch {
        return '—';
      }
    }

    return String(value);
  };

const getStatusClass =
  (
    value:
      string,
  ): string => {
    const normalized =
      value.toUpperCase();

    if (
      normalized.includes(
        'PAID',
      ) ||
      normalized.includes(
        'DELIVERED',
      ) ||
      normalized.includes(
        'ACTIVE',
      ) ||
      normalized.includes(
        'VERIFIED',
      ) ||
      normalized.includes(
        'COMPLETED',
      )
    ) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (
      normalized.includes(
        'FAILED',
      ) ||
      normalized.includes(
        'CANCEL',
      ) ||
      normalized.includes(
        'REJECT',
      ) ||
      normalized.includes(
        'OUT_OF_STOCK',
      )
    ) {
      return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    if (
      normalized.includes(
        'PENDING',
      ) ||
      normalized.includes(
        'PROCESS',
      ) ||
      normalized.includes(
        'LOW',
      ) ||
      normalized.includes(
        'SCHEDULED',
      )
    ) {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    return 'border-slate-200 bg-slate-50 text-slate-600';
  };

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

const csvEscape =
  (
    value:
      string,
  ): string =>
    `"${value.replace(
      /"/g,
      '""',
    )}"`;

export function ReportsPage() {
  const [
    reportKind,
    setReportKind,
  ] =
    useState<ReportKind>(
      'sales',
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

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState<ReportSortOrder>(
      'desc',
    );

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    limit,
    setLimit,
  ] =
    useState(25);

  const [
    search,
    setSearch,
  ] =
    useState('');

  const definition =
    useMemo(
      () =>
        getDefinition(
          reportKind,
        ),
      [
        reportKind,
      ],
    );

  const dateError =
    definition.dateAware &&
    fromDate &&
    toDate &&
    fromDate >
      toDate
      ? 'The start date cannot be after the end date.'
      : null;

  useEffect(
    () => {
      setPage(1);
      setSearch('');
    },
    [
      reportKind,
      branchId,
      fromDate,
      toDate,
      sortOrder,
      limit,
    ],
  );

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
    useMemo<
      ReportFilters
    >(
      () => ({
        ...(branchId
          ? {
              branchId,
            }
          : {}),

        ...(definition
          .dateAware &&
        fromDate
          ? {
              from:
                startOfDayIso(
                  fromDate,
                ),
            }
          : {}),

        ...(definition
          .dateAware &&
        toDate
          ? {
              to:
                endOfDayIso(
                  toDate,
                ),
            }
          : {}),

        page,
        limit,
        sortOrder,
      }),
      [
        branchId,
        definition
          .dateAware,
        fromDate,
        limit,
        page,
        sortOrder,
        toDate,
      ],
    );

  const reportQuery =
    useQuery({
      queryKey: [
        'admin',
        'reports',
        reportKind,
        filters,
      ],

      queryFn: () =>
        getReport(
          reportKind,
          filters,
        ),

      enabled:
        !dateError,

      placeholderData:
        (
          previousData,
        ) =>
          previousData,
    });

  const rows =
    reportQuery.data
      ?.rows ??
    [];

  const filteredRows =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return rows;
        }

        return rows.filter(
          (row) => {
            try {
              return JSON.stringify(
                row,
              )
                .toLowerCase()
                .includes(
                  query,
                );
            } catch {
              return false;
            }
          },
        );
      },
      [
        rows,
        search,
      ],
    );

  const pagination =
    reportQuery.data
      ?.pagination;

  const selectedBranch =
    branchesQuery.data
      ?.find(
        (
          branch,
        ) =>
          branch.id ===
          (
            reportQuery.data
              ?.scope
              .branchId ??
            branchId
          ),
      );

  const currentPageValue =
    useMemo(
      () => {
        if (
          !definition
            .valuePath
        ) {
          return null;
        }

        return filteredRows.reduce(
          (
            total,
            row,
          ) => {
            const value =
              Number(
                getNestedValue(
                  row,
                  definition
                    .valuePath!,
                ),
              );

            return (
              total +
              (
                Number.isFinite(
                  value,
                )
                  ? value
                  : 0
              )
            );
          },
          0,
        );
      },
      [
        definition
          .valuePath,
        filteredRows,
      ],
    );

  const exportCsv =
    () => {
      if (
        filteredRows.length ===
        0
      ) {
        return;
      }

      const header =
        definition.columns
          .map(
            (column) =>
              csvEscape(
                column.header,
              ),
          )
          .join(',');

      const lines =
        filteredRows.map(
          (row) =>
            definition.columns
              .map(
                (column) =>
                  csvEscape(
                    formatValue(
                      getNestedValue(
                        row,
                        column.path,
                      ),
                      column.format,
                    ),
                  ),
              )
              .join(','),
        );

      const csv =
        [
          header,
          ...lines,
        ].join('\r\n');

      const blob =
        new Blob(
          [
            '\uFEFF',
            csv,
          ],
          {
            type:
              'text/csv;charset=utf-8;',
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const anchor =
        document.createElement(
          'a',
        );

      anchor.href =
        url;

      anchor.download =
        `oguns-sure-gas-${reportKind}-report-page-${page}-${todayInput()}.csv`;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url,
      );
    };

  const resetFilters =
    () => {
      setBranchId('');
      setFromDate(
        daysAgoInput(
          29,
        ),
      );
      setToDate(
        todayInput(),
      );
      setSortOrder(
        'desc',
      );
      setLimit(25);
      setSearch('');
      setPage(1);
    };

  const reportError =
    reportQuery.error
      ? getApiErrorMessage(
          reportQuery.error,
        )
      : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <FileSpreadsheet className="size-4" />
              Management reporting
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Reports workspace
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Review company-wide or branch-scoped operational records across
              sales, payments, stock, deliveries, products, campaigns, branches
              and rider tips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void reportQuery
                  .refetch()
              }
              disabled={
                reportQuery
                  .isFetching
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={[
                  'size-4',
                  reportQuery
                    .isFetching
                    ? 'animate-spin'
                    : '',
                ].join(' ')}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={
                exportCsv
              }
              disabled={
                filteredRows
                  .length ===
                0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="size-4" />
              Export page CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {REPORTS.map(
          (report) => {
            const active =
              report.kind ===
              reportKind;

            return (
              <button
                key={
                  report.kind
                }
                type="button"
                onClick={() =>
                  setReportKind(
                    report.kind,
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
                    report.icon
                  }
                </div>

                <p
                  className={[
                    'mt-3 text-sm font-semibold',
                    active
                      ? 'text-emerald-900'
                      : 'text-slate-800',
                  ].join(' ')}
                >
                  {
                    report.label
                  }
                </p>
              </button>
            );
          },
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <SlidersHorizontal className="size-4 text-emerald-600" />
              Report filters
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {
                definition
                  .description
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort
            </span>

            <select
              value={
                sortOrder
              }
              onChange={(
                event,
              ) =>
                setSortOrder(
                  event.target
                    .value as
                    ReportSortOrder,
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="desc">
                Newest / highest first
              </option>

              <option value="asc">
                Oldest / lowest first
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rows
            </span>

            <select
              value={
                limit
              }
              onChange={(
                event,
              ) =>
                setLimit(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value={20}>
                20
              </option>
              <option value={25}>
                25
              </option>
              <option value={50}>
                50
              </option>
              <option value={100}>
                100
              </option>
            </select>
          </label>
        </div>

        {!definition
          .dateAware && (
          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-700">
            Inventory reports are current-stock snapshots. The backend does not
            apply From/To dates to this report.
          </div>
        )}

        {dateError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {dateError}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Records
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {
              pagination
                ?.total ??
              0
            }
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Total records matching the server-side report scope.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Current page
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {
              filteredRows
                .length
            }
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Rows visible after the local search filter.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Scope
          </p>
          <p className="mt-2 truncate text-lg font-semibold text-slate-950">
            {selectedBranch
              ? selectedBranch
                  .name
              : reportQuery.data
                    ?.scope
                    .branchId
                ? 'Selected branch'
                : 'Company-wide'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Super Admin can switch between company-wide and branch reporting.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {
              definition
                .valuePath
                ? 'Page value'
                : 'Page position'
            }
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {currentPageValue !==
            null
              ? formatCurrency(
                  currentPageValue,
                )
              : `Page ${
                  pagination
                    ?.page ??
                  page
                } of ${
                  Math.max(
                    pagination
                      ?.totalPages ??
                      0,
                    1,
                  )
                }`}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {currentPageValue !==
            null
              ? 'Sum of the primary monetary value in the visible rows only.'
              : 'Current server-side pagination position.'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {
                definition
                  .label
              }{' '}
              report
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {reportQuery.data
                ?.scope.from &&
              reportQuery.data
                ?.scope.to
                ? `${formatDate(
                    reportQuery
                      .data
                      .scope
                      .from,
                  )} — ${formatDate(
                    reportQuery
                      .data
                      .scope
                      .to,
                  )}`
                : definition
                    .dateAware
                  ? 'Date scope supplied by the report service.'
                  : 'Current inventory snapshot.'}
            </p>
          </div>

          <label className="relative w-full md:max-w-sm">
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
              placeholder="Search current page..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>

        {reportQuery
          .isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="size-5 animate-spin text-emerald-600" />
              Loading report...
            </div>
          </div>
        ) : reportError ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
              <FileSpreadsheet className="size-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Unable to load this report
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {
                reportError
              }
            </p>

            <button
              type="button"
              onClick={() =>
                void reportQuery
                  .refetch()
              }
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        ) : filteredRows
            .length ===
          0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <FileSpreadsheet className="size-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No report rows found
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Adjust the branch, date range or search filter and try again.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {definition.columns.map(
                    (
                      column,
                    ) => (
                      <th
                        key={
                          column
                            .path
                        }
                        className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {
                          column
                            .header
                        }
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(
                  (
                    row,
                    index,
                  ) => (
                    <tr
                      key={`${page}-${index}`}
                      className="transition hover:bg-slate-50/70"
                    >
                      {definition.columns.map(
                        (
                          column,
                        ) => {
                          const value =
                            getNestedValue(
                              row,
                              column.path,
                            );

                          const formatted =
                            formatValue(
                              value,
                              column.format,
                            );

                          return (
                            <td
                              key={
                                column
                                  .path
                              }
                              className="max-w-[320px] whitespace-nowrap px-5 py-4 text-sm text-slate-700"
                            >
                              {column.badge &&
                              formatted !==
                                '—' ? (
                                <span
                                  className={[
                                    'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
                                    getStatusClass(
                                      formatted,
                                    ),
                                  ].join(' ')}
                                >
                                  {
                                    formatted
                                  }
                                </span>
                              ) : (
                                <span
                                  className={
                                    column.format ===
                                      'currency'
                                      ? 'font-semibold text-slate-950'
                                      : ''
                                  }
                                >
                                  {
                                    formatted
                                  }
                                </span>
                              )}
                            </td>
                          );
                        },
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p className="text-xs text-slate-500">
            Page{' '}
            <span className="font-semibold text-slate-800">
              {
                pagination
                  ?.page ??
                page
              }
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {
                Math.max(
                  pagination
                    ?.totalPages ??
                    0,
                  1,
                )
              }
            </span>{' '}
            ·{' '}
            {
              pagination
                ?.total ??
              0
            }{' '}
            records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                page <= 1 ||
                reportQuery
                  .isFetching
              }
              onClick={() =>
                setPage(
                  (
                    current,
                  ) =>
                    Math.max(
                      1,
                      current -
                        1,
                    ),
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={
                !pagination ||
                page >=
                  pagination
                    .totalPages ||
                reportQuery
                  .isFetching
              }
              onClick={() =>
                setPage(
                  (
                    current,
                  ) =>
                    current +
                    1,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 text-xs leading-5 text-slate-500">
        <div className="flex items-start gap-3">
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <p>
            Reports are management-scoped by the backend. Super Admin can view
            company-wide data or apply a branch filter. CSV export contains only
            the currently loaded page after the local search filter; it does not
            silently fetch additional pages.
          </p>
        </div>
      </section>
    </div>
  );
}
