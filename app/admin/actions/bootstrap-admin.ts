// app/admin/actions/bootstrap-admin.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

export async function bootstrapAdmin() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Bootstrap disabled in production.')
    return { success: false, reason: 'Disabled in production' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const log = (msg: string) => fs.appendFileSync('setup_report.txt', msg + '\n')

  try {
    console.log('👤 Creating admin user...')
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')
      .maybeSingle()

    if (existing) {
      log('✅ Admin already exists — skipping creation.')
      return { success: true, existing }
    }

    const { data: user, error: userErr } = await supabase.auth.admin.createUser({
      email: 'admin@smileflow.com',
      password: 'admin123',
      email_confirm: true,
    })
    if (userErr) throw userErr

    await supabase.from('user_profiles').upsert({
      user_id: user.user.id,
      role: 'admin',
      active: true,
      full_name: 'Admin User',
    })

    await supabase.from('staff_permissions').upsert({
      user_id: user.user.id,
      can_view_appointments: true,
      can_edit_appointments: true,
      can_view_patients: true,
      can_edit_patients: true,
      can_view_calendar: true,
      can_view_reports: true,
      can_view_billing: true,
    })

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'admin@smileflow.com',
      password: 'admin123',
    })
    if (loginErr) throw loginErr

    log('✅ Admin user bootstrap successful.')
    log('Login: admin@smileflow.com / admin123')
    return { success: true }
  } catch (e) {
    log('❌ Error during bootstrap: ' + (e as Error).message)
    return { success: false, error: (e as Error).message }
  }
}