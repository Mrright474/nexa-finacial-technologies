
-- Settings table for NXA configuration (single-row pattern)
CREATE TABLE IF NOT EXISTS public.nxa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  burn_rate_percent numeric NOT NULL DEFAULT 10.0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.nxa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view NXA settings"
  ON public.nxa_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update NXA settings"
  ON public.nxa_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Also allow all authenticated users to read (for swap/trade to use the rate)
CREATE POLICY "Authenticated users can read NXA settings"
  ON public.nxa_settings FOR SELECT
  TO authenticated
  USING (true);

-- Seed default row
INSERT INTO public.nxa_settings (burn_rate_percent) VALUES (10.0);
