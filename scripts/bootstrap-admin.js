const { createClient } = require('@supabase/supabase-js')

async function bootstrapAdmin() {
  try {
    console.log('ðŸš€ Starting admin bootstrap...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
    
    // Check if admin user exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail('admin@smileflow.com')
    
    if (existingUser.user) {
      console.log('âœ“ Admin user exists, updating profile...')
      
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
      
      console.log('âœ… Admin user updated successfully')
      return { success: true, message: 'Admin user updated successfully' }
    } else {
      console.log('âœ“ Creating new admin user...')
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@smileflow.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' }
      })
      
      if (createError || !newUser.user) throw createError
      
      // Update profile to admin role
      const { error: profileError } = await supabase.from('user_profiles')
        .update({ role: 'admin', active: true, full_name: 'Admin User' })
        .eq('user_id', newUser.user.id)
      
      if (profileError) throw profileError
      
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
      
      console.log('âœ… Admin user created successfully')
      return { success: true, message: 'Admin user created successfully' }
    }
  } catch (error) {
    console.error('âŒ Admin bootstrap error:', error.message)
    return { success: false, error: error.message }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.server' })

// Run bootstrap
bootstrapAdmin().then(result => {
  console.log('Bootstrap result:', result)
  process.exit(result.success ? 0 : 1)
})
