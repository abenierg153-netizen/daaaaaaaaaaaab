-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient','staff','admin')) DEFAULT 'patient',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'patient');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent role/active abuse
CREATE OR REPLACE FUNCTION public.prevent_profile_abuse()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'UPDATE') AND NOT public.is_admin(auth.uid()) THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Only admins can change role';
    END IF;
    IF NEW.active <> OLD.active AND NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Only admins can activate/deactivate others';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_abuse ON public.user_profiles;
CREATE TRIGGER trg_profile_abuse BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_abuse();

-- Staff permissions
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_appointments BOOLEAN DEFAULT FALSE,
  can_edit_appointments BOOLEAN DEFAULT FALSE,
  can_view_patients BOOLEAN DEFAULT FALSE,
  can_edit_patients BOOLEAN DEFAULT FALSE,
  can_view_calendar BOOLEAN DEFAULT FALSE,
  can_view_reports BOOLEAN DEFAULT FALSE,
  can_view_billing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-provision staff_permissions
CREATE OR REPLACE FUNCTION public.ensure_staff_permissions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IN ('staff','admin') THEN
    INSERT INTO public.staff_permissions (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_staff_perms ON public.user_profiles;
CREATE TRIGGER trg_ensure_staff_perms AFTER INSERT OR UPDATE OF role ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_staff_permissions();

-- AUDIT LOGGING TABLE
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), 
          CASE WHEN TG_OP='DELETE' THEN TO_JSONB(OLD) ELSE TO_JSONB(NEW) END);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit triggers on critical tables
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER trg_audit_permissions AFTER INSERT OR UPDATE OR DELETE ON public.staff_permissions
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

-- Helper for permission checks (future-proof)
CREATE OR REPLACE FUNCTION public.staff_can(uid UUID, flag TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
SELECT CASE flag
  WHEN 'view_patients' THEN sp.can_view_patients
  WHEN 'edit_patients' THEN sp.can_edit_patients
  WHEN 'view_appointments' THEN sp.can_view_appointments
  WHEN 'edit_appointments' THEN sp.can_edit_appointments
  WHEN 'view_calendar' THEN sp.can_view_calendar
  WHEN 'view_reports' THEN sp.can_view_reports
  WHEN 'view_billing' THEN sp.can_view_billing
  ELSE FALSE
END
FROM public.staff_permissions sp WHERE sp.user_id = uid;
$$;

-- Patients, Dentists, Appointments (for stats)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.dentists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id),
  dentist_id UUID REFERENCES public.dentists(id),
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_perms_updated BEFORE UPDATE ON public.staff_permissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dentists_updated BEFORE UPDATE ON public.dentists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = uid AND role = 'admin' AND active = TRUE);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = uid AND role IN ('staff','admin') AND active = TRUE);
$$;

-- RLS Policies
CREATE POLICY admin_full_access ON public.user_profiles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY view_own_profile ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY update_own_profile ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY admin_manage_permissions ON public.staff_permissions FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY staff_view_own_permissions ON public.staff_permissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY admin_view_audit_logs ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY admin_view_patients ON public.patients FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY admin_view_dentists ON public.dentists FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY admin_view_appointments ON public.appointments FOR SELECT USING (public.is_admin(auth.uid()));

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.user_profiles(role) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.user_profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email ON public.user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_created_at ON public.staff_permissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Realtime publication
CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR TABLE
  public.user_profiles, public.staff_permissions, public.audit_logs;