-- Enable realtime for login_activity and user_sessions tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;