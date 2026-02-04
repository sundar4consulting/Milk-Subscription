import { PrismaClient, UserRole, ProductUnit, SubscriptionFrequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@milksubscription.com' },
    update: {},
    create: {
      email: 'admin@milksubscription.com',
      phone: '+919999999999',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Delivery Person
  const deliveryPassword = await bcrypt.hash('delivery123', 10);
  const deliveryPerson = await prisma.user.upsert({
    where: { email: 'delivery@milksubscription.com' },
    update: {},
    create: {
      email: 'delivery@milksubscription.com',
      phone: '+919999999998',
      passwordHash: deliveryPassword,
      role: UserRole.DELIVERY_PERSON,
    },
  });
  console.log('✅ Delivery person created:', deliveryPerson.email);

  // Create Sample Customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      phone: '+919999999997',
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
      customerProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          addresses: {
            create: {
              addressLine1: '123 Main Street',
              addressLine2: 'Apartment 4B',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400001',
              country: 'India',
              isDefault: true,
            },
          },
          wallet: {
            create: {
              balance: 0,
            },
          },
        },
      },
    },
    include: {
      customerProfile: {
        include: {
          addresses: true,
        },
      },
    },
  });
  console.log('✅ Sample customer created:', customer.email);

  // Create Products
  const products = [
    {
      name: 'Full Cream Milk',
      description: 'Rich and creamy full-fat milk with 3.5% fat content',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/full-cream.jpg',
    },
    {
      name: 'Toned Milk',
      description: 'Light milk with reduced fat content (1.5% fat)',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/toned.jpg',
    },
    {
      name: 'Skimmed Milk',
      description: 'Fat-free milk for health-conscious consumers (0.5% fat)',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/skimmed.jpg',
    },
    {
      name: 'Organic Milk',
      description: 'Premium organic milk from grass-fed cows',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/organic.jpg',
    },
    {
      name: 'Buffalo Milk',
      description: 'Traditional buffalo milk with high fat content (6% fat)',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/buffalo.jpg',
    },
    {
      name: 'A2 Milk',
      description: 'Premium A2 protein milk from indigenous cow breeds',
      unit: ProductUnit.LITER,
      unitQuantity: 1,
      imageUrl: '/images/a2-milk.jpg',
    },
  ];

  const productPrices = [50, 45, 40, 75, 60, 80]; // Prices in INR

  for (let i = 0; i < products.length; i++) {
    const product = await prisma.product.upsert({
      where: { id: `product-${i + 1}` },
      update: {},
      create: {
        id: `product-${i + 1}`,
        ...products[i],
        pricing: {
          create: {
            pricePerUnit: productPrices[i],
            effectiveFrom: new Date('2024-01-01'),
          },
        },
      },
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create System Holidays for 2026
  const holidays2026 = [
    { date: new Date('2026-01-26'), name: 'Republic Day' },
    { date: new Date('2026-03-10'), name: 'Holi' },
    { date: new Date('2026-04-02'), name: 'Good Friday' },
    { date: new Date('2026-05-01'), name: 'May Day' },
    { date: new Date('2026-08-15'), name: 'Independence Day' },
    { date: new Date('2026-10-02'), name: 'Gandhi Jayanti' },
    { date: new Date('2026-10-20'), name: 'Diwali' },
    { date: new Date('2026-12-25'), name: 'Christmas' },
  ];

  for (const holiday of holidays2026) {
    await prisma.holiday.upsert({
      where: { date: holiday.date },
      update: {},
      create: holiday,
    });
  }
  console.log('✅ System holidays created for 2026');

  // Create System Settings
  const settings = [
    { key: 'billing_cycle_day', value: { day: 1 } },
    { key: 'payment_due_day', value: { day: 10 } },
    { key: 'late_fee_day', value: { day: 15 } },
    { key: 'late_fee_percentage', value: { percentage: 5 } },
    { key: 'grace_period_days', value: { days: 5 } },
    { key: 'min_subscription_days', value: { days: 30 } },
    { key: 'max_pause_days', value: { days: 30 } },
    { key: 'cancellation_notice_days', value: { days: 3 } },
    { key: 'adhoc_min_advance_days', value: { days: 1 } },
    { key: 'adhoc_max_advance_days', value: { days: 30 } },
    { key: 'adhoc_default_capacity', value: { capacity: 50 } },
    { key: 'adhoc_auto_expire_hours', value: { hours: 24 } },
    { key: 'adhoc_cancel_before_hours', value: { hours: 12 } },
    { key: 'tax_percentage', value: { gst: 5 } },
    { key: 'currency', value: { code: 'INR', symbol: '₹' } },
    { key: 'service_areas', value: { cities: ['Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Chennai'] } },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ System settings configured');

  // Create sample subscription for demo customer
  if (customer.customerProfile) {
    const subscription = await prisma.subscription.create({
      data: {
        customerId: customer.customerProfile.id,
        productId: 'product-1', // Full Cream Milk
        addressId: customer.customerProfile.addresses[0].id,
        quantity: 1,
        frequency: SubscriptionFrequency.DAILY,
        startDate: new Date('2026-01-01'),
      },
    });
    console.log('✅ Sample subscription created');

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        changeType: 'CREATED',
        newValues: {
          quantity: 1,
          frequency: 'DAILY',
          productId: 'product-1',
        },
        changedBy: customer.id,
      },
    });
  }

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
