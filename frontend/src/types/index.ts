// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PERSON';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// Customer Types
export interface CustomerProfile {
  id: string;
  userId: string;
  defaultAddressId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  addresses: Address[];
  defaultAddress: Address | null;
}

export interface Address {
  id: string;
  customerId: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormData {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  currentPrice?: ProductPricing;
}

export interface ProductPricing {
  id: string;
  productId: string;
  price: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  unit: string;
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  isActive?: boolean;
  imageUrl?: string;
}

// Subscription Types
export type SubscriptionFrequency = 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKLY' | 'CUSTOM';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  addressId: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  customDays: number[] | null;
  startDate: string;
  endDate: string | null;
  status: SubscriptionStatus;
  pausedAt: string | null;
  resumeDate: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
  address: Address;
}

export interface SubscriptionFormData {
  productId: string;
  addressId: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  customDays?: number[];
  startDate: string;
  endDate?: string;
}

export interface Vacation {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface VacationFormData {
  startDate: string;
  endDate: string;
  reason?: string;
}

// Adhoc Request Types
export type AdhocRequestStatus = 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'CANCELLED';
export type AdhocItemStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdhocRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  addressId: string;
  requestedDate: string;
  preferredTimeSlot: string | null;
  status: AdhocRequestStatus;
  customerNotes: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
  items: AdhocRequestItem[];
  address: Address;
  reviewedBy?: User;
}

export interface AdhocRequestItem {
  id: string;
  requestId: string;
  productId: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
  status: AdhocItemStatus;
  product: Product;
}

export interface AdhocRequestFormData {
  addressId: string;
  requestedDate: string;
  preferredTimeSlot?: string;
  customerNotes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

// Delivery Types
export type DeliveryType = 'REGULAR' | 'ADHOC';
export type DeliveryStatus = 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface Delivery {
  id: string;
  type: DeliveryType;
  subscriptionId: string | null;
  adhocRequestId: string | null;
  productId: string;
  customerId: string;
  addressId: string;
  deliveryPersonId: string | null;
  scheduledDate: string;
  quantity: number;
  status: DeliveryStatus;
  deliveredAt: string | null;
  deliveryNotes: string | null;
  issueReported: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
  address: Address;
  deliveryPerson?: User;
  subscription?: Subscription;
  adhocRequest?: AdhocRequest;
}

// Billing Types
export type BillStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
export type PaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  dueDate: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
  payments: Payment[];
  customer?: CustomerProfile;
}

export interface BillItem {
  id: string;
  billId: string;
  deliveryId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description: string;
  product: Product;
}

export interface Payment {
  id: string;
  billId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentFormData {
  billId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

// Wallet Types
export type TransactionType = 'CREDIT' | 'DEBIT';

export interface CustomerWallet {
  id: string;
  customerId: string;
  balance: number;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

// Dashboard Types
export interface CustomerDashboard {
  activeSubscriptions: number;
  pendingDeliveries: number;
  pendingBills: number;
  walletBalance: number;
  upcomingDeliveries: Delivery[];
  recentBills: Bill[];
}

export interface AdminDashboard {
  totalCustomers: number;
  activeSubscriptions: number;
  todayDeliveries: number;
  pendingAdhocRequests: number;
  pendingPayments: number;
  monthlyRevenue: number;
  recentOrders: AdhocRequest[];
  deliveryStats: {
    scheduled: number;
    outForDelivery: number;
    delivered: number;
    failed: number;
  };
}

// Holiday Types
export interface Holiday {
  id: string;
  date: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface HolidayFormData {
  date: string;
  name: string;
  description?: string;
}

// System Settings
export interface SystemSettings {
  id?: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  currency: string;
  timezone: string;
  defaultDeliverySlot: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  maxDeliveriesPerSlot: number;
  minSubscriptionDays: number;
  maxVacationDays: number;
  advanceNoticeDays: number;
  billingCycleDay: number;
  paymentDueDays: number;
  lateFeePercentage: number;
  sendEmailNotifications: boolean;
  sendSmsNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query Params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface DeliveryFilterParams extends PaginationParams, DateRangeParams {
  status?: DeliveryStatus;
  type?: DeliveryType;
}

export interface BillFilterParams extends PaginationParams {
  status?: BillStatus;
}
