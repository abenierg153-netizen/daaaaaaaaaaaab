interface StatsCardsProps {
  patients: number
  dentists: number
  appointments: number
  staff: number
}

export default function StatsCards({ patients, dentists, appointments, staff }: StatsCardsProps) {
  const stats = [
    { label: 'Total Patients', value: patients, icon: '👤', color: 'blue' },
    { label: 'Total Dentists', value: dentists, icon: '🦷', color: 'green' },
    { label: 'Total Appointments', value: appointments, icon: '📅', color: 'purple' },
    { label: 'Staff Members', value: staff, icon: '👥', color: 'orange' },
  ]
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}