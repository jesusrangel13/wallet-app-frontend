# 💰 Finance App - Unified Finance Management

> Complete personal finance and shared expense tracking application combining the best of Wallet and Splitwise

[![Status](https://img.shields.io/badge/Status-85%25%20Complete-success)](https://github.com)
[![Backend](https://img.shields.io/badge/Backend-100%25-brightgreen)](https://github.com)
[![Frontend](https://img.shields.io/badge/Frontend-60%25-yellow)](https://github.com)

## 🌟 Features

### ✅ Personal Finance (Wallet-style)
- Multiple account types (Cash, Debit, Credit, Savings)
- Multi-currency support
- Income/Expense/Transfer tracking
- Category management
- Monthly budgets with tracking
- Transaction history with filters
- Balance overview

### ✅ Shared Expenses (Splitwise-style)
- Create groups for roommates, trips, families
- Split expenses multiple ways (Equal, Percentage, Exact amounts, Shares)
- Simplified debt calculation algorithm
- Settle payments between users
- Group balances overview
- Payment history

### 🚧 Coming Soon
- Dashboard with charts and analytics
- Receipt upload and OCR
- Spending reports and insights
- Export to CSV/PDF
- Email notifications
- Bank sync integration

## 🚀 Tech Stack

### Backend (Production Ready ✅)
- **Node.js** + Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** with bcrypt
- **Zod** for validation
- 40+ REST API endpoints

### Frontend (In Progress 🚧)
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** for forms
- **Recharts** for analytics
- **Axios** for API calls

## 📦 Project Structure

```
finance-app/
├── backend/                    ✅ 100% Complete
│   ├── src/
│   │   ├── controllers/       # 7 controllers (auth, user, account, etc.)
│   │   ├── services/          # Business logic layer
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth, error handling
│   │   ├── utils/             # JWT, validation, helpers
│   │   └── server.ts          # Express app setup
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (9 models)
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   ⚠️ 60% Complete
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       ✅ Login & Register pages
│   │   │   ├── page.tsx      ✅ Landing page
│   │   │   └── layout.tsx    ✅ Root layout
│   │   ├── components/
│   │   │   └── ui/           ✅ Button, Input, Card
│   │   ├── lib/
│   │   │   ├── api.ts        ✅ Complete API client
│   │   │   └── utils.ts      ✅ Helper functions
│   │   ├── store/
│   │   │   └── authStore.ts  ✅ Auth state management
│   │   └── types/
│   │       └── index.ts      ✅ TypeScript definitions
│   └── package.json
│
├── INSTALLATION.md             # Detailed setup guide
└── PROJECT_STATUS.md           # Complete status report
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- npm or yarn

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd finance-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** - Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance_app"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:3000
```

### 5. Test the Application

1. Open http://localhost:3000
2. Click "Get Started" to create an account
3. Login and start managing your finances!

## 📚 Documentation

- [**INSTALLATION.md**](./INSTALLATION.md) - Complete installation guide with troubleshooting
- [**PROJECT_STATUS.md**](./PROJECT_STATUS.md) - Detailed implementation status and roadmap
- **API Documentation** - All 40+ endpoints documented in INSTALLATION.md

## 🎯 Current Status

### ✅ Backend - 100% Complete
- [x] User authentication (register, login, JWT)
- [x] Account management (CRUD operations)
- [x] Transaction tracking with categories
- [x] Budget creation and monitoring
- [x] Group management for shared expenses
- [x] Expense splitting (4 methods)
- [x] Debt simplification algorithm
- [x] Payment settlements
- [x] Complete API with 40+ endpoints
- [x] Error handling and validation

### ⚠️ Frontend - 60% Complete
- [x] Project setup with Next.js 14
- [x] Landing page
- [x] Authentication pages (Login/Register)
- [x] UI components (Button, Input, Card)
- [x] API client with auth interceptors
- [x] State management setup
- [ ] Dashboard page
- [ ] Account management UI
- [ ] Transaction list and forms
- [ ] Budget tracking interface
- [ ] Group and shared expense UI
- [ ] Analytics and reports

## 🚧 What's Next

### Immediate Priorities
1. Create Dashboard with account overview
2. Build Transaction management UI
3. Implement Account CRUD interface
4. Add Budget tracking with charts
5. Create Groups and shared expenses UI

### Estimated Time
- Dashboard + Accounts: 4-6 hours
- Transactions: 6-8 hours
- Budgets with charts: 4-6 hours
- Groups + Shared Expenses: 8-10 hours
- **Total: ~22-30 hours to 100% completion**

## 🧪 API Testing

You can test the complete backend API right now using Postman, Thunder Client, or curl:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (use token from login)
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

See [INSTALLATION.md](./INSTALLATION.md) for complete API documentation.

## 🤝 Contributing

This is a personal project but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this project for learning or as a base for your own app.

## 🙏 Acknowledgments

- Inspired by Wallet and Splitwise
- Built with modern web technologies
- Designed for scalability and maintainability

---

**Made with ❤️ and lots of ☕**

For detailed setup instructions, see [INSTALLATION.md](./INSTALLATION.md)
For implementation status, see [PROJECT_STATUS.md](./PROJECT_STATUS.md)

prueba
