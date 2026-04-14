-- Leaderboard function
CREATE OR REPLACE FUNCTION public.get_burn_leaderboard(p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid,
  total_burned numeric,
  burn_count bigint,
  first_name text,
  last_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.user_id,
    SUM(b.amount) AS total_burned,
    COUNT(*) AS burn_count,
    p.first_name,
    p.last_name,
    p.avatar_url
  FROM nxa_burn_log b
  LEFT JOIN profiles p ON p.user_id = b.user_id
  GROUP BY b.user_id, p.first_name, p.last_name, p.avatar_url
  ORDER BY total_burned DESC
  LIMIT p_limit;
$$;

-- Web3 API keys table
CREATE TABLE public.web3_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT 'Web3 Integration',
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '["read","trade","burn"]'::jsonb,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.web3_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API keys"
ON public.web3_api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own API keys"
ON public.web3_api_keys
FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_web3_api_keys_updated_at
BEFORE UPDATE ON public.web3_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();