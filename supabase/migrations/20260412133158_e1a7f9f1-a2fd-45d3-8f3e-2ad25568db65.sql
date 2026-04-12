
DROP FUNCTION IF EXISTS public.compute_nxa_metrics();

CREATE OR REPLACE FUNCTION public.compute_nxa_metrics()
RETURNS TABLE(
  total_supply numeric,
  circulating_supply numeric,
  total_staked numeric,
  total_collateral numeric,
  tx_volume_24h numeric,
  active_users_24h integer,
  demand_score numeric,
  supply_pressure numeric,
  total_burned numeric
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
  v_total_burned numeric;
  v_max_supply numeric := 1000000000;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO v_total_supply FROM wallets WHERE currency = 'NXA';
  SELECT COALESCE(SUM(amount), 0) INTO v_total_staked FROM nxa_stakes WHERE status = 'active';
  SELECT COALESCE(SUM(collateral_amount), 0) INTO v_total_collateral FROM loans WHERE collateral_currency = 'NXA' AND status IN ('active', 'approved', 'pending');
  SELECT COALESCE(SUM(amount), 0) INTO v_total_burned FROM nxa_burn_log;

  v_circulating := GREATEST(v_total_supply - v_total_staked - v_total_collateral, 0);

  SELECT COALESCE(SUM(amount), 0) INTO v_tx_volume FROM transactions WHERE currency = 'NXA' AND created_at > now() - interval '24 hours' AND status = 'completed';
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM transactions WHERE currency = 'NXA' AND created_at > now() - interval '24 hours' AND status = 'completed';

  v_stake_ratio := CASE WHEN v_total_supply > 0 THEN (v_total_staked / v_total_supply) * 100 ELSE 0 END;
  v_collateral_ratio := CASE WHEN v_total_supply > 0 THEN (v_total_collateral / v_total_supply) * 100 ELSE 0 END;

  v_demand := LEAST(
    (v_stake_ratio * 0.4) +
    (v_collateral_ratio * 0.25) +
    (LEAST(v_tx_volume / 1000, 20)) +
    (LEAST(v_active_users * 3, 15)),
    100
  );

  v_supply_pressure := CASE WHEN v_total_supply > 0 THEN (v_circulating / v_total_supply) * 100 ELSE 100 END;

  RETURN QUERY SELECT v_total_supply, v_circulating, v_total_staked, v_total_collateral, v_tx_volume, v_active_users, v_demand, v_supply_pressure, v_total_burned;
END;
$$;
