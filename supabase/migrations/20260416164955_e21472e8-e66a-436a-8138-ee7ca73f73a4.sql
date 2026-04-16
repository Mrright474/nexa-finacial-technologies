ALTER TABLE public.profiles ADD COLUMN wallet_address text;

CREATE UNIQUE INDEX idx_profiles_wallet_address ON public.profiles (wallet_address) WHERE wallet_address IS NOT NULL;