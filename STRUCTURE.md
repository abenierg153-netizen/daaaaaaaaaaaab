# SmileFlow - Project Structure

## Directory Tree

```
smileflow/
│
├── 📁 app/                          # Next.js 15 App Router
│   ├── 📁 (auth)/                   # Authentication route group
│   │   ├── 📁 login/
│   │   │   └── page.tsx            # Login page
│   │   └── 📁 register/
│   │       └── page.tsx            # Registration page
│   │
│   ├── 📁 (dashboard)/              # Protected route group
│   │   └── 📁 dashboard/
│   │       └── page.tsx            # Main dashboard
│   │
│   ├── 📁 api/                      # API routes
│   │   ├── 📁 auth/
│   │   │   └── 📁 signout/
│   │   │       └── route.ts        # Sign out endpoint
│   │   └── 📁 cron/
│   │       ├── 📁 reminders/
│   │       │   └── route.ts        # Hourly reminder cron
│   │       └── 📁 purge/
│   │           └── route.ts        # Monthly purge cron
│   │
│   ├── globals.css                  # Global styles + Tailwind
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
│
├── 📁 components/                   # React components
│   └── 📁 ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
│
├── 📁 database/                     # Database schemas
│   └── schema.sql                   # Complete PostgreSQL schema
│
├── 📁 lib/                          # Core libraries
│   ├── 📁 crypto/                   # Encryption utilities
│   │   └── phi.ts                  # PHI encryption (AES-256-GCM)
│   │
│   ├── 📁 db/                       # Database helpers
│   │   └── soft-delete.ts          # Soft delete utilities
│   │
│   ├── 📁 supabase/                 # Supabase clients
│   │   ├── admin.ts                # Service role (server-only) ⚠️
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Middleware client
│   │   └── server.ts               # Server component client
│   │
│   ├── 📁 utils/                    # Utility functions
│   │   └── timezone.ts             # Ethiopian timezone helpers
│   │
│   ├── logger.ts                    # Structured logging
│   ├── rate-limit.ts                # Upstash rate limiting
│   └── utils.ts                     # General utilities
│
├── 📁 scripts/                      # Utility scripts
│   └── seed.ts                      # Database seeding
│
├── 📁 types/                        # TypeScript definitions
│   └── database.ts                  # Generated Supabase types
│
├── 📄 middleware.ts                 # Next.js middleware
├── 📄 next.config.js                # Next.js config + security headers
├── 📄 tailwind.config.ts            # Tailwind CSS config
├── 📄 tsconfig.json                 # TypeScript config (strict mode)
├── 📄 postcss.config.mjs            # PostCSS config
├── 📄 package.json                  # Dependencies & scripts
├── 📄 vercel.json                   # Vercel cron configuration
│
├── 📄 .gitignore                    # Git ignore rules
├── 📄 .env.local.example            # Public env template
│
├── 📚 README.md                     # Project overview
├── 📚 GETTING_STARTED.md            # Quick start guide
├── 📚 SETUP.md                      # Detailed setup
├── 📚 COMMANDS.md                   # Command reference
├── 📚 PROJECT_SUMMARY.md            # Architecture overview
├── 📚 DEPLOYMENT_CHECKLIST.md       # Deploy checklist
└── 📚 STRUCTURE.md                  # This file
```

---

## File Descriptions

### Core Application Files

#### `app/layout.tsx`
- Root layout for entire application
- Includes global styles and fonts
- Wraps all pages

#### `app/page.tsx`
- Landing page
- Marketing content
- Links to login/register

#### `middleware.ts`
- Runs on every request
- Handles:
  - Session refresh (Supabase)
  - Rate limiting (Upstash)
  - Security headers

---

### Authentication

#### `app/(auth)/login/page.tsx`
- Login form
- Client component
- Uses Supabase Auth
- Redirects to dashboard on success

#### `app/(auth)/register/page.tsx`
- Registration form
- Creates patient account
- Email confirmation required
- Auto-creates user profile

#### `app/api/auth/signout/route.ts`
- Sign out endpoint
- Clears session
- Redirects to login

---

### Dashboard

#### `app/(dashboard)/dashboard/page.tsx`
- Main dashboard
- Server component (secure)
- Role-based content:
  - **Patient**: Upcoming appointments
  - **Staff**: Today's stats + quick actions
  - **Admin**: System health + audit logs

---

### API Routes

#### `app/api/cron/reminders/route.ts`
**Hourly Cron Job** (`0 * * * *`)
- Finds pending reminders
- Sends via Resend
- Handles retry with exponential backoff
- Updates reminder status

#### `app/api/cron/purge/route.ts`
**Monthly Cron Job** (`0 0 1 * *`)
- Purges old audit logs (2+ years)
- Deletes sent reminders (6+ months)
- Soft-deletes old appointments (5+ years)
- Logs purge action

---

### Supabase Clients

#### `lib/supabase/client.ts`
- **Browser client**
- For client components
- Uses anon key (safe)
- RLS policies enforced

#### `lib/supabase/server.ts`
- **Server client**
- For server components/actions
- Uses anon key (safe)
- Cookie-based sessions

#### `lib/supabase/admin.ts`
- **Admin client** ⚠️ DANGEROUS
- Uses service role key
- Bypasses RLS
- **SERVER-ONLY**
- Used in: seed script, cron jobs

#### `lib/supabase/middleware.ts`
- **Middleware client**
- Refreshes sessions
- Updates cookies

---

### Security & Utilities

#### `lib/crypto/phi.ts`
- **PHI Encryption**
- AES-256-GCM
- Functions:
  - `encryptPHI()` - Encrypt plaintext
  - `decryptPHI()` - Decrypt ciphertext
  - `encryptPHIForDB()` - For bytea storage
  - `decryptPHIFromDB()` - From bytea

#### `lib/logger.ts`
- **Structured Logging**
- Log levels: debug, info, warn, error, audit
- JSON format
- Optional Logtail integration
- Functions:
  - `logger.info()` - General info
  - `logger.error()` - Errors with stack trace
  - `logger.audit()` - Audit trail

#### `lib/rate-limit.ts`
- **Rate Limiting**
- Uses Upstash Redis
- Sliding window: 20 req/min
- Optional in development
- Functions:
  - `getRatelimit()` - Get instance
  - `checkRateLimit()` - Check limit

#### `lib/db/soft-delete.ts`
- **Soft Delete Utilities**
- Functions:
  - `softDelete()` - Set deleted_at
  - `restore()` - Clear deleted_at
  - `permanentDelete()` - Hard delete (admin only)
  - `isDeleted()` - Check if deleted

#### `lib/utils/timezone.ts`
- **Timezone Utilities**
- Ethiopian Time (UTC+3)
- Functions:
  - `formatEthiopianTime()` - Format with TZ
  - `formatEthiopianDate()` - Date only
  - `formatAppointmentTime()` - Full format

---

### Database

#### `database/schema.sql`
**Complete PostgreSQL Schema**

Tables:
- `user_profiles` - User accounts with roles
- `patients` - Patient records (PHI encrypted)
- `dentists` - Dentist profiles
- `services` - Available services
- `appointments` - Scheduling
- `reminders` - Email reminders
- `audit_logs` - Audit trail

Functions:
- `handle_new_user()` - Auto-create profile
- `prevent_role_escalation()` - Security
- `promote_to_staff()` - Admin only
- `promote_to_admin()` - Admin only
- `set_ends_at_from_service()` - Auto-calculate
- `audit_mutation()` - Auto-audit
- `calculate_next_retry()` - Exponential backoff
- `hard_purge_old_records()` - Data retention
- `set_updated_at()` - Auto-timestamp
- `is_staff()` - Helper for RLS
- `is_admin()` - Helper for RLS

Triggers:
- Auto-create user profile on signup
- Prevent unauthorized role changes
- Auto-calculate appointment end time
- Auto-log staff actions
- Auto-update timestamps

RLS Policies:
- Patient can see own data
- Staff can see all
- Admin has full access
- Enforced at database level

---

### Configuration

#### `next.config.js`
- Next.js configuration
- **Security headers**:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy
  - Permissions-Policy

#### `middleware.ts`
- Runs on all requests
- Updates Supabase session
- Checks rate limits
- Adds security headers

#### `tsconfig.json`
- TypeScript strict mode
- `noUncheckedIndexedAccess: true`
- Path aliases: `@/*`

#### `tailwind.config.ts`
- Tailwind CSS setup
- Custom theme
- shadcn/ui integration

#### `vercel.json`
- Cron job schedules
- Reminders: hourly
- Purge: monthly

---

### Scripts

#### `scripts/seed.ts`
- Database seeding
- Creates:
  - Admin + staff users
  - 5 patient users
  - 3 dentists
  - 6 services
  - 10 appointments
  - Reminders
- Prints promotion commands

#### `package.json` Scripts
```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "seed": "tsx scripts/seed.ts" // Seed database
}
```

---

### Documentation

#### `README.md`
- Project overview
- Feature list
- Quick start
- Tech stack

#### `GETTING_STARTED.md`
- 5-minute quick start
- Step-by-step setup
- Common issues

#### `SETUP.md`
- Detailed setup guide
- All prerequisites
- Testing procedures

#### `COMMANDS.md`
- Command reference
- SQL queries
- Git operations

#### `PROJECT_SUMMARY.md`
- Architecture details
- Compliance features
- File structure

#### `DEPLOYMENT_CHECKLIST.md`
- Pre-deployment checks
- Production setup
- Post-deployment
- Maintenance

#### `STRUCTURE.md`
- This file
- Directory tree
- File descriptions

---

## Environment Files

### `.env.local` (Public)
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `.env.server` (Server-only) ⚠️
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AYB...
ENCRYPTION_KEY=64_hex_characters
LOG_LEVEL=info
LOGTAIL_SOURCE_TOKEN=optional
```

**CRITICAL**: `.env.server` is in `.gitignore` and must NEVER be committed!

---

## Data Flow

### Authentication Flow
```
User → Login Page → Supabase Auth → Session → Dashboard
                                      ↓
                              user_profiles table
                                      ↓
                              Role-based content
```

### Appointment Booking Flow
```
Patient → Form → API Route → Validation → Database
                                              ↓
                                    Check double-booking
                                              ↓
                                      Create appointment
                                              ↓
                                     Create reminders
                                              ↓
                                       Audit log
```

### Reminder Flow
```
Cron (hourly) → Find pending → Send email → Success?
                                              ↓
                                      Yes: Mark sent
                                      No: Retry with backoff
```

### Security Flow
```
Request → Middleware → Rate limit → Auth check → RLS → Data
            ↓              ↓            ↓          ↓
        Refresh       Check Redis   Verify JWT   Policies
```

---

## Key Features by File

### Double-booking Prevention
- **File**: `database/schema.sql`
- **Method**: `EXCLUDE` constraint with `gist` index
- **Line**: Constraint on `appointments` table

### Role Escalation Prevention
- **File**: `database/schema.sql`
- **Method**: `prevent_role_escalation()` trigger
- **Enforced**: Database level

### PHI Encryption
- **File**: `lib/crypto/phi.ts`
- **Method**: AES-256-GCM
- **Used in**: Patient notes, medical history

### Audit Logging
- **File**: `database/schema.sql`
- **Method**: `audit_mutation()` trigger
- **Triggers on**: All staff mutations

### Rate Limiting
- **File**: `middleware.ts` + `lib/rate-limit.ts`
- **Method**: Upstash Redis sliding window
- **Limit**: 20 requests/minute

### Soft Delete
- **File**: `lib/db/soft-delete.ts`
- **Method**: Set `deleted_at` timestamp
- **Reason**: Legal compliance

---

## Import Aliases

```typescript
@/*           // Maps to project root
@/lib/*       // Maps to lib/
@/components/* // Maps to components/
@/types/*     // Maps to types/
```

Configured in `tsconfig.json`.

---

## Development vs Production

### Development
- `.env.local` with local URLs
- `.env.server` with dev keys
- Rate limiting optional
- Debug logging enabled
- Sample data via seed script

### Production
- Environment variables in Vercel
- Rotated API keys
- Rate limiting enforced
- Info-level logging
- Real production data

---

## Security Boundaries

### Client-Safe ✅
- Anon key
- Public URLs
- Browser client
- UI components

### Server-Only ⚠️
- Service role key
- Encryption key
- Admin client
- Cron jobs
- Seed script

### Never Expose 🚫
- `.env.server` contents
- Service role key
- Encryption key
- Database passwords

---

This structure ensures:
- ✅ Clear separation of concerns
- ✅ Type safety with TypeScript
- ✅ Security by design
- ✅ Scalable architecture
- ✅ Easy to maintain
- ✅ HIPAA compliant

