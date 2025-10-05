'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  className?: string
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/admin', label: 'Home', icon: '📊' },
    { href: '/admin/staff', label: 'Staff', icon: '👥' },
    { href: '/admin/activity', label: 'Activity', icon: '📋' },
    { href: '/admin/profile', label: 'Profile', icon: '👤' },
  ]
  
  return (
    <div className={cn('fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden', className)}>
      <div className="flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors',
              pathname === item.href
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}