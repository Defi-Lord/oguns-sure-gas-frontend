import {
  api,
} from '@/lib/api/client';

import type {
  Campaign,
  CampaignListFilters,
  CampaignListResponse,
  CampaignResponse,
  CampaignStatus,
  CreateCampaignInput,
  QualifyCampaignEntryInput,
  UpdateCampaignInput,
  Voucher,
  VoucherListFilters,
  VoucherListResponse,
  VoucherResponse,
} from '@/types/campaign';

export async function getCampaigns(
  filters: CampaignListFilters = {},
): Promise<Campaign[]> {
  const response =
    await api.get<CampaignListResponse>(
      '/campaigns',
      {
        params: filters,
      },
    );

  return response.data.data.campaigns;
}

export async function getCampaign(
  campaignId: string,
): Promise<Campaign> {
  const response =
    await api.get<CampaignResponse>(
      `/campaigns/${campaignId}`,
    );

  return response.data.data.campaign;
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<Campaign> {
  const response =
    await api.post<CampaignResponse>(
      '/campaigns',
      input,
    );

  return response.data.data.campaign;
}

export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<Campaign> {
  const response =
    await api.patch<CampaignResponse>(
      `/campaigns/${campaignId}`,
      input,
    );

  return response.data.data.campaign;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
): Promise<Campaign> {
  const response =
    await api.patch<CampaignResponse>(
      `/campaigns/${campaignId}/status`,
      {
        status,
      },
    );

  return response.data.data.campaign;
}

export async function qualifyCampaignEntry(
  campaignId: string,
  entryId: string,
  input: QualifyCampaignEntryInput,
): Promise<Campaign> {
  const response =
    await api.patch<CampaignResponse>(
      `/campaigns/${campaignId}/entries/${entryId}/qualification`,
      input,
    );

  return response.data.data.campaign;
}

export async function selectCampaignWinners(
  campaignId: string,
  winnerCount?: number,
): Promise<Campaign> {
  const response =
    await api.post<CampaignResponse>(
      `/campaigns/${campaignId}/select-winners`,
      winnerCount
        ? {
            winnerCount,
          }
        : {},
    );

  return response.data.data.campaign;
}

export async function deleteCampaign(
  campaignId: string,
): Promise<void> {
  await api.delete(
    `/campaigns/${campaignId}`,
  );
}

export async function getVouchers(
  filters: VoucherListFilters = {},
): Promise<Voucher[]> {
  const response =
    await api.get<VoucherListResponse>(
      '/vouchers',
      {
        params: filters,
      },
    );

  return response.data.data.vouchers;
}

export async function getVoucher(
  voucherId: string,
): Promise<Voucher> {
  const response =
    await api.get<VoucherResponse>(
      `/vouchers/${voucherId}`,
    );

  return response.data.data.voucher;
}
