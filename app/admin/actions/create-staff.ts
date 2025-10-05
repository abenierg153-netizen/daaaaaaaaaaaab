'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { StaffPermissionKey, StaffPermissions } from '@/lib/types/admin'

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['staff']).default('staff'),
  permissions: z.object({
    can_view_appointments: z.boolean(),
    can_edit_appointments: z.boolean(),
    can_view_patients: z.boolean(),
    can_edit_patients: z.boolean(),
    can_view_calendar: z.boolean(),
    can_view_reports: z.boolean(),
    can_view_billing: z.boolean(),
  })
})

export async function createStaff(formData: FormData) {
  try {
    const data = schema.parse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: 'staff',
      permissions: {
        can_view_appointments: formData.get('can_view_appointments') === 'true',
        can_edit_appointments: formData.get('can_edit_appointments') === 'true',
        can_view_patients: formData.get('can_view_patients') === 'true',
        can_edit_patients: formData.get('can_edit_patients') === 'true',
        can_view_calendar: formData.get('can_view_calendar') === 'true',
        can_view_reports: formData.get('can_view_reports') === 'true',
        can_view_billing: formData.get('can_view_billing') === 'true',
      }
    })

    const supabase = createAdminClient()

    // 1. Create user with Admin API
    const tempPassword = crypto.randomUUID()
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.fullName }
    })

    if (createError || !user.user) throw createError

    const userId = user.user.id

    // 2. Update profile to staff role
    const { error: profileError } = await supabase.from('user_profiles')
      .update({ role: 'staff', full_name: data.fullName, email: data.email, phone: data.phone, active: true })
      .eq('user_id', userId)

    if (profileError) throw profileError

    // 3. Set permissions (trigger auto-creates row, we update it)
    const { error: permError } = await supabase.from('staff_permissions')
      .update(data.permissions)
      .eq('user_id', userId)

    if (permError) throw permError

    // 4. Send email asynchronously (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/queue/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.email, fullName: data.fullName }),
      });
    } catch (emailError) {
      console.warn('Email queue failed:', emailError);
    }

    revalidatePath('/admin/staff')
    return { success: true, userId }
  } catch (error: any) {
    console.error('Create staff error:', error)
    return { success: false, error: error.message }
  }
}

