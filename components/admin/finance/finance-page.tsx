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
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  FileKey2,
  Landmark,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import {
  getManagementBranches,
} from '@/lib/api/branches';

import {
  activatePayoutPolicy,
  createPayoutPolicy,
  disablePayoutRecipient,
  finalizeSettlementTransferOtp,
  getActivePayoutPolicy,
  getFinancePayments,
  getFinanceRiders,
  getPayoutPolicies,
  getPayoutRecipient,
  getPayoutRecipients,
  getSettlement,
  getSettlements,
  initiateSettlementTransfer,
  materializeSettlement,
  putBranchPayoutRecipient,
  putRiderPayoutRecipient,
  reconcilePayoutRecipient,
  reconcileSettlementTransfer,
  verifyPayoutRecipient,
} from '@/lib/api/finance';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import type {
  CreatePayoutPolicyInput,
  FinancePayment,
  FinanceRider,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PayoutCalculationMode,
  PayoutOwnerType,
  PayoutPolicy,
  PayoutRecipient,
  PayoutRecipientInput,
  PayoutRecipientStatus,
  Settlement,
  SettlementBlockReason,
  SettlementSourceType,
  SettlementStatus,
} from '@/types/finance';

const PAYMENT_STATUSES: Array<
  'ALL' | PaymentStatus
> = [
  'ALL',
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

const PAYMENT_METHODS: Array<
  'ALL' | PaymentMethod
> = [
  'ALL',
  'CASH',
  'TRANSFER',
  'CARD',
  'ONLINE',
];

const PAYMENT_TYPES: Array<
  'ALL' | PaymentType
> = [
  'ALL',
  'ORDER',
  'TIP',
];

const SETTLEMENT_STATUSES: Array<
  'ALL' | SettlementStatus
> = [
  'ALL',
  'BLOCKED',
  'ELIGIBLE',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED',
];

const SETTLEMENT_SOURCES: Array<
  'ALL' | SettlementSourceType
> = [
  'ALL',
  'ORDER_BRANCH',
  'RIDER_DELIVERY',
  'RIDER_TIP',
];

const SETTLEMENT_BLOCK_REASONS: Array<
  'ALL' | SettlementBlockReason
> = [
  'ALL',
  'PAYOUT_POLICY_MISSING',
  'RECIPIENT_MISSING',
  'RECIPIENT_UNVERIFIED',
  'PAYMENT_NOT_PAID',
  'DELIVERY_NOT_DELIVERED',
  'BENEFICIARY_MISSING',
  'PAYABLE_AMOUNT_UNRESOLVED',
];

const RECIPIENT_STATUSES: Array<
  'ALL' | PayoutRecipientStatus
> = [
  'ALL',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'DISABLED',
];

const RECIPIENT_OWNER_TYPES: Array<
  'ALL' | PayoutOwnerType
> = [
  'ALL',
  'BRANCH',
  'RIDER',
];

const formatMoney = (
  value: number | null | undefined,
): string =>
  new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2,
    },
  ).format(value ?? 0);

const formatDateTime = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return 'Not recorded';
  }

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
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );

const statusTone = (
  status: string,
): string => {
  const value =
    status.toUpperCase();

  if (
    value.includes('PAID') ||
    value.includes('VERIFIED') ||
    value.includes('ELIGIBLE') ||
    value.includes('ACTIVE')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    value.includes('FAILED') ||
    value.includes('DISABLED') ||
    value.includes('CANCELLED')
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (
    value.includes('PROCESSING') ||
    value.includes('PENDING') ||
    value.includes('BLOCKED') ||
    value.includes('OTP')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-cyan-200 bg-cyan-50 text-cyan-700';
};

const compactId = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return '—';
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
};

const riderName = (
  rider: FinanceRider | null | undefined,
): string =>
  rider
    ? `${rider.user.firstName} ${rider.user.lastName}`.trim()
    : 'Unknown rider';

const settlementBeneficiary = (
  settlement: Settlement,
): string => {
  if (settlement.sourceType === 'ORDER_BRANCH') {
    return settlement.branch?.name ?? 'Branch beneficiary';
  }

  if (settlement.rider?.user) {
    return `${settlement.rider.user.firstName} ${settlement.rider.user.lastName}`.trim();
  }

  return 'Rider beneficiary';
};

const paymentOwner = (
  payment: FinancePayment,
): string => {
  if (payment.order) {
    return `${payment.order.customer.firstName} ${payment.order.customer.lastName}`.trim();
  }

  if (payment.riderTip) {
    return `Rider tip • ${compactId(payment.riderTip.riderId)}`;
  }

  return 'Checkout payment';
};

function StatusBadge({
  value,
}: {
  value: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone(value)}`}
    >
      {humanize(value)}
    </span>
  );
}

function LoadingState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-emerald-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          {label}
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-rose-200 bg-rose-50/60 p-6">
      <div className="max-w-md text-center">
        <CircleAlert className="mx-auto size-7 text-rose-500" />
        <h3 className="mt-3 text-sm font-semibold text-slate-950">
          Unable to load finance data
        </h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 font-serif text-2xl font-semibold text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {detail}
          </p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

type FinanceTab =
  | 'OVERVIEW'
  | 'PAYMENTS'
  | 'SETTLEMENTS'
  | 'RECIPIENTS'
  | 'POLICY';

const financeTabs: Array<{
  id: FinanceTab;
  label: string;
}> = [
  {
    id: 'OVERVIEW',
    label: 'Overview',
  },
  {
    id: 'PAYMENTS',
    label: 'Payments',
  },
  {
    id: 'SETTLEMENTS',
    label: 'Settlements',
  },
  {
    id: 'RECIPIENTS',
    label: 'Payout destinations',
  },
  {
    id: 'POLICY',
    label: 'Payout policy',
  },
];

export function FinancePage() {
  const queryClient =
    useQueryClient();

  const [activeTab, setActiveTab] =
    useState<FinanceTab>('OVERVIEW');

  const [paymentSearch, setPaymentSearch] =
    useState('');
  const [paymentStatus, setPaymentStatus] =
    useState<'ALL' | PaymentStatus>('ALL');
  const [paymentMethod, setPaymentMethod] =
    useState<'ALL' | PaymentMethod>('ALL');
  const [paymentType, setPaymentType] =
    useState<'ALL' | PaymentType>('ALL');
  const [selectedPaymentId, setSelectedPaymentId] =
    useState<string | null>(null);

  const [settlementPage, setSettlementPage] =
    useState(1);
  const [settlementStatus, setSettlementStatus] =
    useState<'ALL' | SettlementStatus>('ALL');
  const [settlementSource, setSettlementSource] =
    useState<'ALL' | SettlementSourceType>('ALL');
  const [settlementBlockReason, setSettlementBlockReason] =
    useState<'ALL' | SettlementBlockReason>('ALL');
  const [settlementBranchId, setSettlementBranchId] =
    useState('');
  const [settlementRiderId, setSettlementRiderId] =
    useState('');
  const [settlementSearch, setSettlementSearch] =
    useState('');
  const [selectedSettlementId, setSelectedSettlementId] =
    useState<string | null>(null);
  const [otpInput, setOtpInput] =
    useState('');

  const [materializeType, setMaterializeType] =
    useState<SettlementSourceType>('ORDER_BRANCH');
  const [materializeId, setMaterializeId] =
    useState('');
  const [materializeMessage, setMaterializeMessage] =
    useState<string | null>(null);

  const [recipientPage, setRecipientPage] =
    useState(1);
  const [recipientOwnerType, setRecipientOwnerType] =
    useState<'ALL' | PayoutOwnerType>('ALL');
  const [recipientStatus, setRecipientStatus] =
    useState<'ALL' | PayoutRecipientStatus>('ALL');
  const [recipientBranchId, setRecipientBranchId] =
    useState('');
  const [recipientRiderId, setRecipientRiderId] =
    useState('');
  const [selectedRecipientId, setSelectedRecipientId] =
    useState<string | null>(null);
  const [recipientEditorOpen, setRecipientEditorOpen] =
    useState(false);
  const [recipientOwner, setRecipientOwner] =
    useState<PayoutOwnerType>('BRANCH');
  const [recipientOwnerId, setRecipientOwnerId] =
    useState('');
  const [recipientForm, setRecipientForm] =
    useState<PayoutRecipientInput>({
      bankCode: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
    });
  const [recipientMessage, setRecipientMessage] =
    useState<string | null>(null);

  const [policyEditorOpen, setPolicyEditorOpen] =
    useState(false);
  const [policyDescription, setPolicyDescription] =
    useState('');
  const [branchRuleEnabled, setBranchRuleEnabled] =
    useState(true);
  const [branchRuleMode, setBranchRuleMode] =
    useState<PayoutCalculationMode>('PERCENTAGE_OF_ORDER_PAYMENT');
  const [branchRuleValue, setBranchRuleValue] =
    useState('');
  const [riderRuleEnabled, setRiderRuleEnabled] =
    useState(true);
  const [riderRuleMode, setRiderRuleMode] =
    useState<PayoutCalculationMode>('FIXED_AMOUNT');
  const [riderRuleValue, setRiderRuleValue] =
    useState('');
  const [policyMessage, setPolicyMessage] =
    useState<string | null>(null);

  const branchesQuery =
    useQuery({
      queryKey: [
        'finance-branches',
      ],
      queryFn:
        getManagementBranches,
      staleTime: 60_000,
    });

  const ridersQuery =
    useQuery({
      queryKey: [
        'finance-riders',
      ],
      queryFn:
        getFinanceRiders,
      staleTime: 30_000,
    });

  const paymentsQuery =
    useQuery({
      queryKey: [
        'finance-payments',
        paymentStatus,
        paymentMethod,
      ],
      queryFn: () =>
        getFinancePayments({
          ...(paymentStatus !== 'ALL'
            ? {
                status: paymentStatus,
              }
            : {}),
          ...(paymentMethod !== 'ALL'
            ? {
                method: paymentMethod,
              }
            : {}),
        }),
      staleTime: 15_000,
    });

  const settlementFilters =
    useMemo(
      () => ({
        ...(settlementSource !== 'ALL'
          ? {
              sourceType: settlementSource,
            }
          : {}),
        ...(settlementStatus !== 'ALL'
          ? {
              status: settlementStatus,
            }
          : {}),
        ...(settlementBlockReason !== 'ALL'
          ? {
              blockReason: settlementBlockReason,
            }
          : {}),
        ...(settlementBranchId
          ? {
              branchId: settlementBranchId,
            }
          : {}),
        ...(settlementRiderId
          ? {
              riderId: settlementRiderId,
            }
          : {}),
        page: settlementPage,
        limit: 25,
      }),
      [
        settlementBlockReason,
        settlementBranchId,
        settlementPage,
        settlementRiderId,
        settlementSource,
        settlementStatus,
      ],
    );

  const settlementsQuery =
    useQuery({
      queryKey: [
        'finance-settlements',
        settlementFilters,
      ],
      queryFn: () =>
        getSettlements(
          settlementFilters,
        ),
      staleTime: 10_000,
    });

  const recipientFilters =
    useMemo(
      () => ({
        ...(recipientOwnerType !== 'ALL'
          ? {
              ownerType: recipientOwnerType,
            }
          : {}),
        ...(recipientStatus !== 'ALL'
          ? {
              status: recipientStatus,
            }
          : {}),
        ...(recipientBranchId
          ? {
              branchId: recipientBranchId,
            }
          : {}),
        ...(recipientRiderId
          ? {
              riderId: recipientRiderId,
            }
          : {}),
        page: recipientPage,
        limit: 25,
      }),
      [
        recipientBranchId,
        recipientOwnerType,
        recipientPage,
        recipientRiderId,
        recipientStatus,
      ],
    );

  const recipientsQuery =
    useQuery({
      queryKey: [
        'finance-recipients',
        recipientFilters,
      ],
      queryFn: () =>
        getPayoutRecipients(
          recipientFilters,
        ),
      staleTime: 15_000,
    });

  const policiesQuery =
    useQuery({
      queryKey: [
        'finance-payout-policies',
      ],
      queryFn:
        getPayoutPolicies,
      staleTime: 30_000,
    });

  const activePolicyQuery =
    useQuery({
      queryKey: [
        'finance-active-payout-policy',
      ],
      queryFn:
        getActivePayoutPolicy,
      staleTime: 30_000,
    });

  const settlementDetailQuery =
    useQuery({
      queryKey: [
        'finance-settlement',
        selectedSettlementId,
      ],
      queryFn: () => {
        if (!selectedSettlementId) {
          throw new Error(
            'Settlement ID is required.',
          );
        }

        return getSettlement(
          selectedSettlementId,
        );
      },
      enabled:
        Boolean(
          selectedSettlementId,
        ),
      staleTime: 5_000,
    });

  const recipientDetailQuery =
    useQuery({
      queryKey: [
        'finance-recipient',
        selectedRecipientId,
      ],
      queryFn: () => {
        if (!selectedRecipientId) {
          throw new Error(
            'Recipient ID is required.',
          );
        }

        return getPayoutRecipient(
          selectedRecipientId,
        );
      },
      enabled:
        Boolean(
          selectedRecipientId,
        ),
      staleTime: 5_000,
    });

  const branches =
    useMemo(
      () =>
        branchesQuery.data ?? [],
      [branchesQuery.data],
    );

  const riders =
    useMemo(
      () =>
        ridersQuery.data ?? [],
      [ridersQuery.data],
    );

  const payments =
    useMemo(
      () =>
        paymentsQuery.data ?? [],
      [paymentsQuery.data],
    );

  const settlementRows =
    useMemo(
      () =>
        settlementsQuery.data
          ?.settlements ?? [],
      [
        settlementsQuery.data
          ?.settlements,
      ],
    );

  const recipientRows =
    useMemo(
      () =>
        recipientsQuery.data
          ?.recipients ?? [],
      [
        recipientsQuery.data
          ?.recipients,
      ],
    );

  const policies =
    useMemo(
      () =>
        policiesQuery.data ?? [],
      [policiesQuery.data],
    );

  const filteredPayments =
    useMemo(() => {
      const normalized =
        paymentSearch
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          if (
            paymentType !== 'ALL' &&
            payment.paymentType !== paymentType
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          const haystack = [
            payment.reference,
            payment.order?.orderNumber,
            payment.order?.customer.firstName,
            payment.order?.customer.lastName,
            payment.order?.customer.email,
            payment.order?.fulfillmentBranch.name,
            payment.provider,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(
            normalized,
          );
        },
      );
    }, [
      paymentSearch,
      paymentType,
      payments,
    ]);

  const filteredSettlements =
    useMemo(() => {
      const normalized =
        settlementSearch
          .trim()
          .toLowerCase();

      if (!normalized) {
        return settlementRows;
      }

      return settlementRows.filter(
        (settlement) =>
          [
            settlement.key,
            settlement.order?.orderNumber,
            settlement.payment?.reference,
            settlement.branch?.name,
            settlement.rider?.user.firstName,
            settlement.rider?.user.lastName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalized),
      );
    }, [
      settlementRows,
      settlementSearch,
    ]);

  const selectedPayment =
    useMemo(
      () =>
        payments.find(
          (payment) =>
            payment.id ===
            selectedPaymentId,
        ) ?? null,
      [
        payments,
        selectedPaymentId,
      ],
    );

  const overview =
    useMemo(() => {
      const paidPayments =
        payments.filter(
          (payment) =>
            payment.status === 'PAID',
        );

      const captured =
        paidPayments.reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        );

      const platformRevenue =
        paidPayments.reduce(
          (total, payment) =>
            total +
            (payment.order?.platformFee ?? 0),
          0,
        );

      const outstanding =
        settlementRows
          .filter(
            (settlement) =>
              [
                'BLOCKED',
                'ELIGIBLE',
                'PROCESSING',
              ].includes(
                settlement.status,
              ),
          )
          .reduce(
            (total, settlement) =>
              total +
              (settlement.payableAmount ?? 0),
            0,
          );

      const paidSettlements =
        settlementRows
          .filter(
            (settlement) =>
              settlement.status === 'PAID',
          )
          .reduce(
            (total, settlement) =>
              total +
              (settlement.payableAmount ?? 0),
            0,
          );

      return {
        captured,
        platformRevenue,
        outstanding,
        paidSettlements,
        blocked:
          settlementRows.filter(
            (settlement) =>
              settlement.status === 'BLOCKED',
          ).length,
        verifiedRecipients:
          recipientRows.filter(
            (recipient) =>
              recipient.status === 'VERIFIED',
          ).length,
      };
    }, [
      payments,
      recipientRows,
      settlementRows,
    ]);

  const refreshFinance =
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            'finance-payments',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'finance-settlements',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'finance-recipients',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'finance-payout-policies',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'finance-active-payout-policy',
          ],
        }),
      ]);
    };

  const materializeMutation =
    useMutation({
      mutationFn:
        materializeSettlement,
      onSuccess: async (
        settlement,
      ) => {
        setMaterializeMessage(
          `Settlement ${settlement.key} is now ${humanize(settlement.status)}.`,
        );
        setMaterializeId('');
        await queryClient.invalidateQueries({
          queryKey: [
            'finance-settlements',
          ],
        });
      },
      onError: (error) => {
        setMaterializeMessage(
          getApiErrorMessage(error),
        );
      },
    });

  const initiateTransferMutation =
    useMutation({
      mutationFn:
        initiateSettlementTransfer,
      onSuccess: async (
        result,
      ) => {
        setOtpInput('');
        window.alert(
          result.otpRequired
            ? 'Paystack accepted the transfer request and requires OTP finalization. The settlement remains processing.'
            : result.message ??
                'Transfer initiation completed. Reconciliation is still required before the settlement is considered paid.',
        );
        await refreshFinance();
        await settlementDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const reconcileTransferMutation =
    useMutation({
      mutationFn:
        reconcileSettlementTransfer,
      onSuccess: async (
        result,
      ) => {
        window.alert(
          result.message ??
            `Paystack reconciliation completed. Current settlement state: ${humanize(result.status)}.`,
        );
        await refreshFinance();
        await settlementDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const finalizeOtpMutation =
    useMutation({
      mutationFn: ({
        settlementId,
        otp,
      }: {
        settlementId: string;
        otp: string;
      }) =>
        finalizeSettlementTransferOtp(
          settlementId,
          otp,
        ),
      onSuccess: async (
        result,
      ) => {
        setOtpInput('');
        window.alert(
          result.message ??
            'OTP finalization returned successfully. The settlement remains subject to trusted reconciliation.',
        );
        await refreshFinance();
        await settlementDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const saveRecipientMutation =
    useMutation({
      mutationFn: async () => {
        if (!recipientOwnerId) {
          throw new Error(
            `Select a ${recipientOwner === 'BRANCH' ? 'branch' : 'rider'} first.`,
          );
        }

        return recipientOwner === 'BRANCH'
          ? putBranchPayoutRecipient(
              recipientOwnerId,
              recipientForm,
            )
          : putRiderPayoutRecipient(
              recipientOwnerId,
              recipientForm,
            );
      },
      onSuccess: async (
        recipient,
      ) => {
        setRecipientMessage(
          'Payout destination saved. It must be verified with Paystack before settlements can become eligible.',
        );
        setRecipientEditorOpen(false);
        setSelectedRecipientId(
          recipient.id,
        );
        setRecipientForm({
          bankCode: '',
          bankName: '',
          accountName: '',
          accountNumber: '',
        });
        setRecipientOwnerId('');
        await refreshFinance();
      },
      onError: (error) => {
        setRecipientMessage(
          getApiErrorMessage(error),
        );
      },
    });

  const verifyRecipientMutation =
    useMutation({
      mutationFn:
        verifyPayoutRecipient,
      onSuccess: async (
        result,
      ) => {
        window.alert(
          result.providerVerified
            ? `Paystack verified this payout destination. ${result.settlementsReevaluated} open settlement(s) were re-evaluated.`
            : 'Paystack did not verify this payout destination.',
        );
        await refreshFinance();
        await recipientDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const reconcileRecipientMutation =
    useMutation({
      mutationFn:
        reconcilePayoutRecipient,
      onSuccess: async (
        result,
      ) => {
        window.alert(
          result.providerVerified
            ? 'Paystack reconciliation confirmed the saved payout destination.'
            : 'Paystack reconciliation no longer matches the saved payout destination. Reverification is required.',
        );
        await refreshFinance();
        await recipientDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const disableRecipientMutation =
    useMutation({
      mutationFn:
        disablePayoutRecipient,
      onSuccess: async () => {
        await refreshFinance();
        await recipientDetailQuery.refetch();
      },
      onError: (error) => {
        window.alert(
          getApiErrorMessage(error),
        );
      },
    });

  const createPolicyMutation =
    useMutation({
      mutationFn: (
        input: CreatePayoutPolicyInput,
      ) =>
        createPayoutPolicy(input),
      onSuccess: async (
        policy,
      ) => {
        setPolicyMessage(
          `Created immutable payout policy ${policy.version}. It is not active until you explicitly activate it.`,
        );
        setPolicyEditorOpen(false);
        setPolicyDescription('');
        setBranchRuleValue('');
        setRiderRuleValue('');
        await queryClient.invalidateQueries({
          queryKey: [
            'finance-payout-policies',
          ],
        });
      },
      onError: (error) => {
        setPolicyMessage(
          getApiErrorMessage(error),
        );
      },
    });

  const activatePolicyMutation =
    useMutation({
      mutationFn:
        activatePayoutPolicy,
      onSuccess: async (
        policy,
      ) => {
        setPolicyMessage(
          `${policy.version} is now the active payout policy for future settlement materialization/re-evaluation.`,
        );
        await queryClient.invalidateQueries({
          queryKey: [
            'finance-payout-policies',
          ],
        });
        await queryClient.invalidateQueries({
          queryKey: [
            'finance-active-payout-policy',
          ],
        });
      },
      onError: (error) => {
        setPolicyMessage(
          getApiErrorMessage(error),
        );
      },
    });

  const selectedSettlement =
    settlementDetailQuery.data ?? null;
  const selectedRecipient =
    recipientDetailQuery.data ?? null;

  const resetSettlementFilters = () => {
    setSettlementPage(1);
    setSettlementStatus('ALL');
    setSettlementSource('ALL');
    setSettlementBlockReason('ALL');
    setSettlementBranchId('');
    setSettlementRiderId('');
    setSettlementSearch('');
  };

  const resetRecipientFilters = () => {
    setRecipientPage(1);
    setRecipientOwnerType('ALL');
    setRecipientStatus('ALL');
    setRecipientBranchId('');
    setRecipientRiderId('');
  };

  const startRecipientEditor = (
    ownerType: PayoutOwnerType = 'BRANCH',
  ) => {
    setRecipientOwner(ownerType);
    setRecipientOwnerId('');
    setRecipientForm({
      bankCode: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
    });
    setRecipientMessage(null);
    setRecipientEditorOpen(true);
  };

  const replaceRecipientDetails = (
    recipient: PayoutRecipient,
  ) => {
    setRecipientOwner(
      recipient.ownerType,
    );
    setRecipientOwnerId(
      recipient.branchId ??
        recipient.riderId ??
        '',
    );
    setRecipientForm({
      bankCode: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
    });
    setRecipientMessage(null);
    setSelectedRecipientId(null);
    setRecipientEditorOpen(true);
  };

  const buildPolicyInput = ():
    CreatePayoutPolicyInput => {
    const input:
      CreatePayoutPolicyInput = {
      ...(policyDescription.trim()
        ? {
            description:
              policyDescription.trim(),
          }
        : {}),
      branchRule:
        branchRuleEnabled
          ? {
              mode: branchRuleMode,
              value:
                branchRuleValue.trim(),
            }
          : null,
      riderDeliveryRule:
        riderRuleEnabled
          ? {
              mode: riderRuleMode,
              value:
                riderRuleValue.trim(),
            }
          : null,
    };

    return input;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,#f8fffd_0%,#f7fafc_44%,#ffffff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <section className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#073f35] via-[#0a5f4d] to-[#0d785d] px-5 py-7 text-white sm:px-7 lg:px-9">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-120px] left-[28%] size-72 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
                  <ShieldCheck className="size-3.5" />
                  Super Admin finance control
                </div>

                <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  Payments, payouts & settlements
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">
                  Monitor customer payments, platform service revenue, payout destinations, immutable payout policy versions and Paystack settlement execution from one controlled workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void refreshFinance();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <RefreshCw className="size-4" />
                  Refresh finance
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('RECIPIENTS');
                    startRecipientEditor();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-300 px-4 text-xs font-bold text-[#073f35] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200"
                >
                  <Landmark className="size-4" />
                  Add payout destination
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 bg-white px-3 py-3 sm:px-5">
            <div className="flex min-w-max gap-2">
              {financeTabs.map(
                (tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={[
                      'rounded-2xl px-4 py-2.5 text-xs font-semibold transition',
                      activeTab === tab.id
                        ? 'bg-[#073f35] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        {activeTab === 'OVERVIEW' ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Captured payments"
                value={formatMoney(overview.captured)}
                detail="Paid payment records currently returned by the finance payment API."
                icon={CreditCard}
              />
              <MetricCard
                label="Platform service fees"
                value={formatMoney(overview.platformRevenue)}
                detail="Immutable order platform-fee snapshots on paid order payments."
                icon={Sparkles}
              />
              <MetricCard
                label="Open payout liability"
                value={formatMoney(overview.outstanding)}
                detail="Known payable amounts across blocked, eligible and processing settlements in the current page."
                icon={Banknote}
              />
              <MetricCard
                label="Paid settlements"
                value={formatMoney(overview.paidSettlements)}
                detail="Settlements already reconciled to the terminal paid state in the current page."
                icon={CheckCircle2}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                      Financial control plane
                    </p>
                    <h2 className="mt-2 font-serif text-xl font-semibold text-slate-950">
                      Money movement stays behind explicit gates
                    </h2>
                  </div>
                  <LockKeyhole className="size-5 text-emerald-700" />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    {
                      title: 'Payments',
                      text: 'Admin finance is read-only for customer payment status. Provider reconciliation remains server-authoritative.',
                    },
                    {
                      title: 'Recipients',
                      text: 'Bank destinations return to pending verification whenever details are replaced.',
                    },
                    {
                      title: 'Transfers',
                      text: 'Initiation only moves a settlement to processing. Paid/failed requires trusted reconciliation.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[20px] border border-slate-100 bg-slate-50/75 p-4"
                    >
                      <p className="text-xs font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Operational readiness
                    </p>
                    <h2 className="mt-2 font-serif text-xl font-semibold text-slate-950">
                      Payout health
                    </h2>
                  </div>
                  <ShieldCheck className="size-5 text-emerald-700" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                    <span className="text-xs font-medium text-emerald-800">
                      Verified payout destinations
                    </span>
                    <span className="text-sm font-bold text-emerald-900">
                      {overview.verifiedRecipients}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                    <span className="text-xs font-medium text-amber-800">
                      Blocked settlements
                    </span>
                    <span className="text-sm font-bold text-amber-900">
                      {overview.blocked}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="text-xs font-medium text-slate-800">
                      Active payout policy
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {activePolicyQuery.data
                        ? activePolicyQuery.data.version
                        : 'No active payout policy returned.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Recent settlement ledger
                  </p>
                  <h2 className="mt-2 font-serif text-xl font-semibold text-slate-950">
                    Latest payout obligations
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('SETTLEMENTS')
                  }
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"
                >
                  Open settlements
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-3 font-semibold">Beneficiary</th>
                      <th className="px-3 py-3 font-semibold">Source</th>
                      <th className="px-3 py-3 font-semibold">Payable</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementRows.slice(0, 6).map((settlement) => (
                      <tr
                        key={settlement.id}
                        className="border-b border-slate-50"
                      >
                        <td className="px-3 py-4 font-medium text-slate-800">
                          {settlementBeneficiary(settlement)}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {humanize(settlement.sourceType)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-900">
                          {settlement.payableAmount === null
                            ? 'Unresolved'
                            : formatMoney(settlement.payableAmount)}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge value={settlement.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'PAYMENTS' ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  Customer payment ledger
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">
                  Payments
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                  Payment status is provider-authoritative. This workspace deliberately does not expose admin buttons for marking a payment paid, failed or refunded.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1 xl:flex-none">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={paymentSearch}
                    onChange={(event) =>
                      setPaymentSearch(event.target.value)
                    }
                    placeholder="Search reference, customer, order..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none transition focus:border-emerald-400"
                  />
                </div>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value as 'ALL' | PaymentStatus)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-400"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === 'ALL' ? 'All statuses' : humanize(status)}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as 'ALL' | PaymentMethod)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-400"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method === 'ALL' ? 'All methods' : humanize(method)}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentType}
                  onChange={(event) =>
                    setPaymentType(event.target.value as 'ALL' | PaymentType)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-400"
                >
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'All payment types' : humanize(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {paymentsQuery.isLoading ? (
              <div className="mt-5">
                <LoadingState label="Loading payment ledger..." />
              </div>
            ) : paymentsQuery.isError ? (
              <div className="mt-5">
                <ErrorState
                  message={getApiErrorMessage(paymentsQuery.error)}
                  onRetry={() => {
                    void paymentsQuery.refetch();
                  }}
                />
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-3 font-semibold">Reference</th>
                      <th className="px-3 py-3 font-semibold">Customer / source</th>
                      <th className="px-3 py-3 font-semibold">Amount</th>
                      <th className="px-3 py-3 font-semibold">Type</th>
                      <th className="px-3 py-3 font-semibold">Method</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        onClick={() =>
                          setSelectedPaymentId(payment.id)
                        }
                        className="cursor-pointer border-b border-slate-50 transition hover:bg-emerald-50/40"
                      >
                        <td className="px-3 py-4 font-semibold text-slate-900">
                          {payment.reference}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          <p className="font-medium text-slate-800">
                            {paymentOwner(payment)}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {payment.order?.orderNumber ?? compactId(payment.orderId)}
                          </p>
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-950">
                          {formatMoney(payment.amount)}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {humanize(payment.paymentType)}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {humanize(payment.method)}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge value={payment.status} />
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {formatDateTime(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400">
                    No payment records match the current filters.
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'SETTLEMENTS' ? (
          <div className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    Internal payout ledger
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">
                    Settlements
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                    A settlement is an internal liability record. Only eligible settlements with verified Paystack destinations can start transfer execution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSettlementFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                >
                  <RotateCcw className="size-3.5" />
                  Reset filters
                </button>
              </div>

              <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                <div className="relative xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={settlementSearch}
                    onChange={(event) =>
                      setSettlementSearch(event.target.value)
                    }
                    placeholder="Search key, order, payment, beneficiary..."
                    className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <select
                  value={settlementStatus}
                  onChange={(event) => {
                    setSettlementPage(1);
                    setSettlementStatus(event.target.value as 'ALL' | SettlementStatus);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
                >
                  {SETTLEMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === 'ALL' ? 'All statuses' : humanize(status)}
                    </option>
                  ))}
                </select>

                <select
                  value={settlementSource}
                  onChange={(event) => {
                    setSettlementPage(1);
                    setSettlementSource(event.target.value as 'ALL' | SettlementSourceType);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
                >
                  {SETTLEMENT_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source === 'ALL' ? 'All source types' : humanize(source)}
                    </option>
                  ))}
                </select>

                <select
                  value={settlementBranchId}
                  onChange={(event) => {
                    setSettlementPage(1);
                    setSettlementBranchId(event.target.value);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
                >
                  <option value="">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>

                <select
                  value={settlementBlockReason}
                  onChange={(event) => {
                    setSettlementPage(1);
                    setSettlementBlockReason(event.target.value as 'ALL' | SettlementBlockReason);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
                >
                  {SETTLEMENT_BLOCK_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason === 'ALL' ? 'All block reasons' : humanize(reason)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2">
                <select
                  value={settlementRiderId}
                  onChange={(event) => {
                    setSettlementPage(1);
                    setSettlementRiderId(event.target.value);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400 md:max-w-sm"
                >
                  <option value="">All riders</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {riderName(rider)}
                    </option>
                  ))}
                </select>
              </div>

              {settlementsQuery.isLoading ? (
                <div className="mt-5">
                  <LoadingState label="Loading settlement ledger..." />
                </div>
              ) : settlementsQuery.isError ? (
                <div className="mt-5">
                  <ErrorState
                    message={getApiErrorMessage(settlementsQuery.error)}
                    onRetry={() => {
                      void settlementsQuery.refetch();
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-[1080px] w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-3 py-3 font-semibold">Beneficiary</th>
                          <th className="px-3 py-3 font-semibold">Source</th>
                          <th className="px-3 py-3 font-semibold">Gross</th>
                          <th className="px-3 py-3 font-semibold">Payable</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold">Provider</th>
                          <th className="px-3 py-3 font-semibold">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSettlements.map((settlement) => (
                          <tr
                            key={settlement.id}
                            onClick={() => {
                              setOtpInput('');
                              setSelectedSettlementId(settlement.id);
                            }}
                            className="cursor-pointer border-b border-slate-50 transition hover:bg-emerald-50/40"
                          >
                            <td className="px-3 py-4">
                              <p className="font-semibold text-slate-900">
                                {settlementBeneficiary(settlement)}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {settlement.order?.orderNumber ?? compactId(settlement.key)}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-slate-500">
                              {humanize(settlement.sourceType)}
                            </td>
                            <td className="px-3 py-4 text-slate-600">
                              {settlement.grossAmount === null
                                ? '—'
                                : formatMoney(settlement.grossAmount)}
                            </td>
                            <td className="px-3 py-4 font-semibold text-slate-950">
                              {settlement.payableAmount === null
                                ? 'Unresolved'
                                : formatMoney(settlement.payableAmount)}
                            </td>
                            <td className="px-3 py-4">
                              <StatusBadge value={settlement.status} />
                              {settlement.blockReason ? (
                                <p className="mt-1 text-[10px] text-amber-700">
                                  {humanize(settlement.blockReason)}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-4 text-slate-500">
                              {settlement.provider ?? 'Not started'}
                            </td>
                            <td className="px-3 py-4 text-slate-500">
                              {formatDateTime(settlement.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredSettlements.length === 0 ? (
                    <div className="py-14 text-center text-xs text-slate-400">
                      No settlements match the current filters.
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                      Page {settlementsQuery.data?.pagination.page ?? settlementPage} of {Math.max(settlementsQuery.data?.pagination.totalPages ?? 0, 1)} • {settlementsQuery.data?.pagination.total ?? 0} total
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={settlementPage <= 1}
                        onClick={() =>
                          setSettlementPage((current) => Math.max(1, current - 1))
                        }
                        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-35"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={settlementPage >= (settlementsQuery.data?.pagination.totalPages ?? 0)}
                        onClick={() =>
                          setSettlementPage((current) => current + 1)
                        }
                        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-35"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <FileKey2 className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                    Advanced ledger tool
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-950">
                    Create or refresh a settlement from its source record
                  </h3>
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                    Materialization only creates or re-evaluates the internal settlement ledger. It does not create a Paystack transfer recipient, initiate a transfer or mark a settlement paid.
                  </p>

                  <div className="mt-4 grid gap-2 md:grid-cols-[220px_1fr_auto]">
                    <select
                      value={materializeType}
                      onChange={(event) =>
                        setMaterializeType(event.target.value as SettlementSourceType)
                      }
                      className="h-11 rounded-2xl border border-cyan-200 bg-white px-3 text-xs outline-none focus:border-cyan-400"
                    >
                      <option value="ORDER_BRANCH">Order branch</option>
                      <option value="RIDER_DELIVERY">Rider delivery</option>
                      <option value="RIDER_TIP">Rider tip</option>
                    </select>
                    <input
                      value={materializeId}
                      onChange={(event) =>
                        setMaterializeId(event.target.value)
                      }
                      placeholder={
                        materializeType === 'ORDER_BRANCH'
                          ? 'Order UUID'
                          : materializeType === 'RIDER_DELIVERY'
                            ? 'Delivery UUID'
                            : 'Rider tip UUID'
                      }
                      className="h-11 rounded-2xl border border-cyan-200 bg-white px-3 text-xs outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      disabled={!materializeId.trim() || materializeMutation.isPending}
                      onClick={() => {
                        setMaterializeMessage(null);
                        materializeMutation.mutate({
                          sourceType: materializeType,
                          sourceId: materializeId.trim(),
                        });
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {materializeMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Materialize
                    </button>
                  </div>

                  {materializeMessage ? (
                    <p className="mt-3 text-xs font-medium text-cyan-800">
                      {materializeMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'RECIPIENTS' ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  Verified beneficiary destinations
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">
                  Payout destinations
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                  Bank details are stored internally first, then verified against Paystack before settlement eligibility. Replacing bank details always returns the destination to pending verification.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetRecipientFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                >
                  <RotateCcw className="size-3.5" />
                  Reset filters
                </button>
                <button
                  type="button"
                  onClick={() => startRecipientEditor()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#073f35] px-4 text-xs font-semibold text-white"
                >
                  <Landmark className="size-3.5" />
                  Add destination
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={recipientOwnerType}
                onChange={(event) => {
                  setRecipientPage(1);
                  setRecipientOwnerType(event.target.value as 'ALL' | PayoutOwnerType);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
              >
                {RECIPIENT_OWNER_TYPES.map((ownerType) => (
                  <option key={ownerType} value={ownerType}>
                    {ownerType === 'ALL' ? 'All owner types' : humanize(ownerType)}
                  </option>
                ))}
              </select>

              <select
                value={recipientStatus}
                onChange={(event) => {
                  setRecipientPage(1);
                  setRecipientStatus(event.target.value as 'ALL' | PayoutRecipientStatus);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
              >
                {RECIPIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : humanize(status)}
                  </option>
                ))}
              </select>

              <select
                value={recipientBranchId}
                onChange={(event) => {
                  setRecipientPage(1);
                  setRecipientBranchId(event.target.value);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
              >
                <option value="">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <select
                value={recipientRiderId}
                onChange={(event) => {
                  setRecipientPage(1);
                  setRecipientRiderId(event.target.value);
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
              >
                <option value="">All riders</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {riderName(rider)}
                  </option>
                ))}
              </select>
            </div>

            {recipientMessage ? (
              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-medium text-cyan-800">
                {recipientMessage}
              </div>
            ) : null}

            {recipientsQuery.isLoading ? (
              <div className="mt-5">
                <LoadingState label="Loading payout destinations..." />
              </div>
            ) : recipientsQuery.isError ? (
              <div className="mt-5">
                <ErrorState
                  message={getApiErrorMessage(recipientsQuery.error)}
                  onRetry={() => {
                    void recipientsQuery.refetch();
                  }}
                />
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {recipientRows.map((recipient) => (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() =>
                        setSelectedRecipientId(recipient.id)
                      }
                      className="rounded-[22px] border border-slate-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                            {humanize(recipient.ownerType)} payout
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {recipient.branch?.name ??
                              (recipient.rider
                                ? `${recipient.rider.user.firstName} ${recipient.rider.user.lastName}`
                                : 'Unknown beneficiary')}
                          </p>
                        </div>
                        <StatusBadge value={recipient.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <p className="text-slate-400">Bank</p>
                          <p className="mt-1 font-medium text-slate-700">
                            {recipient.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Account</p>
                          <p className="mt-1 font-medium text-slate-700">
                            {recipient.accountNumber}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                        <span>{recipient.provider ?? 'Provider not configured'}</span>
                        <span>{formatDateTime(recipient.updatedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {recipientRows.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400">
                    No payout destinations match the current filters.
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Page {recipientsQuery.data?.pagination.page ?? recipientPage} of {Math.max(recipientsQuery.data?.pagination.totalPages ?? 0, 1)} • {recipientsQuery.data?.pagination.total ?? 0} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={recipientPage <= 1}
                      onClick={() =>
                        setRecipientPage((current) => Math.max(1, current - 1))
                      }
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-35"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={recipientPage >= (recipientsQuery.data?.pagination.totalPages ?? 0)}
                      onClick={() =>
                        setRecipientPage((current) => current + 1)
                      }
                      className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-35"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}

        {activeTab === 'POLICY' ? (
          <div className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    Immutable payout configuration
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">
                    Payout policy versions
                  </h2>
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                    Policy versions are append-only. Create a new version when payout rules change, then explicitly activate it. Existing settlements can retain their pinned policy version.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPolicyMessage(null);
                    setPolicyEditorOpen(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#073f35] px-4 text-xs font-semibold text-white"
                >
                  <FileKey2 className="size-4" />
                  Create policy version
                </button>
              </div>

              {policyMessage ? (
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-medium text-cyan-800">
                  {policyMessage}
                </div>
              ) : null}

              <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                      Active policy
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {activePolicyQuery.data?.version ?? 'No active payout policy'}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {activePolicyQuery.data?.description ??
                        'Without an active policy, order-branch and rider-delivery payable amounts can remain unresolved and blocked.'}
                    </p>
                  </div>
                  <BadgeCheck className="size-6 text-emerald-700" />
                </div>

                {activePolicyQuery.data ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <PolicyRuleCard
                      title="Branch payout rule"
                      rule={activePolicyQuery.data.branchRule}
                    />
                    <PolicyRuleCard
                      title="Rider delivery rule"
                      rule={activePolicyQuery.data.riderDeliveryRule}
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {policiesQuery.isLoading ? (
                  <LoadingState label="Loading payout policy versions..." />
                ) : policiesQuery.isError ? (
                  <ErrorState
                    message={getApiErrorMessage(policiesQuery.error)}
                    onRetry={() => {
                      void policiesQuery.refetch();
                    }}
                  />
                ) : policies.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    No payout policy versions have been created yet.
                  </div>
                ) : (
                  policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="rounded-[22px] border border-slate-200 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">
                              {policy.version}
                            </p>
                            {policy.isActive ? (
                              <StatusBadge value="ACTIVE" />
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {policy.description ?? 'No description provided.'}
                          </p>
                          <p className="mt-2 text-[10px] text-slate-400">
                            Created {formatDateTime(policy.createdAt)}
                          </p>
                        </div>

                        {!policy.isActive ? (
                          <button
                            type="button"
                            disabled={activatePolicyMutation.isPending}
                            onClick={() => {
                              const confirmed = window.confirm(
                                `Activate ${policy.version}? This changes the payout policy used for future settlement materialization and re-evaluation.`,
                              );

                              if (confirmed) {
                                activatePolicyMutation.mutate(policy.version);
                              }
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                          >
                            <ShieldCheck className="size-3.5" />
                            Activate version
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <PolicyRuleCard
                          title="Branch payout rule"
                          rule={policy.branchRule}
                        />
                        <PolicyRuleCard
                          title="Rider delivery rule"
                          rule={policy.riderDeliveryRule}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] leading-5 text-slate-500">
                <strong className="text-slate-700">Rider tips:</strong> rider-tip settlements are a separate liability and are not calculated from the branch/rider-delivery payout rules.
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {selectedPayment ? (
        <Drawer
          title="Payment record"
          subtitle={selectedPayment.reference}
          onClose={() =>
            setSelectedPaymentId(null)
          }
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400">
                  Amount
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-slate-950">
                  {formatMoney(selectedPayment.amount)}
                </p>
              </div>
              <StatusBadge value={selectedPayment.status} />
            </div>

            <DetailGrid
              items={[
                ['Payment type', humanize(selectedPayment.paymentType)],
                ['Method', humanize(selectedPayment.method)],
                ['Provider', selectedPayment.provider ?? 'Not recorded'],
                ['Paid at', formatDateTime(selectedPayment.paidAt)],
                ['Created', formatDateTime(selectedPayment.createdAt)],
                ['Updated', formatDateTime(selectedPayment.updatedAt)],
              ]}
            />

            {selectedPayment.order ? (
              <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/45 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Order financial snapshot
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <MoneyRow label="Merchandise subtotal" value={selectedPayment.order.subtotal} />
                  <MoneyRow label="Discount" value={-selectedPayment.order.discountAmount} />
                  <MoneyRow label={`Platform service fee (${selectedPayment.order.platformFeeRate.toFixed(2)}%)`} value={selectedPayment.order.platformFee} />
                  <MoneyRow label="Delivery fee" value={selectedPayment.order.deliveryFee} />
                  <MoneyRow label="Cross-branch fee" value={selectedPayment.order.crossBranchFee} />
                  <div className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-3 font-semibold text-slate-950">
                    <span>Order total</span>
                    <span>{formatMoney(selectedPayment.order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedPayment.order ? (
              <div className="rounded-[20px] border border-slate-100 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Customer & fulfilment
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {selectedPayment.order.customer.firstName} {selectedPayment.order.customer.lastName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedPayment.order.customer.email}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-700">
                  {selectedPayment.order.fulfillmentBranch.name} • {selectedPayment.order.fulfillmentBranch.code}
                </p>
              </div>
            ) : null}

            <div className="rounded-[20px] border border-cyan-100 bg-cyan-50/60 p-4 text-xs leading-5 text-cyan-800">
              Payment state is read-only here. Financial status transitions are intentionally not controlled by the Super Admin frontend.
            </div>
          </div>
        </Drawer>
      ) : null}

      {selectedSettlementId ? (
        <Drawer
          title="Settlement record"
          subtitle={selectedSettlement?.key ?? compactId(selectedSettlementId)}
          onClose={() => {
            setOtpInput('');
            setSelectedSettlementId(null);
          }}
        >
          {settlementDetailQuery.isLoading ? (
            <LoadingState label="Loading settlement..." />
          ) : settlementDetailQuery.isError || !selectedSettlement ? (
            <ErrorState
              message={getApiErrorMessage(settlementDetailQuery.error)}
              onRetry={() => {
                void settlementDetailQuery.refetch();
              }}
            />
          ) : (
            <div className="space-y-5">
              <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400">
                      Beneficiary
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {settlementBeneficiary(selectedSettlement)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {humanize(selectedSettlement.sourceType)}
                    </p>
                  </div>
                  <StatusBadge value={selectedSettlement.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] text-slate-400">Gross amount</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedSettlement.grossAmount === null
                        ? 'Unresolved'
                        : formatMoney(selectedSettlement.grossAmount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-[10px] text-slate-400">Payable amount</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedSettlement.payableAmount === null
                        ? 'Unresolved'
                        : formatMoney(selectedSettlement.payableAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSettlement.blockReason ? (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Settlement blocked
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        {humanize(selectedSettlement.blockReason)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <DetailGrid
                items={[
                  ['Policy version', selectedSettlement.policyVersion ?? 'Not pinned'],
                  ['Order', selectedSettlement.order?.orderNumber ?? compactId(selectedSettlement.orderId)],
                  ['Payment', selectedSettlement.payment?.reference ?? compactId(selectedSettlement.paymentId)],
                  ['Provider', selectedSettlement.provider ?? 'Not started'],
                  ['Provider status', selectedSettlement.providerStatus ?? 'Not started'],
                  ['Transfer attempts', String(selectedSettlement.attempts)],
                  ['Eligible at', formatDateTime(selectedSettlement.eligibleAt)],
                  ['Paid at', formatDateTime(selectedSettlement.paidAt)],
                ]}
              />

              {selectedSettlement.payoutRecipient ? (
                <div className="rounded-[20px] border border-slate-100 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Payout destination snapshot
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedSettlement.payoutRecipient.accountName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedSettlement.payoutRecipient.bankName} • {selectedSettlement.payoutRecipient.accountNumber}
                      </p>
                    </div>
                    <StatusBadge value={selectedSettlement.payoutRecipient.status} />
                  </div>
                </div>
              ) : null}

              {selectedSettlement.status === 'ELIGIBLE' ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50/65 p-4">
                  <div className="flex items-start gap-3">
                    <Send className="mt-0.5 size-4 shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-rose-900">
                        Initiate Paystack transfer
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-rose-700">
                        This is a real financial action. The backend will claim the settlement as processing before contacting Paystack, and it will not mark the settlement paid until trusted reconciliation.
                      </p>
                      <button
                        type="button"
                        disabled={initiateTransferMutation.isPending}
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Initiate a Paystack transfer of ${formatMoney(selectedSettlement.payableAmount)} to ${settlementBeneficiary(selectedSettlement)}? This can move real money.`,
                          );

                          if (confirmed) {
                            initiateTransferMutation.mutate(selectedSettlement.id);
                          }
                        }}
                        className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {initiateTransferMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        Initiate transfer
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedSettlement.status === 'PROCESSING' ? (
                <div className="space-y-3 rounded-[20px] border border-amber-200 bg-amber-50/60 p-4">
                  <div>
                    <p className="text-xs font-semibold text-amber-900">
                      Transfer reconciliation required
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-amber-700">
                      Processing is deliberately non-terminal. Verify the immutable provider transfer reference before treating this payout as complete.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={reconcileTransferMutation.isPending}
                    onClick={() =>
                      reconcileTransferMutation.mutate(selectedSettlement.id)
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-xs font-semibold text-amber-800 disabled:opacity-50"
                  >
                    {reconcileTransferMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Reconcile with Paystack
                  </button>

                  {selectedSettlement.providerStatus?.toLowerCase().includes('otp') ? (
                    <div className="rounded-2xl border border-amber-200 bg-white p-3">
                      <p className="text-[11px] font-semibold text-slate-800">
                        Paystack OTP finalization
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        Only the OTP is sent by the client. Transfer identity and financial data stay server-authoritative.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          value={otpInput}
                          onChange={(event) =>
                            setOtpInput(event.target.value)
                          }
                          type="password"
                          autoComplete="one-time-code"
                          placeholder="Enter transfer OTP"
                          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          disabled={!otpInput.trim() || finalizeOtpMutation.isPending}
                          onClick={() => {
                            const confirmed = window.confirm(
                              'Submit this OTP to finalize the existing Paystack transfer? The settlement will still require trusted reconciliation afterward.',
                            );

                            if (confirmed) {
                              finalizeOtpMutation.mutate({
                                settlementId: selectedSettlement.id,
                                otp: otpInput,
                              });
                            }
                          }}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <LockKeyhole className="size-3.5" />
                          Finalize OTP
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </Drawer>
      ) : null}

      {selectedRecipientId ? (
        <Drawer
          title="Payout destination"
          subtitle={selectedRecipient?.accountName ?? compactId(selectedRecipientId)}
          onClose={() =>
            setSelectedRecipientId(null)
          }
        >
          {recipientDetailQuery.isLoading ? (
            <LoadingState label="Loading payout destination..." />
          ) : recipientDetailQuery.isError || !selectedRecipient ? (
            <ErrorState
              message={getApiErrorMessage(recipientDetailQuery.error)}
              onRetry={() => {
                void recipientDetailQuery.refetch();
              }}
            />
          ) : (
            <div className="space-y-5">
              <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400">
                      {humanize(selectedRecipient.ownerType)} beneficiary
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {selectedRecipient.branch?.name ??
                        (selectedRecipient.rider
                          ? `${selectedRecipient.rider.user.firstName} ${selectedRecipient.rider.user.lastName}`
                          : 'Unknown beneficiary')}
                    </p>
                  </div>
                  <StatusBadge value={selectedRecipient.status} />
                </div>
              </div>

              <DetailGrid
                items={[
                  ['Bank', selectedRecipient.bankName],
                  ['Bank code', selectedRecipient.bankCode],
                  ['Account name', selectedRecipient.accountName],
                  ['Account number', selectedRecipient.accountNumber],
                  ['Provider', selectedRecipient.provider ?? 'Not configured'],
                  ['Provider recipient', selectedRecipient.providerRecipientConfigured ? 'Configured' : 'Not configured'],
                  ['Verified at', formatDateTime(selectedRecipient.verifiedAt)],
                  ['Updated', formatDateTime(selectedRecipient.updatedAt)],
                ]}
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    replaceRecipientDetails(selectedRecipient)
                  }
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700"
                >
                  <Landmark className="size-4" />
                  Replace bank details
                </button>

                {selectedRecipient.status === 'PENDING_VERIFICATION' ? (
                  <button
                    type="button"
                    disabled={verifyRecipientMutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Verify this payout destination with Paystack? This creates or verifies provider recipient state but does not send money.',
                      );

                      if (confirmed) {
                        verifyRecipientMutation.mutate(selectedRecipient.id);
                      }
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {verifyRecipientMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="size-4" />
                    )}
                    Verify with Paystack
                  </button>
                ) : null}

                {selectedRecipient.status === 'VERIFIED' && selectedRecipient.providerRecipientConfigured ? (
                  <button
                    type="button"
                    disabled={reconcileRecipientMutation.isPending}
                    onClick={() =>
                      reconcileRecipientMutation.mutate(selectedRecipient.id)
                    }
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                  >
                    {reconcileRecipientMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Reconcile provider destination
                  </button>
                ) : null}

                {selectedRecipient.status !== 'DISABLED' ? (
                  <button
                    type="button"
                    disabled={disableRecipientMutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Disable this payout destination? Open settlements may be blocked until a valid verified destination is available.',
                      );

                      if (confirmed) {
                        disableRecipientMutation.mutate(selectedRecipient.id);
                      }
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 disabled:opacity-50"
                  >
                    <X className="size-4" />
                    Disable destination
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </Drawer>
      ) : null}

      {recipientEditorOpen ? (
        <Modal
          title="Add or replace payout destination"
          onClose={() =>
            setRecipientEditorOpen(false)
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[11px] leading-5 text-amber-800">
              Saving new bank details does not verify them. The destination returns to pending verification and must pass Paystack verification before eligible settlements can use it.
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {(['BRANCH', 'RIDER'] as PayoutOwnerType[]).map((ownerType) => (
                <button
                  key={ownerType}
                  type="button"
                  onClick={() => {
                    setRecipientOwner(ownerType);
                    setRecipientOwnerId('');
                  }}
                  className={[
                    'rounded-xl px-3 py-2.5 text-xs font-semibold transition',
                    recipientOwner === ownerType
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500',
                  ].join(' ')}
                >
                  {humanize(ownerType)}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700">
                {recipientOwner === 'BRANCH' ? 'Branch' : 'Rider'}
              </span>
              <select
                value={recipientOwnerId}
                onChange={(event) =>
                  setRecipientOwnerId(event.target.value)
                }
                className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
              >
                <option value="">Select {recipientOwner === 'BRANCH' ? 'branch' : 'rider'}</option>
                {recipientOwner === 'BRANCH'
                  ? branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} • {branch.code}
                      </option>
                    ))
                  : riders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {riderName(rider)} {rider.branchId ? '• assigned branch' : '• no branch'}
                      </option>
                    ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <FinanceInput
                label="Bank name"
                value={recipientForm.bankName}
                onChange={(value) =>
                  setRecipientForm((current) => ({
                    ...current,
                    bankName: value,
                  }))
                }
                placeholder="e.g. Access Bank"
              />
              <FinanceInput
                label="Bank code"
                value={recipientForm.bankCode}
                onChange={(value) =>
                  setRecipientForm((current) => ({
                    ...current,
                    bankCode: value,
                  }))
                }
                placeholder="Provider bank code"
              />
              <FinanceInput
                label="Account name"
                value={recipientForm.accountName}
                onChange={(value) =>
                  setRecipientForm((current) => ({
                    ...current,
                    accountName: value,
                  }))
                }
                placeholder="Account holder name"
              />
              <FinanceInput
                label="Account number"
                value={recipientForm.accountNumber}
                onChange={(value) =>
                  setRecipientForm((current) => ({
                    ...current,
                    accountNumber: value.replace(/\D/g, '')
                  }))
                }
                placeholder="Digits only"
              />
            </div>

            <button
              type="button"
              disabled={
                saveRecipientMutation.isPending ||
                !recipientOwnerId ||
                !recipientForm.bankCode.trim() ||
                !recipientForm.bankName.trim() ||
                !recipientForm.accountName.trim() ||
                !recipientForm.accountNumber.trim()
              }
              onClick={() =>
                saveRecipientMutation.mutate()
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#073f35] px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saveRecipientMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Landmark className="size-4" />
              )}
              Save pending verification
            </button>
          </div>
        </Modal>
      ) : null}

      {policyEditorOpen ? (
        <Modal
          title="Create immutable payout policy"
          onClose={() =>
            setPolicyEditorOpen(false)
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-[11px] leading-5 text-cyan-800">
              This creates a new immutable version. It does not become active automatically, and existing pinned settlements are not silently rewritten.
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700">
                Description
              </span>
              <textarea
                value={policyDescription}
                onChange={(event) =>
                  setPolicyDescription(event.target.value)
                }
                rows={3}
                maxLength={500}
                placeholder="Why this policy version exists..."
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-emerald-400"
              />
            </label>

            <PolicyRuleEditor
              title="Branch payout rule"
              enabled={branchRuleEnabled}
              onEnabledChange={setBranchRuleEnabled}
              mode={branchRuleMode}
              onModeChange={setBranchRuleMode}
              value={branchRuleValue}
              onValueChange={setBranchRuleValue}
            />

            <PolicyRuleEditor
              title="Rider delivery rule"
              enabled={riderRuleEnabled}
              onEnabledChange={setRiderRuleEnabled}
              mode={riderRuleMode}
              onModeChange={setRiderRuleMode}
              value={riderRuleValue}
              onValueChange={setRiderRuleValue}
            />

            <button
              type="button"
              disabled={
                createPolicyMutation.isPending ||
                (!branchRuleEnabled && !riderRuleEnabled) ||
                (branchRuleEnabled && !branchRuleValue.trim()) ||
                (riderRuleEnabled && !riderRuleValue.trim())
              }
              onClick={() => {
                const confirmed = window.confirm(
                  'Create this immutable payout policy version? You will still need to activate it separately.',
                );

                if (confirmed) {
                  createPolicyMutation.mutate(buildPolicyInput());
                }
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#073f35] px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              {createPolicyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileKey2 className="size-4" />
              )}
              Create immutable version
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function PolicyRuleCard({
  title,
  rule,
}: {
  title: string;
  rule: PayoutPolicy['branchRule'];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>
      {rule ? (
        <>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {rule.mode === 'FIXED_AMOUNT'
              ? formatMoney(Number(rule.value))
              : `${rule.value}%`}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {humanize(rule.mode)}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Not configured
        </p>
      )}
    </div>
  );
}

function PolicyRuleEditor({
  title,
  enabled,
  onEnabledChange,
  mode,
  onModeChange,
  value,
  onValueChange,
}: {
  title: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  mode: PayoutCalculationMode;
  onModeChange: (value: PayoutCalculationMode) => void;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-900">
            {title}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Configure a fixed NGN amount or percentage of the order-payment payout basis.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onEnabledChange(!enabled)
          }
          className={[
            'rounded-full px-3 py-1.5 text-[10px] font-semibold',
            enabled
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-500',
          ].join(' ')}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {enabled ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <select
            value={mode}
            onChange={(event) =>
              onModeChange(event.target.value as PayoutCalculationMode)
            }
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400"
          >
            <option value="FIXED_AMOUNT">Fixed amount</option>
            <option value="PERCENTAGE_OF_ORDER_PAYMENT">Percentage of order payment</option>
          </select>
          <input
            value={value}
            onChange={(event) =>
              onValueChange(event.target.value)
            }
            placeholder={mode === 'FIXED_AMOUNT' ? 'e.g. 500.00' : 'e.g. 12.5'}
            inputMode="decimal"
            className="h-11 rounded-2xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-400"
          />
        </div>
      ) : null}
    </div>
  );
}

function MoneyRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-600">
      <span>{label}</span>
      <span className={value < 0 ? 'text-rose-600' : 'font-medium text-slate-800'}>
        {value < 0 ? `−${formatMoney(Math.abs(value))}` : formatMoney(value)}
      </span>
    </div>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<[
    string,
    string,
  ]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={`${label}-${value}`}
          className="rounded-2xl border border-slate-100 p-3"
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 break-words text-xs font-medium text-slate-800">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FinanceInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-400"
      />
    </label>
  );
}

function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                Finance detail
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-slate-950">
                {title}
              </h2>
              <p className="mt-1 break-all text-[10px] text-slate-400">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          {children}
        </div>
      </aside>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]"
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/40 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <h2 className="font-serif text-xl font-semibold text-slate-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
