// scripts/verify-login.ts
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function verifyLogin() {
  console.log('ðŸ” Verifying admin login...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@smileflow.com',
      password: 'admin123',
    })
    
    if (error) {
      console.log('âŒ Login failed:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('âœ… Login successful!')
      console.log('ðŸ‘¤ User ID:', data.user.id)
      console.log('ðŸ“§ Email:', data.user.email)
      return true
    }
    
    return false
  } catch (err) {
    console.log('âŒ Login error:', err)
    return false
  }
}

verifyLogin().then(success => {
  if (success) {
    console.log('ðŸŽ‰ Admin login verification PASSED!')
    process.exit(0)
  } else {
    console.log('ðŸ’¥ Admin login verification FAILED!')
    process.exit(1)
  }
})
