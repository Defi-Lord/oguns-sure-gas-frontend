'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  Activity,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileJson2,
  Fingerprint,
  History,
  Laptop,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';

import {
  getManagementBranches,
} from '@/lib/api/branches';

import {
  getAuditLog,
  getAuditLogs,
} from '@/lib/api/audit';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  AuditListFilters,
  AuditLog,
} from '@/types/audit';

const PAGE_SIZES = [
  20,
  50,
  100,
];

const EMPTY_FILTERS = {
  branchId: '',
  actorId: '',
  action: '',
  entityType: '',
  entityId: '',
  fromDate: '',
  toDate: '',
};

type FilterDraft =
  typeof EMPTY_FILTERS;

const formatDateTime = (
  value: string,
): string => {
  const date = new Date(value);

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
};

const humanize = (
  value: string,
): string =>
  value
    .replace(
      /([a-z0-9])([A-Z])/g,
      '$1 $2',
    )
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );

const actorName = (
  log: AuditLog,
): string => {
  if (!log.actor) {
    return 'System / automated';
  }

  return `${log.actor.firstName} ${log.actor.lastName}`.trim();
};

const actionTone = (
  action: string,
): string => {
  const normalized =
    action.toUpperCase();

  if (
    normalized.includes('FAILED') ||
    normalized.includes('REJECTED') ||
    normalized.includes('REVOKED')
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200';
  }

  if (
    normalized.includes('UNCERTAIN') ||
    normalized.includes('DISABLED') ||
    normalized.includes('SUSPENDED')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';
  }

  if (
    normalized.includes('CREATED') ||
    normalized.includes('ACTIVATED') ||
    normalized.includes('VERIFIED')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200';
  }

  return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200';
};

const toFromIso = (
  value: string,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T00:00:00.000`,
  ).toISOString();
};

const toToIso = (
  value: string,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T23:59:59.999`,
  ).toISOString();
};

const safeJson = (
  value: unknown,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return 'No metadata attached to this audit event.';
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
};

const metadataEntries = (
  value: unknown,
): Array<{
  label: string;
  value: string;
  mono: boolean;
}> => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return [];
  }

  return Object.entries(
    value as Record<
      string,
      unknown
    >,
  ).map(([key, entry]) => {
    let displayValue =
      'Not recorded';

    if (
      typeof entry ===
      'string'
    ) {
      displayValue =
        /^[A-Z0-9_-]+$/.test(
          entry,
        )
          ? humanize(entry)
          : entry;
    } else if (
      typeof entry ===
        'number' ||
      typeof entry ===
        'bigint'
    ) {
      displayValue =
        String(entry);
    } else if (
      typeof entry ===
      'boolean'
    ) {
      displayValue = entry
        ? 'Yes'
        : 'No';
    } else if (
      entry !== null &&
      entry !== undefined
    ) {
      displayValue =
        Array.isArray(entry)
          ? entry
              .map((item) =>
                typeof item ===
                  'string' ||
                typeof item ===
                  'number'
                  ? String(item)
                  : 'Structured item',
              )
              .join(', ')
          : 'Structured data';
    }

    return {
      label: humanize(key),
      value: displayValue,
      mono:
        /(^id$|id$|token|reference|code)/i.test(
          key,
        ),
    };
  });
};

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
      {children}
    </span>
  );
}

function DetailDrawer({
  auditLogId,
  onClose,
}: {
  auditLogId: string | null;
  onClose: () => void;
}) {
  const detailQuery =
    useQuery({
      queryKey: [
        'audit-log-detail',
        auditLogId,
      ],
      queryFn: () =>
        getAuditLog(
          auditLogId ?? '',
        ),
      enabled:
        Boolean(auditLogId),
      retry: false,
      staleTime: 30_000,
    });

  if (!auditLogId) {
    return null;
  }

  const log =
    detailQuery.data;

  const businessMetadata =
    metadataEntries(
      log?.metadata,
    );

  const hasRequestContext =
    Boolean(
      log?.ipAddress ||
        log?.userAgent,
    );

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close audit detail"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-white/70 bg-[#f8fbfa]/95 p-4 shadow-[-24px_0_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-[#071814]/95">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              Immutable record
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Audit event detail
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {detailQuery.isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading audit event...
              </p>
            </div>
          </div>
        ) : detailQuery.isError ? (
          <div className="mt-8 rounded-[22px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
            {getApiErrorMessage(
              detailQuery.error,
            )}
          </div>
        ) : log ? (
          <div className="mt-7 space-y-5">
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${actionTone(
                    log.action,
                  )}`}
                >
                  {humanize(
                    log.action,
                  )}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                  {humanize(
                    log.entityType,
                  )}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {log.description ??
                  'No description was recorded for this event.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Occurred"
                  value={formatDateTime(
                    log.createdAt,
                  )}
                />
                <DetailItem
                  label="Audit ID"
                  value={log.id}
                  mono
                />
                <DetailItem
                  label="Entity ID"
                  value={
                    log.entityId ??
                    'Not recorded'
                  }
                  mono={Boolean(
                    log.entityId,
                  )}
                />
                <DetailItem
                  label="Branch"
                  value={
                    log.branch
                      ? `${log.branch.name} (${log.branch.code})`
                      : 'Company-wide / not linked'
                  }
                />
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                  <UserRound className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Actor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Identity associated with the change.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Name"
                  value={actorName(
                    log,
                  )}
                />
                <DetailItem
                  label="Role"
                  value={
                    log.actor
                      ? humanize(
                          log.actor.role,
                        )
                      : 'System'
                  }
                />
                <DetailItem
                  label="Email"
                  value={
                    log.actor?.email ??
                    'Not available'
                  }
                />
                <DetailItem
                  label="Actor ID"
                  value={
                    log.actorId ??
                    'Not recorded'
                  }
                  mono={Boolean(
                    log.actorId,
                  )}
                />
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                  <FileJson2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Event details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Useful business information captured with this action.
                  </p>
                </div>
              </div>

              {businessMetadata.length >
              0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {businessMetadata.map(
                    (entry) => (
                      <DetailItem
                        key={
                          entry.label
                        }
                        label={
                          entry.label
                        }
                        value={
                          entry.value
                        }
                        mono={
                          entry.mono
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-400">
                  No additional business details were recorded for this event.
                </div>
              )}

              <details className="group mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.025]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-700 marker:hidden dark:text-slate-200">
                  <span>
                    Technical metadata
                  </span>
                  <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                    Advanced
                  </span>
                </summary>

                <div className="border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-white/10">
                  <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    Sanitized metadata is retained for deeper investigation. Sensitive credential-like fields are redacted by the backend before persistence.
                  </p>
                  <pre className="mt-3 max-h-[320px] overflow-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">
                    {safeJson(
                      log.metadata,
                    )}
                  </pre>
                </div>
              </details>
            </section>

            {hasRequestContext ? (
              <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                    <Laptop className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                      Request context
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Network and client information recorded for this event.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {log.ipAddress ? (
                    <DetailItem
                      label="IP address"
                      value={
                        log.ipAddress
                      }
                      mono
                    />
                  ) : null}
                  {log.userAgent ? (
                    <DetailItem
                      label="User agent"
                      value={
                        log.userAgent
                      }
                    />
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-white/[0.035]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1.5 break-words text-xs leading-5 text-slate-700 dark:text-slate-300 ${
          mono
            ? 'font-mono'
            : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function AuditPage() {
  const [draft, setDraft] =
    useState<FilterDraft>(
      EMPTY_FILTERS,
    );

  const [filters, setFilters] =
    useState<FilterDraft>(
      EMPTY_FILTERS,
    );

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const apiFilters =
    useMemo<AuditListFilters>(
      () => ({
        ...(filters.branchId
          ? {
              branchId:
                filters.branchId,
            }
          : {}),
        ...(filters.actorId
          ? {
              actorId:
                filters.actorId.trim(),
            }
          : {}),
        ...(filters.action
          ? {
              action:
                filters.action.trim(),
            }
          : {}),
        ...(filters.entityType
          ? {
              entityType:
                filters.entityType.trim(),
            }
          : {}),
        ...(filters.entityId
          ? {
              entityId:
                filters.entityId.trim(),
            }
          : {}),
        ...(toFromIso(
          filters.fromDate,
        )
          ? {
              from:
                toFromIso(
                  filters.fromDate,
                ),
            }
          : {}),
        ...(toToIso(
          filters.toDate,
        )
          ? {
              to:
                toToIso(
                  filters.toDate,
                ),
            }
          : {}),
        page,
        limit,
      }),
      [
        filters,
        limit,
        page,
      ],
    );

  const branchesQuery =
    useQuery({
      queryKey: [
        'audit-management-branches',
      ],
      queryFn:
        getManagementBranches,
      staleTime: 60_000,
      retry: false,
    });

  const auditQuery =
    useQuery({
      queryKey: [
        'audit-logs',
        apiFilters,
      ],
      queryFn: () =>
        getAuditLogs(
          apiFilters,
        ),
      retry: false,
      staleTime: 15_000,
    });

  const logs =
    useMemo(
      () =>
        auditQuery.data
          ?.auditLogs ?? [],
      [
        auditQuery.data
          ?.auditLogs,
      ],
    );

  const pagination =
    auditQuery.data
      ?.pagination;

  const visibleActorCount =
    useMemo(
      () =>
        new Set(
          logs
            .map(
              (log) =>
                log.actorId,
            )
            .filter(Boolean),
        ).size,
      [logs],
    );

  const visibleBranchCount =
    useMemo(
      () =>
        new Set(
          logs
            .map(
              (log) =>
                log.branchId,
            )
            .filter(Boolean),
        ).size,
      [logs],
    );

  const actionSuggestions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs.map(
              (log) =>
                log.action,
            ),
          ),
        ).sort(),
      [logs],
    );

  const entitySuggestions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs.map(
              (log) =>
                log.entityType,
            ),
          ),
        ).sort(),
      [logs],
    );

  const activeFilterCount =
    Object.values(
      filters,
    ).filter(Boolean).length;

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };

  const resetFilters = () => {
    setDraft(
      EMPTY_FILTERS,
    );
    setFilters(
      EMPTY_FILTERS,
    );
    setPage(1);
  };

  const updateDraft = (
    field: keyof FilterDraft,
    value: string,
  ) => {
    setDraft(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  };

  return (
    <>
      <div className="space-y-5 pb-4 pt-2 sm:space-y-6 sm:pt-4">
        <section className="relative overflow-hidden rounded-[30px] border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/65 to-cyan-50/70 p-5 shadow-[0_25px_75px_rgba(15,118,110,0.08)] sm:p-7 dark:border-emerald-400/15 dark:from-[#0b211b] dark:via-[#0a1d18] dark:to-[#09231f]">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-white/[0.06] dark:text-emerald-300">
                <ShieldCheck className="size-3.5" />
                Governance & traceability
              </div>

              <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Audit trail
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Review append-only administrative and operational events across the company. Inspect the actor, branch, entity, sanitized metadata and request context without changing historical records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-xs font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                <History className="size-4 text-emerald-600 dark:text-emerald-300" />
                Append-only
              </div>

              <button
                type="button"
                onClick={() =>
                  auditQuery.refetch()
                }
                disabled={
                  auditQuery.isFetching
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0b6b58] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-800/15 transition hover:bg-[#095947] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${
                    auditQuery.isFetching
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                Refresh trail
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total records"
            value={new Intl.NumberFormat(
              'en-NG',
            ).format(
              pagination?.total ??
                0,
            )}
            helper="Matching the currently applied filters."
            icon={<Activity className="size-4" />}
          />

          <StatCard
            label="Current page"
            value={
              pagination
                ? `${pagination.page} / ${Math.max(
                    pagination.totalPages,
                    1,
                  )}`
                : '—'
            }
            helper={`${limit} records per page.`}
            icon={<Clock3 className="size-4" />}
          />

          <StatCard
            label="Actors in view"
            value={String(
              visibleActorCount,
            )}
            helper="Distinct recorded actors on this page."
            icon={<UserRound className="size-4" />}
          />

          <StatCard
            label="Branches in view"
            value={String(
              visibleBranchCount,
            )}
            helper="Distinct linked branches on this page."
            icon={<Building2 className="size-4" />}
          />
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
                <SlidersHorizontal className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
                  Audit filters
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Backend-enforced filters for branch, actor, action, entity and date range.
                </p>
              </div>
            </div>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05] lg:self-auto"
              >
                <RotateCcw className="size-3.5" />
                Clear {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <FieldLabel>Branch</FieldLabel>
              <select
                value={draft.branchId}
                onChange={(event) =>
                  updateDraft(
                    'branchId',
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:focus:ring-emerald-400/10"
              >
                <option value="">
                  All branches
                </option>
                {(branchesQuery.data ?? []).map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name} ({branch.code})
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <FieldLabel>Action contains</FieldLabel>
              <input
                list="audit-action-suggestions"
                value={draft.action}
                onChange={(event) =>
                  updateDraft(
                    'action',
                    event.target.value,
                  )
                }
                placeholder="e.g. PLATFORM_FEE_UPDATED"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:ring-emerald-400/10"
              />
              <datalist id="audit-action-suggestions">
                {actionSuggestions.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    />
                  ),
                )}
              </datalist>
            </label>

            <label>
              <FieldLabel>Entity type contains</FieldLabel>
              <input
                list="audit-entity-suggestions"
                value={draft.entityType}
                onChange={(event) =>
                  updateDraft(
                    'entityType',
                    event.target.value,
                  )
                }
                placeholder="e.g. Settlement"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:ring-emerald-400/10"
              />
              <datalist id="audit-entity-suggestions">
                {entitySuggestions.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    />
                  ),
                )}
              </datalist>
            </label>

            <label>
              <FieldLabel>Entity ID</FieldLabel>
              <input
                value={draft.entityId}
                onChange={(event) =>
                  updateDraft(
                    'entityId',
                    event.target.value,
                  )
                }
                placeholder="Exact entity identifier"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:ring-emerald-400/10"
              />
            </label>

            <label>
              <FieldLabel>Actor ID</FieldLabel>
              <input
                value={draft.actorId}
                onChange={(event) =>
                  updateDraft(
                    'actorId',
                    event.target.value,
                  )
                }
                placeholder="Exact user UUID"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-700 outline-none transition placeholder:font-sans placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:ring-emerald-400/10"
              />
            </label>

            <label>
              <FieldLabel>From</FieldLabel>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={draft.fromDate}
                  onChange={(event) =>
                    updateDraft(
                      'fromDate',
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:focus:ring-emerald-400/10"
                />
              </div>
            </label>

            <label>
              <FieldLabel>To</FieldLabel>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={draft.toDate}
                  onChange={(event) =>
                    updateDraft(
                      'toDate',
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:focus:ring-emerald-400/10"
                />
              </div>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
              >
                <Search className="size-4" />
                Apply filters
              </button>
            </div>
          </div>

          {branchesQuery.isError ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Branch names could not be loaded. Audit records remain available; branch filtering can be retried by refreshing the page.
            </p>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_22px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-white/10">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
                Recorded events
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Newest events first. Select a row for the complete immutable record.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              Show
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(
                    Number(
                      event.target.value,
                    ),
                  );
                  setPage(1);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                {PAGE_SIZES.map(
                  (size) => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  ),
                )}
              </select>
              per page
            </label>
          </div>

          {auditQuery.isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-emerald-600" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Loading audit trail...
                </p>
              </div>
            </div>
          ) : auditQuery.isError ? (
            <div className="flex min-h-[420px] items-center justify-center px-5">
              <div className="max-w-md text-center">
                <CircleAlert className="mx-auto size-7 text-rose-500" />
                <h3 className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
                  Unable to load the audit trail
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {getApiErrorMessage(
                    auditQuery.error,
                  )}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    auditQuery.refetch()
                  }
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center px-5">
              <div className="max-w-md text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-slate-950 dark:text-white">
                  No audit events found
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  No records match the currently applied backend filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400 dark:bg-white/[0.025] dark:text-slate-500">
                      <th className="px-5 py-3.5">Time</th>
                      <th className="px-4 py-3.5">Actor</th>
                      <th className="px-4 py-3.5">Action</th>
                      <th className="px-4 py-3.5">Entity</th>
                      <th className="px-4 py-3.5">Branch</th>
                      <th className="px-5 py-3.5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(
                      (log) => (
                        <tr
                          key={log.id}
                          className="border-t border-slate-100 transition hover:bg-emerald-50/35 dark:border-white/[0.06] dark:hover:bg-emerald-400/[0.035]"
                        >
                          <td className="px-5 py-4 align-top">
                            <p className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-200">
                              {formatDateTime(
                                log.createdAt,
                              )}
                            </p>
                            <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-slate-400">
                              {log.id}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {actorName(
                                log,
                              )}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {log.actor
                                ? humanize(
                                    log.actor.role,
                                  )
                                : 'No user actor'}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${actionTone(
                                log.action,
                              )}`}
                            >
                              {humanize(
                                log.action,
                              )}
                            </span>
                            {log.description ? (
                              <p className="mt-2 max-w-[300px] line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                {log.description}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {humanize(
                                log.entityType,
                              )}
                            </p>
                            <p className="mt-1 max-w-[170px] truncate font-mono text-[10px] text-slate-400">
                              {log.entityId ??
                                'No entity ID'}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {log.branch?.name ??
                                'Company-wide'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {log.branch?.code ??
                                'No branch link'}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right align-top">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedId(
                                  log.id,
                                )
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-emerald-300"
                            >
                              View record
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden dark:divide-white/[0.06]">
                {logs.map(
                  (log) => (
                    <button
                      type="button"
                      key={log.id}
                      onClick={() =>
                        setSelectedId(
                          log.id,
                        )
                      }
                      className="block w-full p-4 text-left transition hover:bg-emerald-50/40 dark:hover:bg-emerald-400/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {actorName(
                              log,
                            )}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatDateTime(
                              log.createdAt,
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${actionTone(
                            log.action,
                          )}`}
                        >
                          {humanize(
                            log.action,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-white/[0.05]">
                          {humanize(
                            log.entityType,
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {log.branch?.name ??
                            'Company-wide'}
                        </span>
                      </div>

                      {log.description ? (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {log.description}
                        </p>
                      ) : null}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {pagination ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pagination.total === 0
                  ? '0 records'
                  : `Page ${pagination.page} of ${pagination.totalPages} · ${new Intl.NumberFormat(
                      'en-NG',
                    ).format(
                      pagination.total,
                    )} total records`}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1,
                        ),
                    )
                  }
                  disabled={
                    !pagination.hasPreviousPage ||
                    auditQuery.isFetching
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1,
                    )
                  }
                  disabled={
                    !pagination.hasNextPage ||
                    auditQuery.isFetching
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/[0.06]">
            <ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-300" />
            <p className="mt-3 text-xs font-semibold text-slate-900 dark:text-white">
              Read-only by design
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              The backend exposes only list and detail audit routes. There is no public create, edit or delete endpoint.
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-400/15 dark:bg-cyan-400/[0.06]">
            <Fingerprint className="size-4 text-cyan-700 dark:text-cyan-300" />
            <p className="mt-3 text-xs font-semibold text-slate-900 dark:text-white">
              Scoped access
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Super Admin can inspect company-wide records; backend access rules remain the authority for every request.
            </p>
          </div>

          <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-400/15 dark:bg-violet-400/[0.06]">
            <FileJson2 className="size-4 text-violet-700 dark:text-violet-300" />
            <p className="mt-3 text-xs font-semibold text-slate-900 dark:text-white">
              Sanitized metadata
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Credential-like metadata is recursively redacted by the backend before an audit record is stored.
            </p>
          </div>
        </section>
      </div>

      <DetailDrawer
        auditLogId={selectedId}
        onClose={() =>
          setSelectedId(null)
        }
      />
    </>
  );
}
