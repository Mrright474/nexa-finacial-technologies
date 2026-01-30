-- Create failed login attempts table
CREATE TABLE public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account lockouts table
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_failed_login_attempts_email ON public.failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempts_created_at ON public.failed_login_attempts(created_at);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts(email);
CREATE INDEX idx_account_lockouts_locked_until ON public.account_lockouts(locked_until);

-- Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for failed_login_attempts (admin only for viewing, service role for inserts)
CREATE POLICY "Admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for account_lockouts (admin only for viewing/managing)
CREATE POLICY "Admins can view account lockouts"
ON public.account_lockouts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage account lockouts"
ON public.account_lockouts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_account_lockouts_updated_at
BEFORE UPDATE ON public.account_lockouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check and manage lockouts (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.check_account_lockout(p_email TEXT)
RETURNS TABLE(is_locked BOOLEAN, locked_until TIMESTAMP WITH TIME ZONE, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN al.locked_until > now() THEN true ELSE false END,
    al.locked_until,
    al.reason
  FROM account_lockouts al
  WHERE al.email = p_email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMP WITH TIME ZONE, NULL::TEXT;
  END IF;
END;
$$;

-- Create function to record failed attempt and check for lockout trigger
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE(should_lock BOOLEAN, attempt_count INTEGER, unique_ips INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_unique_ips INTEGER;
  v_time_window INTERVAL := '15 minutes';
  v_max_attempts INTEGER := 5;
  v_lockout_duration INTERVAL := '30 minutes';
BEGIN
  -- Insert the failed attempt
  INSERT INTO failed_login_attempts (email, ip_address, user_agent, location)
  VALUES (p_email, p_ip_address, p_user_agent, p_location);
  
  -- Count recent attempts
  SELECT COUNT(*), COUNT(DISTINCT ip_address)
  INTO v_attempt_count, v_unique_ips
  FROM failed_login_attempts
  WHERE email = p_email
    AND created_at > now() - v_time_window;
  
  -- Check if we should lock the account
  IF v_attempt_count >= v_max_attempts THEN
    -- Create or update lockout
    INSERT INTO account_lockouts (email, locked_until, reason, failed_attempts)
    VALUES (
      p_email,
      now() + v_lockout_duration,
      CASE 
        WHEN v_unique_ips > 2 THEN 'Multiple failed attempts from ' || v_unique_ips || ' different locations'
        ELSE 'Too many failed login attempts'
      END,
      v_attempt_count
    )
    ON CONFLICT (email) DO UPDATE SET
      locked_until = now() + v_lockout_duration,
      reason = CASE 
        WHEN v_unique_ips > 2 THEN 'Multiple failed attempts from ' || v_unique_ips || ' different locations'
        ELSE 'Too many failed login attempts'
      END,
      failed_attempts = v_attempt_count,
      updated_at = now();
    
    RETURN QUERY SELECT true, v_attempt_count, v_unique_ips;
  ELSE
    RETURN QUERY SELECT false, v_attempt_count, v_unique_ips;
  END IF;
END;
$$;

-- Create function to clear failed attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_attempts(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete recent failed attempts
  DELETE FROM failed_login_attempts
  WHERE email = p_email
    AND created_at > now() - interval '1 hour';
  
  -- Remove any existing lockout
  DELETE FROM account_lockouts
  WHERE email = p_email;
END;
$$;