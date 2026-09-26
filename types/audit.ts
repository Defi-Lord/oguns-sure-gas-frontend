export interface AuditActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
}

export interface AuditBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  branchId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: AuditActor | null;
  branch: AuditBranch | null;
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditListPayload {
  auditLogs: AuditLog[];
  pagination: AuditPagination;
}

export interface AuditListFilters {
  actorId?: string;
  branchId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditListApiResponse {
  success: true;
  message: string;
  data: AuditListPayload;
}

export interface AuditDetailApiResponse {
  success: true;
  message: string;
  data: {
    auditLog: AuditLog;
  };
}
