
-- Create burn log table
CREATE TABLE IF NOT EXISTS public.nxa_burn_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  source text NOT NULL DEFAULT 'swap_fee',
  transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nxa_burn_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own burn records
CREATE POLICY "Users can insert own burn records"
  ON public.nxa_burn_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can view burn logs (transparency)
CREATE POLICY "Authenticated users can view burn logs"
  ON public.nxa_burn_log FOR SELECT
  TO authenticated
  USING (true);
