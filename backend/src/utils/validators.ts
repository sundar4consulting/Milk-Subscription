import { z } from 'zod';

// Common schemas
export const uuidSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date format'
);

export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  firstName: z.string().min(2, 'First name too short').max(100),
  lastName: z.string().min(2, 'Last name too short').max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Address schemas
export const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  postalCode: z.string().min(4, 'Postal code is required').max(20),
  country: z.string().max(100).default('India'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

// Product schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required').max(100),
  description: z.string().max(1000).optional(),
  unit: z.enum(['LITER', 'PACKET', 'BOTTLE']),
  unitQuantity: z.number().positive().default(1),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const productPricingSchema = z.object({
  productId: uuidSchema,
  pricePerUnit: z.number().positive('Price must be positive'),
  effectiveFrom: dateSchema,
  effectiveTo: dateSchema.optional(),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  productId: uuidSchema,
  addressId: uuidSchema,
  quantity: z.number().positive('Quantity must be positive'),
  frequency: z.enum(['DAILY', 'ALTERNATE', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM']),
  customDays: z
    .array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    .optional(),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
});

export const updateSubscriptionSchema = z.object({
  productId: uuidSchema.optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  frequency: z
    .enum(['DAILY', 'ALTERNATE', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM'])
    .optional(),
  customDays: z
    .array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    .optional(),
});

export const pauseSubscriptionSchema = z.object({
  pauseStartDate: dateSchema,
  pauseEndDate: dateSchema,
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

// Vacation schemas
export const vacationSchema = z.object({
  subscriptionId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  reason: z.string().max(255).optional(),
});

// Ad-hoc request schemas
export const adhocRequestItemSchema = z.object({
  productId: uuidSchema,
  requestedDate: dateSchema,
  quantity: z.number().positive('Quantity must be positive'),
});

export const createAdhocRequestSchema = z.object({
  addressId: uuidSchema,
  items: z.array(adhocRequestItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(500).optional(),
});

export const reviewAdhocRequestSchema = z.object({
  action: z.enum(['approve', 'reject', 'partial']),
  adminNotes: z.string().max(500).optional(),
  itemDecisions: z
    .array(
      z.object({
        itemId: uuidSchema,
        approved: z.boolean(),
        rejectionReason: z.string().max(255).optional(),
      })
    )
    .optional(), // Required for partial approval
});

// Delivery schemas
export const updateDeliverySchema = z.object({
  status: z.enum(['SCHEDULED', 'DELIVERED', 'PARTIAL', 'MISSED', 'CANCELLED']),
  deliveredQuantity: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

export const reportDeliveryIssueSchema = z.object({
  issueDescription: z.string().min(10, 'Please describe the issue').max(500),
});

// Payment schemas
export const initiatePaymentSchema = z.object({
  billId: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['ONLINE', 'UPI', 'CARD', 'NETBANKING', 'WALLET']),
});

export const recordPaymentSchema = z.object({
  billId: uuidSchema,
  customerId: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['ONLINE', 'UPI', 'CARD', 'NETBANKING', 'WALLET', 'CASH', 'CHEQUE']),
  transactionId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Bill generation schema
export const generateBillSchema = z.object({
  customerId: uuidSchema.optional(), // If not provided, generate for all
  billingPeriodStart: dateSchema,
  billingPeriodEnd: dateSchema,
});

// Notification schema
export const sendNotificationSchema = z.object({
  userId: uuidSchema.optional(), // If not provided, broadcast
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  type: z.enum(['DELIVERY', 'PAYMENT', 'SUBSCRIPTION', 'ANNOUNCEMENT', 'ALERT', 'ADHOC_REQUEST']),
  channel: z.enum(['APP', 'EMAIL', 'SMS', 'PUSH']).default('APP'),
});

// Holiday schema
export const holidaySchema = z.object({
  date: dateSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Adhoc capacity schema
export const adhocCapacitySchema = z.object({
  date: dateSchema,
  maxAdhocRequests: z.number().int().positive().default(50),
  isBlocked: z.boolean().default(false),
  blockReason: z.string().max(255).optional(),
});

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
});

// Date range query schema
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type VacationInput = z.infer<typeof vacationSchema>;
export type CreateAdhocRequestInput = z.infer<typeof createAdhocRequestSchema>;
export type ReviewAdhocRequestInput = z.infer<typeof reviewAdhocRequestSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
