// scripts/bootstrap-admin.ts
import { bootstrapAdmin } from '../app/admin/actions/bootstrap-admin'

bootstrapAdmin()
  .then((res) => {
    console.log('✅ Bootstrap complete:', res)
    process.exit(res.success ? 0 : 1)
  })
  .catch((err) => {
    console.error('❌ Bootstrap failed:', err)
    process.exit(1)
  })