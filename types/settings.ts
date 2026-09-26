import type {
  AuthUser,
} from '@/types/auth';

export interface SettingsProfile
  extends AuthUser {
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface UserProfileResponse {
  success: true;
  message: string;
  data: {
    user: SettingsProfile;
  };
}

export interface DeliveryZoneBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  branchId: string;
  name: string;
  code: string;
  area: string;
  city: string;
  state: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  branch?: DeliveryZoneBranch;
}

export interface CreateDeliveryZoneInput {
  branchId: string;
  name: string;
  code: string;
  area: string;
  city: string;
  state: string;
  deliveryFee: number;
}

export interface UpdateDeliveryZoneInput {
  name?: string;
  code?: string;
  area?: string;
  city?: string;
  state?: string;
  deliveryFee?: number;
  isActive?: boolean;
}

export interface DeliveryZoneListFilters {
  branchId?: string;
  area?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export type DeliveryZoneListResponse = {
  success: true;
  message: string;
  data:
    | {
        deliveryZones: DeliveryZone[];
      }
    | {
        zones: DeliveryZone[];
      }
    | DeliveryZone[];
};

export type DeliveryZoneResponse = {
  success: true;
  message: string;
  data:
    | {
        deliveryZone: DeliveryZone;
      }
    | {
        zone: DeliveryZone;
      }
    | DeliveryZone;
};

export interface PlatformFeeUpdatedBy {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface PlatformFeeConfig {
  key: string;
  percent: number;
  defaultPercent: number;
  minPercent: number;
  maxPercent: number;
  configured: boolean;
  description: string | null;
  updatedAt: string | null;
  updatedBy: PlatformFeeUpdatedBy | null;
}

export interface UpdatePlatformFeeInput {
  percent: number;
}

export interface PlatformFeeResponse {
  success: true;
  message: string;
  data: {
    platformFee: PlatformFeeConfig;
  };
}
