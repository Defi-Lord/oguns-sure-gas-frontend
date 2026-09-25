export type ReportKind =
  | 'sales'
  | 'payments'
  | 'inventory'
  | 'deliveries'
  | 'products'
  | 'campaigns'
  | 'branches'
  | 'rider-tips';

export type ReportSortOrder =
  | 'asc'
  | 'desc';

export interface ReportFilters {
  branchId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sortOrder?: ReportSortOrder;
}

export interface ReportScope {
  branchId: string | null;
  from?: string;
  to?: string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ReportRow =
  Record<string, unknown>;

export interface ReportResult {
  scope: ReportScope;
  pagination: ReportPagination;
  rows: ReportRow[];
}

export interface ReportApiResponse {
  success: true;
  message: string;
  data:
    | {
        report: ReportResult;
      }
    | ReportResult;
}
