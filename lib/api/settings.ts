import {
  api,
} from '@/lib/api/client';

import type {
  CreateDeliveryZoneInput,
  DeliveryZone,
  DeliveryZoneListFilters,
  DeliveryZoneListResponse,
  DeliveryZoneResponse,
  PlatformFeeConfig,
  PlatformFeeResponse,
  SettingsProfile,
  UpdateDeliveryZoneInput,
  UpdatePlatformFeeInput,
  UpdateSettingsProfileInput,
  UserProfileResponse,
} from '@/types/settings';

const isRecord = (
  value: unknown,
): value is Record<
  string,
  unknown
> =>
  typeof value ===
    'object' &&
  value !== null &&
  !Array.isArray(value);

const normalizeDeliveryZoneList =
  (
    response:
      DeliveryZoneListResponse,
  ): DeliveryZone[] => {
    const data =
      response.data;

    if (
      Array.isArray(
        data,
      )
    ) {
      return data;
    }

    if (
      isRecord(data) &&
      'deliveryZones' in data &&
      Array.isArray(
        data.deliveryZones,
      )
    ) {
      return data.deliveryZones as
        DeliveryZone[];
    }

    if (
      isRecord(data) &&
      'zones' in data &&
      Array.isArray(
        data.zones,
      )
    ) {
      return data.zones as
        DeliveryZone[];
    }

    throw new Error(
      'The delivery-zone API returned an unexpected list payload.',
    );
  };

const normalizeDeliveryZone =
  (
    response:
      DeliveryZoneResponse,
  ): DeliveryZone => {
    const data =
      response.data;

    if (
      isRecord(data) &&
      'deliveryZone' in data
    ) {
      return data.deliveryZone as
        DeliveryZone;
    }

    if (
      isRecord(data) &&
      'zone' in data
    ) {
      return data.zone as
        DeliveryZone;
    }

    if (
      isRecord(data) &&
      typeof data.id ===
        'string'
    ) {
      return data as unknown as
        DeliveryZone;
    }

    throw new Error(
      'The delivery-zone API returned an unexpected item payload.',
    );
  };

export const getSettingsProfile =
  async (): Promise<
    SettingsProfile
  > => {
    const response =
      await api.get<UserProfileResponse>(
        '/users/me',
      );

    return response.data.data
      .user;
  };

export const updateSettingsProfile =
  async (
    input:
      UpdateSettingsProfileInput,
  ): Promise<
    SettingsProfile
  > => {
    const response =
      await api.patch<UserProfileResponse>(
        '/users/me',
        input,
      );

    return response.data.data
      .user;
  };

export const getDeliveryZones =
  async (
    filters:
      DeliveryZoneListFilters = {},
  ): Promise<
    DeliveryZone[]
  > => {
    const response =
      await api.get<DeliveryZoneListResponse>(
        '/delivery-zones',
        {
          params: {
            ...(filters.branchId
              ? {
                  branchId:
                    filters.branchId,
                }
              : {}),

            ...(filters.area
              ? {
                  area:
                    filters.area,
                }
              : {}),

            ...(filters.city
              ? {
                  city:
                    filters.city,
                }
              : {}),

            ...(filters.state
              ? {
                  state:
                    filters.state,
                }
              : {}),

            ...(filters.isActive !==
            undefined
              ? {
                  isActive:
                    String(
                      filters.isActive,
                    ),
                }
              : {}),
          },
        },
      );

    return normalizeDeliveryZoneList(
      response.data,
    );
  };

export const createDeliveryZone =
  async (
    input:
      CreateDeliveryZoneInput,
  ): Promise<
    DeliveryZone
  > => {
    const response =
      await api.post<DeliveryZoneResponse>(
        '/delivery-zones',
        input,
      );

    return normalizeDeliveryZone(
      response.data,
    );
  };

export const updateDeliveryZone =
  async (
    zoneId: string,
    input:
      UpdateDeliveryZoneInput,
  ): Promise<
    DeliveryZone
  > => {
    const response =
      await api.patch<DeliveryZoneResponse>(
        `/delivery-zones/${zoneId}`,
        input,
      );

    return normalizeDeliveryZone(
      response.data,
    );
  };

export const getPlatformFeeConfig =
  async (): Promise<
    PlatformFeeConfig
  > => {
    const response =
      await api.get<PlatformFeeResponse>(
        '/settings/platform-fee',
      );

    return response.data.data
      .platformFee;
  };

export const updatePlatformFeeConfig =
  async (
    input:
      UpdatePlatformFeeInput,
  ): Promise<
    PlatformFeeConfig
  > => {
    const response =
      await api.put<PlatformFeeResponse>(
        '/settings/platform-fee',
        input,
      );

    return response.data.data
      .platformFee;
  };
