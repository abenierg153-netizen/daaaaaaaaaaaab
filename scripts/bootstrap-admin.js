const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.server' })

async function bootstrapAdmin() {
  try {
    console.log('🚀 Starting admin bootstrap...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    )
    
    // Check if admin user exists
    console.log('📧 Checking if admin user exists...')
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail('admin@smileflow.com')
    
    if (existingUser.user) {
      console.log('👤 Admin user exists, updating profile...')
      
      // Update existing user profile to admin
      const { error: profileError } = await supabase.from('user_profiles')
        .update({ role: 'admin', active: true, full_name: 'Admin User' })
        .eq('user_id', existingUser.user.id)
      
      if (profileError) throw profileError
      
      // Ensure staff_permissions row exists
      const { error: permError } = await supabase.from('staff_permissions')
        .upsert({ 
          user_id: existingUser.user.id,
          can_view_appointments: true,
          can_edit_appointments: true,
          can_view_patients: true,
          can_edit_patients: true,
          can_view_calendar: true,
          can_view_reports: true,
          can_view_billing: true
        })
      
      if (permError) throw permError
      
      console.log('✅ Admin user updated successfully')
      return { success: true, message: 'Admin user updated successfully' }
    } else {
      console.log('👤 Creating new admin user...')
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@smileflow.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' }
      })
      
      if (createError || !newUser.user) throw createError
      
      console.log('👤 Updating user profile to admin...')
      
      // Update profile to admin role
      const { error: profileError } = await supabase.from('user_profiles')
        .update({ role: 'admin', active: true, full_name: 'Admin User' })
        .eq('user_id', newUser.user.id)
      
      if (profileError) throw profileError
      
      console.log('🔐 Setting up admin permissions...')
      
      // Ensure staff_permissions row exists
      const { error: permError } = await supabase.from('staff_permissions')
        .upsert({ 
          user_id: newUser.user.id,
          can_view_appointments: true,
          can_edit_appointments: true,
          can_view_patients: true,
          can_edit_patients: true,
          can_view_calendar: true,
          can_view_reports: true,
          can_view_billing: true
        })
      
      if (permError) throw permError
      
      console.log('✅ Admin user created successfully')
      return { success: true, message: 'Admin user created successfully' }
    }
  } catch (error) {
    console.error('❌ Admin bootstrap error:', error.message)
    return { success: false, error: error.message }
  }
}

bootstrapAdmin().then(result => {
  if (result.success) {
    console.log('🎉 Admin bootstrap completed successfully!')
    console.log('📧 Email: admin@smileflow.com')
    console.log('🔑 Password: admin123')
    process.exit(0)
  } else {
    console.log('❌ Admin bootstrap failed:', result.error)
    process.exit(1)
  }
})