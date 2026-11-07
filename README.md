# IntraShip UAM Portal — Dynamic Mock & API Integration (`FE-44`)

A responsive, production-ready User & Access Management (UAM) Portal frontend built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Recharts**, adhering to the official Figma design system tokens.

---

## 🚀 Key Architectural Feature: Dynamic Data Mode

The entire application runs on an environment-driven service layer that allows instantaneous switching between **Local Mock JSON Data** and **Live Backend APIs** without changing a single UI component, page, chart, or form.

### 1. Mock Mode (Default)

Runs 100% offline using realistic synthetic datasets under `/mocks`:

```env
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_API_BASE_URL=
```

### 2. Live API Mode

Routes requests to the backend server:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
```

_Note: If `api` mode is selected without a valid base URL, a clear configuration error is shown rather than failing silently._

---

## 🛠️ Tech Stack & Libraries

- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS (Custom IntraShip Forest Green & Sage theme tokens)
- **Validation**: Zod
- **Data Visualization**: Recharts (Pie/Donut & Bar Charts)
- **Icons**: Lucide React
- **Architecture**: Centralized Service Layer (`services/`) with isolated Mocks (`mocks/`)

---

## 📁 Project Architecture

```text
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── forgot-password/page.tsx
│   ├── verify-otp/page.tsx
│   ├── otp/page.tsx (alias)
│   └── reset-password/page.tsx
├── dashboard/
│   ├── page.tsx
│   └── _components/
│       ├── KpiCardsGrid.tsx
│       ├── RoleUsersChart.tsx
│       ├── LoginAttemptsChart.tsx
│       ├── InterfaceAccessChart.tsx
│       └── LoginHistoryTable.tsx
├── layout.tsx
└── globals.css

components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── PasswordInput.tsx
│   ├── Card.tsx
│   ├── ChartCard.tsx
│   ├── Alert.tsx
│   ├── Toast.tsx
│   ├── Loader.tsx
│   ├── EmptyState.tsx
│   ├── Table.tsx
│   ├── Pagination.tsx
│   └── Modal.tsx
├── Header.tsx
├── Sidebar.tsx
└── Logo.tsx

services/
├── api-client.ts        # Centralized HTTP client & error handler
├── auth.service.ts      # Auth facade routing to mock or API
├── dashboard.service.ts # Dashboard facade routing to mock or API
└── mock.service.ts      # Deterministic local mock responses

mocks/
├── auth/
│   ├── login.json
│   ├── send-otp.json
│   ├── verify-otp.json
│   ├── forgot-password.json
│   └── reset-password.json
└── dashboard/
    ├── kpis.json
    ├── role-users.json
    ├── login-attempts-daily.json
    ├── login-attempts-monthly.json
    ├── interface-access.json
    └── login-history.json

types/
├── auth.ts              # Authentication data contracts
└── dashboard.ts         # Dashboard metrics & table contracts

lib/
├── config.ts            # Environment data mode config
├── validations.ts       # Zod schemas
└── auth-context.tsx     # In-memory session management
```

---

## 🔑 Synthetic Test Accounts (For Local Mock Testing)

> ⚠️ **Notice**: These are purely synthetic test accounts for development and automated testing. Never commit real credentials.


---

## 📊 Dashboard Modules

1. **Summary KPI Cards**: Live metrics for Total Users, Active Roles, Access Requests, and Audit Events.
2. **Role-wise Users (Donut Chart)**: Recharts-powered distribution with custom tooltips and interactive role legend.
3. **Daily / Monthly Login Attempts (Bar Chart)**: Dual-period toggle switching between 7-day daily and 6-month monthly trends, displaying successful vs. failed attempts.
4. **Interface-wise Access**: Breakdown across Web Portal, Mobile App, Admin CLI, and API Gateway channels with percentages and trend badges.
5. **Login History Table**: Comprehensive audit table with live search, status filter, interface filter, and responsive pagination.

---

## 🏃 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run Next.js development server
npm run dev

# 3. Build for production
npm run build
```

Visit [http://localhost:3000](http://localhost:3000) to view the portal.
