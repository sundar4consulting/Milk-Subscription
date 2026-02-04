# Milk Subscription Platform Management - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Overview
A web-based subscription management platform for milk delivery services that enables customers to subscribe to monthly milk deliveries and allows administrators to manage deliveries, track payments, and maintain customer relationships.

### 1.2 Business Objectives
- Automate milk subscription management
- Provide transparent billing and delivery tracking
- Reduce manual intervention in payment calculations
- Enable real-time delivery status updates
- Streamline customer-admin communication

---

## 2. User Roles & Personas

### 2.1 Customer
- End consumers who subscribe to milk delivery
- Can manage their subscription, view delivery history, and make payments
- Receives notifications about deliveries and billing

### 2.2 Admin
- Platform administrators managing the milk delivery business
- Manages customers, deliveries, pricing, and payments
- Generates reports and handles exceptions

---

## 3. Core Features

### 3.1 Customer Portal Features

#### 3.1.1 Authentication & Profile
- User registration with email/phone verification
- Login with email/password or OTP
- Password reset functionality
- Profile management (name, address, contact details)
- Multiple delivery address support

#### 3.1.2 Subscription Management
- Browse available milk products (Full cream, Toned, Skimmed, Organic, etc.)
- Select quantity per delivery (in liters/packets)
- Choose delivery frequency:
  - Daily
  - Alternate days
  - Specific days of the week
  - Weekdays only
  - Weekends only
- Set subscription start date
- Pause/Resume subscription with date range
- Cancel subscription with reason
- Modify subscription (change quantity, product, frequency)

#### 3.1.3 Vacation/Holiday Management
- Mark vacation dates (no delivery needed)
- Bulk date selection for vacations
- Auto-adjustment of billing for vacation days
- Vacation calendar view

#### 3.1.4 Ad-hoc Milk Availability Request (NEW)
- **Request Extra Milk for Specific Dates**
  - Select specific dates from calendar for additional milk delivery
  - Choose product type and quantity for each date
  - Add notes/reason for the request (e.g., guests, event)
  - View availability calendar showing regular subscription vs ad-hoc requests
- **Request Submission & Tracking**
  - Submit request for admin approval
  - View status of pending requests (Pending/Approved/Rejected)
  - Receive notification on approval/rejection
  - Cancel pending request before approval
  - View history of all ad-hoc requests
- **Request Modification**
  - Modify pending requests (before approval)
  - Request date change for approved requests (requires re-approval)
- **Billing Integration**
  - Approved ad-hoc requests automatically added to monthly bill
  - Separate line item in bill for ad-hoc deliveries
  - View estimated cost before submitting request

#### 3.1.5 Delivery Tracking
- View daily delivery status (Delivered/Not Delivered/Pending)
- Delivery time tracking
- Report missed/damaged delivery
- View delivery history with filters (date range, status)
- Download delivery reports (PDF/Excel)

#### 3.1.6 Consolidated Member Dashboard (NEW)
- **Monthly Summary View**
  - Total milk delivered (in liters/units)
  - Total deliveries count (regular + ad-hoc)
  - Total cost breakdown
  - Savings from vacations/holidays
  - Payment status indicator
- **Visual Analytics**
  - Calendar heat map showing delivery days
  - Bar chart: Daily quantity delivered
  - Pie chart: Product-wise distribution
  - Line chart: Month-over-month consumption trend
- **Detailed Breakdown Table**
  | Date | Product | Qty | Rate | Amount | Type | Status |
  |------|---------|-----|------|--------|------|--------|
  | Date-wise rows with all delivery details |
- **Summary Cards**
  - Regular Subscription Deliveries: Count & Amount
  - Ad-hoc Request Deliveries: Count & Amount
  - Vacation Days: Count & Credits
  - Missed Deliveries: Count & Credits
  - Net Payable Amount
- **Filters & Export**
  - Filter by date range, product, delivery type
  - Export consolidated report (PDF/Excel)
  - Print-friendly view
  - Share via email

#### 3.1.7 Billing & Payments
- View current month's billing summary
- Itemized bill showing:
  - Total delivery days
  - Quantity delivered each day
  - Rate per unit
  - Vacation days (credited)
  - Missed deliveries (credited)
  - **Ad-hoc deliveries (additional charges)**
  - Total amount due
- View payment history
- Multiple payment options:
  - Online payment (UPI, Cards, Net Banking)
  - Wallet balance
  - Auto-debit setup
- Download invoices (PDF)
- Payment reminders and due date notifications

#### 3.1.8 Notifications & Alerts
- Delivery confirmation notifications
- Payment due reminders
- Subscription expiry alerts
- Price change notifications
- Service announcements
- **Ad-hoc request approval/rejection notifications**
- **Consolidated statement ready notification**

### 3.2 Admin Portal Features

#### 3.2.1 Dashboard
- Total active subscriptions count
- Today's delivery summary
- Pending payments overview
- New registrations
- Revenue metrics (daily, weekly, monthly)
- Alerts for issues requiring attention

#### 3.2.2 Customer Management
- View all customers with search and filters
- Customer details with subscription history
- Add/Edit/Deactivate customer accounts
- View customer's delivery and payment history
- Send notifications to individual/all customers
- Export customer data

#### 3.2.3 Product & Pricing Management
- Add/Edit/Delete milk products
- Set base prices per unit (liter/packet)
- Configure pricing tiers:
  - Standard pricing
  - Bulk discount pricing
  - Loyalty pricing
- Set effective date for price changes
- Price history tracking

#### 3.2.4 Subscription Management
- View all active/paused/cancelled subscriptions
- Create subscription on behalf of customer
- Modify any customer's subscription
- Approve/reject subscription changes
- Bulk subscription operations

#### 3.2.5 Ad-hoc Request Management (NEW)
- **Request Queue Dashboard**
  - View all pending ad-hoc requests
  - Filter by date, customer, product, status
  - Sort by request date, delivery date, priority
  - Count badges: Pending, Today's requests, Urgent
- **Request Review & Approval**
  - View request details (customer, dates, products, quantities)
  - Check delivery capacity for requested dates
  - Approve request with optional notes
  - Reject request with mandatory reason
  - Bulk approve/reject multiple requests
  - Partial approval (approve some dates, reject others)
- **Capacity Management**
  - View daily delivery capacity
  - Set maximum ad-hoc requests per day
  - Block dates for ad-hoc requests
  - Auto-reject if capacity exceeded
- **Request Analytics**
  - Most requested products
  - Peak request days/periods
  - Approval/rejection rates
  - Revenue from ad-hoc requests

#### 3.2.6 Delivery Management
- Daily delivery schedule generation
- Route optimization view
- Mark deliveries as:
  - Delivered
  - Not Delivered (with reason)
  - Partial Delivery
- Bulk delivery status update
- Assign delivery personnel
- Delivery personnel management
- Real-time delivery tracking
- **Include ad-hoc deliveries in daily schedule**
- **Differentiate regular vs ad-hoc in delivery list**
- **Visual indicator for ad-hoc requests in route**

#### 3.2.7 Billing & Payment Management
- Generate monthly bills (auto/manual)
- Bill generation settings:
  - Billing cycle (1st to last day of month)
  - Bill generation date
  - Payment due date
- View all pending payments
- Record manual/offline payments
- Process refunds
- Payment reconciliation
- Generate payment reports
- Send payment reminders (individual/bulk)
- **Generate consolidated statements for customers**

#### 3.2.8 Reports & Analytics
- Delivery reports (daily, weekly, monthly)
- Revenue reports
- Customer acquisition/churn reports
- Product-wise sales reports
- Delivery personnel performance
- Outstanding payments report
- **Ad-hoc request reports (volume, revenue, approval rate)**
- **Customer consumption pattern reports**
- Export all reports (PDF, Excel, CSV)

#### 3.2.9 Settings & Configuration
- Business profile settings
- Notification templates
- Holiday calendar (no delivery days)
- Service area management
- Tax configuration
- Payment gateway settings

---

## 4. Business Rules & Logic

### 4.1 Billing Calculation Rules

```
Monthly Bill Calculation:

1. Billing Period: 1st to last day of each month
2. Calculate total scheduled deliveries based on subscription frequency
3. Deductions:
   - Vacation days marked by customer
   - Missed deliveries (reported or admin-marked)
   - System holidays
4. Additions:
   - Approved ad-hoc deliveries
5. Formula:
   
   Total Amount = Regular Amount + Ad-hoc Amount + Taxes - Credits
   
   Where:
   - Regular Amount = (Actual Deliveries × Quantity × Price per Unit)
   - Actual Deliveries = Scheduled Deliveries - Vacations - Missed - Holidays
   - Ad-hoc Amount = Sum of (Ad-hoc Quantity × Price per Unit) for each approved ad-hoc
   - Credits = Previous overpayments or refunds
```

### 4.2 Date-Oriented Calculation Examples

```
Example 1: Daily Delivery with Ad-hoc Request
- Subscription: Daily, 1 liter, Price: $2/liter
- Month: January (31 days)
- Vacations: 5 days
- Missed Deliveries: 1 day
- Holidays: 2 days
- Ad-hoc Requests (Approved): 3 days × 2 liters = 6 liters

Calculation:
- Scheduled Deliveries: 31
- Actual Regular Deliveries: 31 - 5 - 1 - 2 = 23
- Regular Amount: 23 × 1 × $2 = $46
- Ad-hoc Amount: 6 × $2 = $12
- Total Amount: $46 + $12 = $58

Example 2: Alternate Day Delivery
- Subscription: Alternate days, 2 liters, Price: $2/liter
- Month: January (31 days → 16 delivery days)
- Vacations: 2 delivery days
- Missed: 0

Calculation:
- Actual Deliveries: 16 - 2 = 14
- Amount: 14 × 2 × $2 = $56
```

### 4.3 Subscription Rules
- Minimum subscription duration: 1 month
- Subscription modification: Takes effect from next day
- Pause subscription: Minimum 1 day, Maximum 30 days
- Cancellation: Requires 3 days notice
- New subscription: Starts from next available delivery date

### 4.4 Ad-hoc Request Rules (NEW)
- **Request Submission**
  - Customer can request milk for any future date (minimum 1 day advance)
  - Maximum ad-hoc request: 30 days in advance
  - Can request multiple dates in single request
  - Can request different products/quantities for each date
- **Approval Process**
  - Requests require admin approval before delivery scheduling
  - Admin can approve, reject, or partially approve
  - Approval based on delivery capacity for requested date
  - Auto-approval option for trusted/premium customers (configurable)
  - Pending requests auto-expire 24 hours before delivery date
- **Capacity Management**
  - Daily ad-hoc capacity limit (configurable, default: 50)
  - Admin can block specific dates for ad-hoc requests
  - System prevents approval beyond capacity
- **Billing**
  - Approved ad-hoc deliveries added to monthly bill
  - Uses price at time of request submission
  - Separate line items in bill for transparency
- **Cancellation**
  - Customer can cancel pending request anytime
  - Approved requests can be cancelled up to 12 hours before delivery

### 4.5 Payment Rules
- Bill generation: 1st of every month for previous month
- Payment due: 10th of the month
- Late payment fee: After 15th of the month
- Grace period: 5 days after due date
- Auto-debit: Attempted on due date

---

## 5. Data Models

### 5.1 Database Schema

```sql
-- Users Table
users {
  id: UUID PRIMARY KEY
  email: VARCHAR(255) UNIQUE NOT NULL
  phone: VARCHAR(20) UNIQUE NOT NULL
  password_hash: VARCHAR(255) NOT NULL
  role: ENUM('customer', 'admin', 'delivery_person')
  status: ENUM('active', 'inactive', 'suspended')
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Customer Profile
customer_profiles {
  id: UUID PRIMARY KEY
  user_id: UUID FOREIGN KEY -> users.id
  first_name: VARCHAR(100)
  last_name: VARCHAR(100)
  profile_image: VARCHAR(500)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Addresses
addresses {
  id: UUID PRIMARY KEY
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  address_line1: VARCHAR(255)
  address_line2: VARCHAR(255)
  city: VARCHAR(100)
  state: VARCHAR(100)
  postal_code: VARCHAR(20)
  country: VARCHAR(100)
  latitude: DECIMAL(10, 8)
  longitude: DECIMAL(11, 8)
  is_default: BOOLEAN
  is_active: BOOLEAN
  created_at: TIMESTAMP
}

-- Products
products {
  id: UUID PRIMARY KEY
  name: VARCHAR(100) NOT NULL
  description: TEXT
  unit: ENUM('liter', 'packet', 'bottle')
  unit_quantity: DECIMAL(10, 2) -- e.g., 0.5 for 500ml packet
  image_url: VARCHAR(500)
  is_active: BOOLEAN DEFAULT true
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Product Pricing (supports historical pricing)
product_pricing {
  id: UUID PRIMARY KEY
  product_id: UUID FOREIGN KEY -> products.id
  price_per_unit: DECIMAL(10, 2)
  effective_from: DATE NOT NULL
  effective_to: DATE -- NULL means current price
  created_at: TIMESTAMP
}

-- Subscriptions
subscriptions {
  id: UUID PRIMARY KEY
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  product_id: UUID FOREIGN KEY -> products.id
  address_id: UUID FOREIGN KEY -> addresses.id
  quantity: DECIMAL(10, 2) NOT NULL
  frequency: ENUM('daily', 'alternate', 'weekdays', 'weekends', 'custom')
  custom_days: JSON -- for custom frequency, e.g., ["monday", "wednesday", "friday"]
  start_date: DATE NOT NULL
  end_date: DATE -- NULL for ongoing
  status: ENUM('active', 'paused', 'cancelled', 'expired')
  pause_start_date: DATE
  pause_end_date: DATE
  cancellation_reason: TEXT
  cancelled_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Subscription History (tracks all changes)
subscription_history {
  id: UUID PRIMARY KEY
  subscription_id: UUID FOREIGN KEY -> subscriptions.id
  change_type: ENUM('created', 'modified', 'paused', 'resumed', 'cancelled')
  previous_values: JSON
  new_values: JSON
  changed_by: UUID FOREIGN KEY -> users.id
  changed_at: TIMESTAMP
}

-- Vacations
vacations {
  id: UUID PRIMARY KEY
  subscription_id: UUID FOREIGN KEY -> subscriptions.id
  start_date: DATE NOT NULL
  end_date: DATE NOT NULL
  reason: VARCHAR(255)
  created_at: TIMESTAMP
}

-- System Holidays
holidays {
  id: UUID PRIMARY KEY
  date: DATE NOT NULL UNIQUE
  name: VARCHAR(100)
  description: TEXT
  created_at: TIMESTAMP
}

-- Deliveries
deliveries {
  id: UUID PRIMARY KEY
  subscription_id: UUID FOREIGN KEY -> subscriptions.id
  adhoc_request_id: UUID FOREIGN KEY -> adhoc_requests.id -- NULL for regular deliveries
  delivery_type: ENUM('regular', 'adhoc') DEFAULT 'regular' -- NEW: Distinguish delivery type
  delivery_date: DATE NOT NULL
  scheduled_quantity: DECIMAL(10, 2)
  delivered_quantity: DECIMAL(10, 2)
  status: ENUM('scheduled', 'delivered', 'partial', 'missed', 'cancelled')
  delivery_time: TIMESTAMP
  delivery_person_id: UUID FOREIGN KEY -> users.id
  notes: TEXT
  issue_reported: BOOLEAN DEFAULT false
  issue_description: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  
  UNIQUE(subscription_id, delivery_date)
}

-- Ad-hoc Milk Requests (NEW)
adhoc_requests {
  id: UUID PRIMARY KEY
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  address_id: UUID FOREIGN KEY -> addresses.id
  request_number: VARCHAR(50) UNIQUE
  status: ENUM('pending', 'approved', 'partially_approved', 'rejected', 'cancelled')
  total_estimated_cost: DECIMAL(10, 2)
  notes: TEXT -- Customer notes for the request
  admin_notes: TEXT -- Admin notes on approval/rejection
  reviewed_by: UUID FOREIGN KEY -> users.id
  reviewed_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Ad-hoc Request Items (Multiple dates/products per request)
adhoc_request_items {
  id: UUID PRIMARY KEY
  adhoc_request_id: UUID FOREIGN KEY -> adhoc_requests.id
  product_id: UUID FOREIGN KEY -> products.id
  requested_date: DATE NOT NULL
  quantity: DECIMAL(10, 2) NOT NULL
  unit_price: DECIMAL(10, 2) -- Captured at request time
  estimated_cost: DECIMAL(10, 2)
  status: ENUM('pending', 'approved', 'rejected') -- For partial approval
  rejection_reason: TEXT
  created_at: TIMESTAMP
  
  UNIQUE(adhoc_request_id, product_id, requested_date)
}

-- Ad-hoc Capacity Settings (NEW)
adhoc_capacity {
  id: UUID PRIMARY KEY
  date: DATE NOT NULL UNIQUE
  max_adhoc_requests: INT DEFAULT 50 -- Maximum ad-hoc deliveries per day
  current_approved: INT DEFAULT 0
  is_blocked: BOOLEAN DEFAULT false -- Admin can block specific dates
  block_reason: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Bills
bills {
  id: UUID PRIMARY KEY
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  bill_number: VARCHAR(50) UNIQUE
  billing_period_start: DATE NOT NULL
  billing_period_end: DATE NOT NULL
  total_scheduled_deliveries: INT
  actual_deliveries: INT
  vacation_days: INT
  missed_deliveries: INT
  holiday_days: INT
  adhoc_deliveries: INT -- NEW: Count of ad-hoc deliveries
  adhoc_amount: DECIMAL(10, 2) -- NEW: Total ad-hoc delivery amount
  regular_subtotal: DECIMAL(10, 2) -- NEW: Regular subscription amount
  subtotal: DECIMAL(10, 2)
  tax_amount: DECIMAL(10, 2)
  discount_amount: DECIMAL(10, 2)
  credits_applied: DECIMAL(10, 2)
  total_amount: DECIMAL(10, 2)
  due_date: DATE
  status: ENUM('draft', 'generated', 'sent', 'paid', 'partial', 'overdue', 'cancelled')
  generated_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Bill Line Items
bill_items {
  id: UUID PRIMARY KEY
  bill_id: UUID FOREIGN KEY -> bills.id
  subscription_id: UUID FOREIGN KEY -> subscriptions.id
  product_id: UUID FOREIGN KEY -> products.id
  description: VARCHAR(255)
  quantity: DECIMAL(10, 2)
  unit_price: DECIMAL(10, 2)
  total_price: DECIMAL(10, 2)
  created_at: TIMESTAMP
}

-- Payments
payments {
  id: UUID PRIMARY KEY
  bill_id: UUID FOREIGN KEY -> bills.id
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  amount: DECIMAL(10, 2)
  payment_method: ENUM('online', 'upi', 'card', 'netbanking', 'wallet', 'cash', 'cheque')
  payment_gateway: VARCHAR(50)
  transaction_id: VARCHAR(255)
  status: ENUM('pending', 'success', 'failed', 'refunded')
  payment_date: TIMESTAMP
  notes: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Customer Wallet/Credits
customer_wallet {
  id: UUID PRIMARY KEY
  customer_id: UUID FOREIGN KEY -> customer_profiles.id
  balance: DECIMAL(10, 2) DEFAULT 0
  updated_at: TIMESTAMP
}

-- Wallet Transactions
wallet_transactions {
  id: UUID PRIMARY KEY
  wallet_id: UUID FOREIGN KEY -> customer_wallet.id
  type: ENUM('credit', 'debit')
  amount: DECIMAL(10, 2)
  reference_type: ENUM('refund', 'payment', 'adjustment', 'bonus')
  reference_id: VARCHAR(255)
  description: TEXT
  created_at: TIMESTAMP
}

-- Notifications
notifications {
  id: UUID PRIMARY KEY
  user_id: UUID FOREIGN KEY -> users.id
  title: VARCHAR(255)
  message: TEXT
  type: ENUM('delivery', 'payment', 'subscription', 'announcement', 'alert')
  is_read: BOOLEAN DEFAULT false
  sent_via: ENUM('app', 'email', 'sms', 'push')
  created_at: TIMESTAMP
}

-- Audit Log
audit_logs {
  id: UUID PRIMARY KEY
  user_id: UUID FOREIGN KEY -> users.id
  action: VARCHAR(100)
  entity_type: VARCHAR(100)
  entity_id: UUID
  old_values: JSON
  new_values: JSON
  ip_address: VARCHAR(50)
  user_agent: TEXT
  created_at: TIMESTAMP
}
```

---

## 6. API Specifications

### 6.1 Authentication APIs
```
POST   /api/auth/register          - Customer registration
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
POST   /api/auth/verify-otp        - Verify OTP
POST   /api/auth/refresh-token     - Refresh JWT token
```

### 6.2 Customer APIs
```
GET    /api/customer/profile                    - Get customer profile
PUT    /api/customer/profile                    - Update customer profile
GET    /api/customer/addresses                  - List addresses
POST   /api/customer/addresses                  - Add new address
PUT    /api/customer/addresses/:id              - Update address
DELETE /api/customer/addresses/:id              - Delete address

GET    /api/customer/subscriptions              - List customer subscriptions
POST   /api/customer/subscriptions              - Create new subscription
GET    /api/customer/subscriptions/:id          - Get subscription details
PUT    /api/customer/subscriptions/:id          - Modify subscription
POST   /api/customer/subscriptions/:id/pause    - Pause subscription
POST   /api/customer/subscriptions/:id/resume   - Resume subscription
POST   /api/customer/subscriptions/:id/cancel   - Cancel subscription

GET    /api/customer/vacations                  - List vacations
POST   /api/customer/vacations                  - Add vacation dates
DELETE /api/customer/vacations/:id              - Remove vacation

# Ad-hoc Milk Request APIs (NEW)
GET    /api/customer/adhoc-requests             - List all ad-hoc requests
POST   /api/customer/adhoc-requests             - Create new ad-hoc request
GET    /api/customer/adhoc-requests/:id         - Get ad-hoc request details
PUT    /api/customer/adhoc-requests/:id         - Modify pending request
DELETE /api/customer/adhoc-requests/:id         - Cancel pending request
GET    /api/customer/adhoc-requests/availability - Check date availability
GET    /api/customer/adhoc-requests/estimate    - Get cost estimate for dates

# Consolidated Dashboard APIs (NEW)
GET    /api/customer/dashboard/summary          - Get monthly summary stats
GET    /api/customer/dashboard/consolidated     - Get consolidated delivery & cost view
GET    /api/customer/dashboard/analytics        - Get consumption analytics
GET    /api/customer/dashboard/export           - Export consolidated report (PDF/Excel)
GET    /api/customer/dashboard/calendar         - Get calendar view data

GET    /api/customer/deliveries                 - List deliveries with filters
GET    /api/customer/deliveries/:id             - Get delivery details
POST   /api/customer/deliveries/:id/report      - Report delivery issue

GET    /api/customer/bills                      - List bills
GET    /api/customer/bills/:id                  - Get bill details
GET    /api/customer/bills/:id/download         - Download bill PDF

GET    /api/customer/payments                   - List payments
POST   /api/customer/payments                   - Initiate payment
GET    /api/customer/payments/:id               - Get payment status

GET    /api/customer/wallet                     - Get wallet balance
GET    /api/customer/wallet/transactions        - List wallet transactions

GET    /api/customer/notifications              - List notifications
PUT    /api/customer/notifications/:id/read     - Mark notification as read
```

### 6.3 Admin APIs
```
GET    /api/admin/dashboard                     - Dashboard metrics

GET    /api/admin/customers                     - List all customers
GET    /api/admin/customers/:id                 - Get customer details
PUT    /api/admin/customers/:id                 - Update customer
PUT    /api/admin/customers/:id/status          - Activate/Deactivate customer

GET    /api/admin/products                      - List products
POST   /api/admin/products                      - Add product
PUT    /api/admin/products/:id                  - Update product
DELETE /api/admin/products/:id                  - Delete product
POST   /api/admin/products/:id/pricing          - Set new pricing

GET    /api/admin/subscriptions                 - List all subscriptions
GET    /api/admin/subscriptions/:id             - Get subscription details
PUT    /api/admin/subscriptions/:id             - Modify subscription
POST   /api/admin/subscriptions/:id/approve     - Approve subscription change

# Ad-hoc Request Management APIs (NEW)
GET    /api/admin/adhoc-requests                - List all ad-hoc requests (with filters)
GET    /api/admin/adhoc-requests/pending        - List pending requests
GET    /api/admin/adhoc-requests/:id            - Get request details
POST   /api/admin/adhoc-requests/:id/approve    - Approve ad-hoc request
POST   /api/admin/adhoc-requests/:id/reject     - Reject ad-hoc request
POST   /api/admin/adhoc-requests/:id/partial    - Partial approval (approve/reject items)
POST   /api/admin/adhoc-requests/bulk-approve   - Bulk approve requests
POST   /api/admin/adhoc-requests/bulk-reject    - Bulk reject requests
GET    /api/admin/adhoc-capacity/:date          - Get capacity for date
PUT    /api/admin/adhoc-capacity/:date          - Update capacity settings
POST   /api/admin/adhoc-capacity/block          - Block dates for ad-hoc
GET    /api/admin/adhoc-requests/analytics      - Ad-hoc request analytics

GET    /api/admin/deliveries                    - List deliveries with filters
GET    /api/admin/deliveries/today              - Today's delivery schedule
PUT    /api/admin/deliveries/:id                - Update delivery status
POST   /api/admin/deliveries/bulk-update        - Bulk update deliveries
GET    /api/admin/deliveries/route/:date        - Get delivery route for date

GET    /api/admin/bills                         - List all bills
POST   /api/admin/bills/generate                - Generate bills for period
GET    /api/admin/bills/:id                     - Get bill details
PUT    /api/admin/bills/:id                     - Update bill
POST   /api/admin/bills/:id/send                - Send bill to customer

GET    /api/admin/payments                      - List all payments
POST   /api/admin/payments/manual               - Record manual payment
POST   /api/admin/payments/:id/refund           - Process refund

GET    /api/admin/delivery-persons              - List delivery personnel
POST   /api/admin/delivery-persons              - Add delivery person
PUT    /api/admin/delivery-persons/:id          - Update delivery person
DELETE /api/admin/delivery-persons/:id          - Remove delivery person

GET    /api/admin/reports/deliveries            - Delivery report
GET    /api/admin/reports/revenue               - Revenue report
GET    /api/admin/reports/customers             - Customer report
GET    /api/admin/reports/outstanding           - Outstanding payments

GET    /api/admin/holidays                      - List holidays
POST   /api/admin/holidays                      - Add holiday
DELETE /api/admin/holidays/:id                  - Remove holiday

GET    /api/admin/settings                      - Get settings
PUT    /api/admin/settings                      - Update settings

POST   /api/admin/notifications/send            - Send notification
POST   /api/admin/notifications/broadcast       - Broadcast to all
```

### 6.4 Common APIs
```
GET    /api/products                            - List available products (public)
GET    /api/products/:id                        - Get product details
GET    /api/service-areas                       - List service areas
```

---

## 7. Technical Requirements

### 7.1 Technology Stack (Recommended)

#### Frontend
- **Framework**: React.js or Next.js
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Tailwind CSS
- **Forms**: React Hook Form with Yup validation
- **Date Handling**: date-fns or Day.js
- **Charts**: Recharts or Chart.js
- **HTTP Client**: Axios

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js or NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi or class-validator
- **Documentation**: Swagger/OpenAPI

#### Infrastructure
- **Hosting**: AWS, GCP, or Azure
- **File Storage**: AWS S3 or equivalent
- **Cache**: Redis
- **Message Queue**: RabbitMQ or AWS SQS (for notifications)
- **CI/CD**: GitHub Actions or GitLab CI

### 7.2 Non-Functional Requirements

#### Performance
- API response time < 200ms for 95th percentile
- Support 10,000+ concurrent users
- Page load time < 3 seconds

#### Security
- HTTPS everywhere
- JWT tokens with short expiry (15 min access, 7 days refresh)
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting (100 requests/min per user)
- Data encryption at rest

#### Scalability
- Horizontal scaling capability
- Database connection pooling
- Caching frequently accessed data

#### Availability
- 99.9% uptime SLA
- Automated backups (daily)
- Disaster recovery plan

#### Compliance
- GDPR compliance for data privacy
- PCI DSS for payment data (use payment gateway)
- Data retention policies

---

## 8. User Interface Requirements

### 8.1 Customer Portal Screens

1. **Authentication**
   - Login page
   - Registration page
   - Forgot password page
   - OTP verification page

2. **Consolidated Member Dashboard (NEW - Primary Landing Page)**
   - **Summary Cards Row**
     - Total Milk Delivered (liters) this month
     - Total Deliveries Count (Regular + Ad-hoc)
     - Total Amount Due
     - Payment Status Badge (Paid/Pending/Overdue)
   - **Quick Stats Section**
     - Regular Deliveries: X deliveries, $XX
     - Ad-hoc Deliveries: X deliveries, $XX
     - Vacation Days: X days, -$XX saved
     - Missed Deliveries: X days, -$XX credited
   - **Delivery Calendar (Heat Map)**
     - Color coded: Green (delivered), Yellow (ad-hoc), Gray (vacation), Red (missed)
     - Click on date to see details
   - **Monthly Trend Chart**
     - Line graph showing daily consumption
     - Compare with previous month
   - **Detailed Breakdown Table**
     - Sortable columns: Date, Product, Quantity, Rate, Amount, Type, Status
     - Filters: Date range, Product, Delivery type (Regular/Ad-hoc)
     - Pagination for long lists
   - **Export & Actions**
     - Download PDF report
     - Export to Excel
     - Print view
     - Email statement

3. **Subscription Management**
   - Product catalog view
   - Subscription creation wizard
   - Active subscriptions list
   - Subscription detail view
   - Modification modal
   - Vacation calendar

4. **Ad-hoc Milk Request (NEW)**
   - **Request Creation Page**
     - Calendar date picker (multi-select enabled)
     - Product selection dropdown per date
     - Quantity input per date
     - Estimated cost calculator (live update)
     - Notes/reason text area
     - Submit for approval button
   - **My Requests Page**
     - Tabs: All | Pending | Approved | Rejected
     - Request cards showing:
       - Request number
       - Dates requested
       - Products & quantities
       - Estimated cost
       - Status badge
       - Actions (Edit/Cancel for pending)
   - **Request Detail View**
     - Full request information
     - Item-wise status (for partial approvals)
     - Admin notes (if rejected)
     - Timeline of status changes
   - **Availability Calendar**
     - Shows dates available for ad-hoc requests
     - Blocked dates marked in red
     - Capacity indicator per date

5. **Delivery Tracking**
   - Monthly calendar view with delivery status
   - Delivery list view with filters
   - **Filter by delivery type (Regular/Ad-hoc)**
   - Delivery detail modal
   - Issue reporting form

6. **Billing & Payments**
   - Current bill summary
   - **Itemized view: Regular vs Ad-hoc deliveries**
   - Bill history list
   - Bill detail view
   - Payment page
   - Payment history
   - Wallet view

7. **Profile**
   - Personal information form
   - Address management
   - Notification preferences
   - Change password

### 8.2 Admin Portal Screens

1. **Dashboard**
   - KPI cards (subscriptions, revenue, deliveries)
   - **Pending Ad-hoc Requests Count Badge**
   - Charts (revenue trend, delivery stats)
   - Alerts panel
   - Quick actions

2. **Ad-hoc Request Management (NEW)**
   - **Request Queue Page**
     - Tabs: Pending | Approved | Rejected | All
     - Filter by: Date range, Customer, Product, Urgency
     - Sort by: Request date, Delivery date, Customer
     - Bulk selection checkboxes
     - Bulk Approve/Reject buttons
   - **Request Review Modal**
     - Customer details
     - Request items table (Date, Product, Qty, Price)
     - Capacity check indicator per date
     - Approve button (with optional notes)
     - Reject button (with mandatory reason)
     - Partial approval option (item-wise checkboxes)
   - **Capacity Management Page**
     - Calendar view with daily capacity
     - Set default daily capacity
     - Override capacity for specific dates
     - Block dates for ad-hoc
   - **Ad-hoc Analytics Dashboard**
     - Total requests (approved/rejected/pending)
     - Revenue from ad-hoc deliveries
     - Most requested products chart
     - Peak request days heatmap
     - Approval rate trend

3. **Customer Management**
   - Customer list with search/filter
   - Customer detail view
   - Customer subscription history
   - Customer payment history

3. **Product Management**
   - Product list
   - Add/Edit product form
   - Pricing history

4. **Subscription Management**
   - Subscription list with filters
   - Subscription detail view
   - Bulk operations

5. **Delivery Management**
   - Daily delivery schedule
   - Delivery list with filters
   - Route view
   - Delivery personnel assignment
   - Bulk status update

6. **Billing Management**
   - Bill generation wizard
   - Bill list with filters
   - Bill detail view
   - Payment recording form

7. **Reports**
   - Report type selection
   - Date range picker
   - Filter options
   - Chart visualizations
   - Export options

8. **Settings**
   - General settings
   - Holiday calendar
   - Notification templates
   - Tax configuration

---

## 9. Notification System

### 9.1 Notification Types

| Event | Channel | Recipient | Timing |
|-------|---------|-----------|--------|
| Delivery Completed | Push, SMS | Customer | Real-time |
| Delivery Missed | Push, Email | Customer | Real-time |
| Bill Generated | Email, Push | Customer | On generation |
| Payment Due Reminder | Email, SMS, Push | Customer | 3 days before due |
| Payment Overdue | Email, SMS | Customer | 1 day after due |
| Payment Received | Email, Push | Customer | Real-time |
| Subscription Paused | Email | Customer | On pause |
| Subscription Resumed | Push | Customer | On resume |
| Price Change | Email | All Customers | 7 days before effective |
| New Product | Email | All Customers | On launch |
| **Ad-hoc Request Submitted** | Push | Admin | Real-time |
| **Ad-hoc Request Approved** | Push, Email | Customer | Real-time |
| **Ad-hoc Request Rejected** | Push, Email | Customer | Real-time |
| **Ad-hoc Request Expiring** | Push | Customer | 24 hours before expiry |
| **Consolidated Statement Ready** | Email, Push | Customer | Monthly (with bill) |

### 9.2 Notification Templates
- All templates should be customizable by admin
- Support for variables: {customer_name}, {amount}, {due_date}, {request_number}, {approval_status}, etc.
- Multi-language support consideration

---

## 10. Testing Requirements

### 10.1 Test Coverage
- Unit tests: 80% coverage
- Integration tests for all API endpoints
- E2E tests for critical user flows

### 10.2 Critical Test Scenarios
1. Monthly bill calculation accuracy
2. Vacation day deduction
3. Missed delivery handling
4. Payment processing
5. Subscription pause/resume
6. Date boundary cases (month end, leap year)
7. **Ad-hoc request approval workflow**
8. **Ad-hoc capacity limit enforcement**
9. **Consolidated dashboard data accuracy**
10. **Ad-hoc billing integration**

---

## 11. Deployment & DevOps

### 11.1 Environments
- Development
- Staging
- Production

### 11.2 CI/CD Pipeline
- Automated testing on PR
- Code quality checks (ESLint, Prettier)
- Automated deployment to staging on merge
- Manual approval for production deployment

---

## 12. Future Enhancements (Phase 2)

1. Mobile applications (iOS, Android)
2. Multiple language support
3. Delivery person mobile app
4. GPS tracking for deliveries
5. Customer feedback system
6. Referral program
7. Loyalty points
8. Subscription bundles
9. Quality reports
10. Integration with accounting software

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Customer registration conversion | > 70% |
| Bill generation accuracy | 100% |
| Payment collection rate | > 95% |
| Customer retention (monthly) | > 90% |
| Delivery success rate | > 98% |
| System uptime | > 99.9% |
| Customer support tickets | < 5% of customers |

---

## 14. Timeline Estimation

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | 3 weeks | Auth, User management, Product setup |
| Phase 2: Subscriptions | 3 weeks | Subscription CRUD, Vacation management |
| Phase 3: Deliveries | 2 weeks | Delivery scheduling, Status tracking |
| Phase 4: Ad-hoc Requests | 2 weeks | Request submission, Admin approval workflow |
| Phase 5: Billing | 3 weeks | Bill generation, Payment integration, Ad-hoc billing |
| Phase 6: Consolidated Dashboard | 2 weeks | Member dashboard, Analytics, Reports |
| Phase 7: Admin Portal | 2 weeks | Dashboard, Reports, Settings |
| Phase 8: Testing & QA | 2 weeks | Testing, Bug fixes |
| Phase 9: Deployment | 1 week | Production deployment |

**Total Estimated Duration: 20 weeks**

---

## 15. Appendix

### 15.1 Glossary
- **Subscription**: A recurring order for milk delivery
- **Billing Cycle**: 1st to last day of each calendar month
- **Vacation**: Customer-marked days when no delivery is needed
- **Scheduled Delivery**: A delivery that should occur based on subscription frequency
- **Actual Delivery**: A delivery that was successfully completed
- **Ad-hoc Request**: One-time milk request for specific dates outside regular subscription
- **Consolidated View**: Unified dashboard showing all deliveries and cost calculations

### 15.2 Sample User Stories

**Customer Stories:**
1. As a customer, I want to subscribe to daily milk delivery so that I receive fresh milk every morning.
2. As a customer, I want to mark vacation dates so that I'm not charged for days I don't need delivery.
3. As a customer, I want to view my monthly bill with itemized details so that I understand what I'm paying for.
4. As a customer, I want to report a missed delivery so that I get credit for it.
5. **As a customer, I want to request extra milk for specific dates when I have guests, so that I can get additional delivery beyond my regular subscription.**
6. **As a customer, I want to see the status of my ad-hoc milk requests so that I know if my request is approved or pending.**
7. **As a customer, I want to view a consolidated dashboard showing all my deliveries and costs so that I can easily track my milk consumption and expenses.**
8. **As a customer, I want to export my monthly delivery report so that I can keep records or share with family members.**
9. **As a customer, I want to see a calendar view of all my deliveries (regular and ad-hoc) so that I can plan accordingly.**

**Admin Stories:**
1. As an admin, I want to view today's delivery schedule so that I can plan routes efficiently.
2. As an admin, I want to generate monthly bills automatically so that customers receive accurate bills on time.
3. As an admin, I want to see outstanding payments so that I can follow up with customers.
4. As an admin, I want to update product prices with a future effective date so that customers are informed in advance.
5. **As an admin, I want to view all pending ad-hoc requests so that I can approve or reject them based on delivery capacity.**
6. **As an admin, I want to set daily capacity limits for ad-hoc deliveries so that I don't overcommit delivery resources.**
7. **As an admin, I want to bulk approve/reject ad-hoc requests so that I can efficiently manage high volumes of requests.**
8. **As an admin, I want to see analytics on ad-hoc requests so that I can understand demand patterns and plan inventory.**
9. **As an admin, I want to block specific dates for ad-hoc requests so that I can manage holidays or capacity constraints.**

---

### 15.3 Consolidated Dashboard Data Structure (API Response Example)

```json
{
  "summary": {
    "period": { "start": "2026-01-01", "end": "2026-01-31" },
    "totalMilkDelivered": 45.5,
    "totalDeliveries": 25,
    "regularDeliveries": 22,
    "adhocDeliveries": 3,
    "vacationDays": 5,
    "missedDeliveries": 1,
    "totalAmount": 91.00,
    "regularAmount": 79.00,
    "adhocAmount": 12.00,
    "creditsApplied": 2.00,
    "netPayable": 89.00,
    "paymentStatus": "pending"
  },
  "deliveries": [
    {
      "date": "2026-01-02",
      "product": "Full Cream Milk",
      "quantity": 1.0,
      "rate": 2.00,
      "amount": 2.00,
      "type": "regular",
      "status": "delivered"
    },
    {
      "date": "2026-01-15",
      "product": "Full Cream Milk",
      "quantity": 2.0,
      "rate": 2.00,
      "amount": 4.00,
      "type": "adhoc",
      "status": "delivered"
    }
  ],
  "analytics": {
    "dailyConsumption": [...],
    "productDistribution": {...},
    "monthlyTrend": [...]
  }
}
```

---

*Document Version: 1.1*
*Last Updated: February 4, 2026*
*Author: Product Management*
*Change Log: Added Ad-hoc Milk Request feature and Consolidated Member Dashboard*
