'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
  ReactNode,
} from 'react';

import {
  AlertTriangle,
  Ban,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Eye,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';

import {
  api,
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  useAuthStore,
} from '@/stores/auth-store';

import {
  approveStaffMember,
  getStaffMember,
  getStaffMembers,
  inviteStaffMember,
  revokeStaffMember,
  suspendStaffMember,
} from '@/lib/api/staff';

import type {
  InviteStaffInput,
  StaffInvitation,
  StaffMember,
  StaffStatus,
} from '@/types/staff';


interface BranchOption {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;

  manager?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}


interface BranchListResponse {
  success: boolean;
  message: string;

  data: {
    branches: BranchOption[];
  };
}


interface InviteFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branchId: string;
  jobTitle: string;
}


const EMPTY_INVITE_FORM: InviteFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  branchId: '',
  jobTitle: '',
};


const STATUS_OPTIONS:
  Array<{
    value:
      | 'ALL'
      | StaffStatus;

    label: string;
  }> = [
    {
      value: 'ALL',
      label: 'All statuses',
    },
    {
      value: 'PENDING_INVITE',
      label: 'Pending invite',
    },
    {
      value: 'PENDING_APPROVAL',
      label: 'Pending approval',
    },
    {
      value: 'ACTIVE',
      label: 'Active',
    },
    {
      value: 'SUSPENDED',
      label: 'Suspended',
    },
    {
      value: 'REVOKED',
      label: 'Revoked',
    },
  ];


const STATUS_LABEL:
  Record<
    StaffStatus,
    string
  > = {
    PENDING_INVITE:
      'Pending invite',

    PENDING_APPROVAL:
      'Pending approval',

    ACTIVE:
      'Active',

    SUSPENDED:
      'Suspended',

    REVOKED:
      'Revoked',
  };


const STATUS_CLASS:
  Record<
    StaffStatus,
    string
  > = {
    PENDING_INVITE:
      'border-amber-200 bg-amber-50 text-amber-700',

    PENDING_APPROVAL:
      'border-sky-200 bg-sky-50 text-sky-700',

    ACTIVE:
      'border-emerald-200 bg-emerald-50 text-emerald-700',

    SUSPENDED:
      'border-orange-200 bg-orange-50 text-orange-700',

    REVOKED:
      'border-rose-200 bg-rose-50 text-rose-700',
  };


const getStaffName = (
  staff: StaffMember,
): string =>
  [
    staff.user.firstName,
    staff.user.lastName,
  ]
    .filter(Boolean)
    .join(' ');


const getActorName = (
  actor:
    | StaffMember['createdBy']
    | StaffMember['approvedBy'],
): string => {
  if (!actor) {
    return '—';
  }

  return [
    actor.firstName,
    actor.lastName,
  ]
    .filter(Boolean)
    .join(' ');
};


const formatDate = (
  value:
    | string
    | null
    | undefined,
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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
};


function StaffStatusBadge({
  status,
}: {
  status: StaffStatus;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        STATUS_CLASS[
          status
        ],
      ].join(' ')}
    >
      {
        STATUS_LABEL[
          status
        ]
      }
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


export function StaffManagementPage() {
  const authUser =
    useAuthStore(
      (
        state,
      ) =>
        state.user,
    );

  const [
    staff,
    setStaff,
  ] =
    useState<
      StaffMember[]
    >([]);

  const [
    branches,
    setBranches,
  ] =
    useState<
      BranchOption[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    notice,
    setNotice,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | 'ALL'
      | StaffStatus
    >('ALL');

  const [
    branchFilter,
    setBranchFilter,
  ] =
    useState('ALL');

  const [
    inviteOpen,
    setInviteOpen,
  ] =
    useState(false);

  const [
    inviteSubmitting,
    setInviteSubmitting,
  ] =
    useState(false);

  const [
    inviteForm,
    setInviteForm,
  ] =
    useState<InviteFormState>(
      EMPTY_INVITE_FORM,
    );

  const [
    invitation,
    setInvitation,
  ] =
    useState<
      StaffInvitation | null
    >(null);

  const [
    selectedStaff,
    setSelectedStaff,
  ] =
    useState<
      StaffMember | null
    >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    actionKey,
    setActionKey,
  ] =
    useState<
      string | null
    >(null);


  const getVisibleBranches =
    useCallback(
      (
        availableBranches:
          BranchOption[],

        staffMembers:
          StaffMember[],
      ): BranchOption[] => {
        const activeBranches =
          availableBranches.filter(
            (
              branch,
            ) =>
              branch.isActive !==
              false,
          );

        if (
          authUser?.role !==
          'BRANCH_MANAGER'
        ) {
          return activeBranches;
        }

        const explicitManaged =
          activeBranches.filter(
            (
              branch,
            ) =>
              branch.manager?.id ===
              authUser.id,
          );

        if (
          explicitManaged.length >
          0
        ) {
          return explicitManaged;
        }

        /*
         * Fallback for APIs where the public branch serializer
         * does not expose manager ownership.
         *
         * /staff is already branch-scoped by the backend for a
         * BRANCH_MANAGER, so existing staff records can safely
         * identify visible managed branches.
         */
        const branchIds =
          new Set(
            staffMembers.map(
              (
                member,
              ) =>
                member.branchId,
            ),
          );

        const inferredBranches =
          activeBranches.filter(
            (
              branch,
            ) =>
              branchIds.has(
                branch.id,
              ),
          );

        if (
          inferredBranches.length >
          0
        ) {
          return inferredBranches;
        }

        /*
         * Final fallback:
         *
         * keep active branches visible so a manager with zero
         * existing staff is not locked out of onboarding.
         *
         * The backend remains the financial/security authority
         * and rejects invitations for unmanaged branches.
         */
        return activeBranches;
      },
      [
        authUser,
      ],
    );


  const loadWorkspace =
    useCallback(
      async (
        quiet = false,
      ) => {
        if (quiet) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setError(null);

        try {
          const [
            staffMembers,
            branchResponse,
          ] =
            await Promise.all([
              getStaffMembers(),

              api.get<BranchListResponse>(
                '/branches',
              ),
            ]);

          const visibleBranches =
            getVisibleBranches(
              branchResponse
                .data
                .data
                .branches,

              staffMembers,
            );

          setStaff(
            staffMembers,
          );

          setBranches(
            visibleBranches,
          );

          if (
            authUser?.role ===
              'BRANCH_MANAGER' &&
            visibleBranches.length ===
              1
          ) {
            setInviteForm(
              (
                current,
              ) => ({
                ...current,

                branchId:
                  current.branchId ||
                  visibleBranches[
                    0
                  ]?.id ||
                  '',
              }),
            );
          }
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        authUser,
        getVisibleBranches,
      ],
    );


  const reloadStaff =
    useCallback(
      async () => {
        const members =
          await getStaffMembers();

        setStaff(
          members,
        );
      },
      [],
    );


  useEffect(
    () => {
      void loadWorkspace();
    },
    [
      loadWorkspace,
    ],
  );


  const filteredStaff =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return staff.filter(
          (
            member,
          ) => {
            if (
              statusFilter !==
                'ALL' &&
              member.status !==
                statusFilter
            ) {
              return false;
            }

            if (
              branchFilter !==
                'ALL' &&
              member.branchId !==
                branchFilter
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            const searchable =
              [
                getStaffName(
                  member,
                ),
                member.user.email,
                member.user.phone ??
                  '',
                member.jobTitle ??
                  '',
                member.branch.name,
                member.branch.code,
                STATUS_LABEL[
                  member.status
                ],
              ]
                .join(' ')
                .toLowerCase();

            return searchable.includes(
              query,
            );
          },
        );
      },
      [
        branchFilter,
        search,
        staff,
        statusFilter,
      ],
    );


  const metrics =
    useMemo(
      () => ({
        total:
          staff.length,

        active:
          staff.filter(
            (
              member,
            ) =>
              member.status ===
              'ACTIVE',
          ).length,

        awaitingApproval:
          staff.filter(
            (
              member,
            ) =>
              member.status ===
              'PENDING_APPROVAL',
          ).length,

        suspended:
          staff.filter(
            (
              member,
            ) =>
              member.status ===
              'SUSPENDED',
          ).length,
      }),
      [
        staff,
      ],
    );


  const openInvite =
    () => {
      setError(null);
      setNotice(null);
      setInvitation(null);

      setInviteForm({
        ...EMPTY_INVITE_FORM,

        branchId:
          authUser?.role ===
            'BRANCH_MANAGER' &&
          branches.length ===
            1
            ? branches[
                0
              ]?.id ??
              ''
            : '',
      });

      setInviteOpen(
        true,
      );
    };


  const closeInvite =
    () => {
      setInviteOpen(
        false,
      );

      setInvitation(
        null,
      );

      setInviteForm(
        EMPTY_INVITE_FORM,
      );
    };


  const submitInvite =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError(null);
      setNotice(null);

      const firstName =
        inviteForm
          .firstName
          .trim();

      const lastName =
        inviteForm
          .lastName
          .trim();

      const email =
        inviteForm
          .email
          .trim()
          .toLowerCase();

      const phone =
        inviteForm
          .phone
          .trim();

      const jobTitle =
        inviteForm
          .jobTitle
          .trim();

      if (
        firstName.length <
          2 ||
        lastName.length <
          2
      ) {
        setError(
          'First name and last name must each contain at least 2 characters.',
        );

        return;
      }

      if (
        !email ||
        !email.includes(
          '@',
        )
      ) {
        setError(
          'Enter a valid staff email address.',
        );

        return;
      }

      if (
        !inviteForm.branchId
      ) {
        setError(
          'Select the staff member branch.',
        );

        return;
      }

      const input:
        InviteStaffInput =
        {
          firstName,
          lastName,
          email,

          branchId:
            inviteForm.branchId,

          ...(phone
            ? {
                phone,
              }
            : {}),

          ...(jobTitle
            ? {
                jobTitle,
              }
            : {}),
        };

      setInviteSubmitting(
        true,
      );

      try {
        const result =
          await inviteStaffMember(
            input,
          );

        setInvitation(
          result,
        );

        setNotice(
          'Staff invitation created successfully.',
        );

        await reloadStaff();
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
          ),
        );
      } finally {
        setInviteSubmitting(
          false,
        );
      }
    };


  const runAction =
    async (
      member:
        StaffMember,

      action:
        | 'approve'
        | 'suspend'
        | 'revoke',
    ) => {
      const actionId =
        `${member.id}:${action}`;

      setActionKey(
        actionId,
      );

      setError(null);
      setNotice(null);

      try {
        if (
          action ===
          'approve'
        ) {
          await approveStaffMember(
            member.id,
          );

          setNotice(
            `${getStaffName(
              member,
            )} has been approved.`,
          );
        }

        if (
          action ===
          'suspend'
        ) {
          await suspendStaffMember(
            member.id,
          );

          setNotice(
            `${getStaffName(
              member,
            )} has been suspended.`,
          );
        }

        if (
          action ===
          'revoke'
        ) {
          await revokeStaffMember(
            member.id,
          );

          setNotice(
            `${getStaffName(
              member,
            )}'s staff access has been revoked.`,
          );
        }

        await reloadStaff();

        if (
          selectedStaff?.id ===
          member.id
        ) {
          const refreshed =
            await getStaffMember(
              member.id,
            );

          setSelectedStaff(
            refreshed,
          );
        }
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
          ),
        );
      } finally {
        setActionKey(
          null,
        );
      }
    };


  const openStaffDetails =
    async (
      member:
        StaffMember,
    ) => {
      setSelectedStaff(
        member,
      );

      setDetailLoading(
        true,
      );

      try {
        const refreshed =
          await getStaffMember(
            member.id,
          );

        setSelectedStaff(
          refreshed,
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
          ),
        );
      } finally {
        setDetailLoading(
          false,
        );
      }
    };


  const copyInvitationToken =
    async () => {
      if (!invitation) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          invitation.invitationToken,
        );

        setNotice(
          'Invitation token copied to clipboard.',
        );
      } catch {
        setError(
          'Automatic copy failed. Select and copy the invitation token manually.',
        );
      }
    };


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="size-5 animate-spin text-emerald-600" />
          Loading staff management…
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <ShieldCheck className="size-4" />
                Workforce control
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Staff management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Invite branch staff,
                monitor onboarding,
                approve accepted
                invitations and control
                workforce access across
                Ogun&apos;s Sure Gas.
              </p>

              {authUser && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Signed in as{' '}
                  <span className="text-slate-800">
                    {
                      authUser.email
                    }
                  </span>{' '}
                  ·{' '}
                  {
                    authUser.role
                  }
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadWorkspace(
                    true,
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={[
                    'size-4',
                    refreshing
                      ? 'animate-spin'
                      : '',
                  ].join(' ')}
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openInvite
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <UserPlus className="size-4" />
                Invite staff
              </button>
            </div>
          </div>
        </section>


        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() =>
                setError(
                  null,
                )
              }
            >
              <X className="size-4" />
            </button>
          </div>
        )}


        {notice && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
          </div>
        )}


        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total staff"
            value={
              metrics.total
            }
            description="Staff records inside your permitted management scope."
            icon={
              <UsersRound className="size-5" />
            }
          />

          <MetricCard
            title="Active"
            value={
              metrics.active
            }
            description="Approved staff currently holding active accounts."
            icon={
              <CheckCircle2 className="size-5" />
            }
          />

          <MetricCard
            title="Awaiting approval"
            value={
              metrics.awaitingApproval
            }
            description="Staff who accepted an invitation and require approval."
            icon={
              <Clock3 className="size-5" />
            }
          />

          <MetricCard
            title="Suspended"
            value={
              metrics.suspended
            }
            description="Staff whose access is currently suspended."
            icon={
              <Ban className="size-5" />
            }
          />
        </section>


        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
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
                      event.target.value,
                    )
                  }
                  placeholder="Search name, email, phone, title or branch…"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | 'ALL'
                      | StaffStatus,
                  )
                }
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                {STATUS_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  branchFilter
                }
                onChange={(
                  event,
                ) =>
                  setBranchFilter(
                    event.target.value,
                  )
                }
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="ALL">
                  All visible branches
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
                      ({
                        branch.code
                      })
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>


          {filteredStaff.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <UsersRound className="size-6" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No staff records found
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Adjust the filters or
                invite a staff member
                into an active branch.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStaff.map(
                (
                  member,
                ) => {
                  const approveBusy =
                    actionKey ===
                    `${member.id}:approve`;

                  const suspendBusy =
                    actionKey ===
                    `${member.id}:suspend`;

                  const revokeBusy =
                    actionKey ===
                    `${member.id}:revoke`;

                  return (
                    <article
                      key={
                        member.id
                      }
                      className="p-5 transition hover:bg-slate-50/80 md:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-sm font-bold text-emerald-800">
                              {
                                member.user
                                  .firstName?.[
                                  0
                                ]
                              }
                              {
                                member.user
                                  .lastName?.[
                                  0
                                ]
                              }
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-semibold text-slate-950">
                                  {
                                    getStaffName(
                                      member,
                                    )
                                  }
                                </h3>

                                <StaffStatusBadge
                                  status={
                                    member.status
                                  }
                                />
                              </div>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {
                                  member.jobTitle ??
                                  'Staff member'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="size-3.5" />
                              {
                                member.user
                                  .email
                              }
                            </span>

                            {member.user
                              .phone && (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="size-3.5" />
                                {
                                  member.user
                                    .phone
                                }
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="size-3.5" />
                              {
                                member.branch
                                  .name
                              }{' '}
                              ·{' '}
                              {
                                member.branch
                                  .code
                              }
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="size-3.5" />
                              Invited{' '}
                              {
                                formatDate(
                                  member.invitedAt,
                                )
                              }
                            </span>
                          </div>
                        </div>


                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openStaffDetails(
                                member,
                              )
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="size-4" />
                            Details
                          </button>


                          {member.status ===
                            'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              disabled={
                                approveBusy
                              }
                              onClick={() =>
                                void runAction(
                                  member,
                                  'approve',
                                )
                              }
                              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {approveBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Check className="size-4" />
                              )}

                              Approve
                            </button>
                          )}


                          {member.status ===
                            'ACTIVE' && (
                            <button
                              type="button"
                              disabled={
                                suspendBusy
                              }
                              onClick={() =>
                                void runAction(
                                  member,
                                  'suspend',
                                )
                              }
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-60"
                            >
                              {suspendBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Ban className="size-4" />
                              )}

                              Suspend
                            </button>
                          )}


                          {member.status !==
                            'REVOKED' && (
                            <button
                              type="button"
                              disabled={
                                revokeBusy
                              }
                              onClick={() => {
                                const confirmed =
                                  window.confirm(
                                    `Revoke staff access for ${getStaffName(
                                      member,
                                    )}?`,
                                  );

                                if (
                                  confirmed
                                ) {
                                  void runAction(
                                    member,
                                    'revoke',
                                  );
                                }
                              }}
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              {revokeBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <XCircle className="size-4" />
                              )}

                              Revoke
                            </button>
                          )}
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


      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Staff onboarding
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {invitation
                    ? 'Invitation created'
                    : 'Invite staff member'}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={
                  closeInvite
                }
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="size-4" />
              </button>
            </div>


            {invitation ? (
              <div className="space-y-6 p-6">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                    <div>
                      <h3 className="font-semibold text-emerald-950">
                        Invitation created
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Copy the one-time
                        invitation token now
                        and deliver it securely
                        to the intended staff
                        member.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    One-time invitation token
                  </label>

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      readOnly
                      value={
                        invitation.invitationToken
                      }
                      className="min-h-28 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-700"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void copyInvitationToken()
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                    >
                      <Clipboard className="size-4" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Staff member
                    </p>

                    <p className="mt-2 font-semibold text-slate-900">
                      {
                        getStaffName(
                          invitation.staff,
                        )
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        invitation.staff
                          .user.email
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Token expires
                    </p>

                    <p className="mt-2 font-semibold text-slate-900">
                      {
                        formatDate(
                          invitation
                            .inviteExpiresAt,
                        )
                      }
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Accepting this invitation
                  does not activate the
                  account. The staff member
                  will move to Pending
                  Approval until management
                  approves them.
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={
                      closeInvite
                    }
                    className="h-11 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  submitInvite
                }
                className="space-y-5 p-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      First name
                    </span>

                    <input
                      required
                      minLength={
                        2
                      }
                      maxLength={
                        50
                      }
                      value={
                        inviteForm.firstName
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            firstName:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Last name
                    </span>

                    <input
                      required
                      minLength={
                        2
                      }
                      maxLength={
                        50
                      }
                      value={
                        inviteForm.lastName
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            lastName:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>


                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Email
                    </span>

                    <input
                      required
                      type="email"
                      value={
                        inviteForm.email
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            email:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Phone{' '}
                      <span className="font-normal text-slate-400">
                        optional
                      </span>
                    </span>

                    <input
                      minLength={
                        7
                      }
                      maxLength={
                        20
                      }
                      value={
                        inviteForm.phone
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            phone:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>


                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Branch
                    </span>

                    <select
                      required
                      value={
                        inviteForm.branchId
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            branchId:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
                            ({
                              branch.code
                            })
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Job title{' '}
                      <span className="font-normal text-slate-400">
                        optional
                      </span>
                    </span>

                    <input
                      minLength={
                        2
                      }
                      maxLength={
                        100
                      }
                      placeholder="e.g. Gas Attendant"
                      value={
                        inviteForm.jobTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            jobTitle:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>


                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                  New staff are created as
                  inactive accounts. They
                  accept the invitation first,
                  then management approval
                  activates their account.
                </div>


                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeInvite
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      inviteSubmitting
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {inviteSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}

                    Create invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close details"
            className="absolute inset-0"
            onClick={() =>
              setSelectedStaff(
                null,
              )
            }
          />

          <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Staff record
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {
                    getStaffName(
                      selectedStaff,
                    )
                  }
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close details"
                onClick={() =>
                  setSelectedStaff(
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
                  Refreshing record…
                </div>
              )}


              <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-emerald-700 shadow-sm">
                  {
                    selectedStaff
                      .user
                      .firstName?.[
                      0
                    ]
                  }
                  {
                    selectedStaff
                      .user
                      .lastName?.[
                      0
                    ]
                  }
                </div>

                <div>
                  <StaffStatusBadge
                    status={
                      selectedStaff.status
                    }
                  />

                  <p className="mt-2 font-semibold text-slate-950">
                    {
                      selectedStaff.jobTitle ??
                      'Staff member'
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedStaff.branch
                        .name
                    }{' '}
                    ·{' '}
                    {
                      selectedStaff.branch
                        .code
                    }
                  </p>
                </div>
              </div>


              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <Mail className="size-4 text-slate-400" />

                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-800">
                    {
                      selectedStaff.user
                        .email
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <Phone className="size-4 text-slate-400" />

                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {
                      selectedStaff.user
                        .phone ??
                      'Not provided'
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <Building2 className="size-4 text-slate-400" />

                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                    Branch
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {
                      selectedStaff.branch
                        .name
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <BriefcaseBusiness className="size-4 text-slate-400" />

                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                    Job title
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {
                      selectedStaff.jobTitle ??
                      'Not specified'
                    }
                  </p>
                </div>
              </div>


              <section className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Lifecycle
                  </h3>
                </div>

                <dl className="divide-y divide-slate-100">
                  {[
                    [
                      'Invited',
                      selectedStaff
                        .invitedAt,
                    ],
                    [
                      'Invite expires',
                      selectedStaff
                        .inviteExpiresAt,
                    ],
                    [
                      'Accepted',
                      selectedStaff
                        .acceptedAt,
                    ],
                    [
                      'Approved',
                      selectedStaff
                        .approvedAt,
                    ],
                    [
                      'Revoked',
                      selectedStaff
                        .revokedAt,
                    ],
                  ].map(
                    ([
                      label,
                      value,
                    ]) => (
                      <div
                        key={
                          label
                        }
                        className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                      >
                        <dt className="text-slate-500">
                          {label}
                        </dt>

                        <dd className="text-right font-medium text-slate-800">
                          {
                            formatDate(
                              value,
                            )
                          }
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>


              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">
                  Management audit
                </h3>

                <div className="mt-4 space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Invited by
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        getActorName(
                          selectedStaff.createdBy,
                        )
                      }
                    </p>

                    <p className="text-sm text-slate-500">
                      {
                        selectedStaff.createdBy
                          .email
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Approved by
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        getActorName(
                          selectedStaff.approvedBy,
                        )
                      }
                    </p>

                    {selectedStaff
                      .approvedBy && (
                      <p className="text-sm text-slate-500">
                        {
                          selectedStaff
                            .approvedBy
                            .email
                        }
                      </p>
                    )}
                  </div>
                </div>
              </section>


              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">
                  Management actions
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedStaff.status ===
                    'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      disabled={
                        actionKey ===
                        `${selectedStaff.id}:approve`
                      }
                      onClick={() =>
                        void runAction(
                          selectedStaff,
                          'approve',
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check className="size-4" />
                      Approve staff
                    </button>
                  )}

                  {selectedStaff.status ===
                    'ACTIVE' && (
                    <button
                      type="button"
                      disabled={
                        actionKey ===
                        `${selectedStaff.id}:suspend`
                      }
                      onClick={() =>
                        void runAction(
                          selectedStaff,
                          'suspend',
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
                    >
                      <Ban className="size-4" />
                      Suspend
                    </button>
                  )}

                  {selectedStaff.status !==
                    'REVOKED' && (
                    <button
                      type="button"
                      disabled={
                        actionKey ===
                        `${selectedStaff.id}:revoke`
                      }
                      onClick={() => {
                        const confirmed =
                          window.confirm(
                            `Revoke staff access for ${getStaffName(
                              selectedStaff,
                            )}?`,
                          );

                        if (
                          confirmed
                        ) {
                          void runAction(
                            selectedStaff,
                            'revoke',
                          );
                        }
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <XCircle className="size-4" />
                      Revoke access
                    </button>
                  )}
                </div>

                {selectedStaff.status ===
                  'SUSPENDED' && (
                  <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    The backend currently
                    exposes no resume/reactivate
                    endpoint for suspended
                    staff, so this UI does not
                    invent one.
                  </p>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
