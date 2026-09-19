export type UserRole =
  | 'CUSTOMER'
  | 'STAFF'
  | 'RIDER'
  | 'BRANCH_MANAGER'
  | 'SUPER_ADMIN';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export interface AuthManagedBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;

  managedBranch?:
    | AuthManagedBranch
    | null;

}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface MeResponse {
  success: true;
  message: string;
  data: {
    user: AuthUser;
  };
}

export interface RefreshResponse {
  success: true;
  message: string;
  data: {
    tokens: AuthTokens;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  errors?: unknown;
}
