
-- Points ledger: tracks all point transactions
CREATE TABLE public.points_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'earned' CHECK (type IN ('earned', 'redeemed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Redeemed rewards
CREATE TABLE public.redeemed_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referral codes stored on profiles (add column)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- RLS
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Points ledger policies
CREATE POLICY "Users can view own points" ON public.points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.points_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Redeemed rewards policies
CREATE POLICY "Users can view own redeemed" ON public.redeemed_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redeemed" ON public.redeemed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get total points for a user
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(
    CASE WHEN type = 'earned' THEN points ELSE -points END
  ), 0)::INTEGER
  FROM points_ledger
  WHERE user_id = p_user_id;
$$;

-- Generate referral code on profile creation if missing
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'NEXA-' || upper(substr(md5(random()::text), 1, 5));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();
