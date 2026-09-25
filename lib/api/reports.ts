import {
  api,
} from '@/lib/api/client';

import type {
  ReportApiResponse,
  ReportFilters,
  ReportKind,
  ReportResult,
} from '@/types/report';

const normalizeReport =
  (
    response:
      ReportApiResponse,
  ): ReportResult => {
    const data =
      response.data;

    if (
      'report' in data
    ) {
      return data.report;
    }

    return data;
  };

export const getReport =
  async (
    kind:
      ReportKind,
    filters:
      ReportFilters,
  ): Promise<ReportResult> => {
    const response =
      await api.get<ReportApiResponse>(
        `/reports/${kind}`,
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

            page:
              filters.page ??
              1,

            limit:
              filters.limit ??
              25,

            sortOrder:
              filters.sortOrder ??
              'desc',
          },
        },
      );

    return normalizeReport(
      response.data,
    );
  };
