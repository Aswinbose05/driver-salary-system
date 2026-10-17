# FleetPay — Driver Earnings & Monthly Salary Management System

A production-ready web application designed for real-world daily tracking of driver work shifts, overtime (OT) drives, rate configurations, and salary disbursements for fleet operations.

Built with **React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, and Supabase (PostgreSQL with Row Level Security)**. Complies with **UI/UX Pro Max** mobile-first design, accessibility standards (WCAG 4.5:1), and Indian business standards (**INR ₹ currency** and **Asia/Kolkata IST** timezone).

---

## 1. Business Logic & Calculation Rules

### Initial Fleet Setup
There are four primary drivers initially assigned to vehicles:
1. **Ramesh Kumar** (`KA-01-EQ-1001`)
2. **Suresh Patel** (`KA-01-EQ-1002`)
3. **Rajesh Sharma** (`KA-01-EQ-1003`)
4. **Mahesh Verma** (`KA-01-EQ-1004`)
5. Plus **Fleet Administrator** (Vikram Singh)

### Payment Rules
- **Regular driving day payment:** ₹800 (configurable)
- **Every additional drive (OT):** ₹800 (configurable)
- **Additional drives allowed:** 0 or more drives per day
- **Rate snapshot preservation:** When payment rates change in admin settings, **historical records permanently preserve the rate snapshot recorded at entry**, guaranteeing financial audit integrity.
- **Duplicate shift prevention:** A driver can have at most one work record per date (`UNIQUE(driver_id, work_date)`). A regular shift cannot be entered twice for the same driver on the same day. Subsequent saves update the existing entry with full audit logging.

### Mathematical Formulas
$$\text{Daily Earnings} = (\text{Regular Shift} \times \text{Regular Rate}) + (\text{OT Drives} \times \text{OT Rate})$$

$$\text{Gross Monthly Earnings} = \sum \text{Daily Earnings for Month}$$

$$\text{Outstanding Balance} = \text{Gross Monthly Earnings} - \text{Total Payments Recorded}$$

---

## 2. Key Features

- **Driver Portal (<30-Second Work Entry):** Mobile-optimized with large tactile YES/NO regular shift buttons, +/- OT stepper, live formula breakdown preview, optional trip notes, and celebratory confetti animation upon completion.
- **Admin Fleet Operations:** 4-driver side-by-side comparison cards, combined monthly gross and payout totals, comparative Recharts bar chart, quick payment disbursements (UPI, Bank Transfer, Cash), driver profile management, and rate adjustments.
- **Monthly Reports & Payslips:** Itemized daily shift log, month-by-month navigation, date-range searching, one-click **CSV export** (UTF-8 BOM Excel-compatible), and **official printable monthly payslip vouchers** with company letterhead and signature blocks.
- **Audit History Trail:** Complete tamper-evident log capturing Actor, Action (`CREATE`, `UPDATE`, `DELETE`, `RATE_CHANGE`, `PAYMENT`, `LOGIN`), Timestamp in IST, and before/after change details.
- **Dual-Mode Backend Engine:**
  - **Instant Local Storage Mode:** Works out of the box with realistic initial seed data for immediate evaluation and offline operation.
  - **Cloud PostgreSQL Mode:** Connects to Supabase PostgreSQL with full Row Level Security (RLS) policies by simply providing `.env` credentials.
- **Theme & PWA Support:** Built-in Light and Dark theme toggle, standalone PWA web app manifest (`/manifest.json`), and touch-optimized layout (min 44×44px targets).

---

## 3. Project Structure

```text
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx       # Fleet overview, 4-driver comparison, charts
│   │   │   ├── DriverManagementModal.tsx# Create/edit driver profiles & vehicles
│   │   │   └── PaymentModal.tsx         # Disburse full/partial salary & advances
│   │   ├── audit/
│   │   │   └── AuditLogViewer.tsx       # Audit log viewer with filters
│   │   ├── auth/
│   │   │   ├── ChangePasswordModal.tsx  # Secure password update
│   │   │   └── LoginModal.tsx           # Authentication modal & 1-click role switcher
│   │   ├── common/
│   │   │   ├── Navbar.tsx               # Responsive header, theme toggle, role switcher
│   │   │   └── StatCard.tsx             # Accessible financial metric card
│   │   ├── driver/
│   │   │   ├── DailyWorkForm.tsx        # <30s mobile-first work entry form
│   │   │   └── DriverDashboard.tsx      # Driver KPI stats, daily chart, recent shifts
│   │   ├── reports/
│   │   │   ├── MonthlyReport.tsx        # Monthly filter, CSV export, itemized table
│   │   │   └── PrintablePayslip.tsx     # Printable official salary voucher
│   │   └── settings/
│   │       └── SettingsView.tsx         # Configurable rates & system parameters
│   ├── context/
│   │   ├── AppContext.tsx               # App state, records, rates, and theme context
│   │   └── AuthContext.tsx              # Auth state, role permissions, session handling
│   ├── lib/
│   │   ├── dateUtils.ts                 # Asia/Kolkata date & INR currency formatting
│   │   ├── storage.ts                   # Storage service, calculations & seed generator
│   │   └── supabase.ts                  # Supabase client & environment detector
│   ├── test/
│   │   ├── calculations.test.ts         # Automated Vitest test suite
│   │   └── setup.ts                     # Test setup configuration
│   ├── types/
│   │   └── index.ts                     # TypeScript data contracts & models
│   ├── App.tsx                          # Root application layout
│   ├── index.css                        # Tailwind directives, print media, touch targets
│   └── main.tsx                         # React 18 DOM mount
├── supabase/
│   ├── migrations/
│   │   └── 20261017000000_init_driver_system.sql # PostgreSQL schema, RLS policies, triggers
│   └── seed.sql                         # Initial profiles & default app rates
├── public/
│   ├── favicon.svg
│   └── manifest.json                    # PWA installation manifest
├── .env.example                         # Environment variable template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts                       # Vite build & chunking configuration
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js (v18, v20, or v22)
- npm or yarn

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```

---

## 5. Free Deployment Guide

The application is architected to run permanently on free-tier cloud hosting services with zero monthly hosting fees.

### Option A: Cloudflare Pages (Recommended)
1. Push your repository to GitHub.
2. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Under **Environment variables (Advanced)**, add (optional if using Supabase):
   - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-public-key>`
5. Click **Save and Deploy**. Your site will be live on a `*.pages.dev` domain with free global CDN and SSL.

### Option B: Vercel Free Hobby Tier
1. Import the repository in [Vercel](https://vercel.com/new).
2. Framework Preset will automatically detect **Vite**.
3. Add environment variables if using Supabase.
4. Click **Deploy**.

---

## 6. Database Setup & Row Level Security (Supabase)

If deploying with Supabase PostgreSQL backend:
1. Create a free project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the entire SQL script from:
   `supabase/migrations/20261017000000_init_driver_system.sql`
4. This script configures:
   - Tables: `profiles`, `work_records`, `payments`, `audit_logs`, `app_settings`.
   - Primary & foreign keys, `ot_count >= 0` check constraints, `total_earnings` generated columns.
   - `UNIQUE(driver_id, work_date)` constraint.
   - Triggers for `updated_at`.
   - **Row Level Security (RLS) policies**:
     - Drivers can only read their own work records and payments.
     - Drivers cannot see other drivers' salary details.
     - Admins have full access to view, update, and disburse payments.
     - Only Admins can modify payment rates in `app_settings`.
5. In your project settings, retrieve the **Project URL** and **anon public key**, and set them in your deployment environment variables or `.env`.

---

## 7. Account Provisioning Instructions

### In Local / Demo Mode
The system starts pre-configured with:
- **Admin:** `admin@fleet.local` (Vikram Singh)
- **Driver 1:** `ramesh@driver.local` (Ramesh Kumar)
- **Driver 2:** `suresh@driver.local` (Suresh Patel)
- **Driver 3:** `rajesh@driver.local` (Rajesh Sharma)
- **Driver 4:** `mahesh@driver.local` (Mahesh Verma)

Use the 1-click **Role Switcher** dropdown in the navigation header to instantly inspect the application from any driver's perspective or the admin's console.

### In Supabase Cloud Production
1. Go to **Authentication** > **Users** in your Supabase Dashboard.
2. Click **Invite User** or **Add User** for each driver and the admin.
3. Insert corresponding profile rows in `public.profiles` using `supabase/seed.sql`.
4. Drivers can sign in using their email and initial password, and can securely update their passwords anytime from the user profile menu.

---

## 8. Backup, Recovery & Free-Tier Limits

### Free-Tier Limits Notice
- **Cloudflare Pages / Vercel:** Free tier includes unlimited requests/bandwidth for personal/standard use and free automated SSL.
- **Supabase Free Tier:**
  - 500 MB database storage (sufficient for over 1,000,000 daily work records).
  - Inactive projects on Supabase free tier pause after 7 days of inactivity. Simply logging into the dashboard or submitting a daily shift wakes the database.

### Backup & Recovery Instructions
1. **One-Click CSV Backup:** In the **Monthly Reports** view, click **Export CSV** at the end of each month. This downloads an itemized backup of all records.
2. **Database Dump via Supabase CLI:**
   ```bash
   npx supabase db dump -f fleet_salary_backup_$(date +%F).sql
   ```
3. **Database Restore:**
   ```bash
   psql -h db.<your-project>.supabase.co -U postgres -d postgres -f fleet_salary_backup_YYYY-MM-DD.sql
   ```

---

## 9. Automated Test Verification

All critical calculation and security behaviors are verified via automated Vitest tests:
```text
✓ calculates regular shift earnings correctly (1 day = ₹800)
✓ calculates multiple OT drives correctly (Regular 1 + 2 OT = ₹2,400)
✓ calculates zero-earnings for no-work day (shift: false, ot: 0)
✓ calculates only OT drives on a non-regular shift day (shift: false, ot: 3 = ₹2,400)
✓ prevents duplicate regular shift entries for the same date and updates instead
✓ preserves historical earnings when rates are changed in app_settings
✓ calculates monthly summary, partial payments, and outstanding balances correctly
✓ guarantees driver-to-driver data isolation in monthly summaries
✓ correctly handles month/year transitions in month selectors
✓ formats Indian currency properly with ₹ symbol
```
To run tests locally:
```bash
npm run test
```
