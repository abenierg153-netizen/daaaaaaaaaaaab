# SmileFlow Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup ✅

- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] `.env.local` configured with public variables
- [ ] `.env.server` configured with server-only variables
- [ ] Encryption key generated (64 hex characters)
- [ ] All API keys obtained:
  - [ ] Supabase URL
  - [ ] Supabase Anon Key
  - [ ] Supabase Service Role Key
  - [ ] Upstash Redis URL
  - [ ] Upstash Redis Token
  - [ ] Resend API Key

### 2. Database Setup ✅

- [ ] Supabase project created
- [ ] Database schema executed (`database/schema.sql`)
- [ ] Schema executed successfully (no errors)
- [ ] Extensions enabled (uuid-ossp, pgcrypto, btree_gist)
- [ ] All tables created
- [ ] All triggers created
- [ ] All RLS policies enabled
- [ ] Storage bucket created

### 3. Initial Data ✅

- [ ] Seed script executed (`npm run seed`)
- [ ] Admin user created
- [ ] Staff user created
- [ ] Patient users created
- [ ] Admin promoted via SQL: `SELECT public.promote_to_admin('user-id');`
- [ ] Staff promoted via SQL: `SELECT public.promote_to_staff('user-id');`
- [ ] Sample dentists created
- [ ] Sample services created
- [ ] Sample appointments created

### 4. Local Testing ✅

- [ ] Development server runs (`npm run dev`)
- [ ] Home page loads (http://localhost:3000)
- [ ] Login page accessible
- [ ] Register page accessible
- [ ] Can login as patient
- [ ] Can login as staff
- [ ] Can login as admin
- [ ] Dashboard loads correctly
- [ ] User sees appropriate role-based content

### 5. Security Testing ✅

- [ ] **Double-booking prevention**: Try booking overlapping appointments
  - Expected: Database constraint error
- [ ] **Role escalation prevention**: Patient tries to become admin
  - Expected: Permission denied
- [ ] **Soft delete**: Delete record and verify `deleted_at` set
  - Expected: Record not visible but still in database
- [ ] **Audit logs**: Staff action creates audit log entry
  - Expected: Entry in `audit_logs` table
- [ ] **Rate limiting**: Make 25+ rapid requests
  - Expected: 429 Too Many Requests after 20
- [ ] **RLS policies**: Patient tries accessing other patient's data
  - Expected: No data returned
- [ ] **PHI encryption**: Test encrypt/decrypt functions
  - Expected: Data encrypted and correctly decrypted
- [ ] **Security headers**: Check response headers
  - Expected: CSP, X-Frame-Options, etc. present

### 6. Functional Testing ✅

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Dashboard displays correct data
- [ ] Patient sees their appointments
- [ ] Staff sees all appointments
- [ ] Admin sees additional controls
- [ ] Appointments display with correct timezone

### 7. Cron Job Testing ✅

- [ ] **Reminders**: `curl http://localhost:3000/api/cron/reminders`
  - Expected: Processes pending reminders
- [ ] **Data purge**: `curl http://localhost:3000/api/cron/purge`
  - Expected: Purges old data successfully
- [ ] Check reminder retry logic
- [ ] Verify exponential backoff (15min → 1hr → 6hr → 24hr)

---

## Production Deployment

### 1. Code Preparation

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `.env.server` not committed (check `.gitignore`)
- [ ] Sensitive data removed from code
- [ ] Console.logs removed or replaced with logger
- [ ] Production build successful (`npm run build`)

### 2. API Key Rotation 🔄

**CRITICAL: Rotate all keys before production!**

- [ ] Generate new Supabase project or rotate keys
- [ ] Generate new encryption key
- [ ] Create new Upstash Redis database
- [ ] Create new Resend API key
- [ ] Update all environment variables with new keys
- [ ] Test with new keys locally
- [ ] Delete old keys from services

### 3. Git & GitHub

- [ ] Initialize git repository
- [ ] Create `.gitignore` (already done)
- [ ] Verify `.env.server` not tracked
- [ ] Initial commit
- [ ] Create GitHub repository
- [ ] Push to GitHub
- [ ] Verify no secrets in commit history

### 4. Vercel Deployment

- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure environment variables in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL` (set to production URL)
  - [ ] `LOG_LEVEL=info`
  - [ ] `LOGTAIL_SOURCE_TOKEN` (optional)
- [ ] Deploy
- [ ] Verify deployment successful
- [ ] Check deployment logs for errors

### 5. Vercel Cron Configuration

In Vercel Dashboard → Project → Settings → Cron Jobs:

- [ ] Add reminder cron:
  - Path: `/api/cron/reminders`
  - Schedule: `0 * * * *` (every hour)
- [ ] Add purge cron:
  - Path: `/api/cron/purge`
  - Schedule: `0 0 1 * *` (monthly)
- [ ] Test cron jobs manually:
  - [ ] Visit `https://your-app.vercel.app/api/cron/reminders`
  - [ ] Visit `https://your-app.vercel.app/api/cron/purge`
- [ ] Optional: Add `CRON_SECRET` for extra security

### 6. Domain Setup (Optional)

- [ ] Purchase domain
- [ ] Add domain in Vercel
- [ ] Configure DNS records
- [ ] Verify SSL certificate
- [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
- [ ] Verify custom domain in Resend
- [ ] Update email sender address

### 7. Production Testing

- [ ] Visit production URL
- [ ] Home page loads
- [ ] Login works
- [ ] Register works
- [ ] Dashboard loads
- [ ] All features work
- [ ] Security headers present (check with browser dev tools)
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] No console errors

### 8. Monitoring Setup

- [ ] Check Vercel Analytics enabled
- [ ] Check Vercel Logs accessible
- [ ] Optional: Configure Logtail
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure alerts for errors

### 9. Backup Configuration

- [ ] Enable Supabase backups (automatic on paid plans)
- [ ] Document restore procedure
- [ ] Test database restore (optional)
- [ ] Export encryption key to secure location

### 10. Documentation

- [ ] Update README with production URL
- [ ] Document admin procedures
- [ ] Create user guide
- [ ] Document troubleshooting steps
- [ ] Share credentials securely with team

---

## Post-Deployment

### 1. Security Hardening

- [ ] Change default passwords:
  - [ ] Admin: admin@clinic.com
  - [ ] Staff: staff@clinic.com
  - [ ] All patient accounts
- [ ] Enable MFA for admin accounts
- [ ] Review and tighten RLS policies if needed
- [ ] Set up IP allowlisting (optional)
- [ ] Configure Supabase Auth policies

### 2. Data Management

- [ ] Create real dentist profiles
- [ ] Add real services and pricing
- [ ] Delete or update sample data
- [ ] Import existing patient data (if applicable)
- [ ] Verify PHI encryption on imported data

### 3. Email Configuration

- [ ] Verify domain in Resend
- [ ] Update email templates
- [ ] Test reminder emails
- [ ] Set up email tracking
- [ ] Configure DMARC/SPF/DKIM

### 4. User Training

- [ ] Train staff on system usage
- [ ] Create quick reference guide
- [ ] Set up support channel
- [ ] Document common workflows

### 5. Monitoring

- [ ] Check cron jobs running successfully
- [ ] Monitor error logs
- [ ] Track usage metrics
- [ ] Review audit logs regularly

---

## Compliance Verification

### HIPAA Compliance Checklist

- [ ] **Access Control**: RLS policies enforced ✅
- [ ] **Audit Controls**: All actions logged ✅
- [ ] **Integrity Controls**: Encryption with checksums ✅
- [ ] **Transmission Security**: HTTPS only ✅
- [ ] **Encryption at Rest**: Supabase AES-256 ✅
- [ ] **Encryption in Transit**: TLS 1.3 ✅
- [ ] **PHI Encryption**: AES-256-GCM ✅
- [ ] **Authentication**: Secure password hashing ✅
- [ ] **Authorization**: Role-based + RLS ✅
- [ ] **Activity Logging**: Audit trail ✅
- [ ] **Data Retention**: Policies enforced ✅
- [ ] **Soft Deletes**: Legal compliance ✅
- [ ] **MFA Support**: Available ✅

### Additional Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data processing agreement (if EU patients)
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor cron job execution
- [ ] Review failed reminders

### Weekly
- [ ] Review audit logs
- [ ] Check system performance
- [ ] Verify backups

### Monthly
- [ ] Review data retention policies
- [ ] Check storage usage
- [ ] Update dependencies
- [ ] Security review

### Quarterly
- [ ] Rotate API keys
- [ ] Security audit
- [ ] Compliance review
- [ ] Performance optimization

### Annually
- [ ] Comprehensive security audit
- [ ] Compliance certification review
- [ ] Disaster recovery drill
- [ ] Update documentation

---

## Emergency Procedures

### System Down
1. Check Vercel status page
2. Check Supabase status page
3. Review error logs in Vercel
4. Roll back to last working deployment
5. Contact support if needed

### Data Breach
1. Immediately disable affected accounts
2. Rotate all API keys
3. Review audit logs for unauthorized access
4. Notify affected patients (legal requirement)
5. Document incident
6. Implement additional security measures

### Data Loss
1. Stop all write operations
2. Restore from Supabase backup
3. Verify data integrity
4. Re-enable write operations
5. Document incident

---

## Success Criteria

✅ All checklist items completed  
✅ Production site accessible  
✅ All tests passing  
✅ Security verified  
✅ Cron jobs running  
✅ Monitoring active  
✅ Backups configured  
✅ Team trained  

---

## Support Contacts

- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
- **Upstash Support**: https://upstash.com/docs
- **Resend Support**: https://resend.com/docs

---

## Final Notes

1. **Never commit `.env.server`** to version control
2. **Service role key** must remain server-only
3. **Rotate all keys** before going live
4. **Enable backups** on all services
5. **Test disaster recovery** procedure
6. **Document everything** for your team
7. **Regular security audits** are essential
8. **Keep dependencies updated** for security patches

---

## Deployment Complete! 🎉

Congratulations! Your SmileFlow dental clinic management system is now live and HIPAA-compliant.

**Remember:**
- Change default passwords immediately
- Enable MFA for admin accounts
- Monitor logs regularly
- Keep documentation updated
- Schedule regular security reviews

For ongoing support, refer to:
- `README.md` - Overview and features
- `SETUP.md` - Detailed setup guide
- `COMMANDS.md` - Quick command reference
- `PROJECT_SUMMARY.md` - Technical architecture

