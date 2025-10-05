# Getting Started with SmileFlow

**5-Minute Quick Start Guide**

This guide will get you from zero to running SmileFlow locally in about 5-10 minutes (excluding account creation time).

---

## What You'll Need

- ✅ Node.js 18+ installed
- ✅ A code editor (VS Code recommended)
- ✅ Terminal/Command Prompt
- ✅ Internet connection

---

## Step 1: Create Accounts (5 minutes)

### Supabase (Database & Auth)
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (fastest)
4. Create new project:
   - Name: `smileflow`
   - Password: (generate strong password)
   - Region: Choose closest to you
5. **Wait 2-3 minutes** for project to initialize ☕

### Upstash (Rate Limiting)
1. Go to https://upstash.com
2. Sign up with GitHub
3. Click "Create Database"
4. Name: `smileflow-redis`
5. Region: Same as Supabase
6. Plan: Free tier
7. Click "Create"

### Resend (Emails)
1. Go to https://resend.com
2. Sign up with email
3. Verify your email
4. Dashboard → API Keys → "Create API Key"
5. Name: `smileflow-local`
6. Copy key immediately (only shown once)

---

## Step 2: Setup Database (2 minutes)

### Execute Schema
1. Open Supabase Dashboard → SQL Editor
2. Open this project's `database/schema.sql` file
3. **Select ALL text** (Ctrl+A / Cmd+A)
4. **Copy** (Ctrl+C / Cmd+C)
5. **Paste** into Supabase SQL Editor
6. Click **"Run"** button
7. Wait for "Success. No rows returned"

### Get API Keys
1. Supabase Dashboard → Settings → API
2. **Copy these values:**
   - Project URL
   - anon/public key
   - service_role key (⚠️ keep secret!)

---

## Step 3: Configure Project (3 minutes)

### Install Dependencies
```bash
cd C:\dev\smileflow
npm install
```

### Create Environment Files

**File 1: `.env.local`** (public variables)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File 2: `.env.server`** (server-only secrets)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYB...
ENCRYPTION_KEY=[run command below to generate]
LOG_LEVEL=info
```

### Generate Encryption Key

**Windows PowerShell:**
```powershell
$bytes = New-Object Byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [BitConverter]::ToString($bytes) -replace '-',''
```

**Mac/Linux:**
```bash
openssl rand -hex 32
```

Copy the output (64 hex characters) and paste as `ENCRYPTION_KEY`.

---

## Step 4: Seed Data (1 minute)

```bash
npm run seed
```

**Output will show:**
- ✅ Admin user created
- ✅ Staff user created
- ✅ 5 patients created
- ✅ 3 dentists created
- ✅ 6 services created
- ✅ 10 appointments created

**IMPORTANT:** Copy the SQL commands shown at the end!

### Promote Admin User
1. Go to Supabase Dashboard → SQL Editor
2. Paste the commands from seed output:
```sql
SELECT public.promote_to_admin('user-id-here');
SELECT public.promote_to_staff('user-id-here');
```
3. Click "Run"

---

## Step 5: Launch! (10 seconds)

```bash
npm run dev
```

Open browser to: **http://localhost:3000**

---

## Step 6: Test Login

### Try These Accounts:

**Admin Access:**
- Email: `admin@clinic.com`
- Password: `TempPass123!`
- Can: Manage everything + view audit logs

**Staff Access:**
- Email: `staff@clinic.com`
- Password: `TempPass123!`
- Can: Manage patients, appointments, dentists

**Patient Access:**
- Email: `patient1@example.com`
- Password: `TempPass123!`
- Can: View own appointments

---

## 🎉 You're Running!

### What to Explore:

1. **Dashboard** - See role-based views
2. **Try different users** - See different permissions
3. **Check database** - Supabase Table Editor
4. **View logs** - Check terminal output

---

## Next Steps

### Customize Your Clinic

1. **Add Real Dentists**
   - Login as admin
   - Go to Dentists section
   - Update sample data

2. **Configure Services**
   - Update pricing
   - Add/remove services
   - Set durations

3. **Update Branding**
   - Change "SmileFlow" to your clinic name
   - Update colors in `tailwind.config.ts`
   - Add logo

### Test Features

Try these in order:

1. **Security Testing**
   ```bash
   # Try to exceed rate limit
   for ($i=0; $i -lt 25; $i++) { curl http://localhost:3000/ }
   ```

2. **Cron Jobs**
   ```bash
   # Test reminder cron
   curl http://localhost:3000/api/cron/reminders
   
   # Test purge cron
   curl http://localhost:3000/api/cron/purge
   ```

3. **Database Checks**
   - Supabase → Table Editor
   - Check `audit_logs` table
   - Check `appointments` table
   - Try the SQL queries in `COMMANDS.md`

---

## Common Issues & Fixes

### "Missing Supabase environment variables"
❌ Problem: `.env.local` not found or has wrong values

✅ Fix:
1. Check file is named `.env.local` (not `.env.local.txt`)
2. Check file is in project root
3. Restart dev server: `npm run dev`

### "Failed to fetch reminders"
❌ Problem: Database schema not applied

✅ Fix:
1. Go to Supabase SQL Editor
2. Re-run entire `database/schema.sql`
3. Check for error messages

### "ENCRYPTION_KEY not found"
❌ Problem: `.env.server` missing or incorrect

✅ Fix:
1. Create `.env.server` in project root
2. Generate encryption key (see Step 3)
3. Add to `.env.server`

### "Rate limit check failed"
❌ Problem: Upstash Redis credentials wrong

✅ Fix:
1. Verify Upstash Redis URL and Token
2. Check for typos
3. In development, app will work anyway (rate limiting optional)

### Can't login after seeding
❌ Problem: Admin/Staff not promoted

✅ Fix:
1. Go to Supabase SQL Editor
2. Run: `SELECT public.promote_to_admin('admin-user-id');`
3. User ID is shown in seed output

---

## Development Tips

### Hot Reload
Changes to files automatically reload the page. But:
- Changes to `.env.*` require restart
- Database changes require manual migration
- TypeScript errors prevent compilation

### View Logs
- **Application logs**: Terminal where `npm run dev` runs
- **Database logs**: Supabase Dashboard → Database → Logs
- **API logs**: Terminal + structured JSON output

### Debug Mode
Add to `.env.server`:
```env
LOG_LEVEL=debug
```

### Database Queries
Use Supabase SQL Editor for quick queries:
```sql
-- See all users
SELECT * FROM public.user_profiles;

-- See today's appointments
SELECT * FROM public.appointments 
WHERE starts_at::date = CURRENT_DATE;

-- Check audit logs
SELECT * FROM public.audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Ready for Production?

When you're ready to deploy:

1. Read `DEPLOYMENT_CHECKLIST.md` - Complete checklist
2. **ROTATE ALL API KEYS** - Security first!
3. Follow Vercel deployment steps
4. Configure cron jobs
5. Change default passwords

---

## Need Help?

### Documentation
- `README.md` - Feature overview
- `SETUP.md` - Detailed setup
- `COMMANDS.md` - Command reference
- `PROJECT_SUMMARY.md` - Architecture
- `DEPLOYMENT_CHECKLIST.md` - Production deploy

### External Resources
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs

---

## Success Checklist

- [x] Node.js installed
- [ ] Accounts created (Supabase, Upstash, Resend)
- [ ] Database schema executed
- [ ] Environment files configured
- [ ] Dependencies installed
- [ ] Database seeded
- [ ] Admin user promoted
- [ ] Dev server running
- [ ] Can login as admin
- [ ] Can login as staff
- [ ] Can login as patient

**All checked? You're ready to build! 🚀**

---

## Quick Reference Card

```
📦 Install:           npm install
🌱 Seed:             npm run seed
🏃 Dev:              npm run dev
🏗️  Build:            npm run build
🚀 Start:            npm start

🔐 Admin:            admin@clinic.com / TempPass123!
👔 Staff:            staff@clinic.com / TempPass123!
🧑 Patient:          patient1@example.com / TempPass123!

🌐 Local URL:        http://localhost:3000
📊 Supabase:         https://app.supabase.com
⚡ Upstash:          https://console.upstash.com
📧 Resend:           https://resend.com/dashboard
```

---

**Happy Building! 😊**

For detailed information, see the other documentation files in this project.

