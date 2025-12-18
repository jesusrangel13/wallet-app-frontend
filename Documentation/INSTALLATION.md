# Finance App - Installation & Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Supabase)
- npm or yarn package manager

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file in the backend directory:

```env
# Database (Update with your PostgreSQL connection string)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_app"

# Server
PORT=5000
NODE_ENV=development

# JWT (Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345678
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### 4. Start Backend Server

```bash
npm run dev
```

The backend API will be running at `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Testing the Application

1. Open `http://localhost:3000` in your browser
2. Click "Get Started" or "Sign Up"
3. Create a new account
4. Start adding accounts, transactions, and budgets!

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Update `DATABASE_URL` with production database
3. Change `JWT_SECRET` to a strong random string
4. Build: `npm run build`
5. Start: `npm start`

### Frontend

1. Update `NEXT_PUBLIC_API_URL` with production API URL
2. Build: `npm run build`
3. Start: `npm start`

## Database Schema

The application uses the following main tables:

- **User**: User accounts and profiles
- **Account**: Bank accounts, cash, credit cards
- **Transaction**: Income and expense transactions
- **Budget**: Monthly budgets
- **Group**: Shared expense groups
- **GroupMember**: Group memberships
- **SharedExpense**: Split expenses
- **ExpenseParticipant**: Individual shares
- **Payment**: Debt settlements

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/balance/total` - Get total balance

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/by-category` - Get transactions by category
- `GET /api/transactions/stats` - Get transaction statistics

### Budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get budget by ID
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/current` - Get current month budget
- `GET /api/budgets/vs-actual` - Compare budget vs actual

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get group by ID
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:id/members/:memberId` - Remove member
- `GET /api/groups/:id/balances` - Get group balances

### Shared Expenses
- `POST /api/shared-expenses` - Create shared expense
- `GET /api/shared-expenses` - Get all shared expenses
- `GET /api/shared-expenses/:id` - Get shared expense by ID
- `DELETE /api/shared-expenses/:id` - Delete shared expense
- `POST /api/shared-expenses/payments` - Settle payment
- `GET /api/shared-expenses/payments/history` - Get payment history
- `GET /api/shared-expenses/groups/:groupId/simplified-debts` - Get simplified debts

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres

# Recreate database
npx prisma db push --force-reset
```

### Port Already in Use

```bash
# Kill process on port 5000 (Backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npx prisma generate
```

## Support

For issues or questions, please refer to the main README.md or create an issue in the repository.
