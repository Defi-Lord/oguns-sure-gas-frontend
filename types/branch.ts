export interface BranchManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'BRANCH_MANAGER';
}

export interface Branch {
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

  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;

  isActive: boolean;

  manager: BranchManager | null;

  createdAt: string;
  updatedAt: string;
}

export interface BranchListResponse {
  success: true;
  message: string;
  data: {
    branches: Branch[];
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
