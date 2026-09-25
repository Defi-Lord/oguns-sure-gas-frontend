'use client';

import {
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
  ReactNode,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertTriangle,
  BadgePercent,
  CalendarClock,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Eye,
  Gift,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  TicketCheck,
  Trophy,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';

import {
  getApiErrorMessage,
} from '@/lib/api/client';

import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaigns,
  getVoucher,
  getVouchers,
  qualifyCampaignEntry,
  selectCampaignWinners,
  updateCampaign,
  updateCampaignStatus,
} from '@/lib/api/campaigns';

import {
  getManagementProducts,
} from '@/lib/api/products';

import type {
  Product,
} from '@/types/product';

import type {
  Campaign,
  CampaignEntry,
  CampaignRewardType,
  CampaignStatus,
  CampaignType,
  CreateCampaignInput,
  DiscountType,
  UpdateCampaignInput,
  VoucherStatus,
} from '@/types/campaign';

type WorkspaceTab =
  | 'campaigns'
  | 'vouchers';

type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;

interface CampaignFormState {
  name: string;
  code: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
  maxWinners: string;
  rewardType: CampaignRewardType;
  rewardName: string;
  rewardDescription: string;
  rewardProductId: string;
  rewardQuantity: string;
  popupEnabled: boolean;
  popupTitle: string;
  popupMessage: string;
  popupImageUrl: string;
  popupCtaText: string;
  popupCtaUrl: string;
  targetProductId: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
}

const EMPTY_FORM: CampaignFormState = {
  name: '',
  code: '',
  description: '',
  type: 'GIVEAWAY',
  status: 'DRAFT',
  startsAt: '',
  endsAt: '',
  maxWinners: '10',
  rewardType: 'GAS',
  rewardName: 'Free 3kg Gas',
  rewardDescription: '',
  rewardProductId: '',
  rewardQuantity: '3',
  popupEnabled: false,
  popupTitle: '',
  popupMessage: '',
  popupImageUrl: '',
  popupCtaText: '',
  popupCtaUrl: '',
  targetProductId: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxDiscountAmount: '',
};

const CAMPAIGN_TYPES: CampaignType[] = [
  'GIVEAWAY',
  'PROMOTION',
  'DISCOUNT',
];

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
  'CANCELLED',
];

const VOUCHER_STATUSES: VoucherStatus[] = [
  'ACTIVE',
  'REDEEMED',
  'EXPIRED',
  'CANCELLED',
];

const REWARD_TYPES: CampaignRewardType[] = [
  'GAS',
  'PRODUCT',
  'VOUCHER',
  'OTHER',
];

const STATUS_CLASS: Record<CampaignStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  SCHEDULED: 'border-sky-200 bg-sky-50 text-sky-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ENDED: 'border-violet-200 bg-violet-50 text-violet-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const VOUCHER_STATUS_CLASS: Record<VoucherStatus, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REDEEMED: 'border-sky-200 bg-sky-50 text-sky-700',
  EXPIRED: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const ENTRY_STATUS_CLASS: Record<CampaignEntry['status'], string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  QUALIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WON: 'border-violet-200 bg-violet-50 text-violet-700',
  LOST: 'border-slate-200 bg-slate-50 text-slate-700',
  DISQUALIFIED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const fieldClass =
  'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

const formatDate = (
  value: string | null | undefined,
): string => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const toLocalDateTimeValue = (
  value: string | null | undefined,
): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const toIsoOrUndefined = (
  value: string,
): string | undefined => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
};

const toPositiveNumber = (
  value: string,
): number | undefined => {
  if (!value.trim()) return undefined;

  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number
    : undefined;
};

const displayName = (
  firstName?: string,
  lastName?: string,
): string =>
  [firstName, lastName].filter(Boolean).join(' ') ||
  'Unknown user';

const productLabel = (
  product: Product,
): string =>
  `${product.name}${
    product.branch?.name
      ? ` · ${product.branch.name}`
      : ''
  }`;

function StatusBadge({
  status,
}: {
  status: CampaignStatus;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        STATUS_CLASS[status],
      ].join(' ')}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function VoucherStatusBadge({
  status,
}: {
  status: VoucherStatus;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        VOUCHER_STATUS_CLASS[status],
      ].join(' ')}
    >
      {status}
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

function NoticeBanner({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  if (!notice) return null;

  const success = notice.type === 'success';

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      ].join(' ')}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="flex-1">{notice.message}</div>
      <button type="button" aria-label="Dismiss" onClick={onClose}>
        <X className="size-4" />
      </button>
    </div>
  );
}

export function CampaignManagementPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] =
    useState<WorkspaceTab>('campaigns');

  const [notice, setNotice] =
    useState<Notice>(null);

  const [search, setSearch] =
    useState('');

  const [typeFilter, setTypeFilter] =
    useState<'ALL' | CampaignType>('ALL');

  const [statusFilter, setStatusFilter] =
    useState<'ALL' | CampaignStatus>('ALL');

  const [voucherSearch, setVoucherSearch] =
    useState('');

  const [voucherStatusFilter, setVoucherStatusFilter] =
    useState<'ALL' | VoucherStatus>('ALL');

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [editingCampaign, setEditingCampaign] =
    useState<Campaign | null>(null);

  const [form, setForm] =
    useState<CampaignFormState>(EMPTY_FORM);

  const [selectedCampaignId, setSelectedCampaignId] =
    useState<string | null>(null);

  const [selectedVoucherId, setSelectedVoucherId] =
    useState<string | null>(null);

  const [winnerCount, setWinnerCount] =
    useState('');

  const campaignsQuery = useQuery({
    queryKey: ['admin', 'campaigns'],
    queryFn: () => getCampaigns(),
  });

  const vouchersQuery = useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => getVouchers(),
  });

  const productsQuery = useQuery({
    queryKey: [
      'admin',
      'products',
      'management',
      'campaign-options',
    ],
    queryFn: () => getManagementProducts({}),
  });

  const campaignDetailQuery = useQuery({
    queryKey: [
      'admin',
      'campaign',
      selectedCampaignId,
    ],
    queryFn: () =>
      getCampaign(selectedCampaignId as string),
    enabled: Boolean(selectedCampaignId),
  });

  const voucherDetailQuery = useQuery({
    queryKey: [
      'admin',
      'voucher',
      selectedVoucherId,
    ],
    queryFn: () =>
      getVoucher(selectedVoucherId as string),
    enabled: Boolean(selectedVoucherId),
  });

  const campaigns = campaignsQuery.data ?? [];
  const vouchers = vouchersQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const campaignMetrics = useMemo(
    () => ({
      total: campaigns.length,
      active: campaigns.filter(
        (campaign) => campaign.status === 'ACTIVE',
      ).length,
      scheduled: campaigns.filter(
        (campaign) => campaign.status === 'SCHEDULED',
      ).length,
      winners: campaigns.reduce(
        (total, campaign) =>
          total + campaign.winnerCount,
        0,
      ),
    }),
    [campaigns],
  );

  const voucherMetrics = useMemo(
    () => ({
      total: vouchers.length,
      active: vouchers.filter(
        (voucher) => voucher.status === 'ACTIVE',
      ).length,
      redeemed: vouchers.filter(
        (voucher) => voucher.status === 'REDEEMED',
      ).length,
      expired: vouchers.filter(
        (voucher) => voucher.status === 'EXPIRED',
      ).length,
    }),
    [vouchers],
  );

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      if (
        typeFilter !== 'ALL' &&
        campaign.type !== typeFilter
      ) {
        return false;
      }

      if (
        statusFilter !== 'ALL' &&
        campaign.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        campaign.name,
        campaign.code,
        campaign.description ?? '',
        campaign.type,
        campaign.status,
        campaign.rewardName ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [
    campaigns,
    search,
    statusFilter,
    typeFilter,
  ]);

  const filteredVouchers = useMemo(() => {
    const query = voucherSearch
      .trim()
      .toLowerCase();

    return vouchers.filter((voucher) => {
      if (
        voucherStatusFilter !== 'ALL' &&
        voucher.status !== voucherStatusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        voucher.code,
        voucher.qrToken,
        voucher.rewardName,
        voucher.campaign?.name ?? '',
        voucher.campaign?.code ?? '',
        voucher.winner?.firstName ?? '',
        voucher.winner?.lastName ?? '',
        voucher.winner?.email ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [
    voucherSearch,
    voucherStatusFilter,
    vouchers,
  ]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['admin', 'campaigns'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['admin', 'vouchers'],
      }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const code = form.code.trim().toUpperCase();

      if (name.length < 2) {
        throw new Error(
          'Campaign name must contain at least 2 characters.',
        );
      }

      if (
        code.length < 2 ||
        !/^[A-Z0-9_-]+$/.test(code)
      ) {
        throw new Error(
          'Campaign code may contain only letters, numbers, underscores and hyphens.',
        );
      }

      const startsAt =
        toIsoOrUndefined(form.startsAt);
      const endsAt =
        toIsoOrUndefined(form.endsAt);

      if (
        startsAt &&
        endsAt &&
        new Date(endsAt) <= new Date(startsAt)
      ) {
        throw new Error(
          'End date/time must be later than start date/time.',
        );
      }

      const maxWinners =
        toPositiveNumber(form.maxWinners);
      const rewardQuantity =
        toPositiveNumber(form.rewardQuantity);
      const discountValue =
        toPositiveNumber(form.discountValue);
      const maxDiscountAmount =
        toPositiveNumber(form.maxDiscountAmount);

      if (
        form.type === 'GIVEAWAY' &&
        (!maxWinners || !form.rewardName.trim())
      ) {
        throw new Error(
          'Giveaways require a reward name and winner count.',
        );
      }

      if (
        form.type === 'GIVEAWAY' &&
        form.rewardType === 'PRODUCT' &&
        !form.rewardProductId
      ) {
        throw new Error(
          'Select the reward product for a product giveaway.',
        );
      }

      if (form.type === 'DISCOUNT') {
        if (!form.targetProductId || !discountValue) {
          throw new Error(
            'Discount campaigns require a target product and discount value.',
          );
        }

        if (
          form.discountType === 'PERCENTAGE' &&
          discountValue > 100
        ) {
          throw new Error(
            'Percentage discount cannot exceed 100.',
          );
        }
      }

      if (
        form.popupEnabled &&
        !form.popupTitle.trim() &&
        !form.popupMessage.trim()
      ) {
        throw new Error(
          'An enabled popup requires a title or message.',
        );
      }

      const input: CreateCampaignInput = {
        name,
        code,
        type: form.type,
        ...(editingCampaign
          ? {}
          : { status: form.status }),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {}),
        popupEnabled: form.popupEnabled,
        ...(form.popupTitle.trim()
          ? { popupTitle: form.popupTitle.trim() }
          : {}),
        ...(form.popupMessage.trim()
          ? { popupMessage: form.popupMessage.trim() }
          : {}),
        ...(form.popupImageUrl.trim()
          ? { popupImageUrl: form.popupImageUrl.trim() }
          : {}),
        ...(form.popupCtaText.trim()
          ? { popupCtaText: form.popupCtaText.trim() }
          : {}),
        ...(form.popupCtaUrl.trim()
          ? { popupCtaUrl: form.popupCtaUrl.trim() }
          : {}),
      };

      if (form.type === 'GIVEAWAY') {
        input.maxWinners = maxWinners as number;
        input.rewardType = form.rewardType;
        input.rewardName = form.rewardName.trim();

        if (form.rewardDescription.trim()) {
          input.rewardDescription =
            form.rewardDescription.trim();
        }

        if (form.rewardProductId) {
          input.rewardProductId =
            form.rewardProductId;
        }

        if (rewardQuantity) {
          input.rewardQuantity = rewardQuantity;
        }
      }

      if (
        form.type === 'PROMOTION' &&
        form.targetProductId
      ) {
        input.targetProductId =
          form.targetProductId;
      }

      if (form.type === 'DISCOUNT') {
        input.targetProductId =
          form.targetProductId;
        input.discountType =
          form.discountType;
        input.discountValue = discountValue as number;

        if (maxDiscountAmount) {
          input.maxDiscountAmount =
            maxDiscountAmount;
        }
      }

      if (editingCampaign) {
        return updateCampaign(
          editingCampaign.id,
          input as UpdateCampaignInput,
        );
      }

      return createCampaign(input);
    },

    onSuccess: async (saved) => {
      await refreshAll();

      setNotice({
        type: 'success',
        message: editingCampaign
          ? 'Campaign updated successfully.'
          : 'Campaign created successfully.',
      });

      setEditorOpen(false);
      setEditingCampaign(null);
      setForm(EMPTY_FORM);
      setSelectedCampaignId(saved.id);
    },

    onError: (error) => {
      setNotice({
        type: 'error',
        message: getApiErrorMessage(error),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      campaignId,
      status,
    }: {
      campaignId: string;
      status: CampaignStatus;
    }) =>
      updateCampaignStatus(campaignId, status),

    onSuccess: async () => {
      await refreshAll();
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'campaign',
          selectedCampaignId,
        ],
      });

      setNotice({
        type: 'success',
        message: 'Campaign status updated.',
      });
    },

    onError: (error) =>
      setNotice({
        type: 'error',
        message: getApiErrorMessage(error),
      }),
  });

  const qualificationMutation = useMutation({
    mutationFn: ({
      campaignId,
      entryId,
      qualified,
    }: {
      campaignId: string;
      entryId: string;
      qualified: boolean;
    }) =>
      qualifyCampaignEntry(
        campaignId,
        entryId,
        { qualified },
      ),

    onSuccess: async () => {
      await refreshAll();
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'campaign',
          selectedCampaignId,
        ],
      });

      setNotice({
        type: 'success',
        message: 'Entry qualification updated.',
      });
    },

    onError: (error) =>
      setNotice({
        type: 'error',
        message: getApiErrorMessage(error),
      }),
  });

  const winnerMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const count = winnerCount.trim()
        ? Number(winnerCount)
        : undefined;

      if (
        count !== undefined &&
        (!Number.isInteger(count) || count <= 0)
      ) {
        throw new Error(
          'Winner count must be a positive whole number.',
        );
      }

      return selectCampaignWinners(
        campaignId,
        count,
      );
    },

    onSuccess: async () => {
      setWinnerCount('');
      await refreshAll();
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'campaign',
          selectedCampaignId,
        ],
      });

      setNotice({
        type: 'success',
        message:
          'Winners selected and vouchers generated successfully.',
      });
    },

    onError: (error) =>
      setNotice({
        type: 'error',
        message: getApiErrorMessage(error),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,

    onSuccess: async () => {
      setSelectedCampaignId(null);
      await refreshAll();

      setNotice({
        type: 'success',
        message: 'Campaign deleted successfully.',
      });
    },

    onError: (error) =>
      setNotice({
        type: 'error',
        message: getApiErrorMessage(error),
      }),
  });

  const openCreate = () => {
    setEditingCampaign(null);
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      code: campaign.code,
      description: campaign.description ?? '',
      type: campaign.type,
      status: campaign.status,
      startsAt: toLocalDateTimeValue(
        campaign.startsAt,
      ),
      endsAt: toLocalDateTimeValue(
        campaign.endsAt,
      ),
      maxWinners: campaign.maxWinners
        ? String(campaign.maxWinners)
        : '',
      rewardType: campaign.rewardType ?? 'GAS',
      rewardName: campaign.rewardName ?? '',
      rewardDescription:
        campaign.rewardDescription ?? '',
      rewardProductId:
        campaign.rewardProductId ??
        campaign.rewardProduct?.id ??
        '',
      rewardQuantity:
        campaign.rewardQuantity
          ? String(campaign.rewardQuantity)
          : '',
      popupEnabled: campaign.popupEnabled,
      popupTitle: campaign.popupTitle ?? '',
      popupMessage: campaign.popupMessage ?? '',
      popupImageUrl:
        campaign.popupImageUrl ?? '',
      popupCtaText: campaign.popupCtaText ?? '',
      popupCtaUrl: campaign.popupCtaUrl ?? '',
      targetProductId:
        campaign.targetProductId ??
        campaign.targetProduct?.id ??
        '',
      discountType:
        campaign.discountType ?? 'PERCENTAGE',
      discountValue:
        campaign.discountValue
          ? String(campaign.discountValue)
          : '',
      maxDiscountAmount:
        campaign.maxDiscountAmount
          ? String(campaign.maxDiscountAmount)
          : '',
    });
    setEditorOpen(true);
  };

  const applyThursdayPreset = () => {
    setForm((current) => ({
      ...current,
      type: 'GIVEAWAY',
      maxWinners: '10',
      rewardType: 'GAS',
      rewardName: 'Free 3kg Gas',
      rewardDescription:
        'Thursday TikTok giveaway reward.',
      rewardQuantity: '3',
      popupEnabled: true,
      popupTitle:
        current.popupTitle ||
        'Thursday Giveaway',
      popupMessage:
        current.popupMessage ||
        'Complete the TikTok tasks and submit your proof for a chance to win free 3kg gas.',
      popupCtaText:
        current.popupCtaText ||
        'Join Giveaway',
    }));
  };

  const copyText = async (
    value: string,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({
        type: 'success',
        message: `${label} copied to clipboard.`,
      });
    } catch {
      setNotice({
        type: 'error',
        message:
          `Could not copy ${label.toLowerCase()} automatically.`,
      });
    }
  };

  if (
    campaignsQuery.isLoading ||
    vouchersQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="size-5 animate-spin text-emerald-600" />
          Loading campaigns and vouchers…
        </div>
      </div>
    );
  }

  const workspaceError =
    campaignsQuery.error ||
    vouchersQuery.error ||
    productsQuery.error;

  const selectedCampaign =
    campaignDetailQuery.data ??
    campaigns.find(
      (campaign) =>
        campaign.id === selectedCampaignId,
    ) ??
    null;

  const selectedVoucher =
    voucherDetailQuery.data ??
    vouchers.find(
      (voucher) =>
        voucher.id === selectedVoucherId,
    ) ??
    null;

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <Sparkles className="size-4" />
                Growth command center
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Campaigns, giveaways & vouchers
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Create scheduled promotions, run the Thursday TikTok giveaway,
                review customer proof, select winners and monitor every issued
                reward voucher from one Super Admin workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  campaignsQuery.isFetching ||
                  vouchersQuery.isFetching
                }
                onClick={() => void refreshAll()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
              >
                <RefreshCw
                  className={[
                    'size-4',
                    campaignsQuery.isFetching ||
                    vouchersQuery.isFetching
                      ? 'animate-spin'
                      : '',
                  ].join(' ')}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <Plus className="size-4" />
                Create campaign
              </button>
            </div>
          </div>
        </section>

        <NoticeBanner
          notice={notice}
          onClose={() => setNotice(null)}
        />

        {workspaceError && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{getApiErrorMessage(workspaceError)}</p>
          </div>
        )}

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('campaigns')}
            className={[
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
              tab === 'campaigns'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            <Gift className="size-4" />
            Campaigns
          </button>

          <button
            type="button"
            onClick={() => setTab('vouchers')}
            className={[
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
              tab === 'vouchers'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            <TicketCheck className="size-4" />
            Vouchers
          </button>
        </div>

        {tab === 'campaigns' ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total campaigns"
                value={campaignMetrics.total}
                description="All giveaway, promotion and discount campaigns."
                icon={<Gift className="size-5" />}
              />

              <MetricCard
                title="Active"
                value={campaignMetrics.active}
                description="Campaigns currently effective for customers."
                icon={<CheckCircle2 className="size-5" />}
              />

              <MetricCard
                title="Scheduled"
                value={campaignMetrics.scheduled}
                description="Campaigns waiting for their configured start time."
                icon={<CalendarClock className="size-5" />}
              />

              <MetricCard
                title="Winners"
                value={campaignMetrics.winners}
                description="Total winners recorded across campaign history."
                icon={<Trophy className="size-5" />}
              />
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 md:p-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search campaign name, code, reward or description…"
                      className={`${fieldClass} pl-11`}
                    />
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value as
                          | 'ALL'
                          | CampaignType,
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="ALL">
                      All campaign types
                    </option>
                    {CAMPAIGN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | 'ALL'
                          | CampaignStatus,
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="ALL">
                      All statuses
                    </option>
                    {CAMPAIGN_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                    <Gift className="size-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    No campaigns found
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Adjust the filters or create the first campaign for this workspace.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredCampaigns.map((campaign) => (
                    <article
                      key={campaign.id}
                      className="p-5 transition hover:bg-slate-50/80 md:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-950">
                              {campaign.name}
                            </h3>
                            <StatusBadge status={campaign.status} />
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {campaign.type}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {campaign.description ||
                              'No description provided.'}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Tag className="size-3.5" />
                              {campaign.code}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="size-3.5" />
                              {formatDate(campaign.startsAt)}
                              {' → '}
                              {formatDate(campaign.endsAt)}
                            </span>

                            {campaign.type === 'GIVEAWAY' && (
                              <span className="inline-flex items-center gap-1.5">
                                <UsersRound className="size-3.5" />
                                {campaign.entries.length}
                                {' entries · '}
                                {campaign.winnerCount}
                                {' winners'}
                              </span>
                            )}

                            {campaign.rewardName && (
                              <span className="inline-flex items-center gap-1.5">
                                <Trophy className="size-3.5" />
                                {campaign.rewardName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCampaignId(campaign.id)
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="size-4" />
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(campaign)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Pencil className="size-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total vouchers"
                value={voucherMetrics.total}
                description="All generated campaign reward vouchers."
                icon={<TicketCheck className="size-5" />}
              />

              <MetricCard
                title="Active"
                value={voucherMetrics.active}
                description="Issued vouchers still available for redemption."
                icon={<QrCode className="size-5" />}
              />

              <MetricCard
                title="Redeemed"
                value={voucherMetrics.redeemed}
                description="Rewards already processed at a branch."
                icon={<CheckCircle2 className="size-5" />}
              />

              <MetricCard
                title="Expired"
                value={voucherMetrics.expired}
                description="Vouchers no longer eligible for redemption."
                icon={<Clock3 className="size-5" />}
              />
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 md:p-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={voucherSearch}
                      onChange={(event) =>
                        setVoucherSearch(event.target.value)
                      }
                      placeholder="Search voucher code, QR token, winner or campaign…"
                      className={`${fieldClass} pl-11`}
                    />
                  </label>

                  <select
                    value={voucherStatusFilter}
                    onChange={(event) =>
                      setVoucherStatusFilter(
                        event.target.value as
                          | 'ALL'
                          | VoucherStatus,
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="ALL">
                      All voucher statuses
                    </option>
                    {VOUCHER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                    <TicketCheck className="size-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    No vouchers found
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Generated giveaway rewards will appear here after winner selection.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredVouchers.map((voucher) => (
                    <article
                      key={voucher.id}
                      className="p-5 transition hover:bg-slate-50/80 md:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-mono text-base font-semibold text-slate-950">
                              {voucher.code}
                            </h3>
                            <VoucherStatusBadge
                              status={voucher.status}
                            />
                          </div>

                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {voucher.rewardName}
                            {voucher.rewardQuantity
                              ? ` · ${voucher.rewardQuantity}`
                              : ''}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span>
                              Campaign:{' '}
                              {voucher.campaign?.name ?? '—'}
                            </span>
                            <span>
                              Winner:{' '}
                              {voucher.winner
                                ? displayName(
                                    voucher.winner.firstName,
                                    voucher.winner.lastName,
                                  )
                                : '—'}
                            </span>
                            <span>
                              Issued: {formatDate(voucher.issuedAt)}
                            </span>
                            <span>
                              Redeemed: {formatDate(voucher.redeemedAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedVoucherId(voucher.id)
                          }
                          className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 xl:self-auto"
                        >
                          <Eye className="size-4" />
                          Voucher details
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Campaign configuration
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingCampaign
                    ? 'Edit campaign'
                    : 'Create campaign'}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close editor"
                onClick={() => setEditorOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-7 p-6"
            >
              {!editingCampaign && (
                <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      Thursday TikTok giveaway preset
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      Loads the normal 10-winner, free 3kg gas configuration.
                      You still choose the actual start and end date/time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={applyThursdayPreset}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white"
                  >
                    <Sparkles className="size-4" />
                    Use preset
                  </button>
                </div>
              )}

              <section className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Campaign identity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Name, unique code and campaign type.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Name
                    </span>
                    <input
                      required
                      minLength={2}
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Code
                    </span>
                    <input
                      required
                      minLength={2}
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="THURSDAY_3KG"
                      className={fieldClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Type
                    </span>
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value as CampaignType,
                        }))
                      }
                      className={fieldClass}
                    >
                      {CAMPAIGN_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!editingCampaign && (
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Initial status
                      </span>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status: event.target.value as CampaignStatus,
                          }))
                        }
                        className={fieldClass}
                      >
                        {CAMPAIGN_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Schedule
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Scheduling is date/time based. Thursday is configured here, not hardcoded.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Starts at
                    </span>
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startsAt: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Ends at
                    </span>
                    <input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endsAt: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
              </section>

              {form.type === 'GIVEAWAY' && (
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Giveaway reward
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Configure winner count and the reward issued as a voucher.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Maximum winners
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={form.maxWinners}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            maxWinners: event.target.value,
                          }))
                        }
                        className={fieldClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Reward type
                      </span>
                      <select
                        value={form.rewardType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            rewardType:
                              event.target.value as CampaignRewardType,
                          }))
                        }
                        className={fieldClass}
                      >
                        {REWARD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Reward quantity
                      </span>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={form.rewardQuantity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            rewardQuantity: event.target.value,
                          }))
                        }
                        placeholder="3"
                        className={fieldClass}
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Reward name
                      </span>
                      <input
                        value={form.rewardName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            rewardName: event.target.value,
                          }))
                        }
                        placeholder="Free 3kg Gas"
                        className={fieldClass}
                      />
                    </label>

                    {form.rewardType === 'PRODUCT' && (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Reward product
                        </span>
                        <select
                          value={form.rewardProductId}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              rewardProductId: event.target.value,
                            }))
                          }
                          className={fieldClass}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {productLabel(product)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Reward description
                    </span>
                    <textarea
                      value={form.rewardDescription}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rewardDescription: event.target.value,
                        }))
                      }
                      className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </section>
              )}

              {(form.type === 'PROMOTION' ||
                form.type === 'DISCOUNT') && (
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Product targeting
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Discounts require a target product. Promotions may optionally target one.
                    </p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Target product
                    </span>
                    <select
                      value={form.targetProductId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          targetProductId: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="">
                        {form.type === 'DISCOUNT'
                          ? 'Select required product'
                          : 'No specific product'}
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {productLabel(product)}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              )}

              {form.type === 'DISCOUNT' && (
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Discount
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Discount type
                      </span>
                      <select
                        value={form.discountType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            discountType:
                              event.target.value as DiscountType,
                          }))
                        }
                        className={fieldClass}
                      >
                        <option value="PERCENTAGE">
                          Percentage
                        </option>
                        <option value="FIXED_AMOUNT">
                          Fixed amount
                        </option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Discount value
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.discountValue}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            discountValue: event.target.value,
                          }))
                        }
                        className={fieldClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Max discount amount
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.maxDiscountAmount}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            maxDiscountAmount: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </section>
              )}

              <section className="space-y-4 border-t border-slate-100 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Customer popup / banner
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Configure the customer-facing campaign promotion.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.popupEnabled}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          popupEnabled: event.target.checked,
                        }))
                      }
                      className="size-4 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Popup enabled
                    </span>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Popup title
                    </span>
                    <input
                      value={form.popupTitle}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          popupTitle: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Popup image URL
                    </span>
                    <input
                      type="url"
                      value={form.popupImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          popupImageUrl: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Popup message
                  </span>
                  <textarea
                    value={form.popupMessage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        popupMessage: event.target.value,
                      }))
                    }
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      CTA text
                    </span>
                    <input
                      value={form.popupCtaText}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          popupCtaText: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      CTA URL
                    </span>
                    <input
                      value={form.popupCtaUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          popupCtaUrl: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>

                {form.popupImageUrl && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">
                      <ImageIcon className="size-4" />
                      Banner preview
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.popupImageUrl}
                      alt="Campaign popup preview"
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                )}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : editingCampaign ? (
                    <Check className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {editingCampaign
                    ? 'Save changes'
                    : 'Create campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCampaignId && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close campaign details"
            className="absolute inset-0"
            onClick={() => setSelectedCampaignId(null)}
          />

          <aside className="relative z-10 h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            {campaignDetailQuery.isLoading &&
            !selectedCampaign ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-7 animate-spin text-emerald-600" />
              </div>
            ) : selectedCampaign ? (
              <>
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Campaign record
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {selectedCampaign.name}
                      </h2>
                      <StatusBadge
                        status={selectedCampaign.status}
                      />
                    </div>
                    <p className="mt-2 font-mono text-xs text-slate-500">
                      {selectedCampaign.code}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close campaign details"
                    onClick={() => setSelectedCampaignId(null)}
                    className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <X className="size-4" />
                  </button>
                </header>

                <div className="space-y-6 p-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(selectedCampaign)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700"
                    >
                      <Pencil className="size-4" />
                      Edit campaign
                    </button>

                    <select
                      value={selectedCampaign.status}
                      disabled={statusMutation.isPending}
                      onChange={(event) =>
                        statusMutation.mutate({
                          campaignId: selectedCampaign.id,
                          status:
                            event.target.value as CampaignStatus,
                        })
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                    >
                      {CAMPAIGN_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          Set {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Type
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedCampaign.type}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Schedule
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDate(selectedCampaign.startsAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        to {formatDate(selectedCampaign.endsAt)}
                      </p>
                    </div>
                  </div>

                  {selectedCampaign.description && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Description
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {selectedCampaign.description}
                      </p>
                    </div>
                  )}

                  {selectedCampaign.type === 'GIVEAWAY' && (
                    <section className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                            Reward
                          </p>
                          <p className="mt-2 font-semibold text-violet-950">
                            {selectedCampaign.rewardName ?? '—'}
                          </p>
                          <p className="mt-1 text-xs text-violet-700">
                            {selectedCampaign.rewardQuantity ?? '—'} ·{' '}
                            {selectedCampaign.rewardType ?? '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            Entrants
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-emerald-950">
                            {selectedCampaign.entries.length}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                            Winners
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-amber-950">
                            {selectedCampaign.winnerCount} /{' '}
                            {selectedCampaign.maxWinners ?? '—'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-950">
                              Winner selection
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Leave count blank to use the configured winner limit.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={winnerCount}
                              onChange={(event) =>
                                setWinnerCount(event.target.value)
                              }
                              placeholder={
                                selectedCampaign.maxWinners
                                  ? String(
                                      selectedCampaign.maxWinners,
                                    )
                                  : 'Count'
                              }
                              className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
                            />

                            <button
                              type="button"
                              disabled={winnerMutation.isPending}
                              onClick={() => {
                                const confirmed =
                                  window.confirm(
                                    `Select winners for ${selectedCampaign.name}? This can generate reward vouchers.`,
                                  );

                                if (confirmed) {
                                  winnerMutation.mutate(
                                    selectedCampaign.id,
                                  );
                                }
                              }}
                              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {winnerMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trophy className="size-4" />
                              )}
                              Select winners
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-3xl border border-slate-200">
                        <div className="border-b border-slate-100 px-5 py-4">
                          <h3 className="font-semibold text-slate-950">
                            Entrants & task proof
                          </h3>
                        </div>

                        {selectedCampaign.entries.length === 0 ? (
                          <div className="p-8 text-center text-sm text-slate-500">
                            No customer entries yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {selectedCampaign.entries.map((entry) => (
                              <div key={entry.id} className="p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-950">
                                        {displayName(
                                          entry.user.firstName,
                                          entry.user.lastName,
                                        )}
                                      </p>
                                      <span
                                        className={[
                                          'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                          ENTRY_STATUS_CLASS[
                                            entry.status
                                          ],
                                        ].join(' ')}
                                      >
                                        {entry.status}
                                      </span>

                                      {entry.winnerRank && (
                                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                          Winner #{entry.winnerRank}
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {entry.user.email} · joined{' '}
                                      {formatDate(entry.joinedAt)}
                                    </p>

                                    {entry.taskProofUrl ? (
                                      <a
                                        href={entry.taskProofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex text-xs font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4"
                                      >
                                        Open submitted proof
                                      </a>
                                    ) : (
                                      <p className="mt-2 text-xs text-slate-400">
                                        No proof URL submitted.
                                      </p>
                                    )}

                                    {entry.voucher && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedVoucherId(
                                            entry.voucher?.id ?? null,
                                          )
                                        }
                                        className="mt-2 block font-mono text-xs font-semibold text-violet-700"
                                      >
                                        Voucher: {entry.voucher.code}
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={
                                        qualificationMutation.isPending
                                      }
                                      onClick={() =>
                                        qualificationMutation.mutate({
                                          campaignId:
                                            selectedCampaign.id,
                                          entryId: entry.id,
                                          qualified: true,
                                        })
                                      }
                                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                                    >
                                      <Check className="size-3.5" />
                                      Qualify
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        qualificationMutation.isPending
                                      }
                                      onClick={() =>
                                        qualificationMutation.mutate({
                                          campaignId:
                                            selectedCampaign.id,
                                          entryId: entry.id,
                                          qualified: false,
                                        })
                                      }
                                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 disabled:opacity-60"
                                    >
                                      <XCircle className="size-3.5" />
                                      Disqualify
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedCampaign.type === 'DISCOUNT' && (
                    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                      <div className="flex items-center gap-2 text-sky-800">
                        <BadgePercent className="size-5" />
                        <h3 className="font-semibold">
                          Discount configuration
                        </h3>
                      </div>

                      <p className="mt-3 text-sm text-sky-900">
                        {selectedCampaign.discountType === 'PERCENTAGE'
                          ? `${selectedCampaign.discountValue ?? '—'}%`
                          : `₦${selectedCampaign.discountValue ?? '—'}`}
                        {' · Target: '}
                        {selectedCampaign.targetProduct?.name ??
                          selectedCampaign.targetProductId ??
                          '—'}
                      </p>

                      {selectedCampaign.maxDiscountAmount && (
                        <p className="mt-1 text-xs text-sky-700">
                          Maximum discount amount: ₦
                          {selectedCampaign.maxDiscountAmount}
                        </p>
                      )}
                    </div>
                  )}

                  <section className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="size-5 text-emerald-700" />
                      <h3 className="font-semibold text-slate-950">
                        Customer popup
                      </h3>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {selectedCampaign.popupEnabled
                        ? 'Enabled'
                        : 'Disabled'}
                      {' · '}
                      {selectedCampaign.popupTitle ?? 'No title'}
                    </p>

                    {selectedCampaign.popupMessage && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedCampaign.popupMessage}
                      </p>
                    )}

                    {selectedCampaign.popupImageUrl && (
                      <a
                        href={selectedCampaign.popupImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs font-semibold text-sky-700 underline"
                      >
                        Open popup image
                      </a>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          Generated vouchers
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Reward vouchers attached to this campaign.
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {selectedCampaign.vouchers?.length ?? 0}
                      </span>
                    </div>

                    {(selectedCampaign.vouchers?.length ?? 0) === 0 ? (
                      <p className="mt-4 text-sm text-slate-400">
                        No generated vouchers yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {selectedCampaign.vouchers.map((voucher) => (
                          <button
                            key={voucher.id}
                            type="button"
                            onClick={() =>
                              setSelectedVoucherId(voucher.id)
                            }
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50"
                          >
                            <div>
                              <p className="font-mono text-sm font-semibold text-slate-900">
                                {voucher.code}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {voucher.rewardName}
                              </p>
                            </div>
                            <VoucherStatusBadge
                              status={voucher.status}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                    <h3 className="font-semibold text-rose-950">
                      Delete campaign
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-700">
                      Backend rules decide whether this campaign can be deleted.
                      Campaigns with protected voucher redemption history will be rejected.
                    </p>

                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete ${selectedCampaign.name}? This action cannot be undone.`,
                        );

                        if (confirmed) {
                          deleteMutation.mutate(selectedCampaign.id);
                        }
                      }}
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      Delete campaign
                    </button>
                  </section>
                </div>
              </>
            ) : (
              <div className="p-8 text-sm text-rose-700">
                Unable to load campaign details.
              </div>
            )}
          </aside>
        </div>
      )}

      {selectedVoucherId && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close voucher details"
            className="absolute inset-0"
            onClick={() => setSelectedVoucherId(null)}
          />

          <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            {voucherDetailQuery.isLoading &&
            !selectedVoucher ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-7 animate-spin text-emerald-600" />
              </div>
            ) : selectedVoucher ? (
              <>
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                      Voucher record
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-2xl font-semibold tracking-tight text-slate-950">
                        {selectedVoucher.code}
                      </h2>
                      <VoucherStatusBadge
                        status={selectedVoucher.status}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close voucher details"
                    onClick={() => setSelectedVoucherId(null)}
                    className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <X className="size-4" />
                  </button>
                </header>

                <div className="space-y-6 p-6">
                  <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                    <div className="flex items-start gap-3">
                      <QrCode className="mt-0.5 size-6 shrink-0 text-violet-700" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                          QR token payload
                        </p>
                        <p className="mt-2 break-all font-mono text-sm font-semibold text-violet-950">
                          {selectedVoucher.qrToken}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            void copyText(
                              selectedVoucher.qrToken,
                              'QR token',
                            )
                          }
                          className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-violet-700 px-3 text-xs font-semibold text-white"
                        >
                          <Clipboard className="size-3.5" />
                          Copy QR token
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Reward
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedVoucher.rewardName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedVoucher.rewardType}
                        {selectedVoucher.rewardQuantity
                          ? ` · ${selectedVoucher.rewardQuantity}`
                          : ''}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Winner
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedVoucher.winner
                          ? displayName(
                              selectedVoucher.winner.firstName,
                              selectedVoucher.winner.lastName,
                            )
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedVoucher.winner?.email ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-950">
                      Voucher timeline
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Issued</dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(selectedVoucher.issuedAt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Expires</dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(selectedVoucher.expiresAt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Redeemed</dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(selectedVoucher.redeemedAt)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-950">
                      Redemption visibility
                    </h3>

                    {selectedVoucher.redemptions.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        This voucher has not been redeemed.
                      </p>
                    ) : (
                      selectedVoucher.redemptions.map(
                        (redemption) => (
                          <div
                            key={redemption.id}
                            className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                          >
                            <p className="font-semibold text-emerald-950">
                              Redeemed{' '}
                              {formatDate(redemption.redeemedAt)}
                            </p>
                            <p className="mt-2 text-sm text-emerald-800">
                              Branch:{' '}
                              {redemption.branch
                                ? `${redemption.branch.name} · ${redemption.branch.code}`
                                : '—'}
                            </p>
                            <p className="mt-1 text-sm text-emerald-800">
                              Processed by:{' '}
                              {redemption.staffUser
                                ? displayName(
                                    redemption.staffUser.firstName,
                                    redemption.staffUser.lastName,
                                  )
                                : '—'}
                            </p>
                          </div>
                        ),
                      )
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Campaign
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {selectedVoucher.campaign?.name ?? '—'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {selectedVoucher.campaign?.code ?? '—'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-sm text-rose-700">
                Unable to load voucher details.
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
