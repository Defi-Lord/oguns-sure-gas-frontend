import type {
  ProductType,
} from '@/types/product';

export type InventoryStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK';

export interface InventoryBranch {
  id: string;
  name: string;
  code: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  sku: string;
  unit: string;
  pricePerUnit: number;
  isActive: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  lowStockLevel: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
  branch: InventoryBranch;
  product: InventoryProduct;
}

export interface CreateInventoryInput {
  branchId: string;
  productId: string;
  quantity: number;
  lowStockLevel: number;
}

export interface UpdateInventoryInput {
  quantity?: number;
  lowStockLevel?: number;
}

export interface UpdateInventoryStockInput {
  quantity: number;
}

export interface InventoryListResponse {
  success: true;
  message: string;
  data: {
    inventories: InventoryRecord[];
  };
}

export interface InventoryResponse {
  success: true;
  message: string;
  data: {
    inventory: InventoryRecord;
  };
}
