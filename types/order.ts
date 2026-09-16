export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'CARD'
  | 'ONLINE';

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface OrderCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export interface OrderAddress {
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

export interface OrderProduct {
  id: string;
  name: string;
  description: string | null;
  type: string;
  sku: string;
  unit: string;
  pricePerUnit: number | string;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  product: OrderProduct;
}

export interface OrderPayment {
  id: string;
  orderId: string | null;
  reference: string;
  amount: number | string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  provider: string | null;
  providerRef: string | null;
  paymentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDelivery {
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
}

export interface Order {
  id: string;
  orderNumber: string;

  customerId: string;
  fulfillmentBranchId: string;
  deliveryAddressId: string;

  status: OrderStatus;

  subtotal: number;
  deliveryFee: number;
  crossBranchFee: number;
  discountAmount: number | string;
  totalAmount: number;

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  customer: OrderCustomer;
  fulfillmentBranch: OrderBranch;
  deliveryAddress: OrderAddress;

  items: OrderItem[];

  payment: OrderPayment | null;
  delivery: OrderDelivery | null;
}

export interface OrdersResponse {
  success: boolean;
  message: string;

  data: {
    orders: Order[];
  };

  meta?: {
    timestamp?: string;
  };
}
