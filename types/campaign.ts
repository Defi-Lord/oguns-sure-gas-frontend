export type CampaignType =
  | 'GIVEAWAY'
  | 'PROMOTION'
  | 'DISCOUNT';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'CANCELLED';

export type CampaignEntryStatus =
  | 'PENDING'
  | 'QUALIFIED'
  | 'WON'
  | 'LOST'
  | 'DISQUALIFIED';

export type CampaignRewardType =
  | 'GAS'
  | 'PRODUCT'
  | 'VOUCHER'
  | 'OTHER';

export type DiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT';

export type VoucherStatus =
  | 'ACTIVE'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface CampaignProductSummary {
  id: string;
  name: string;
  sku?: string;
  unit?: string;
  pricePerUnit?: number;
}

export interface CampaignUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface CampaignVoucherSummary {
  id: string;
  code: string;
  qrToken: string;
  status: VoucherStatus;
  rewardType: CampaignRewardType;
  rewardName: string;
  rewardQuantity: number | null;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
}

export interface CampaignEntry {
  id: string;
  userId: string;
  status: CampaignEntryStatus;
  taskCompletedAt: string | null;
  taskProofUrl: string | null;
  joinedAt: string;
  qualifiedAt: string | null;
  wonAt: string | null;
  winnerRank: number | null;
  user: CampaignUserSummary;
  voucher: CampaignVoucherSummary | null;
}

export interface Campaign {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  maxWinners: number | null;
  winnerCount: number;
  rewardType: CampaignRewardType | null;
  rewardName: string | null;
  rewardDescription: string | null;
  rewardProductId?: string | null;
  rewardQuantity: number | null;
  popupEnabled: boolean;
  popupTitle: string | null;
  popupMessage: string | null;
  popupImageUrl: string | null;
  popupCtaText: string | null;
  popupCtaUrl: string | null;
  targetProductId?: string | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  maxDiscountAmount: number | null;
  rewardProduct: CampaignProductSummary | null;
  targetProduct: CampaignProductSummary | null;
  entries: CampaignEntry[];
  vouchers: CampaignVoucherSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface VoucherRedemption {
  id: string;
  redeemedAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
  } | null;
  staffUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  metadata: Record<string, unknown> | null;
}

export interface Voucher {
  id: string;
  campaignId: string;
  campaignEntryId: string;
  code: string;
  qrToken: string;
  rewardType: CampaignRewardType;
  rewardName: string;
  rewardDescription: string | null;
  rewardQuantity: number | null;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaign: {
    id: string;
    name: string;
    code: string;
    type: CampaignType;
    status: CampaignStatus;
  } | null;
  winner: CampaignUserSummary | null;
  entry: {
    id: string;
    status: CampaignEntryStatus;
    winnerRank: number | null;
    wonAt: string | null;
  } | null;
  redemptions: VoucherRedemption[];
}

export interface CampaignListFilters {
  type?: CampaignType;
  status?: CampaignStatus;
  activeOnly?: boolean;
}

export interface VoucherListFilters {
  status?: VoucherStatus;
  campaignId?: string;
}

export interface CreateCampaignInput {
  name: string;
  code: string;
  description?: string;
  type: CampaignType;
  status?: CampaignStatus;
  startsAt?: string;
  endsAt?: string;
  maxWinners?: number;
  rewardType?: CampaignRewardType;
  rewardName?: string;
  rewardDescription?: string;
  rewardProductId?: string;
  rewardQuantity?: number;
  popupEnabled?: boolean;
  popupTitle?: string;
  popupMessage?: string;
  popupImageUrl?: string;
  popupCtaText?: string;
  popupCtaUrl?: string;
  targetProductId?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
}

export type UpdateCampaignInput =
  Partial<CreateCampaignInput>;

export interface QualifyCampaignEntryInput {
  qualified: boolean;
  taskProofUrl?: string;
}

export interface CampaignListResponse {
  success: true;
  message: string;
  data: {
    campaigns: Campaign[];
  };
}

export interface CampaignResponse {
  success: true;
  message: string;
  data: {
    campaign: Campaign;
  };
}

export interface VoucherListResponse {
  success: true;
  message: string;
  data: {
    vouchers: Voucher[];
  };
}

export interface VoucherResponse {
  success: true;
  message: string;
  data: {
    voucher: Voucher;
  };
}
