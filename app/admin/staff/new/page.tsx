'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaff } from '@/app/admin/actions/create-staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function NewStaffPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createStaff(formData)
      
      if (result.success) {
        toast.success('Staff member created successfully!')
        router.push('/admin/staff')
      } else {
        toast.error(result.error || 'Failed to create staff member')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Staff Member</h1>
        <p className="text-gray-600">Create a new staff account with specific permissions</p>
      </div>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new staff account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+1234567890"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'can_view_appointments', label: 'View Appointments' },
                  { key: 'can_edit_appointments', label: 'Edit Appointments' },
                  { key: 'can_view_patients', label: 'View Patients' },
                  { key: 'can_edit_patients', label: 'Edit Patients' },
                  { key: 'can_view_calendar', label: 'View Calendar' },
                  { key: 'can_view_reports', label: 'View Reports' },
                  { key: 'can_view_billing', label: 'View Billing' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      name={key}
                      value="true"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Staff Member'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/staff')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

