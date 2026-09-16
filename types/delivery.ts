export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type GasVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'DISCREPANCY';

export interface DeliveryCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  addressLine: string;
  area: string | null;
  city: string;
  state: string;
  phone: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface DeliveryProduct {
  id: string;
  name: string;
  sku: string;
}

export interface DeliveryItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: DeliveryProduct | null;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  customer: DeliveryCustomer;
  deliveryAddress: DeliveryAddress;
  items: DeliveryItem[];
}

export interface DeliveryRiderUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface DeliveryRider {
  id: string;
  userId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  user: DeliveryRiderUser;
}

export interface DeliveryBranch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
}

export interface GasVerification {
  id: string;
  deliveryId: string;
  expectedGasKg: number;
  pickupWeightKg: number | null;
  deliveryWeightKg: number | null;
  gasSuppliedKg: number | null;
  pickupPhotoUrl: string | null;
  deliveryPhotoUrl: string | null;
  discrepancyKg: number | null;
  verificationStatus: GasVerificationStatus;
  verificationNotes: string | null;
  riderNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  riderId: string | null;
  branchId: string;
  status: DeliveryStatus;
  pickupTime: string | null;
  deliveredTime: string | null;
  deliveryNotes: string | null;
  createdAt: string;
  updatedAt: string;
  order: DeliveryOrder;
  rider: DeliveryRider | null;
  branch: DeliveryBranch;
  gasVerification: GasVerification | null;
}

export interface DeliveriesResponse {
  success: boolean;
  message: string;
  data: {
    deliveries: Delivery[];
  };
}

export interface DeliveryResponse {
  success: boolean;
  message: string;
  data: {
    delivery: Delivery;
  };
}

export interface DeliveryListFilters {
  status?: DeliveryStatus;
  branchId?: string;
  riderId?: string;
  orderId?: string;
}
