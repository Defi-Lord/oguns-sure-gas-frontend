export interface BranchManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'BRANCH_MANAGER';
}

export interface PublicBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;

  latitude: number | null;
  longitude: number | null;

  phone: string | null;
  email: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Branch
  extends PublicBranch {
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;

  manager: BranchManager | null;
}

export interface PublicBranchListResponse {
  success: true;
  message: string;
  data: {
    branches: PublicBranch[];
  };
}

export interface BranchListResponse {
  success: true;
  message: string;
  data: {
    branches: Branch[];
  };
}

export interface PublicBranchResponse {
  success: true;
  message: string;
  data: {
    branch: PublicBranch;
  };
}

export interface BranchResponse {
  success: true;
  message: string;
  data: {
    branch: Branch;
  };
}

export interface CreateBranchInput {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;

  latitude?: number;
  longitude?: number;

  phone?: string;
  email?: string;

  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  managerId?: string;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;

  latitude?: number | null;
  longitude?: number | null;

  phone?: string | null;
  email?: string | null;

  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;

  managerId?: string | null;
  isActive?: boolean;
}
