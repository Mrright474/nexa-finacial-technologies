
-- Create NXA staking table
CREATE TABLE public.nxa_stakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  lock_period_days INTEGER NOT NULL,
  apy NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  earned_rewards NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nxa_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stakes" ON public.nxa_stakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stakes" ON public.nxa_stakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stakes" ON public.nxa_stakes FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate and update earned rewards
CREATE OR REPLACE FUNCTION public.calculate_stake_rewards()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Calculate earned rewards based on elapsed time
  IF NEW.status = 'active' THEN
    NEW.earned_rewards := NEW.amount * (NEW.apy / 100) * 
      EXTRACT(EPOCH FROM (LEAST(now(), NEW.end_date) - NEW.start_date)) / (365.25 * 86400);
  END IF;
  RETURN NEW;
END;
$$;
