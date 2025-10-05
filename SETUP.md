# SmileFlow Setup Guide

Complete step-by-step instructions to get SmileFlow running locally and in production.

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Supabase** account (https://supabase.com)
- **Upstash Redis** account (https://upstash.com)
- **Resend** account for emails (https://resend.com)

---

## Step 1: Clone and Install Dependencies

```bash
cd C:\dev\smileflow
npm install
```

---

## Step 2: Setup Supabase Database

### 2.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for project initialization (~2 minutes)

### 2.2 Execute Database Schema
1. Open Supabase Dashboard → SQL Editor
2. Open the file `database/schema.sql` from this project
3. Copy the **entire contents** 
4. Paste into Supabase SQL Editor
5. Click "Run" to execute

### 2.3 Get API Keys
1. Go to Project Settings → API
2. Copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) - ⚠️ **NEVER expose to client**

---

## Step 3: Setup Upstash Redis

### 3.1 Create Redis Database
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Choose region closest to your Supabase region
4. Select "Pay as you go" (free tier available)

### 3.2 Get Redis Credentials
1. Click on your database
2. Scroll to "REST API" section
3. Copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

---

## Step 4: Setup Resend (Email Service)

### 4.1 Create Resend Account
1. Go to https://resend.com
2. Sign up for free account
3. Verify your email

### 4.2 Get API Key
1. Dashboard → API Keys
2. Create new API key
3. Copy: **RESEND_API_KEY**

### 4.3 Setup Domain (Optional for Production)
For production, verify your domain:
1. Resend Dashboard → Domains
2. Add your domain
3. Add DNS records shown by Resend
4. Update email "from" address in `app/api/cron/reminders/route.ts`

**For Development:** Use default `onboarding@resend.dev` (limited to verified addresses)

---

## Step 5: Generate Encryption Key

### Windows PowerShell:
```powershell
$bytes = New-Object Byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[BitConverter]::ToString($bytes) -replace '-',''
```

### Mac/Linux (with OpenSSL):
```bash
openssl rand -hex 32
```

Copy the 64-character hex string for `ENCRYPTION_KEY`.

---

## Step 6: Configure Environment Variables

### 6.1 Create `.env.local`
Create file `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your_anon_key
RESEND_API_KEY=re_...your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 Create `.env.server` (SERVER-ONLY)
Create file `.env.server` in project root:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYB...your_redis_token
ENCRYPTION_KEY=your_64_char_hex_key_from_step_5
LOG_LEVEL=info
```

⚠️ **CRITICAL SECURITY NOTES:**
- `.env.server` is in `.gitignore` - NEVER commit it
- Service role key has full database access - keep it secret
- Rotate all keys before production deployment

---

## Step 7: Seed Database

```bash
npm run seed
```

This creates:
- **Admin user:** admin@clinic.com / TempPass123!
- **Staff user:** staff@clinic.com / TempPass123!
- **5 Patient users:** patient1-5@example.com / TempPass123!
- **3 Dentists**
- **6 Services**
- **10 Sample appointments**

### 7.1 Promote Users
After seeding, the script will print SQL commands. Run them in Supabase SQL Editor:

```sql
SELECT public.promote_to_admin('user-id-from-output');
SELECT public.promote_to_staff('staff-user-id-from-output');
```

---

## Step 8: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Test Accounts:
- **Admin:** admin@clinic.com / TempPass123!
- **Staff:** staff@clinic.com / TempPass123!
- **Patient:** patient1@example.com / TempPass123!

---

## Step 9: Production Deployment (Vercel)

### 9.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### 9.2 Deploy to Vercel
1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Configure environment variables:
   - Add **ALL** variables from `.env.local`
   - Add **ALL** variables from `.env.server`
   - Set `NEXT_PUBLIC_APP_URL` to your production URL

### 9.3 Configure Cron Jobs
In Vercel Dashboard:
1. Go to Project Settings → Cron Jobs
2. Add two cron jobs:

**Reminder Cron:**
- Path: `/api/cron/reminders`
- Schedule: `0 * * * *` (every hour)

**Data Purge Cron:**
- Path: `/api/cron/purge`
- Schedule: `0 0 1 * *` (monthly, 1st at midnight)

### 9.4 Optional: Cron Secret
Add `CRON_SECRET` environment variable in Vercel for extra security:
```
CRON_SECRET=some_random_secret_string
```

### 9.5 Rotate API Keys
⚠️ **BEFORE GOING LIVE:**
1. Supabase Dashboard → Settings → API → Rotate keys
2. Regenerate encryption key
3. Update all environment variables in Vercel

---

## Step 10: Testing

### Functional Tests:

1. **Authentication:**
   - ✅ Register new patient account
   - ✅ Login with patient/staff/admin
   - ✅ Logout

2. **Double-booking Prevention:**
   - ✅ Try to book two appointments for same dentist at same time
   - ✅ Should fail with constraint error

3. **Role Escalation:**
   - ✅ Login as patient
   - ✅ Try to update your role to 'admin' via API
   - ✅ Should fail with permission error

4. **Soft Delete:**
   - ✅ Delete an appointment (staff)
   - ✅ Verify it has `deleted_at` timestamp
   - ✅ Verify it no longer appears in lists

5. **Audit Logs:**
   - ✅ Login as staff
   - ✅ Update a patient record
   - ✅ Check `audit_logs` table for entry

6. **Rate Limiting:**
   - ✅ Make 25+ rapid requests to any endpoint
   - ✅ Should get 429 Too Many Requests

7. **PHI Encryption:**
   - ✅ Check `lib/crypto/phi.ts` tests
   - ✅ Encrypt and decrypt sample data

8. **Data Purge:**
   - ✅ Manually trigger `/api/cron/purge`
   - ✅ Verify old records are purged

9. **Reminders:**
   - ✅ Create appointment in next 2 hours
   - ✅ Manually trigger `/api/cron/reminders`
   - ✅ Check email for reminder

10. **RLS Policies:**
    - ✅ Login as patient
    - ✅ Try to access another patient's data
    - ✅ Should fail with no data returned

---

## Step 11: Monitoring (Optional)

### Setup Logtail
1. Create account at https://betterstack.com/logtail
2. Create new source
3. Copy source token
4. Add to `.env.server`: `LOGTAIL_SOURCE_TOKEN=your_token`
5. Redeploy to Vercel

Now all logs will be sent to Logtail dashboard.

---

## Troubleshooting

### "Missing Supabase environment variables"
- Verify `.env.local` exists and has correct values
- Restart dev server after creating `.env.local`

### "SUPABASE_SERVICE_ROLE_KEY not found"
- Verify `.env.server` exists
- Check file is in project root (not subdirectory)

### Rate limiting not working
- Upstash Redis credentials might be incorrect
- In development, rate limiting is optional (won't crash app)

### Reminders not sending
- Check Resend API key is valid
- Verify email domain or use default for testing
- Check cron job logs in Vercel

### Database permission errors
- Verify RLS policies in Supabase
- Check user role is correctly set
- Run promote functions in SQL Editor

---

## Security Checklist Before Production

- [ ] All API keys rotated from defaults
- [ ] `.env.server` is in `.gitignore`
- [ ] Service role key never exposed to client
- [ ] HTTPS enabled on domain
- [ ] Cron secret configured
- [ ] MFA enabled for admin accounts (optional)
- [ ] Default passwords changed
- [ ] Security headers verified (CSP, etc.)
- [ ] Rate limiting active
- [ ] Audit logs enabled
- [ ] Backups configured in Supabase

---

## Support

For issues or questions:
1. Check this guide first
2. Review `README.md` for architecture details
3. Check Supabase/Vercel logs for errors

---

## Next Steps

- [ ] Customize UI theme and branding
- [ ] Add more services and dentists
- [ ] Configure custom domain
- [ ] Setup backup procedures
- [ ] Train staff on system usage
- [ ] Review compliance requirements for your region

