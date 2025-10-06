// scripts/verify-login.ts
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function verifyLogin() {
  console.log('🔐 Verifying admin login...')
  
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
      console.log('❌ Login failed:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('✅ Login successful!')
      console.log('👤 User ID:', data.user.id)
      console.log('📧 Email:', data.user.email)
      return true
    }
    
    return false
  } catch (err) {
    console.log('❌ Login error:', err)
    return false
  }
}

verifyLogin().then(success => {
  if (success) {
    console.log('🎉 Admin login verification PASSED!')
    process.exit(0)
  } else {
    console.log('💥 Admin login verification FAILED!')
    process.exit(1)
  }
})