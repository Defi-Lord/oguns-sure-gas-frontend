import {
  api,
} from '@/lib/api/client';

import type {
  AnalyticsApiResponse,
  AnalyticsFilters,
  AnalyticsKind,
  AnalyticsPayloadMap,
} from '@/types/analytics';

const hasAnalyticsEnvelope =
  <T,>(
    value:
      T | {
        analytics: T;
      },
  ): value is {
    analytics: T;
  } => {
    return (
      typeof value ===
        'object' &&
      value !==
        null &&
      'analytics' in
        value
    );
  };

const normalizeAnalytics =
  <T,>(
    response:
      AnalyticsApiResponse<T>,
  ): T => {
    const payload =
      response.data;

    if (
      hasAnalyticsEnvelope(
        payload,
      )
    ) {
      return payload.analytics;
    }

    if (
      payload ===
        undefined ||
      payload ===
        null
    ) {
      throw new Error(
        'The analytics API returned an empty payload.',
      );
    }

    return payload;
  };

export const getAnalytics =
  async <
    TKind extends
      AnalyticsKind,
  >(
    kind:
      TKind,
    filters:
      AnalyticsFilters,
  ): Promise<
    AnalyticsPayloadMap[TKind]
  > => {
    const response =
      await api.get<
        AnalyticsApiResponse<
          AnalyticsPayloadMap[TKind]
        >
      >(
        `/analytics/${kind}`,
        {
          params: {
            ...(filters.branchId
              ? {
                  branchId:
                    filters.branchId,
                }
              : {}),

            ...(filters.from
              ? {
                  from:
                    filters.from,
                }
              : {}),

            ...(filters.to
              ? {
                  to:
                    filters.to,
                }
              : {}),
          },
        },
      );

    return normalizeAnalytics(
      response.data,
    );
  };
