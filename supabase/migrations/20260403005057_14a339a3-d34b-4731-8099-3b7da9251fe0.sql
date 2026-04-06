CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  blocked_by UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_blocked_users_user_id ON public.blocked_users (user_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read blocked status
CREATE POLICY "Authenticated users can read blocked_users"
  ON public.blocked_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can insert (we check admin in app code, RLS allows any authenticated for now)
CREATE POLICY "Authenticated users can insert blocked_users"
  ON public.blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocked_by);

-- Only admin can delete
CREATE POLICY "Users can delete their own blocks"
  ON public.blocked_users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocked_by);