import { createServerClient } from '@/lib/supabase/server'
import { getAuditLogs } from '@/app/admin/actions/get-audit-logs'
import StatsCards from '@/components/admin/stats-cards'
import { ActivityFeed } from '@/components/admin/activity-feed'

export default async function AdminDashboard() {
  const supabase = await createServerClient()
  
  // Get stats
  const [patientsResult, dentistsResult, appointmentsResult, staffResult] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact' }),
    supabase.from('dentists').select('id', { count: 'exact' }),
    supabase.from('appointments').select('id', { count: 'exact' }),
    supabase.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'staff')
  ])
  
  const auditLogs = await getAuditLogs(10)
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <StatsCards 
        patients={patientsResult.count || 0}
        dentists={dentistsResult.count || 0}
        appointments={appointmentsResult.count || 0}
        staff={staffResult.count || 0}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed logs={auditLogs} />
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="font-medium text-blue-900">Add New Staff Member</div>
              <div className="text-sm text-blue-700">Create a new staff account with permissions</div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="font-medium text-green-900">View Reports</div>
              <div className="text-sm text-green-700">Access comprehensive analytics</div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="font-medium text-purple-900">System Settings</div>
              <div className="text-sm text-purple-700">Configure system preferences</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}