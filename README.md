# Milk Subscription Platform

A full-stack milk subscription management platform built with React, Node.js, Express, and MongoDB.

## Features

### Customer Portal
- **Dashboard**: Overview of subscriptions, upcoming deliveries, recent bills, and wallet balance
- **Subscriptions**: Create, manage, pause, resume, or cancel milk subscriptions
- **Adhoc Requests**: Place one-time delivery orders
- **Deliveries**: View delivery schedule in list or calendar view, report issues
- **Billing**: View bills, make payments
- **Wallet**: Manage wallet balance, view transaction history
- **Profile**: Update personal information, manage addresses

### Admin Portal
- **Dashboard**: Overview of business metrics, recent activities
- **Customers**: Manage customer accounts, add wallet credits
- **Products**: CRUD operations for milk products
- **Adhoc Management**: Review, approve, or reject adhoc requests
- **Deliveries**: Manage delivery schedules, update statuses
- **Billing**: Generate bills, record payments
- **Holidays**: Manage non-delivery days
- **Settings**: Configure system settings

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **ORM**: Prisma
- **Authentication**: JWT with access/refresh tokens
- **Validation**: Zod
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Server State**: TanStack React Query
- **Forms**: React Hook Form
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast

## Project Structure

```
milk/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── index.ts           # Entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── layout/        # Layout components
│   │   │   └── ui/            # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin portal pages
│   │   │   ├── auth/          # Auth pages
│   │   │   └── customer/      # Customer portal pages
│   │   ├── services/          # API services
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account (free tier available)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/milk_subscription?retryWrites=true&w=majority"
   JWT_SECRET="your-jwt-secret"
   PORT=3001
   ```

5. Generate Prisma client and push schema to MongoDB:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Default Credentials (after seeding)

**Admin:**
- Email: admin@milkdelivery.com
- Password: admin123

**Customer:**
- Email: customer@example.com
- Password: customer123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Customer Routes
- `GET /api/customer/profile` - Get profile
- `PUT /api/customer/profile` - Update profile
- `GET /api/customer/dashboard` - Get dashboard data
- `GET /api/customer/subscriptions` - Get subscriptions
- `POST /api/customer/subscriptions` - Create subscription
- `GET /api/customer/adhoc` - Get adhoc requests
- `POST /api/customer/adhoc` - Create adhoc request
- `GET /api/customer/deliveries` - Get deliveries
- `GET /api/customer/bills` - Get bills
- `GET /api/customer/wallet` - Get wallet info

### Admin Routes
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `GET /api/admin/adhoc` - Get all adhoc requests
- `POST /api/admin/adhoc/:id/approve` - Approve request
- `POST /api/admin/adhoc/:id/reject` - Reject request
- `GET /api/admin/deliveries` - Get all deliveries
- `POST /api/admin/deliveries/generate` - Generate schedule
- `GET /api/admin/bills` - Get all bills
- `POST /api/admin/bills/generate` - Generate bills
- `GET /api/admin/holidays` - Get holidays
- `GET /api/admin/settings` - Get settings

## Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
