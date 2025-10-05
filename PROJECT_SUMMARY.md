# SmileFlow - Project Summary

## Overview

**SmileFlow** is a HIPAA-compliant, enterprise-grade dental clinic management system built with modern web technologies. It provides comprehensive patient management, appointment scheduling, automated reminders, and full audit trail capabilities.

## Key Features

### 🔐 Security & Compliance
- ✅ **HIPAA-Ready**: PHI encryption, audit logging, data retention policies
- ✅ **AES-256-GCM Encryption**: Secure storage of sensitive patient data
- ✅ **Row-Level Security (RLS)**: Database-level access controls
- ✅ **Comprehensive Audit Trail**: All staff actions automatically logged
- ✅ **Rate Limiting**: Protection against API abuse (20 req/min)
- ✅ **CSP Headers**: Content Security Policy and security headers
- ✅ **Soft Deletes**: Legal compliance and data retention

### 📅 Appointment Management
- ✅ **Smart Scheduling**: Prevent double-booking with database constraints
- ✅ **Automated Reminders**: Email reminders 24h and 2h before appointments
- ✅ **Exponential Backoff**: Retry failed reminders (15min → 1hr → 6hr → 24hr)
- ✅ **Timezone Support**: Africa/Addis_Ababa (UTC+3) timezone handling
- ✅ **Status Tracking**: Scheduled, completed, cancelled, no-show, rescheduled

### 👥 User Management
- ✅ **Role-Based Access**: Patient, Staff, Admin roles
- ✅ **Secure Authentication**: Supabase Auth with email/password
- ✅ **MFA Support**: Multi-factor authentication ready
- ✅ **Role Escalation Prevention**: Database triggers prevent unauthorized role changes

### 📊 Data Management
- ✅ **Soft Delete Pattern**: Preserve records for compliance
- ✅ **Data Retention**: Automated purge of old data
  - Audit logs: 2 years
  - Sent reminders: 6 months
  - Appointments: 5 years (soft-deleted)
- ✅ **Structured Logging**: JSON logs with context and error tracking
- ✅ **Optional Logtail Integration**: Centralized log management

### 🏥 Clinical Features
- ✅ **Patient Records**: Demographics, medical history, notes
- ✅ **Dentist Profiles**: Specialties, working hours, photos
- ✅ **Service Catalog**: Procedures with duration and pricing
- ✅ **Appointment History**: Complete patient timeline

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess`
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality React components
- **Radix UI**: Accessible component primitives

### Backend
- **Supabase**: PostgreSQL database, authentication, storage
- **Upstash Redis**: Rate limiting with sliding window
- **Resend**: Transactional email service
- **Edge Runtime**: API routes on Vercel Edge Network

### Security
- **AES-256-GCM**: PHI encryption
- **bcrypt**: Password hashing (via Supabase Auth)
- **RLS Policies**: Database-level access control
- **CSRF Protection**: Built into Next.js

### Monitoring
- **Structured Logging**: JSON format with context
- **Logtail**: Optional centralized logging
- **Vercel Analytics**: Performance monitoring

## Architecture

### Database Schema
```
user_profiles (role-based access)
  ↓
patients (PHI encrypted fields)
  ↓
appointments → dentists
             → services
             → reminders (with retry logic)

audit_logs (all staff actions)
```

### Security Layers
1. **Network**: HTTPS, rate limiting, CSP headers
2. **Application**: Authentication, authorization, validation
3. **Database**: RLS policies, soft deletes, encryption
4. **Audit**: Comprehensive logging, change tracking

### Data Flow
```
Client → Middleware (rate limit) → API Route → Supabase (RLS) → Database
                                              ↓
                                         Audit Log (automatic)
```

## File Structure

```
smileflow/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected pages
│   │   └── dashboard/
│   ├── api/                 # API routes
│   │   ├── auth/           # Auth endpoints
│   │   └── cron/           # Scheduled jobs
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                  # shadcn/ui components
├── database/
│   └── schema.sql           # Complete database schema
├── lib/
│   ├── crypto/
│   │   └── phi.ts          # PHI encryption utilities
│   ├── db/
│   │   └── soft-delete.ts  # Soft delete helpers
│   ├── supabase/
│   │   ├── admin.ts        # Service role client (server-only)
│   │   ├── client.ts       # Browser client
│   │   ├── middleware.ts   # Middleware client
│   │   └── server.ts       # Server client
│   ├── utils/
│   │   └── timezone.ts     # Ethiopian timezone helpers
│   ├── logger.ts            # Structured logging
│   ├── rate-limit.ts        # Upstash rate limiting
│   └── utils.ts             # General utilities
├── scripts/
│   └── seed.ts              # Database seeding
├── types/
│   └── database.ts          # TypeScript database types
├── middleware.ts            # Next.js middleware
├── next.config.js           # Next.js + security headers
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .gitignore
├── README.md
├── SETUP.md                 # Detailed setup guide
├── COMMANDS.md              # Quick command reference
└── vercel.json              # Cron job configuration
```

## Environment Variables

### Public (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Server-Only (`.env.server`) ⚠️ NEVER COMMIT
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ENCRYPTION_KEY`
- `LOG_LEVEL`
- `LOGTAIL_SOURCE_TOKEN` (optional)

## Cron Jobs

### Reminders (Hourly: `0 * * * *`)
- Sends appointment reminders via email
- Handles 24h and 2h reminder types
- Implements exponential backoff retry
- Filters out cancelled appointments

### Data Purge (Monthly: `0 0 1 * *`)
- Deletes audit logs > 2 years
- Deletes sent reminders > 6 months
- Soft-deletes appointments > 5 years
- Logs purge actions

## API Endpoints

### Authentication
- `POST /api/auth/signout` - Sign out user

### Cron Jobs
- `GET /api/cron/reminders` - Send appointment reminders
- `GET /api/cron/purge` - Purge old data

### Protected Routes (require authentication)
- `/dashboard` - User dashboard (role-based view)

## Database Functions

### Role Management (Admin only)
```sql
SELECT public.promote_to_admin('user-id');
SELECT public.promote_to_staff('user-id');
```

### Data Purge
```sql
SELECT public.hard_purge_old_records();
```

### Helper Functions
```sql
SELECT public.is_staff('user-id');
SELECT public.is_admin('user-id');
```

## Compliance Features

### HIPAA Requirements Met
✅ **Access Control**: RLS + role-based permissions  
✅ **Audit Controls**: Comprehensive logging  
✅ **Integrity Controls**: Checksums via encryption  
✅ **Transmission Security**: TLS 1.3  
✅ **Encryption at Rest**: Supabase AES-256  
✅ **Encryption in Transit**: HTTPS  
✅ **Authentication**: Secure password hashing  
✅ **Authorization**: Database-level RLS  
✅ **Activity Logging**: All staff actions tracked  
✅ **Data Retention**: Configurable policies  

### PHI Fields (Encrypted)
- `patients.notes_encrypted` (bytea)
- `patients.medical_history_encrypted` (bytea)

Uses AES-256-GCM with authenticated encryption.

## Testing Checklist

- [ ] Double-booking prevention
- [ ] Role escalation blocked
- [ ] Soft delete preserves records
- [ ] Audit logs auto-created
- [ ] Reminder retry with backoff
- [ ] Rate limiting enforced
- [ ] PHI encryption/decryption
- [ ] Data purge respects retention
- [ ] RLS policies working
- [ ] Security headers present

## Performance Optimizations

- **Database Indexes**: On frequently queried columns
- **RLS Caching**: Helper functions use `STABLE` hint
- **Connection Pooling**: Via Supabase
- **Edge Runtime**: API routes run on Vercel Edge
- **Soft Deletes**: Avoid expensive cascading deletes
- **Batch Operations**: Efficient bulk inserts in seed

## Known Limitations

1. **Email Sending**: Resend free tier limits apply
2. **Rate Limiting**: Requires Upstash Redis (optional in dev)
3. **MFA**: Supported but not enforced by default
4. **File Upload**: Storage configured but UI not included
5. **Internationalization**: Currently English only
6. **Payment Processing**: Not implemented (future feature)

## Future Enhancements

- [ ] Patient portal with appointment booking UI
- [ ] Staff schedule management interface
- [ ] Invoice generation with PDF export
- [ ] SMS reminders via Twilio
- [ ] Analytics dashboard for admin
- [ ] Multi-clinic support
- [ ] Integration with dental equipment APIs
- [ ] Advanced reporting and insights
- [ ] Mobile app (React Native)
- [ ] Telemedicine video consultations

## Deployment Options

### Recommended: Vercel
- Zero-config deployment
- Built-in cron jobs
- Edge network
- Automatic HTTPS

### Alternative: Self-hosted
- Docker support (create Dockerfile)
- PM2 for process management
- Nginx reverse proxy
- Manual cron setup

## License

Proprietary - SmileFlow Dental Clinic

## Contributors

Built with ❤️ for modern dental practices.

---

## Quick Start

```bash
cd C:\dev\smileflow
npm install
# Configure .env.local and .env.server
npm run seed
npm run dev
```

Visit http://localhost:3000

**Default Credentials:**
- Admin: admin@clinic.com / TempPass123!
- Staff: staff@clinic.com / TempPass123!
- Patient: patient1@example.com / TempPass123!

---

## Support

For setup assistance, see:
- `SETUP.md` - Detailed setup guide
- `COMMANDS.md` - Quick command reference
- `README.md` - Feature overview

For technical details:
- `database/schema.sql` - Database structure
- `lib/` - Core utilities and helpers
- `types/database.ts` - TypeScript types

