import { api } from '@/lib/api/client';

import type {
  CreateInventoryInput,
  InventoryListResponse,
  InventoryRecord,
  InventoryResponse,
  UpdateInventoryInput,
  UpdateInventoryStockInput,
} from '@/types/inventory';

export const getInventories =
  async (): Promise<InventoryRecord[]> => {
    const response =
      await api.get<InventoryListResponse>(
        '/inventory',
      );

    return response.data.data.inventories;
  };

export const createInventory = async (
  input: CreateInventoryInput,
): Promise<InventoryRecord> => {
  const response =
    await api.post<InventoryResponse>(
      '/inventory',
      input,
    );

  return response.data.data.inventory;
};

export const updateInventory = async (
  inventoryId: string,
  input: UpdateInventoryInput,
): Promise<InventoryRecord> => {
  const response =
    await api.patch<InventoryResponse>(
      `/inventory/${inventoryId}`,
      input,
    );

  return response.data.data.inventory;
};

export const updateInventoryStock = async (
  inventoryId: string,
  input: UpdateInventoryStockInput,
): Promise<InventoryRecord> => {
  const response =
    await api.patch<InventoryResponse>(
      `/inventory/${inventoryId}/stock`,
      input,
    );

  return response.data.data.inventory;
};
