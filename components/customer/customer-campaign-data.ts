import { api } from '@/lib/api/client';
import type { Campaign, CampaignListResponse } from '@/types/campaign';

type CampaignWire = Campaign & { popup?: { enabled?: boolean; title?: string|null; message?: string|null; imageUrl?: string|null; ctaText?: string|null; ctaUrl?: string|null } };
/** The backend serializer nests popup settings. Accept flat fields for older captures. */
export function normalizeCustomerCampaign(value: CampaignWire): Campaign {
  return { ...value,
    popupEnabled: value.popup?.enabled ?? value.popupEnabled ?? false,
    popupTitle: value.popup?.title ?? value.popupTitle ?? null,
    popupMessage: value.popup?.message ?? value.popupMessage ?? null,
    popupImageUrl: value.popup?.imageUrl ?? value.popupImageUrl ?? null,
    popupCtaText: value.popup?.ctaText ?? value.popupCtaText ?? null,
    popupCtaUrl: value.popup?.ctaUrl ?? value.popupCtaUrl ?? null,
  };
}
export async function getCustomerCampaigns(signal?:AbortSignal):Promise<Campaign[]> {
  return (await api.get<CampaignListResponse>('/campaigns/active',{signal})).data.data.campaigns.map(normalizeCustomerCampaign);
}
