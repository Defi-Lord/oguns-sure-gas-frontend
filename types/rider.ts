export type RiderAccountStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | string;

export type RiderDeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface RiderUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: RiderAccountStatus;
  role: string;
}

export interface RiderBranch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  isActive: boolean;
}

export interface RiderDelivery {
  id: string;
  orderId: string;
  riderId: string;
  branchId: string;
  status: RiderDeliveryStatus;
  pickupTime: string | null;
  deliveredTime: string | null;
  deliveryNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  branchId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  user: RiderUser;
  branch: RiderBranch;
  deliveries: RiderDelivery[];
}

export interface RidersResponse {
  success: boolean;
  message: string;
  data: {
    riders: Rider[];
  };
}
