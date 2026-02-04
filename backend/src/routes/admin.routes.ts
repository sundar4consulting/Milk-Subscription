import { Router } from 'express';
import { asyncHandler, authenticate, isAdmin } from '../middleware/index.js';
import { validate } from '../middleware/validate.js';
import {
  customerService,
  productService,
  subscriptionService,
  adhocRequestService,
  deliveryService,
  billingService,
} from '../services/index.js';
import prisma from '../config/database.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/errors.js';
import {
  productSchema,
  productPricingSchema,
  reviewAdhocRequestSchema,
  adhocCapacitySchema,
  updateDeliverySchema,
  generateBillSchema,
  recordPaymentSchema,
  holidaySchema,
  paginationSchema,
} from '../utils/validators.js';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from 'date-fns';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// ==================== DASHBOARD ====================

/**
 * GET /api/admin/dashboard
 * Get admin dashboard metrics
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    const [
      totalCustomers,
      activeSubscriptions,
      todayDeliveries,
      pendingAdhocRequests,
      pendingPayments,
      monthlyRevenue,
      newRegistrations,
    ] = await Promise.all([
      prisma.customerProfile.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.delivery.findMany({
        where: {
          deliveryDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.adhocRequest.count({ where: { status: 'PENDING' } }),
      prisma.bill.count({ where: { status: { in: ['GENERATED', 'SENT', 'OVERDUE'] } } }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentDate: { gte: startMonth, lte: endMonth },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: subDays(today, 7) },
        },
      }),
    ]);

    const deliverySummary = {
      total: todayDeliveries.length,
      scheduled: todayDeliveries.filter((d) => d.status === 'SCHEDULED').length,
      delivered: todayDeliveries.filter((d) => d.status === 'DELIVERED').length,
      missed: todayDeliveries.filter((d) => d.status === 'MISSED').length,
    };

    sendSuccess(res, 'Dashboard data retrieved successfully', {
      totalCustomers,
      activeSubscriptions,
      deliverySummary,
      pendingAdhocRequests,
      pendingPayments,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      newRegistrations,
    });
  })
);

// ==================== CUSTOMERS ====================

/**
 * GET /api/admin/customers
 * List all customers
 */
router.get(
  '/customers',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await customerService.getAllCustomers(req.query as any, {
      status: req.query.status as any,
      search: req.query.search as string,
    });
    sendSuccess(res, 'Customers retrieved successfully', result.customers, result.pagination);
  })
);

/**
 * GET /api/admin/customers/:id
 * Get customer details
 */
router.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await customerService.getProfileById(req.params.id);
    sendSuccess(res, 'Customer retrieved successfully', customer);
  })
);

/**
 * PUT /api/admin/customers/:id/status
 * Update customer status
 */
router.put(
  '/customers/:id/status',
  asyncHandler(async (req, res) => {
    const customer = await customerService.updateCustomerStatus(req.params.id, req.body.status);
    sendSuccess(res, 'Customer status updated successfully', customer);
  })
);

// ==================== PRODUCTS ====================

/**
 * GET /api/admin/products
 * List all products
 */
router.get(
  '/products',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await productService.getAll(req.query as any, includeInactive);
    sendSuccess(res, 'Products retrieved successfully', result.products, result.pagination);
  })
);

/**
 * POST /api/admin/products
 * Create a product
 */
router.post(
  '/products',
  validate(productSchema.extend({ initialPrice: require('zod').z.number().positive() })),
  asyncHandler(async (req, res) => {
    const { initialPrice, ...productData } = req.body;
    const product = await productService.create(productData, initialPrice);
    sendCreated(res, 'Product created successfully', product);
  })
);

/**
 * GET /api/admin/products/:id
 * Get product details
 */
router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    sendSuccess(res, 'Product retrieved successfully', product);
  })
);

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put(
  '/products/:id',
  validate(productSchema.partial()),
  asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, 'Product updated successfully', product);
  })
);

/**
 * DELETE /api/admin/products/:id
 * Delete product
 */
router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);
    sendNoContent(res);
  })
);

/**
 * POST /api/admin/products/:id/pricing
 * Set new pricing
 */
router.post(
  '/products/:id/pricing',
  asyncHandler(async (req, res) => {
    const pricing = await productService.setPricing(
      req.params.id,
      req.body.pricePerUnit,
      new Date(req.body.effectiveFrom)
    );
    sendCreated(res, 'Pricing updated successfully', pricing);
  })
);

// ==================== SUBSCRIPTIONS ====================

/**
 * GET /api/admin/subscriptions
 * List all subscriptions
 */
router.get(
  '/subscriptions',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.getAll(req.query as any, {
      status: req.query.status as any,
      productId: req.query.productId as string,
      frequency: req.query.frequency as any,
    });
    sendSuccess(res, 'Subscriptions retrieved successfully', result.subscriptions, result.pagination);
  })
);

/**
 * GET /api/admin/subscriptions/:id
 * Get subscription details
 */
router.get(
  '/subscriptions/:id',
  asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.getById(req.params.id);
    sendSuccess(res, 'Subscription retrieved successfully', subscription);
  })
);

// ==================== ADHOC REQUESTS ====================

/**
 * GET /api/admin/adhoc-requests
 * List all adhoc requests
 */
router.get(
  '/adhoc-requests',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await adhocRequestService.getAll(req.query as any, {
      status: req.query.status as any,
      customerId: req.query.customerId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    sendSuccess(res, 'Adhoc requests retrieved successfully', result.requests, result.pagination);
  })
);

/**
 * GET /api/admin/adhoc-requests/pending
 * List pending adhoc requests
 */
router.get(
  '/adhoc-requests/pending',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await adhocRequestService.getAll(req.query as any, {
      status: 'PENDING',
    });
    sendSuccess(res, 'Pending requests retrieved successfully', result.requests, result.pagination);
  })
);

/**
 * GET /api/admin/adhoc-requests/analytics
 * Get adhoc request analytics
 */
router.get(
  '/adhoc-requests/analytics',
  asyncHandler(async (req, res) => {
    const startDate = (req.query.startDate as string) || startOfMonth(new Date()).toISOString();
    const endDate = (req.query.endDate as string) || endOfMonth(new Date()).toISOString();

    const analytics = await adhocRequestService.getAnalytics(startDate, endDate);
    sendSuccess(res, 'Analytics retrieved successfully', analytics);
  })
);

/**
 * GET /api/admin/adhoc-requests/:id
 * Get adhoc request details
 */
router.get(
  '/adhoc-requests/:id',
  asyncHandler(async (req, res) => {
    const request = await adhocRequestService.getById(req.params.id);
    sendSuccess(res, 'Adhoc request retrieved successfully', request);
  })
);

/**
 * POST /api/admin/adhoc-requests/:id/approve
 * Approve adhoc request
 */
router.post(
  '/adhoc-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const request = await adhocRequestService.review(req.params.id, req.user!.userId, {
      action: 'approve',
      adminNotes: req.body.adminNotes,
    });
    sendSuccess(res, 'Request approved successfully', request);
  })
);

/**
 * POST /api/admin/adhoc-requests/:id/reject
 * Reject adhoc request
 */
router.post(
  '/adhoc-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const request = await adhocRequestService.review(req.params.id, req.user!.userId, {
      action: 'reject',
      adminNotes: req.body.adminNotes,
    });
    sendSuccess(res, 'Request rejected successfully', request);
  })
);

/**
 * POST /api/admin/adhoc-requests/:id/partial
 * Partial approval
 */
router.post(
  '/adhoc-requests/:id/partial',
  validate(reviewAdhocRequestSchema),
  asyncHandler(async (req, res) => {
    const request = await adhocRequestService.review(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, 'Request partially approved', request);
  })
);

/**
 * GET /api/admin/adhoc-capacity/:date
 * Get capacity for a date
 */
router.get(
  '/adhoc-capacity/:date',
  asyncHandler(async (req, res) => {
    const capacity = await adhocRequestService.getCapacity(req.params.date, req.params.date);
    sendSuccess(res, 'Capacity retrieved successfully', capacity[0]);
  })
);

/**
 * PUT /api/admin/adhoc-capacity/:date
 * Update capacity settings
 */
router.put(
  '/adhoc-capacity/:date',
  asyncHandler(async (req, res) => {
    const capacity = await adhocRequestService.updateCapacitySettings(req.params.date, req.body);
    sendSuccess(res, 'Capacity updated successfully', capacity);
  })
);

// ==================== DELIVERIES ====================

/**
 * GET /api/admin/deliveries
 * List all deliveries
 */
router.get(
  '/deliveries',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await deliveryService.getAll(req.query as any, {
      date: req.query.date as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      status: req.query.status as any,
      type: req.query.type as any,
      deliveryPersonId: req.query.deliveryPersonId as string,
    });
    sendSuccess(res, 'Deliveries retrieved successfully', result.deliveries, result.pagination);
  })
);

/**
 * GET /api/admin/deliveries/today
 * Get today's delivery schedule
 */
router.get(
  '/deliveries/today',
  asyncHandler(async (req, res) => {
    const result = await deliveryService.getTodaySchedule();
    sendSuccess(res, 'Today schedule retrieved successfully', result);
  })
);

/**
 * PUT /api/admin/deliveries/:id
 * Update delivery status
 */
router.put(
  '/deliveries/:id',
  validate(updateDeliverySchema),
  asyncHandler(async (req, res) => {
    const delivery = await deliveryService.updateStatus(req.params.id, req.body);
    sendSuccess(res, 'Delivery updated successfully', delivery);
  })
);

/**
 * POST /api/admin/deliveries/bulk-update
 * Bulk update deliveries
 */
router.post(
  '/deliveries/bulk-update',
  asyncHandler(async (req, res) => {
    const result = await deliveryService.bulkUpdateStatus(req.body.deliveryIds, {
      status: req.body.status,
      deliveryPersonId: req.body.deliveryPersonId,
    });
    sendSuccess(res, 'Deliveries updated successfully', result);
  })
);

/**
 * POST /api/admin/deliveries/generate
 * Generate delivery schedule
 */
router.post(
  '/deliveries/generate',
  asyncHandler(async (req, res) => {
    const result = await deliveryService.generateSchedule(
      req.body.startDate,
      req.body.endDate
    );
    sendSuccess(res, 'Schedule generated successfully', result);
  })
);

// ==================== BILLING ====================

/**
 * GET /api/admin/bills
 * List all bills
 */
router.get(
  '/bills',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await billingService.getAllBills(req.query as any, {
      status: req.query.status as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      customerId: req.query.customerId as string,
    });
    sendSuccess(res, 'Bills retrieved successfully', result.bills, result.pagination);
  })
);

/**
 * POST /api/admin/bills/generate
 * Generate bills for a period
 */
router.post(
  '/bills/generate',
  validate(generateBillSchema),
  asyncHandler(async (req, res) => {
    const result = await billingService.generateBillsForPeriod(
      new Date(req.body.billingPeriodStart),
      new Date(req.body.billingPeriodEnd)
    );
    sendSuccess(res, 'Bills generated successfully', result);
  })
);

/**
 * GET /api/admin/bills/:id
 * Get bill details
 */
router.get(
  '/bills/:id',
  asyncHandler(async (req, res) => {
    const bill = await billingService.getBillById(req.params.id);
    sendSuccess(res, 'Bill retrieved successfully', bill);
  })
);

/**
 * PUT /api/admin/bills/:id
 * Update bill status
 */
router.put(
  '/bills/:id',
  asyncHandler(async (req, res) => {
    const bill = await billingService.updateBillStatus(req.params.id, req.body.status);
    sendSuccess(res, 'Bill updated successfully', bill);
  })
);

/**
 * POST /api/admin/payments/manual
 * Record manual payment
 */
router.post(
  '/payments/manual',
  validate(recordPaymentSchema),
  asyncHandler(async (req, res) => {
    const payment = await billingService.recordPayment(req.body);
    sendCreated(res, 'Payment recorded successfully', payment);
  })
);

// ==================== HOLIDAYS ====================

/**
 * GET /api/admin/holidays
 * List holidays
 */
router.get(
  '/holidays',
  asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      orderBy: { date: 'asc' },
    });
    sendSuccess(res, 'Holidays retrieved successfully', holidays);
  })
);

/**
 * POST /api/admin/holidays
 * Add holiday
 */
router.post(
  '/holidays',
  validate(holidaySchema),
  asyncHandler(async (req, res) => {
    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(req.body.date),
        name: req.body.name,
        description: req.body.description,
      },
    });
    sendCreated(res, 'Holiday added successfully', holiday);
  })
);

/**
 * DELETE /api/admin/holidays/:id
 * Delete holiday
 */
router.delete(
  '/holidays/:id',
  asyncHandler(async (req, res) => {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    sendNoContent(res);
  })
);

// ==================== DELIVERY PERSONS ====================

/**
 * GET /api/admin/delivery-persons
 * List delivery persons
 */
router.get(
  '/delivery-persons',
  asyncHandler(async (req, res) => {
    const deliveryPersons = await prisma.user.findMany({
      where: { role: 'DELIVERY_PERSON' },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
    sendSuccess(res, 'Delivery persons retrieved successfully', deliveryPersons);
  })
);

// ==================== SETTINGS ====================

/**
 * GET /api/admin/settings
 * Get system settings
 */
router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    sendSuccess(res, 'Settings retrieved successfully', settingsMap);
  })
);

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemSettings.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }
    sendSuccess(res, 'Settings updated successfully');
  })
);

export default router;
