-- Create IP blocklist table
CREATE TABLE public.ip_blocklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view blocked IPs" 
ON public.ip_blocklist 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage blocked IPs" 
ON public.ip_blocklist 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if an IP is blocked
CREATE OR REPLACE FUNCTION public.check_ip_block(p_ip_address TEXT)
RETURNS TABLE(is_blocked BOOLEAN, blocked_until TIMESTAMP WITH TIME ZONE, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN b.blocked_until > now() THEN true ELSE false END as is_blocked,
    b.blocked_until,
    b.reason
  FROM ip_blocklist b
  WHERE b.ip_address = p_ip_address
    AND b.blocked_until > now();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, NULL::timestamp with time zone, NULL::text;
  END IF;
END;
$$;

-- Function to record failed attempt by IP and potentially block
CREATE OR REPLACE FUNCTION public.record_ip_failure(
  p_ip_address TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE(attempt_count INTEGER, should_block BOOLEAN, unique_emails INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_unique_emails INTEGER;
  v_should_block BOOLEAN := false;
  v_block_threshold INTEGER := 10; -- Block after 10 failed attempts from same IP
  v_time_window INTERVAL := INTERVAL '30 minutes';
  v_block_duration INTERVAL := INTERVAL '1 hour';
BEGIN
  -- Count recent failed attempts from this IP
  SELECT 
    COUNT(*),
    COUNT(DISTINCT email)
  INTO v_attempt_count, v_unique_emails
  FROM failed_login_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - v_time_window;

  -- If threshold exceeded, block the IP
  IF v_attempt_count >= v_block_threshold THEN
    v_should_block := true;
    
    INSERT INTO ip_blocklist (ip_address, blocked_until, failed_attempts, reason)
    VALUES (
      p_ip_address, 
      now() + v_block_duration, 
      v_attempt_count,
      CASE 
        WHEN v_unique_emails > 3 THEN 'Multiple account attack detected'
        ELSE 'Excessive failed login attempts'
      END
    )
    ON CONFLICT (ip_address) 
    DO UPDATE SET 
      blocked_until = now() + v_block_duration,
      failed_attempts = EXCLUDED.failed_attempts,
      reason = EXCLUDED.reason,
      updated_at = now();
  END IF;

  RETURN QUERY SELECT v_attempt_count, v_should_block, v_unique_emails;
END;
$$;

-- Function to clear IP block
CREATE OR REPLACE FUNCTION public.clear_ip_block(p_ip_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM ip_blocklist WHERE ip_address = p_ip_address;
END;
$$;