# SmileFlow - Quick Command Reference

## Initial Setup Commands

### 1. Navigate to Project
```bash
cd C:\dev\smileflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Project (verify no errors)
```bash
npm run build
```

## Database Setup

### 4. Apply Database Schema
**Manual Step:** 
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `database/schema.sql`
3. Paste and execute

### 5. Setup Upstash Redis
**Manual Step:**
1. Go to https://upstash.com
2. Create database
3. Copy REST URL and TOKEN

### 6. Generate Encryption Key

**Windows PowerShell:**
```powershell
$bytes = New-Object Byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [BitConverter]::ToString($bytes) -replace '-',''
```

**Mac/Linux:**
```bash
openssl rand -hex 32
```

## Environment Configuration

### 7. Create .env.server
**Manual Step:**
Create `.env.server` with:
```
SUPABASE_SERVICE_ROLE_KEY=[your_service_key]
UPSTASH_REDIS_REST_URL=[your_redis_url]
UPSTASH_REDIS_REST_TOKEN=[your_redis_token]
ENCRYPTION_KEY=[64_char_hex_from_step_6]
LOG_LEVEL=info
```

### 8. Create .env.local
Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=[your_supabase_url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
RESEND_API_KEY=[your_resend_key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Seeding

### 9. Seed Database
```bash
npm run seed
```

### 10. Promote Admin (run in Supabase SQL Editor)
**Manual Step:**
Use the SQL command printed by seed script:
```sql
SELECT public.promote_to_admin('user-id-from-seed-output');
SELECT public.promote_to_staff('staff-user-id-from-seed-output');
```

## Vercel Deployment

### 11. Configure Vercel Cron
**Manual Step:**
In Vercel Dashboard → Cron Jobs:
- `/api/cron/reminders` - `0 * * * *`
- `/api/cron/purge` - `0 0 1 * *`

## Development

### 12. Start Development Server
```bash
npm run dev
```

### 13. Build for Production
```bash
npm run build
```

### 14. Start Production Server
```bash
npm start
```

## Testing

### 15. Test Manual Cron Jobs (Development)

**Reminders:**
```bash
curl http://localhost:3000/api/cron/reminders
```

**Data Purge:**
```bash
curl http://localhost:3000/api/cron/purge
```

## Git Operations

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Connect to GitHub
```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Useful Database Queries (Supabase SQL Editor)

### Check User Profiles
```sql
SELECT * FROM public.user_profiles ORDER BY created_at DESC;
```

### Check Recent Appointments
```sql
SELECT 
  a.*,
  p.email as patient_email,
  d.full_name as dentist_name,
  s.name as service_name
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN public.dentists d ON a.dentist_id = d.id
JOIN public.services s ON a.service_id = s.id
WHERE a.deleted_at IS NULL
ORDER BY a.starts_at DESC
LIMIT 10;
```

### Check Audit Logs
```sql
SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 20;
```

### Check Pending Reminders
```sql
SELECT 
  r.*,
  a.starts_at as appointment_time
FROM public.reminders r
JOIN public.appointments a ON r.appointment_id = a.id
WHERE r.status = 'pending'
ORDER BY a.starts_at;
```

### Manually Promote User to Admin
```sql
SELECT public.promote_to_admin('user-id-here');
```

### Manually Promote User to Staff
```sql
SELECT public.promote_to_staff('user-id-here');
```

### Check Storage Usage
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects
GROUP BY bucket_id;
```

### Run Data Purge Manually
```sql
SELECT public.hard_purge_old_records();
```

## Common Issues & Fixes

### Clear Next.js Cache
```bash
rm -rf .next
npm run build
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Environment Variables
```bash
# Windows PowerShell
Get-Content .env.local
Get-Content .env.server

# Mac/Linux
cat .env.local
cat .env.server
```

### View Application Logs (Production)
Check Vercel Dashboard → Deployments → [Latest] → Functions

## Summary of Manual Steps

These steps CANNOT be automated and require manual action:

1. ✋ Copy SQL schema to Supabase SQL Editor
2. ✋ Setup Upstash Redis account and database
3. ✋ Generate encryption key
4. ✋ Create `.env.server` file with SERVER-ONLY keys
5. ✋ Create `.env.local` file with public variables
6. ✋ Run `npm run seed`
7. ✋ Promote admin/staff users in Supabase SQL Editor
8. ✋ Configure Vercel Cron Jobs in Dashboard
9. ✋ Test all 10 compliance requirements
10. ✋ Deploy to Vercel with environment variables

---

## Quick Start (After Initial Setup)

```bash
cd C:\dev\smileflow
npm run dev
# Visit http://localhost:3000
```

**Login with:**
- Admin: admin@clinic.com / TempPass123!
- Staff: staff@clinic.com / TempPass123!
- Patient: patient1@example.com / TempPass123!

