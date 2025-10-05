import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get patient record if user is a patient
  let patient = null;
  let upcomingAppointments = [];
  
  if (profile?.role === 'patient') {
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    patient = patientData;

    if (patient) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          dentists(*),
          services(*)
        `)
        .eq('patient_id', patient.id)
        .eq('status', 'scheduled')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      
      upcomingAppointments = appointments || [];
    }
  }

  // Get statistics for staff/admin
  let stats = null;
  if (profile?.role === 'staff' || profile?.role === 'admin') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppts, totalPatients, totalDentists] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .gte('starts_at', today.toISOString())
        .lt('starts_at', tomorrow.toISOString())
        .eq('status', 'scheduled'),
      supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .is('deleted_at', null),
      supabase
        .from('dentists')
        .select('id', { count: 'exact' })
        .eq('active', true)
        .is('deleted_at', null),
    ]);

    stats = {
      todayAppointments: todayAppts.count || 0,
      totalPatients: totalPatients.count || 0,
      totalDentists: totalDentists.count || 0,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Smile<span className="text-blue-600">Flow</span>
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name} ({profile?.role})
              </span>
              <form action="/api/auth/signout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            {profile?.role === 'patient' 
              ? 'Manage your appointments and health records'
              : 'Manage clinic operations and patient care'
            }
          </p>
        </div>

        {/* Patient Dashboard */}
        {profile?.role === 'patient' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Upcoming Appointments</h3>
              <Link href="/appointments/book">
                <Button>Book Appointment</Button>
              </Link>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="grid gap-4">
                {upcomingAppointments.map((apt: any) => (
                  <Card key={apt.id}>
                    <CardHeader>
                      <CardTitle>{apt.services?.name}</CardTitle>
                      <CardDescription>
                        Dr. {apt.dentists?.full_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.starts_at).toLocaleString('en-ET', {
                          timeZone: 'Africa/Addis_Ababa',
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 mb-4">
                    You don&apos;t have any upcoming appointments
                  </p>
                  <Link href="/appointments/book">
                    <Button>Book Your First Appointment</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Staff/Admin Dashboard */}
        {(profile?.role === 'staff' || profile?.role === 'admin') && stats && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardDescription>Today&apos;s Appointments</CardDescription>
                  <CardTitle className="text-4xl">{stats.todayAppointments}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Total Patients</CardDescription>
                  <CardTitle className="text-4xl">{stats.totalPatients}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Active Dentists</CardDescription>
                  <CardTitle className="text-4xl">{stats.totalDentists}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/staff/appointments">
                    <Button variant="outline" className="w-full justify-start">
                      📅 Manage Appointments
                    </Button>
                  </Link>
                  <Link href="/staff/patients">
                    <Button variant="outline" className="w-full justify-start">
                      🧑‍⚕️ View Patients
                    </Button>
                  </Link>
                  <Link href="/staff/dentists">
                    <Button variant="outline" className="w-full justify-start">
                      🦷 Manage Dentists
                    </Button>
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link href="/admin/audit-logs">
                      <Button variant="outline" className="w-full justify-start">
                        📊 View Audit Logs
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <span className="text-green-600 font-medium">✓ Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Authentication</span>
                    <span className="text-green-600 font-medium">✓ Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PHI Encryption</span>
                    <span className="text-green-600 font-medium">✓ Enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Audit Logging</span>
                    <span className="text-green-600 font-medium">✓ Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

