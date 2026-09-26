export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'CARD'
  | 'ONLINE';

export type PaymentType =
  | 'ORDER'
  | 'TIP';

export interface PaymentParty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface PaymentBranch {
  id: string;
  name: string;
  code: string;
}

export interface PaymentCampaign {
  id: string;
  name: string;
  code: string;
  type: string;
  discountType: string | null;
  discountValue: number | null;
}

export interface PaymentOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  platformFeeRate: number;
  platformFee: number;
  deliveryFee: number;
  crossBranchFee: number;
  totalAmount: number;
  appliedCampaignId: string | null;
  appliedCampaign: PaymentCampaign | null;
  customer: PaymentParty;
  fulfillmentBranch: PaymentBranch;
}

export interface PaymentCheckoutSession {
  id: string;
  customerId: string;
  fulfillmentBranchId: string;
  deliveryAddressId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  platformFeeRate: number;
  platformFee: number;
  deliveryFee: number;
  crossBranchFee: number;
  totalAmount: number;
  appliedCampaignId: string | null;
  appliedCampaign: PaymentCampaign | null;
  paymentMethod: string | null;
  notes: string | null;
  expiresAt: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRiderTip {
  id: string;
  deliveryId: string;
  customerId: string;
  riderId: string;
  amount: number;
  status: string;
  comment: string | null;
  paidAt: string | null;
}

export interface FinancePayment {
  id: string;
  orderId: string | null;
  reference: string;
  amount: number;
  method: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  paidAt: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
  order: PaymentOrder | null;
  checkoutSession: PaymentCheckoutSession | null;
  riderTip: PaymentRiderTip | null;
}

export interface PaymentListFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  orderId?: string;
}

export interface PaymentsResponse {
  success: true;
  message: string;
  data: {
    payments: FinancePayment[];
  };
}

export type PayoutOwnerType =
  | 'BRANCH'
  | 'RIDER';

export type PayoutRecipientStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'DISABLED';

export type SettlementSourceType =
  | 'ORDER_BRANCH'
  | 'RIDER_DELIVERY'
  | 'RIDER_TIP';

export type SettlementStatus =
  | 'BLOCKED'
  | 'ELIGIBLE'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

export type SettlementBlockReason =
  | 'PAYOUT_POLICY_MISSING'
  | 'RECIPIENT_MISSING'
  | 'RECIPIENT_UNVERIFIED'
  | 'PAYMENT_NOT_PAID'
  | 'DELIVERY_NOT_DELIVERED'
  | 'BENEFICIARY_MISSING'
  | 'PAYABLE_AMOUNT_UNRESOLVED';

export interface FinancePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PayoutRecipientBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface PayoutRecipientRider {
  id: string;
  branchId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
}

export interface PayoutRecipient {
  id: string;
  ownerType: PayoutOwnerType;
  branchId: string | null;
  riderId: string | null;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: PayoutRecipientStatus;
  provider: string | null;
  providerRecipientConfigured: boolean;
  verifiedAt: string | null;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: PayoutRecipientBranch | null;
  rider: PayoutRecipientRider | null;
}

export interface PayoutRecipientListFilters {
  ownerType?: PayoutOwnerType;
  status?: PayoutRecipientStatus;
  branchId?: string;
  riderId?: string;
  page: number;
  limit: number;
}

export interface PayoutRecipientsResponse {
  success: true;
  data: {
    recipients: PayoutRecipient[];
    pagination: FinancePagination;
  };
}

export interface PayoutRecipientResponse {
  success: true;
  message?: string;
  data: {
    recipient: PayoutRecipient;
  };
}

export interface PayoutRecipientVerificationResponse {
  success: true;
  message?: string;
  data: {
    recipient: PayoutRecipient;
    providerVerified: boolean;
    settlementsReevaluated: number;
  };
}

export interface PayoutRecipientInput {
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface SettlementOrder {
  id: string;
  orderNumber: string;
  status: string;
  platformFeeRate: number;
  platformFee: number;
  totalAmount: number;
}

export interface SettlementDelivery {
  id: string;
  status: string;
  deliveredTime: string | null;
}

export interface SettlementPayment {
  id: string;
  reference: string;
  paymentType: PaymentType;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface SettlementRiderTip {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

export interface Settlement {
  id: string;
  key: string;
  sourceType: SettlementSourceType;
  status: SettlementStatus;
  blockReason: SettlementBlockReason | null;
  currency: string;
  grossAmount: number | null;
  payableAmount: number | null;
  policyVersion: string | null;
  paymentId: string | null;
  orderId: string | null;
  deliveryId: string | null;
  riderTipId: string | null;
  branchId: string | null;
  riderId: string | null;
  payoutRecipientId: string | null;
  eligibleAt: string | null;
  provider: string | null;
  providerStatus: string | null;
  attempts: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: PayoutRecipientBranch | null;
  rider: PayoutRecipientRider | null;
  order: SettlementOrder | null;
  delivery: SettlementDelivery | null;
  payment: SettlementPayment | null;
  riderTip: SettlementRiderTip | null;
  payoutRecipient: PayoutRecipient | null;
}

export interface SettlementListFilters {
  sourceType?: SettlementSourceType;
  status?: SettlementStatus;
  blockReason?: SettlementBlockReason;
  branchId?: string;
  riderId?: string;
  page: number;
  limit: number;
}

export interface SettlementsResponse {
  success: true;
  data: {
    settlements: Settlement[];
    pagination: FinancePagination;
  };
}

export interface SettlementResponse {
  success: true;
  message?: string;
  data: {
    settlement: Settlement;
  };
}

export interface TransferActionResult {
  settlementId: string;
  status: SettlementStatus;
  provider: string | null;
  providerTransferRef: string | null;
  providerStatus: string | null;
  providerResolution?:
    | 'SUCCESS'
    | 'FAILED'
    | 'OTP_REQUIRED'
    | 'PROCESSING'
    | 'UNKNOWN';
  otpRequired?: boolean;
  reconciliationRequired: boolean;
  message?: string;
  paidAt?: string | null;
}

export interface TransferActionResponse {
  success: true;
  data: {
    transfer: TransferActionResult;
  };
}

export type PayoutCalculationMode =
  | 'FIXED_AMOUNT'
  | 'PERCENTAGE_OF_ORDER_PAYMENT';

export interface PayoutPolicyRule {
  mode: PayoutCalculationMode;
  value: string;
}

export interface PayoutPolicy {
  id: string;
  version: string;
  schemaVersion: 1;
  currency: 'NGN';
  description: string | null;
  branchRule: PayoutPolicyRule | null;
  riderDeliveryRule: PayoutPolicyRule | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedById: string | null;
}

export interface CreatePayoutPolicyInput {
  description?: string;
  branchRule?: PayoutPolicyRule | null;
  riderDeliveryRule?: PayoutPolicyRule | null;
}

export interface PayoutPolicyListResponse {
  success: true;
  data: {
    policies: PayoutPolicy[];
  };
}

export interface PayoutPolicyResponse {
  success: true;
  message?: string;
  data: {
    policy: PayoutPolicy | null;
  };
}

export interface FinanceRider {
  id: string;
  branchId: string | null;
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

export interface FinanceRidersResponse {
  success: true;
  message: string;
  data: {
    riders: FinanceRider[];
  };
}

export type SettlementMaterializationInput =
  | {
      sourceType: 'ORDER_BRANCH';
      sourceId: string;
    }
  | {
      sourceType: 'RIDER_DELIVERY';
      sourceId: string;
    }
  | {
      sourceType: 'RIDER_TIP';
      sourceId: string;
    };
