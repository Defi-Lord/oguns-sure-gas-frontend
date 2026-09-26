import {
  api,
} from '@/lib/api/client';

import type {
  AuditDetailApiResponse,
  AuditListApiResponse,
  AuditListFilters,
  AuditListPayload,
  AuditLog,
} from '@/types/audit';

export const getAuditLogs =
  async (
    filters:
      AuditListFilters,
  ): Promise<AuditListPayload> => {
    const response =
      await api.get<AuditListApiResponse>(
        '/audit',
        {
          params: {
            ...(filters.actorId
              ? {
                  actorId:
                    filters.actorId,
                }
              : {}),

            ...(filters.branchId
              ? {
                  branchId:
                    filters.branchId,
                }
              : {}),

            ...(filters.action
              ? {
                  action:
                    filters.action,
                }
              : {}),

            ...(filters.entityType
              ? {
                  entityType:
                    filters.entityType,
                }
              : {}),

            ...(filters.entityId
              ? {
                  entityId:
                    filters.entityId,
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
              20,
          },
        },
      );

    return response.data.data;
  };

export const getAuditLog =
  async (
    auditLogId: string,
  ): Promise<AuditLog> => {
    const response =
      await api.get<AuditDetailApiResponse>(
        `/audit/${auditLogId}`,
      );

    return response.data.data.auditLog;
  };
