import { PrismaClient, UserRole, SubscriptionFrequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@milksubscription.com',
      phone: '+919999999999',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Delivery Person
  const deliveryPassword = await bcrypt.hash('delivery123', 10);
  const deliveryPerson = await prisma.user.create({
    data: {
      email: 'delivery@milksubscription.com',
      phone: '+919999999998',
      passwordHash: deliveryPassword,
      name: 'Delivery Person',
      role: UserRole.DELIVERY_PERSON,
    },
  });
  console.log('✅ Delivery person created:', deliveryPerson.email);

  // Create Sample Customer User
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      phone: '+919999999997',
      passwordHash: customerPassword,
      name: 'John Doe',
      role: UserRole.CUSTOMER,
    },
  });
  console.log('✅ Customer user created:', customerUser.email);

  // Create Customer Profile
  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
    },
  });

  // Create Customer Address
  const address = await prisma.address.create({
    data: {
      customerId: customer.id,
      label: 'Home',
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      isDefault: true,
    },
  });
  console.log('✅ Customer address created');

  // Create Customer Wallet
  await prisma.wallet.create({
    data: {
      customerId: customer.id,
      balance: 500, // Initial wallet balance
    },
  });
  console.log('✅ Customer wallet created');

  // Create Products
  const productsData = [
    {
      name: 'Full Cream Milk',
      description: 'Rich and creamy full-fat milk with 3.5% fat content',
      unit: 'liter',
      pricePerUnit: 50,
      category: 'MILK',
      imageUrl: '/images/full-cream.jpg',
      pricingHistory: [{ price: 50, startDate: new Date('2024-01-01') }],
    },
    {
      name: 'Toned Milk',
      description: 'Light milk with reduced fat content (1.5% fat)',
      unit: 'liter',
      pricePerUnit: 45,
      category: 'MILK',
      imageUrl: '/images/toned.jpg',
      pricingHistory: [{ price: 45, startDate: new Date('2024-01-01') }],
    },
    {
      name: 'Skimmed Milk',
      description: 'Fat-free milk for health-conscious consumers (0.5% fat)',
      unit: 'liter',
      pricePerUnit: 40,
      category: 'MILK',
      imageUrl: '/images/skimmed.jpg',
      pricingHistory: [{ price: 40, startDate: new Date('2024-01-01') }],
    },
    {
      name: 'Organic Milk',
      description: 'Premium organic milk from grass-fed cows',
      unit: 'liter',
      pricePerUnit: 75,
      category: 'ORGANIC',
      imageUrl: '/images/organic.jpg',
      pricingHistory: [{ price: 75, startDate: new Date('2024-01-01') }],
    },
    {
      name: 'Buffalo Milk',
      description: 'Traditional buffalo milk with high fat content (6% fat)',
      unit: 'liter',
      pricePerUnit: 60,
      category: 'MILK',
      imageUrl: '/images/buffalo.jpg',
      pricingHistory: [{ price: 60, startDate: new Date('2024-01-01') }],
    },
    {
      name: 'A2 Milk',
      description: 'Premium A2 protein milk from indigenous cow breeds',
      unit: 'liter',
      pricePerUnit: 80,
      category: 'PREMIUM',
      imageUrl: '/images/a2-milk.jpg',
      pricingHistory: [{ price: 80, startDate: new Date('2024-01-01') }],
    },
  ];

  const products = [];
  for (const productData of productsData) {
    const product = await prisma.product.create({
      data: productData,
    });
    products.push(product);
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create System Holidays for 2025-2026
  const holidays = [
    { date: new Date('2025-01-26'), name: 'Republic Day', description: 'National holiday' },
    { date: new Date('2025-03-14'), name: 'Holi', description: 'Festival of colors' },
    { date: new Date('2025-04-18'), name: 'Good Friday', description: 'Christian holiday' },
    { date: new Date('2025-05-01'), name: 'May Day', description: 'Labour Day' },
    { date: new Date('2025-08-15'), name: 'Independence Day', description: 'National holiday' },
    { date: new Date('2025-10-02'), name: 'Gandhi Jayanti', description: 'National holiday' },
    { date: new Date('2025-10-20'), name: 'Diwali', description: 'Festival of lights' },
    { date: new Date('2025-12-25'), name: 'Christmas', description: 'Christian holiday' },
    { date: new Date('2026-01-26'), name: 'Republic Day', description: 'National holiday' },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({
      data: holiday,
    });
  }
  console.log('✅ System holidays created for 2025-2026');

  // Create System Settings
  const settings = [
    { key: 'billing_cycle_day', value: '1', type: 'number', category: 'billing' },
    { key: 'payment_due_day', value: '10', type: 'number', category: 'billing' },
    { key: 'late_fee_day', value: '15', type: 'number', category: 'billing' },
    { key: 'late_fee_percentage', value: '5', type: 'number', category: 'billing' },
    { key: 'grace_period_days', value: '5', type: 'number', category: 'billing' },
    { key: 'min_subscription_days', value: '30', type: 'number', category: 'subscription' },
    { key: 'max_pause_days', value: '30', type: 'number', category: 'subscription' },
    { key: 'cancellation_notice_days', value: '3', type: 'number', category: 'subscription' },
    { key: 'adhoc_min_advance_days', value: '1', type: 'number', category: 'adhoc' },
    { key: 'adhoc_max_advance_days', value: '30', type: 'number', category: 'adhoc' },
    { key: 'adhoc_default_capacity', value: '50', type: 'number', category: 'adhoc' },
    { key: 'adhoc_auto_expire_hours', value: '24', type: 'number', category: 'adhoc' },
    { key: 'adhoc_cancel_before_hours', value: '12', type: 'number', category: 'adhoc' },
    { key: 'tax_percentage', value: '5', type: 'number', category: 'billing' },
    { key: 'currency_code', value: 'INR', type: 'string', category: 'general' },
    { key: 'currency_symbol', value: '₹', type: 'string', category: 'general' },
    { key: 'company_name', value: 'Fresh Milk Subscription', type: 'string', category: 'general' },
    { key: 'support_email', value: 'support@milksubscription.com', type: 'string', category: 'general' },
    { key: 'support_phone', value: '+91 1800 123 4567', type: 'string', category: 'general' },
    { key: 'delivery_slots', value: JSON.stringify(['MORNING', 'EVENING']), type: 'json', category: 'delivery' },
    { key: 'service_areas', value: JSON.stringify(['Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Chennai']), type: 'json', category: 'delivery' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.create({
      data: setting,
    });
  }
  console.log('✅ System settings configured');

  // Create sample subscription for demo customer
  const subscription = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      productId: products[0].id, // Full Cream Milk
      addressId: address.id,
      quantity: 1,
      frequency: SubscriptionFrequency.DAILY,
      startDate: new Date(),
      deliverySlot: 'MORNING',
      history: [
        {
          changeType: 'CREATED',
          newValue: JSON.stringify({ quantity: 1, frequency: 'DAILY' }),
          changedAt: new Date(),
        },
      ],
    },
  });
  console.log('✅ Sample subscription created');

  // Create a notification for the customer
  await prisma.notification.create({
    data: {
      customerId: customer.id,
      type: 'SUBSCRIPTION',
      channel: 'IN_APP',
      title: 'Welcome to Fresh Milk Subscription!',
      message: 'Your subscription has been activated. You will start receiving deliveries from tomorrow.',
      isRead: false,
    },
  });
  console.log('✅ Welcome notification created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('   Admin: admin@milksubscription.com / admin123');
  console.log('   Customer: customer@example.com / customer123');
  console.log('   Delivery: delivery@milksubscription.com / delivery123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
