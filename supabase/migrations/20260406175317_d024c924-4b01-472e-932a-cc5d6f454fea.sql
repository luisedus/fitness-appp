
-- 1. Update is_admin to check profiles.role instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  );
$$;

-- 2. Set the existing admin user's role to 'admin' in profiles
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@admin.com';
