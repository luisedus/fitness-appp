
-- 1. Add 'admin' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Drop overly permissive blocked_users SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read blocked_users" ON public.blocked_users;

-- 3. Drop non-admin INSERT policy on blocked_users (only admins should block)
DROP POLICY IF EXISTS "Authenticated users can insert blocked_users" ON public.blocked_users;

-- 4. Drop non-admin DELETE policy on blocked_users (only admins should unblock)
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocked_users;
