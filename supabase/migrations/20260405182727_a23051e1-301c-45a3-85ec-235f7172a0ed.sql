
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, age, gender, level, specialty, certification, experience)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'member'::app_role),
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'gender',
    COALESCE(NEW.raw_user_meta_data->>'level', 'Principiante'),
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'certification',
    NEW.raw_user_meta_data->>'experience'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user is admin/coach
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'coach'
  );
$$;

-- Update blocked_users policies for admin-only
DROP POLICY IF EXISTS "Coaches can block users" ON public.blocked_users;
DROP POLICY IF EXISTS "Coaches can unblock users" ON public.blocked_users;
DROP POLICY IF EXISTS "Coaches can view blocked users" ON public.blocked_users;

CREATE POLICY "Admins can view blocked users"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can block users"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can unblock users"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can check own blocked status"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
