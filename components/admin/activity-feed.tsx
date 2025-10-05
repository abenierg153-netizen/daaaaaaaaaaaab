'use client'
import type { AuditLog, AuditAction } from '@/lib/types/admin'

interface ActivityFeedProps {
  logs: AuditLog[]
}

const iconMap: Record<AuditAction, string> = {
  INSERT: '🟢',
  UPDATE: '🟡',
  DELETE: '🔴',
}

const colorMap: Record<AuditAction, string> = {
  INSERT: 'text-green-600',
  UPDATE: 'text-yellow-600',
  DELETE: 'text-red-600',
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  const formatAction = (action: AuditAction, entity: string) => {
    switch (action) {
      case 'INSERT': return `Created ${entity}`
      case 'UPDATE': return `Updated ${entity}`
      case 'DELETE': return `Deleted ${entity}`
      default: return `${action} ${entity}`
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="text-lg">{iconMap[log.action]}</div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${colorMap[log.action]}`}>
                  {formatAction(log.action, log.entity)}
                </p>
                <p className="text-xs text-gray-500">
                  {log.user_profiles?.full_name || 'System'} • {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}