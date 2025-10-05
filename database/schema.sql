-- SmileFlow Complete Database Schema with HIPAA Compliance
-- Copy and paste this entire file into Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- User profiles
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role text not null check (role in ('patient','staff','admin')) default 'patient',
  full_name text,
  phone text,
  avatar_url text,
  mfa_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  insert into public.user_profiles (user_id, full_name, role) 
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'patient');
  return new;
end; 
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
  after insert on auth.users 
  for each row execute function public.handle_new_user();

-- Prevent role escalation by non-staff
create or replace function public.prevent_role_escalation() 
returns trigger 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  if (tg_op = 'UPDATE') and new.role <> old.role and not public.is_staff(auth.uid()) then 
    raise exception 'Role change not allowed'; 
  end if;
  if (tg_op = 'UPDATE') and new.deleted_at <> old.deleted_at and not public.is_staff(auth.uid()) then 
    raise exception 'Cannot modify deleted_at'; 
  end if;
  return new;
end; 
$$;

drop trigger if exists trg_no_role_escalation on public.user_profiles;
create trigger trg_no_role_escalation 
  before update on public.user_profiles 
  for each row execute function public.prevent_role_escalation();

-- Promotion functions (admin use only)
create or replace function public.promote_to_staff(uid uuid) 
returns void 
language sql 
security definer 
set search_path = public 
as $$
  update public.user_profiles set role = 'staff' where user_id = uid;
$$;

create or replace function public.promote_to_admin(uid uuid) 
returns void 
language sql 
security definer 
set search_path = public 
as $$
  update public.user_profiles set role = 'admin' where user_id = uid;
$$;

-- Patients with PHI encryption support
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text,
  date_of_birth date,
  notes text,
  notes_encrypted bytea,
  medical_history_encrypted bytea,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

comment on column public.patients.notes_encrypted is 'Encrypted with pgp_sym_encrypt(notes, encryption_key) or AES-256-GCM';
comment on column public.patients.medical_history_encrypted is 'Encrypted with pgp_sym_encrypt(medical_history, encryption_key) or AES-256-GCM';

-- Dentists
create table if not exists public.dentists (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  specialty text,
  photo_url text,
  working_hours jsonb default '{"mon":["09:00-17:00"],"tue":["09:00-17:00"],"wed":["09:00-17:00"],"thu":["09:00-17:00"],"fri":["09:00-17:00"],"sat":[],"sun":[]}',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_min int not null check (duration_min > 0),
  price_cents int not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  dentist_id uuid not null references public.dentists(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show','rescheduled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint chk_time check (ends_at > starts_at)
);

-- Prevent double-booking
alter table public.appointments 
  add constraint no_overlap_per_dentist 
  exclude using gist (
    dentist_id with =, 
    tstzrange(starts_at, ends_at, '[)') with &&
  ) 
  where (status <> 'cancelled' and deleted_at is null);

-- Auto-calculate ends_at from service duration
create or replace function public.set_ends_at_from_service() 
returns trigger 
language plpgsql 
security definer 
set search_path = public 
as $$
declare 
  dur int; 
begin
  select s.duration_min into dur from public.services s where s.id = new.service_id;
  if dur is null then 
    raise exception 'Unknown service'; 
  end if;
  new.ends_at := new.starts_at + make_interval(mins => dur);
  return new;
end; 
$$;

drop trigger if exists trg_set_ends_at on public.appointments;
create trigger trg_set_ends_at 
  before insert or update of service_id, starts_at on public.appointments 
  for each row execute function public.set_ends_at_from_service();

-- Audit logs with IP and User Agent
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create or replace function public.audit_mutation() 
returns trigger 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  if public.is_staff(auth.uid()) then
    insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
    values (
      auth.uid(), 
      tg_op, 
      tg_table_name, 
      coalesce(new.id, old.id), 
      case tg_op 
        when 'DELETE' then to_jsonb(old) 
        else to_jsonb(new) 
      end
    );
  end if;
  return coalesce(new, old);
end; 
$$;

-- Audit triggers
drop trigger if exists trg_audit_profiles on public.user_profiles;
create trigger trg_audit_profiles 
  after update or delete on public.user_profiles 
  for each row execute function public.audit_mutation();

drop trigger if exists trg_audit_patients on public.patients;
create trigger trg_audit_patients 
  after insert or update or delete on public.patients 
  for each row execute function public.audit_mutation();

drop trigger if exists trg_audit_appointments on public.appointments;
create trigger trg_audit_appointments 
  after insert or update or delete on public.appointments 
  for each row execute function public.audit_mutation();

drop trigger if exists trg_audit_dentists on public.dentists;
create trigger trg_audit_dentists 
  after insert or update or delete on public.dentists 
  for each row execute function public.audit_mutation();

drop trigger if exists trg_audit_services on public.services;
create trigger trg_audit_services 
  after insert or update or delete on public.services 
  for each row execute function public.audit_mutation();

-- Reminders with exponential backoff
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  type text not null check (type in ('24h','2h')),
  sent_at timestamptz,
  status text default 'pending' check (status in ('pending','sent','failed')),
  retry_count int default 0,
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists idx_reminders_unique 
  on public.reminders (appointment_id, type);

create or replace function public.calculate_next_retry(retry_count int) 
returns interval 
language sql 
immutable 
as $$
  select case
    when retry_count = 0 then interval '15 minutes'
    when retry_count = 1 then interval '1 hour'
    when retry_count = 2 then interval '6 hours'
    else interval '24 hours'
  end;
$$;

-- Data retention purge function
create or replace function public.hard_purge_old_records() 
returns void 
language sql 
security definer 
set search_path = public 
as $$
  delete from public.audit_logs where created_at < now() - interval '2 years';
  delete from public.reminders where created_at < now() - interval '6 months' and status = 'sent';
  update public.appointments set deleted_at = now() where created_at < now() - interval '5 years' and deleted_at is null;
$$;

-- Updated_at triggers (preserve deleted_at)
create or replace function public.set_updated_at() 
returns trigger 
as $$
begin
  new.updated_at = now();
  if old.deleted_at is not null then 
    new.deleted_at = old.deleted_at; 
  end if;
  return new;
end; 
$$ language plpgsql;

create trigger trg_profiles_upd 
  before update on public.user_profiles 
  for each row execute function public.set_updated_at();

create trigger trg_patients_upd 
  before update on public.patients 
  for each row execute function public.set_updated_at();

create trigger trg_dentists_upd 
  before update on public.dentists 
  for each row execute function public.set_updated_at();

create trigger trg_services_upd 
  before update on public.services 
  for each row execute function public.set_updated_at();

create trigger trg_appointments_upd 
  before update on public.appointments 
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.dentists enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reminders enable row level security;

-- Helper functions for RLS
create or replace function public.is_staff(uid uuid) 
returns boolean 
language sql 
stable 
as $$
  select exists(
    select 1 from public.user_profiles up 
    where up.user_id = uid 
      and up.role in ('staff','admin') 
      and up.deleted_at is null
  );
$$;

create or replace function public.is_admin(uid uuid) 
returns boolean 
language sql 
stable 
as $$
  select exists(
    select 1 from public.user_profiles up 
    where up.user_id = uid 
      and up.role = 'admin' 
      and up.deleted_at is null
  );
$$;

-- RLS Policies

-- User profiles
create policy up_select_self on public.user_profiles 
  for select using (
    (auth.uid() = user_id or public.is_staff(auth.uid())) 
    and deleted_at is null
  );

create policy up_insert_self on public.user_profiles 
  for insert with check (auth.uid() = user_id);

create policy up_update_self on public.user_profiles 
  for update using (auth.uid() = user_id and deleted_at is null);

create policy up_update_staff on public.user_profiles 
  for update using (public.is_staff(auth.uid()));

-- Patients
create policy patients_select on public.patients 
  for select using (
    (
      (user_id is not null and auth.uid() = user_id) 
      or public.is_staff(auth.uid())
    ) 
    and deleted_at is null
  );

create policy patients_insert_staff on public.patients 
  for insert with check (public.is_staff(auth.uid()));

create policy patients_update on public.patients 
  for update using (
    (
      (user_id is not null and auth.uid() = user_id) 
      or public.is_staff(auth.uid())
    ) 
    and deleted_at is null
  );

-- Dentists
create policy dentists_select_public on public.dentists 
  for select using (
    (active = true or public.is_staff(auth.uid())) 
    and deleted_at is null
  );

create policy dentists_modify_staff on public.dentists 
  for all using (public.is_staff(auth.uid()));

-- Services
create policy services_select_public on public.services 
  for select using (
    (active = true or public.is_staff(auth.uid())) 
    and deleted_at is null
  );

create policy services_modify_staff on public.services 
  for all using (public.is_staff(auth.uid()));

-- Appointments
create policy appt_select on public.appointments 
  for select using (
    (
      public.is_staff(auth.uid()) 
      or exists (
        select 1 from public.patients p 
        where p.id = appointments.patient_id 
          and p.user_id = auth.uid()
      )
    ) 
    and deleted_at is null
  );

create policy appt_insert on public.appointments 
  for insert with check (
    public.is_staff(auth.uid()) 
    or exists (
      select 1 from public.patients p 
      where p.id = patient_id 
        and p.user_id = auth.uid()
    )
  );

create policy appt_update on public.appointments 
  for update using (
    (
      public.is_staff(auth.uid()) 
      or exists (
        select 1 from public.patients p 
        where p.id = appointments.patient_id 
          and p.user_id = auth.uid()
      )
    ) 
    and deleted_at is null
  );

-- Audit logs
create policy audit_staff_only on public.audit_logs 
  for select using (public.is_staff(auth.uid()));

-- Reminders
create policy reminders_staff_only on public.reminders 
  for all using (public.is_staff(auth.uid())) 
  with check (public.is_staff(auth.uid()));

-- Indexes for performance
create index if not exists idx_appt_starts_at 
  on public.appointments (starts_at) 
  where deleted_at is null;

create index if not exists idx_appt_dentist 
  on public.appointments (dentist_id, starts_at) 
  where deleted_at is null;

create index if not exists idx_services_active 
  on public.services (active) 
  where deleted_at is null;

create index if not exists idx_dentists_active 
  on public.dentists (active) 
  where deleted_at is null;

create index if not exists idx_patients_email 
  on public.patients (email) 
  where deleted_at is null;

create index if not exists idx_reminders_retry 
  on public.reminders (status, next_retry_at) 
  where status = 'failed';

-- Storage bucket for media
insert into storage.buckets (id, name, public) 
values ('media', 'media', true) 
on conflict do nothing;

create policy "Public read" on storage.objects 
  for select using (bucket_id = 'media');

create policy "Auth upload scoped" on storage.objects 
  for insert to authenticated with check (
    bucket_id = 'media' 
    and (name like 'avatars/%' or name like 'dentists/%')
  );

create policy "Admin upload all" on storage.objects 
  for insert with check (
    bucket_id = 'media' 
    and public.is_admin(auth.uid())
  );

