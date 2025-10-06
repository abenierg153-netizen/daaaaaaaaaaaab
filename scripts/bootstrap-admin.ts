// scripts/bootstrap-admin.ts
import { bootstrapAdmin } from '../app/admin/actions/bootstrap-admin'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env.server' })

bootstrapAdmin()
  .then((res) => {
    console.log('✅ Bootstrap complete:', res)
    process.exit(res.success ? 0 : 1)
  })
  .catch((err) => {
    console.error('❌ Bootstrap failed:', err)
    process.exit(1)
  })