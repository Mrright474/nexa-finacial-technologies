
-- Create NXA price history table
CREATE TABLE public.nxa_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric NOT NULL,
  total_supply numeric NOT NULL DEFAULT 0,
  circulating_supply numeric NOT NULL DEFAULT 0,
  total_staked numeric NOT NULL DEFAULT 0,
  total_collateral numeric NOT NULL DEFAULT 0,
  transaction_volume_24h numeric NOT NULL DEFAULT 0,
  active_users_24h integer NOT NULL DEFAULT 0,
  demand_score numeric NOT NULL DEFAULT 50,
  supply_pressure numeric NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nxa_price_history ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read price history (public market data)
CREATE POLICY "Authenticated users can view price history"
ON public.nxa_price_history
FOR SELECT
TO authenticated
USING (true);

-- Index for time-series queries
CREATE INDEX idx_nxa_price_history_created_at ON public.nxa_price_history (created_at DESC);

-- Function to compute real-time NXA metrics from the database
CREATE OR REPLACE FUNCTION public.compute_nxa_metrics()
RETURNS TABLE(
  total_supply numeric,
  circulating_supply numeric,
  total_staked numeric,
  total_collateral numeric,
  tx_volume_24h numeric,
  active_users_24h integer,
  demand_score numeric,
  supply_pressure numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_supply numeric;
  v_total_staked numeric;
  v_total_collateral numeric;
  v_circulating numeric;
  v_tx_volume numeric;
  v_active_users integer;
  v_demand numeric;
  v_supply_pressure numeric;
  v_stake_ratio numeric;
  v_collateral_ratio numeric;
  v_max_supply numeric := 1000000000; -- 1B max supply
BEGIN
  -- Total NXA across all wallets
  SELECT COALESCE(SUM(balance), 0)
  INTO v_total_supply
  FROM wallets
  WHERE currency = 'NXA';

  -- Total NXA actively staked
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_staked
  FROM nxa_stakes
  WHERE status = 'active';

  -- Total NXA locked as loan collateral
  SELECT COALESCE(SUM(collateral_amount), 0)
  INTO v_total_collateral
  FROM loans
  WHERE collateral_currency = 'NXA'
    AND status IN ('active', 'approved', 'pending');

  -- Circulating = total in wallets minus staked and collateral
  v_circulating := GREATEST(v_total_supply - v_total_staked - v_total_collateral, 0);

  -- NXA transaction volume in last 24h
  SELECT COALESCE(SUM(amount), 0)
  INTO v_tx_volume
  FROM transactions
  WHERE currency = 'NXA'
    AND created_at > now() - interval '24 hours'
    AND status = 'completed';

  -- Active unique users transacting NXA in last 24h
  SELECT COUNT(DISTINCT user_id)
  INTO v_active_users
  FROM transactions
  WHERE currency = 'NXA'
    AND created_at > now() - interval '24 hours'
    AND status = 'completed';

  -- Calculate demand score (0-100)
  -- Factors: staking ratio, collateral usage, transaction activity, user activity
  v_stake_ratio := CASE WHEN v_total_supply > 0 
    THEN (v_total_staked / v_total_supply) * 100 
    ELSE 0 END;
  
  v_collateral_ratio := CASE WHEN v_total_supply > 0 
    THEN (v_total_collateral / v_total_supply) * 100 
    ELSE 0 END;

  -- Demand = weighted average of lock-up ratios + activity bonus
  v_demand := LEAST(
    (v_stake_ratio * 0.4) +           -- 40% weight: staking
    (v_collateral_ratio * 0.25) +      -- 25% weight: collateral
    (LEAST(v_tx_volume / 1000, 20)) +  -- up to 20 points from volume
    (LEAST(v_active_users * 3, 15)),   -- up to 15 points from active users
    100
  );

  -- Supply pressure = how much is freely circulating relative to total
  v_supply_pressure := CASE WHEN v_total_supply > 0
    THEN (v_circulating / v_total_supply) * 100
    ELSE 100 END;

  RETURN QUERY SELECT 
    v_total_supply,
    v_circulating,
    v_total_staked,
    v_total_collateral,
    v_tx_volume,
    v_active_users,
    v_demand,
    v_supply_pressure;
END;
$$;
