-- Allow admins to view all login activity
CREATE POLICY "Admins can view all login activity"
ON public.login_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view all user sessions
CREATE POLICY "Admins can view all user sessions"
ON public.user_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);