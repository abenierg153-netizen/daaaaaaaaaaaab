/**
 * Database Seed Script
 * Creates initial data for development and testing
 * 
 * Usage:
 * 1. Create .env.server with SUPABASE_SERVICE_ROLE_KEY and ENCRYPTION_KEY
 * 2. Run: npm run seed
 * 3. Use printed SQL command to promote admin in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from '../types/database';

// Read environment variables from .env.server
function loadEnvServer() {
  try {
    const envServerPath = join(process.cwd(), '.env.server');
    const envContent = readFileSync(envServerPath, 'utf-8');
    
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load .env.server file');
    throw error;
  }
}

// Load local .env.server if not in production
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  loadEnvServer();
}

// Also load .env.local for public variables
try {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envLocalPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
} catch {
  // .env.local optional
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create admin user
    console.log('👤 Creating admin user...');
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@clinic.com',
      password: 'TempPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    });

    if (adminError) throw adminError;
    console.log(`✅ Admin created: ${adminUser.user.email} (ID: ${adminUser.user.id})`);

    // Create staff user
    console.log('👤 Creating staff user...');
    const { data: staffUser, error: staffError } = await supabase.auth.admin.createUser({
      email: 'staff@clinic.com',
      password: 'TempPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Staff Member',
      },
    });

    if (staffError) throw staffError;
    console.log(`✅ Staff created: ${staffUser.user.email} (ID: ${staffUser.user.id})`);

    // Create dentists
    console.log('\n🦷 Creating dentists...');
    const dentists = [
      {
        full_name: 'Dr. Abebe Tesfaye',
        email: 'abebe@clinic.com',
        phone: '+251911123456',
        specialty: 'General Dentistry',
        active: true,
      },
      {
        full_name: 'Dr. Mulu Haile',
        email: 'mulu@clinic.com',
        phone: '+251911234567',
        specialty: 'Orthodontics',
        active: true,
      },
      {
        full_name: 'Dr. Selam Yohannes',
        email: 'selam@clinic.com',
        phone: '+251911345678',
        specialty: 'Endodontics',
        active: true,
      },
    ];

    const { data: createdDentists, error: dentistsError } = await supabase
      .from('dentists')
      .insert(dentists)
      .select();

    if (dentistsError) throw dentistsError;
    console.log(`✅ Created ${createdDentists?.length} dentists`);

    // Create services
    console.log('\n🔧 Creating services...');
    const services = [
      {
        name: 'Dental Checkup',
        description: 'Comprehensive dental examination',
        duration_min: 30,
        price_cents: 50000, // 500 ETB
      },
      {
        name: 'Teeth Cleaning',
        description: 'Professional teeth cleaning and polishing',
        duration_min: 45,
        price_cents: 75000, // 750 ETB
      },
      {
        name: 'Cavity Filling',
        description: 'Dental cavity filling',
        duration_min: 60,
        price_cents: 120000, // 1200 ETB
      },
      {
        name: 'Root Canal',
        description: 'Root canal treatment',
        duration_min: 90,
        price_cents: 350000, // 3500 ETB
      },
      {
        name: 'Teeth Whitening',
        description: 'Professional teeth whitening',
        duration_min: 60,
        price_cents: 200000, // 2000 ETB
      },
      {
        name: 'Tooth Extraction',
        description: 'Simple tooth extraction',
        duration_min: 30,
        price_cents: 80000, // 800 ETB
      },
    ];

    const { data: createdServices, error: servicesError } = await supabase
      .from('services')
      .insert(services)
      .select();

    if (servicesError) throw servicesError;
    console.log(`✅ Created ${createdServices?.length} services`);

    // Create patient users and patients
    console.log('\n🧑‍⚕️ Creating patients...');
    const patientEmails = [
      { email: 'patient1@example.com', name: 'Tigist Bekele' },
      { email: 'patient2@example.com', name: 'Dawit Assefa' },
      { email: 'patient3@example.com', name: 'Sara Getachew' },
      { email: 'patient4@example.com', name: 'Yonas Mekonnen' },
      { email: 'patient5@example.com', name: 'Helen Tadesse' },
    ];

    const createdPatients = [];
    for (const { email, name } of patientEmails) {
      const { data: patientUser, error: patientUserError } = await supabase.auth.admin.createUser({
        email,
        password: 'TempPass123!',
        email_confirm: true,
        user_metadata: {
          full_name: name,
        },
      });

      if (patientUserError) throw patientUserError;

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: patientUser.user.id,
          email,
          date_of_birth: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)).toISOString().split('T')[0],
          notes: 'Initial patient record',
        })
        .select()
        .single();

      if (patientError) throw patientError;
      createdPatients.push(patient);
    }
    console.log(`✅ Created ${createdPatients.length} patients`);

    // Create appointments
    console.log('\n📅 Creating appointments...');
    const appointments = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const daysOffset = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
      const appointmentDate = new Date(now);
      appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
      appointmentDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // 9 AM to 5 PM

      appointments.push({
        patient_id: createdPatients[i % createdPatients.length]!.id,
        dentist_id: createdDentists![i % createdDentists!.length]!.id,
        service_id: createdServices![i % createdServices!.length]!.id,
        starts_at: appointmentDate.toISOString(),
        status: daysOffset < 0 ? 'completed' : 'scheduled',
        notes: `Appointment ${i + 1}`,
        created_by: staffUser.user.id,
      });
    }

    const { data: createdAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (appointmentsError) throw appointmentsError;
    console.log(`✅ Created ${createdAppointments?.length} appointments`);

    // Create reminders for future appointments
    console.log('\n⏰ Creating reminders...');
    const futureAppointments = createdAppointments?.filter(apt => apt.status === 'scheduled') || [];
    const reminders = [];
    
    for (const apt of futureAppointments) {
      reminders.push(
        { appointment_id: apt.id, type: '24h' as const, status: 'pending' as const },
        { appointment_id: apt.id, type: '2h' as const, status: 'pending' as const }
      );
    }

    if (reminders.length > 0) {
      const { error: remindersError } = await supabase
        .from('reminders')
        .insert(reminders);

      if (remindersError) throw remindersError;
      console.log(`✅ Created ${reminders.length} reminders`);
    }

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this command to promote admin:');
    console.log(`   SELECT public.promote_to_admin('${adminUser.user.id}');`);
    console.log('3. Run this command to promote staff:');
    console.log(`   SELECT public.promote_to_staff('${staffUser.user.id}');`);
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@clinic.com / TempPass123!');
    console.log('   Staff: staff@clinic.com / TempPass123!');
    console.log('   Patients: patient1-5@example.com / TempPass123!');
    console.log('\n⚠️  Remember to change these passwords in production!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();

