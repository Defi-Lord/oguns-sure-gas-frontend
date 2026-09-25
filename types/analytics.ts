export type AnalyticsKind =
  | 'overview'
  | 'sales'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'deliveries'
  | 'payments'
  | 'campaigns'
  | 'branches';

export interface AnalyticsFilters {
  branchId?: string;
  from?: string;
  to?: string;
}

export interface AnalyticsScope {
  branchId: string | null;
  from?: string;
  to?: string;
}

export type StatusCounts =
  Record<string, number>;

export interface OverviewAnalytics {
  scope: AnalyticsScope;

  orders: {
    total: number;
    statusCounts: StatusCounts;
    grossOrderValue: number;
    subtotal: number;
    discounts: number;
    deliveryFees: number;
    crossBranchFees: number;
    averageOrderValue: number;
  };

  revenue: {
    paidRevenue: number;
    paidOrderCount: number;
  };

  customers: {
    newCustomers: number | null;
    orderingCustomers: number;
  };

  deliveries: {
    total: number;
    statusCounts: StatusCounts;
    averageDeliveryMinutes: number;
  };

  inventory: {
    totalInventoryLines: number;
    lowStockCount: number;
    outOfStockCount: number;
    statusCounts: StatusCounts;
  };
}

export interface SalesTrendPoint {
  date: string;
  orders: number;
  grossOrderValue: number;
  paidRevenue: number;
  discounts: number;
  deliveryFees: number;
  crossBranchFees: number;
}

export interface SalesAnalytics {
  scope: AnalyticsScope;

  totals: {
    orders: number;
    grossOrderValue: number;
    paidRevenue: number;
    averageOrderValue: number;
  };

  trend: SalesTrendPoint[];
}

export interface OrderAnalytics {
  scope: AnalyticsScope;
  totalOrders: number;
  statusCounts: StatusCounts;
  campaignOrderCount: number;
  discountedOrderCount: number;
}

export interface ProductAnalyticsItem {
  productId: string;
  name: string;
  sku: string;
  type: string;
  unit: string;

  category: {
    id: string;
    name: string;
  };

  quantitySold: number;
  salesValue: number;
  orderLines: number;
}

export interface ProductAnalytics {
  scope: AnalyticsScope;
  products: ProductAnalyticsItem[];
  topBySales: ProductAnalyticsItem[];
  topByQuantity: ProductAnalyticsItem[];
}

export interface InventoryAnalyticsItem {
  id: string;

  branch: {
    id: string;
    name: string;
    code: string;
  };

  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };

  quantity: number;
  lowStockLevel: number;
  status: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  estimatedStockValue: number;
}

export interface InventoryAnalytics {
  scope: {
    branchId: string | null;
  };

  summary: {
    totalInventoryLines: number;
    lowStockCount: number;
    outOfStockCount: number;
    estimatedStockValue: number;
    statusCounts: StatusCounts;
  };

  items: InventoryAnalyticsItem[];
}

export interface DeliveryAnalytics {
  scope: AnalyticsScope;
  totalDeliveries: number;
  statusCounts: StatusCounts;
  gasVerificationStatusCounts: StatusCounts;
  averageDeliveryMinutes: number;
  completedTimingSamples: number;
}

export interface PaymentAnalytics {
  scope: AnalyticsScope;
  totalPayments: number;
  statusCounts: StatusCounts;
  methodCounts: StatusCounts;
  paymentTypeCounts: StatusCounts;
  paidAmount: number;
  orderPaymentRevenue: number;
  tipPaymentRevenue: number;
}

export interface CampaignAnalyticsItem {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  winnerCount: number;
  maxWinners: number | null;
  createdAt: string;
  attributedOrders: number;
  attributedOrderValue: number;
  discountGiven: number;
  voucherRedemptions: number;

  entryMetrics: {
    total: number;
    statusCounts: StatusCounts;
  } | null;
}

export interface CampaignAnalytics {
  scope: AnalyticsScope;
  campaigns: CampaignAnalyticsItem[];
}

export interface BranchAnalyticsItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  isActive: boolean;
  orders: number;
  grossOrderValue: number;
  paidRevenue: number;
  deliveries: number;
  deliveryStatusCounts: StatusCounts;
  inventoryLines: number;
  riders: number;
}

export interface BranchAnalytics {
  scope: AnalyticsScope;
  branches: BranchAnalyticsItem[];
}

export type AnalyticsPayloadMap = {
  overview: OverviewAnalytics;
  sales: SalesAnalytics;
  orders: OrderAnalytics;
  products: ProductAnalytics;
  inventory: InventoryAnalytics;
  deliveries: DeliveryAnalytics;
  payments: PaymentAnalytics;
  campaigns: CampaignAnalytics;
  branches: BranchAnalytics;
};

export interface AnalyticsApiResponse<
  T,
> {
  success: true;
  message: string;

  data:
    | T
    | {
        analytics: T;
      };
}
