import { api } from '@/lib/api/client';

import type {
  Branch,
  BranchListResponse,
  BranchResponse,
  CreateBranchInput,
  PublicBranch,
  PublicBranchListResponse,
  PublicBranchResponse,
  UpdateBranchInput,
} from '@/types/branch';

export const getBranches =
  async (): Promise<PublicBranch[]> => {
    const response =
      await api.get<PublicBranchListResponse>(
        '/branches',
      );

    return response.data.data.branches;
  };

export const getManagementBranches =
  async (): Promise<Branch[]> => {
    const response =
      await api.get<BranchListResponse>(
        '/branches/management',
      );

    return response.data.data.branches;
  };

export const getBranch =
  async (
    branchId: string,
  ): Promise<PublicBranch> => {
    const response =
      await api.get<PublicBranchResponse>(
        `/branches/${branchId}`,
      );

    return response.data.data.branch;
  };

export const createBranch =
  async (
    input: CreateBranchInput,
  ): Promise<Branch> => {
    const response =
      await api.post<BranchResponse>(
        '/branches',
        input,
      );

    return response.data.data.branch;
  };

export const updateBranch =
  async (
    branchId: string,
    input: UpdateBranchInput,
  ): Promise<Branch> => {
    const response =
      await api.patch<BranchResponse>(
        `/branches/${branchId}`,
        input,
      );

    return response.data.data.branch;
  };
