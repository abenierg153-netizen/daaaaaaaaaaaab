import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/sidebar'
import MobileBottomNav from '@/components/admin/mobile-bottom-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, active')
    .eq('user_id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin' || !profile.active) {
    redirect('/')
  }
  
  return (
    <div className="flex h-screen">
      <AdminSidebar className="hidden md:flex" />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav className="md:hidden" />
    </div>
  )
}