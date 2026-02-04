import { Router } from 'express';
import { asyncHandler, authenticate, isCustomer } from '../middleware/index.js';
import { validate } from '../middleware/validate.js';
import {
  customerService,
  subscriptionService,
  adhocRequestService,
  deliveryService,
  billingService,
} from '../services/index.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/errors.js';
import {
  addressSchema,
  updateProfileSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  pauseSubscriptionSchema,
  cancelSubscriptionSchema,
  vacationSchema,
  createAdhocRequestSchema,
  reportDeliveryIssueSchema,
  initiatePaymentSchema,
  paginationSchema,
  dateRangeSchema,
} from '../utils/validators.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(isCustomer);

// ==================== PROFILE ====================

/**
 * GET /api/customer/profile
 * Get customer profile
 */
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    sendSuccess(res, 'Profile retrieved successfully', profile);
  })
);

/**
 * PUT /api/customer/profile
 * Update customer profile
 */
router.put(
  '/profile',
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, 'Profile updated successfully', profile);
  })
);

// ==================== ADDRESSES ====================

/**
 * GET /api/customer/addresses
 * Get all addresses
 */
router.get(
  '/addresses',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const addresses = await customerService.getAddresses(profile.id);
    sendSuccess(res, 'Addresses retrieved successfully', addresses);
  })
);

/**
 * POST /api/customer/addresses
 * Add a new address
 */
router.post(
  '/addresses',
  validate(addressSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const address = await customerService.addAddress(profile.id, req.body);
    sendCreated(res, 'Address added successfully', address);
  })
);

/**
 * PUT /api/customer/addresses/:id
 * Update an address
 */
router.put(
  '/addresses/:id',
  validate(addressSchema.partial()),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const address = await customerService.updateAddress(profile.id, req.params.id, req.body);
    sendSuccess(res, 'Address updated successfully', address);
  })
);

/**
 * DELETE /api/customer/addresses/:id
 * Delete an address
 */
router.delete(
  '/addresses/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    await customerService.deleteAddress(profile.id, req.params.id);
    sendNoContent(res);
  })
);

// ==================== SUBSCRIPTIONS ====================

/**
 * GET /api/customer/subscriptions
 * List customer subscriptions
 */
router.get(
  '/subscriptions',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const result = await subscriptionService.getByCustomer(profile.id, req.query as any);
    sendSuccess(res, 'Subscriptions retrieved successfully', result.subscriptions, result.pagination);
  })
);

/**
 * POST /api/customer/subscriptions
 * Create a new subscription
 */
router.post(
  '/subscriptions',
  validate(createSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.create(profile.id, req.body);
    sendCreated(res, 'Subscription created successfully', subscription);
  })
);

/**
 * GET /api/customer/subscriptions/:id
 * Get subscription details
 */
router.get(
  '/subscriptions/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.getById(req.params.id, profile.id);
    sendSuccess(res, 'Subscription retrieved successfully', subscription);
  })
);

/**
 * PUT /api/customer/subscriptions/:id
 * Update subscription
 */
router.put(
  '/subscriptions/:id',
  validate(updateSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.update(req.params.id, profile.id, req.body);
    sendSuccess(res, 'Subscription updated successfully', subscription);
  })
);

/**
 * POST /api/customer/subscriptions/:id/pause
 * Pause subscription
 */
router.post(
  '/subscriptions/:id/pause',
  validate(pauseSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.pause(
      req.params.id,
      profile.id,
      req.body.pauseStartDate,
      req.body.pauseEndDate
    );
    sendSuccess(res, 'Subscription paused successfully', subscription);
  })
);

/**
 * POST /api/customer/subscriptions/:id/resume
 * Resume subscription
 */
router.post(
  '/subscriptions/:id/resume',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.resume(req.params.id, profile.id);
    sendSuccess(res, 'Subscription resumed successfully', subscription);
  })
);

/**
 * POST /api/customer/subscriptions/:id/cancel
 * Cancel subscription
 */
router.post(
  '/subscriptions/:id/cancel',
  validate(cancelSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscription = await subscriptionService.cancel(req.params.id, profile.id, req.body.reason);
    sendSuccess(res, 'Subscription cancelled successfully', subscription);
  })
);

// ==================== VACATIONS ====================

/**
 * GET /api/customer/vacations
 * List vacations
 */
router.get(
  '/vacations',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const subscriptions = await subscriptionService.getByCustomer(profile.id, {
      page: 1,
      limit: 100,
      sortOrder: 'desc',
    });

    const vacations = subscriptions.subscriptions.flatMap((s: any) => s.vacations || []);
    sendSuccess(res, 'Vacations retrieved successfully', vacations);
  })
);

/**
 * POST /api/customer/vacations
 * Add vacation dates
 */
router.post(
  '/vacations',
  validate(vacationSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    // Verify subscription ownership
    await subscriptionService.getById(req.body.subscriptionId, profile.id);

    const vacation = await import('../config/database.js').then((db) =>
      db.default.vacation.create({
        data: {
          subscriptionId: req.body.subscriptionId,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
          reason: req.body.reason,
        },
      })
    );

    sendCreated(res, 'Vacation added successfully', vacation);
  })
);

/**
 * DELETE /api/customer/vacations/:id
 * Delete vacation
 */
router.delete(
  '/vacations/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);

    const prisma = (await import('../config/database.js')).default;
    const vacation = await prisma.vacation.findUnique({
      where: { id: req.params.id },
      include: { subscription: true },
    });

    if (!vacation || vacation.subscription.customerId !== profile.id) {
      throw new (await import('../utils/errors.js')).NotFoundError('Vacation not found');
    }

    await prisma.vacation.delete({ where: { id: req.params.id } });
    sendNoContent(res);
  })
);

// ==================== ADHOC REQUESTS ====================

/**
 * GET /api/customer/adhoc-requests
 * List adhoc requests
 */
router.get(
  '/adhoc-requests',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const status = req.query.status as string | undefined;
    const result = await adhocRequestService.getByCustomer(
      profile.id,
      req.query as any,
      status as any
    );
    sendSuccess(res, 'Adhoc requests retrieved successfully', result.requests, result.pagination);
  })
);

/**
 * POST /api/customer/adhoc-requests
 * Create adhoc request
 */
router.post(
  '/adhoc-requests',
  validate(createAdhocRequestSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const request = await adhocRequestService.create(profile.id, req.body);
    sendCreated(res, 'Adhoc request created successfully', request);
  })
);

/**
 * GET /api/customer/adhoc-requests/availability
 * Check date availability
 */
router.get(
  '/adhoc-requests/availability',
  validate(dateRangeSchema, 'query'),
  asyncHandler(async (req, res) => {
    const capacity = await adhocRequestService.getCapacity(
      req.query.startDate as string,
      req.query.endDate as string
    );
    sendSuccess(res, 'Availability retrieved successfully', capacity);
  })
);

/**
 * GET /api/customer/adhoc-requests/:id
 * Get adhoc request details
 */
router.get(
  '/adhoc-requests/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const request = await adhocRequestService.getById(req.params.id, profile.id);
    sendSuccess(res, 'Adhoc request retrieved successfully', request);
  })
);

/**
 * PUT /api/customer/adhoc-requests/:id
 * Update adhoc request
 */
router.put(
  '/adhoc-requests/:id',
  validate(createAdhocRequestSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const request = await adhocRequestService.update(req.params.id, profile.id, req.body);
    sendSuccess(res, 'Adhoc request updated successfully', request);
  })
);

/**
 * DELETE /api/customer/adhoc-requests/:id
 * Cancel adhoc request
 */
router.delete(
  '/adhoc-requests/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    await adhocRequestService.cancel(req.params.id, profile.id);
    sendNoContent(res);
  })
);

// ==================== DELIVERIES ====================

/**
 * GET /api/customer/deliveries
 * List deliveries
 */
router.get(
  '/deliveries',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const result = await deliveryService.getCustomerDeliveries(profile.id, req.query as any, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      status: req.query.status as any,
      type: req.query.type as any,
    });
    sendSuccess(res, 'Deliveries retrieved successfully', result.deliveries, result.pagination);
  })
);

/**
 * GET /api/customer/deliveries/calendar
 * Get delivery calendar
 */
router.get(
  '/deliveries/calendar',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const calendar = await deliveryService.getCustomerCalendar(profile.id, month, year);
    sendSuccess(res, 'Calendar retrieved successfully', calendar);
  })
);

/**
 * GET /api/customer/deliveries/:id
 * Get delivery details
 */
router.get(
  '/deliveries/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const delivery = await deliveryService.getById(req.params.id, profile.id);
    sendSuccess(res, 'Delivery retrieved successfully', delivery);
  })
);

/**
 * POST /api/customer/deliveries/:id/report
 * Report delivery issue
 */
router.post(
  '/deliveries/:id/report',
  validate(reportDeliveryIssueSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const delivery = await deliveryService.reportIssue(
      req.params.id,
      profile.id,
      req.body.issueDescription
    );
    sendSuccess(res, 'Issue reported successfully', delivery);
  })
);

// ==================== BILLING ====================

/**
 * GET /api/customer/bills
 * List bills
 */
router.get(
  '/bills',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const result = await billingService.getCustomerBills(profile.id, req.query as any);
    sendSuccess(res, 'Bills retrieved successfully', result.bills, result.pagination);
  })
);

/**
 * GET /api/customer/bills/:id
 * Get bill details
 */
router.get(
  '/bills/:id',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const bill = await billingService.getBillById(req.params.id, profile.id);
    sendSuccess(res, 'Bill retrieved successfully', bill);
  })
);

// ==================== PAYMENTS ====================

/**
 * POST /api/customer/payments
 * Initiate payment
 */
router.post(
  '/payments',
  validate(initiatePaymentSchema),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const payment = await billingService.recordPayment({
      billId: req.body.billId,
      customerId: profile.id,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
    });
    sendCreated(res, 'Payment recorded successfully', payment);
  })
);

// ==================== WALLET ====================

/**
 * GET /api/customer/wallet
 * Get wallet balance
 */
router.get(
  '/wallet',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const wallet = await customerService.getWallet(profile.id);
    sendSuccess(res, 'Wallet retrieved successfully', wallet);
  })
);

/**
 * GET /api/customer/wallet/transactions
 * Get wallet transactions
 */
router.get(
  '/wallet/transactions',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const result = await customerService.getWalletTransactions(profile.id, req.query as any);
    sendSuccess(res, 'Transactions retrieved successfully', result.transactions, result.pagination);
  })
);

// ==================== DASHBOARD ====================

/**
 * GET /api/customer/dashboard/summary
 * Get dashboard summary
 */
router.get(
  '/dashboard/summary',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const dashboard = await billingService.getConsolidatedDashboard(profile.id, month, year);
    sendSuccess(res, 'Dashboard data retrieved successfully', dashboard);
  })
);

/**
 * GET /api/customer/dashboard/consolidated
 * Get consolidated view
 */
router.get(
  '/dashboard/consolidated',
  asyncHandler(async (req, res) => {
    const profile = await customerService.getProfileByUserId(req.user!.userId);
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const dashboard = await billingService.getConsolidatedDashboard(profile.id, month, year);
    sendSuccess(res, 'Consolidated data retrieved successfully', dashboard);
  })
);

export default router;
