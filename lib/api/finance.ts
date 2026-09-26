import { api } from '@/lib/api/client';

import type {
  CreatePayoutPolicyInput,
  FinancePayment,
  FinanceRider,
  FinanceRidersResponse,
  PaymentListFilters,
  PaymentsResponse,
  PayoutPolicy,
  PayoutPolicyListResponse,
  PayoutPolicyResponse,
  PayoutRecipient,
  PayoutRecipientInput,
  PayoutRecipientListFilters,
  PayoutRecipientResponse,
  PayoutRecipientVerificationResponse,
  PayoutRecipientsResponse,
  Settlement,
  SettlementListFilters,
  SettlementMaterializationInput,
  SettlementResponse,
  SettlementsResponse,
  TransferActionResponse,
  TransferActionResult,
} from '@/types/finance';

const compactParams = (
  params: object,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '',
    ),
  );

export const getFinancePayments =
  async (
    filters: PaymentListFilters = {},
  ): Promise<FinancePayment[]> => {
    const response =
      await api.get<PaymentsResponse>(
        '/payments',
        {
          params:
            compactParams(filters),
        },
      );

    return response.data.data.payments;
  };

export const getFinanceRiders =
  async (): Promise<FinanceRider[]> => {
    const response =
      await api.get<FinanceRidersResponse>(
        '/riders',
      );

    return response.data.data.riders;
  };

export const getSettlements =
  async (
    filters: SettlementListFilters,
  ) => {
    const response =
      await api.get<SettlementsResponse>(
        '/payouts/settlements',
        {
          params:
            compactParams(filters),
        },
      );

    return response.data.data;
  };

export const getSettlement =
  async (
    settlementId: string,
  ): Promise<Settlement> => {
    const response =
      await api.get<SettlementResponse>(
        `/payouts/settlements/${settlementId}`,
      );

    return response.data.data.settlement;
  };

export const materializeSettlement =
  async (
    input: SettlementMaterializationInput,
  ): Promise<Settlement> => {
    const path =
      input.sourceType ===
      'ORDER_BRANCH'
        ? `/payouts/settlements/materialize/orders/${input.sourceId}`
        : input.sourceType ===
            'RIDER_DELIVERY'
          ? `/payouts/settlements/materialize/deliveries/${input.sourceId}`
          : `/payouts/settlements/materialize/rider-tips/${input.sourceId}`;

    const response =
      await api.post<SettlementResponse>(
        path,
      );

    return response.data.data.settlement;
  };

export const initiateSettlementTransfer =
  async (
    settlementId: string,
  ): Promise<TransferActionResult> => {
    const response =
      await api.post<TransferActionResponse>(
        `/payouts/settlements/${settlementId}/transfer`,
      );

    return response.data.data.transfer;
  };

export const reconcileSettlementTransfer =
  async (
    settlementId: string,
  ): Promise<TransferActionResult> => {
    const response =
      await api.post<TransferActionResponse>(
        `/payouts/settlements/${settlementId}/reconcile-transfer`,
      );

    return response.data.data.transfer;
  };

export const finalizeSettlementTransferOtp =
  async (
    settlementId: string,
    otp: string,
  ): Promise<TransferActionResult> => {
    const response =
      await api.post<TransferActionResponse>(
        `/payouts/settlements/${settlementId}/finalize-otp`,
        {
          otp,
        },
      );

    return response.data.data.transfer;
  };

export const getPayoutRecipients =
  async (
    filters: PayoutRecipientListFilters,
  ) => {
    const response =
      await api.get<PayoutRecipientsResponse>(
        '/payouts/recipients',
        {
          params:
            compactParams(filters),
        },
      );

    return response.data.data;
  };

export const getPayoutRecipient =
  async (
    recipientId: string,
  ): Promise<PayoutRecipient> => {
    const response =
      await api.get<PayoutRecipientResponse>(
        `/payouts/recipients/${recipientId}`,
      );

    return response.data.data.recipient;
  };

export const putBranchPayoutRecipient =
  async (
    branchId: string,
    input: PayoutRecipientInput,
  ): Promise<PayoutRecipient> => {
    const response =
      await api.put<PayoutRecipientResponse>(
        `/payouts/recipients/branches/${branchId}`,
        input,
      );

    return response.data.data.recipient;
  };

export const putRiderPayoutRecipient =
  async (
    riderId: string,
    input: PayoutRecipientInput,
  ): Promise<PayoutRecipient> => {
    const response =
      await api.put<PayoutRecipientResponse>(
        `/payouts/recipients/riders/${riderId}`,
        input,
      );

    return response.data.data.recipient;
  };

export const verifyPayoutRecipient =
  async (
    recipientId: string,
  ) => {
    const response =
      await api.post<PayoutRecipientVerificationResponse>(
        `/payouts/recipients/${recipientId}/verify`,
      );

    return response.data.data;
  };

export const reconcilePayoutRecipient =
  async (
    recipientId: string,
  ) => {
    const response =
      await api.post<PayoutRecipientVerificationResponse>(
        `/payouts/recipients/${recipientId}/reconcile`,
      );

    return response.data.data;
  };

export const disablePayoutRecipient =
  async (
    recipientId: string,
  ): Promise<PayoutRecipient> => {
    const response =
      await api.patch<PayoutRecipientResponse>(
        `/payouts/recipients/${recipientId}/disable`,
      );

    return response.data.data.recipient;
  };

export const getPayoutPolicies =
  async (): Promise<PayoutPolicy[]> => {
    const response =
      await api.get<PayoutPolicyListResponse>(
        '/payouts/policies',
      );

    return response.data.data.policies;
  };

export const getActivePayoutPolicy =
  async (): Promise<PayoutPolicy | null> => {
    const response =
      await api.get<PayoutPolicyResponse>(
        '/payouts/policies/active',
      );

    return response.data.data.policy;
  };

export const createPayoutPolicy =
  async (
    input: CreatePayoutPolicyInput,
  ): Promise<PayoutPolicy> => {
    const response =
      await api.post<PayoutPolicyResponse>(
        '/payouts/policies',
        input,
      );

    if (!response.data.data.policy) {
      throw new Error(
        'The backend did not return the new payout policy.',
      );
    }

    return response.data.data.policy;
  };

export const activatePayoutPolicy =
  async (
    version: string,
  ): Promise<PayoutPolicy> => {
    const response =
      await api.post<PayoutPolicyResponse>(
        `/payouts/policies/${version}/activate`,
      );

    if (!response.data.data.policy) {
      throw new Error(
        'The backend did not return the activated payout policy.',
      );
    }

    return response.data.data.policy;
  };
