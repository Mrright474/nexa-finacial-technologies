
-- =========================================================
-- 1. Lock down direct wallet mutations from clients
-- =========================================================
DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.wallets;

-- Re-create granular policies: users may read & insert empty wallets only.
CREATE POLICY "Users can insert empty wallets"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND balance = 0);

-- (SELECT policy "Users can view their own wallets" already exists.)

-- Revoke direct UPDATE/DELETE on balance from the API roles.
REVOKE UPDATE, DELETE ON public.wallets FROM authenticated;
REVOKE UPDATE, DELETE ON public.wallets FROM anon;

-- =========================================================
-- 2. Helper: get or create a wallet (SECURITY DEFINER)
-- =========================================================
CREATE OR REPLACE FUNCTION public._ensure_wallet(p_user_id uuid, p_currency text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_type text;
BEGIN
  SELECT id INTO v_id FROM wallets WHERE user_id = p_user_id AND currency = p_currency;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;
  v_type := CASE WHEN p_currency IN ('USD','EUR','UGX','GBP','KES') THEN 'fiat' ELSE 'crypto' END;
  INSERT INTO wallets (user_id, currency, balance, wallet_type)
  VALUES (p_user_id, p_currency, 0, v_type)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- =========================================================
-- 3. wallet_credit / wallet_debit
-- =========================================================
CREATE OR REPLACE FUNCTION public.wallet_credit(
  p_currency text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_tx_type text DEFAULT 'deposit'
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_wallet_id uuid;
  v_new_balance numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  v_wallet_id := public._ensure_wallet(v_user, p_currency);

  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, p_tx_type, p_amount, p_currency, 'completed',
          COALESCE(p_description, initcap(p_tx_type) || ' ' || p_currency || ' ' || p_amount::text));

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_debit(
  p_currency text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_tx_type text DEFAULT 'withdraw'
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance numeric;
  v_new_balance numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO v_balance FROM wallets
  WHERE user_id = v_user AND currency = p_currency
  FOR UPDATE;

  IF v_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found for %', p_currency; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient % balance', p_currency; END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_currency
  RETURNING balance INTO v_new_balance;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, p_tx_type, p_amount, p_currency, 'completed',
          COALESCE(p_description, initcap(p_tx_type) || ' ' || p_currency || ' ' || p_amount::text));

  RETURN v_new_balance;
END;
$$;

-- =========================================================
-- 4. wallet_transfer (P2P by recipient email)
-- =========================================================
CREATE OR REPLACE FUNCTION public.wallet_transfer(
  p_recipient_email text,
  p_currency text,
  p_amount numeric,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_recipient_id uuid;
  v_recipient_name text;
  v_sender_name text;
  v_sender_balance numeric;
  v_sender_profile record;
  v_recipient_profile record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT user_id, first_name, last_name, email INTO v_recipient_profile
  FROM profiles WHERE email = p_recipient_email;

  IF v_recipient_profile.user_id IS NULL THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  IF v_recipient_profile.user_id = v_user THEN RAISE EXCEPTION 'Cannot transfer to yourself'; END IF;

  v_recipient_id := v_recipient_profile.user_id;
  v_recipient_name := COALESCE(NULLIF(TRIM(COALESCE(v_recipient_profile.first_name,'') || ' ' || COALESCE(v_recipient_profile.last_name,'')), ''), v_recipient_profile.email);

  SELECT balance INTO v_sender_balance FROM wallets
  WHERE user_id = v_user AND currency = p_currency
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN RAISE EXCEPTION 'Sender wallet not found'; END IF;
  IF v_sender_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  PERFORM public._ensure_wallet(v_recipient_id, p_currency);

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_currency;

  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_recipient_id AND currency = p_currency;

  SELECT first_name, last_name, email INTO v_sender_profile FROM profiles WHERE user_id = v_user;
  v_sender_name := COALESCE(NULLIF(TRIM(COALESCE(v_sender_profile.first_name,'') || ' ' || COALESCE(v_sender_profile.last_name,'')), ''), v_sender_profile.email);

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description, recipient_id, recipient_name)
  VALUES (v_user, 'send', p_amount, p_currency, 'completed', COALESCE(p_note, 'Transfer to ' || v_recipient_name), v_recipient_id, v_recipient_name);

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description, recipient_id, recipient_name)
  VALUES (v_recipient_id, 'receive', p_amount, p_currency, 'completed', COALESCE(p_note, 'Received from ' || v_sender_name), v_user, v_sender_name);
END;
$$;

-- =========================================================
-- 5. wallet_swap
-- =========================================================
CREATE OR REPLACE FUNCTION public.wallet_swap(
  p_from_currency text,
  p_to_currency text,
  p_from_amount numeric,
  p_to_amount numeric,
  p_fee numeric DEFAULT 0,
  p_description text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_from_balance numeric;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_from_currency = p_to_currency THEN RAISE EXCEPTION 'Currencies must differ'; END IF;
  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN RAISE EXCEPTION 'Amounts must be positive'; END IF;

  SELECT balance INTO v_from_balance FROM wallets
  WHERE user_id = v_user AND currency = p_from_currency
  FOR UPDATE;

  IF v_from_balance IS NULL THEN RAISE EXCEPTION 'Source wallet not found'; END IF;
  IF v_from_balance < p_from_amount THEN RAISE EXCEPTION 'Insufficient % balance', p_from_currency; END IF;

  PERFORM public._ensure_wallet(v_user, p_to_currency);

  UPDATE wallets SET balance = balance - p_from_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_from_currency;

  UPDATE wallets SET balance = balance + p_to_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_to_currency;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, fee, description)
  VALUES (v_user, 'swap', p_from_amount, p_from_currency, 'completed', COALESCE(p_fee, 0),
          COALESCE(p_description, 'Swapped ' || p_from_amount || ' ' || p_from_currency || ' → ' || p_to_amount || ' ' || p_to_currency))
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- =========================================================
-- 6. loan_apply / loan_repay
-- =========================================================
CREATE OR REPLACE FUNCTION public.loan_apply(
  p_loan_amount numeric,
  p_loan_currency text,
  p_collateral_amount numeric,
  p_collateral_currency text,
  p_collateral_ratio numeric,
  p_interest_rate numeric,
  p_term_days int,
  p_monthly_payment numeric,
  p_total_repayment numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_coll_balance numeric;
  v_loan_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_loan_amount <= 0 OR p_collateral_amount <= 0 THEN RAISE EXCEPTION 'Amounts must be positive'; END IF;

  SELECT balance INTO v_coll_balance FROM wallets
  WHERE user_id = v_user AND currency = p_collateral_currency
  FOR UPDATE;

  IF v_coll_balance IS NULL OR v_coll_balance < p_collateral_amount THEN
    RAISE EXCEPTION 'Insufficient % collateral', p_collateral_currency;
  END IF;

  -- Lock collateral
  UPDATE wallets SET balance = balance - p_collateral_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_collateral_currency;

  -- Credit loan funds
  PERFORM public._ensure_wallet(v_user, p_loan_currency);
  UPDATE wallets SET balance = balance + p_loan_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_loan_currency;

  -- Create loan record
  INSERT INTO loans (user_id, loan_amount, loan_currency, collateral_amount, collateral_currency,
                     collateral_ratio, interest_rate, term_days, monthly_payment, remaining_balance,
                     status, approved_at, due_date)
  VALUES (v_user, p_loan_amount, p_loan_currency, p_collateral_amount, p_collateral_currency,
          p_collateral_ratio, p_interest_rate, p_term_days, p_monthly_payment, p_total_repayment,
          'active', now(), now() + (p_term_days || ' days')::interval)
  RETURNING id INTO v_loan_id;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, 'receive', p_loan_amount, p_loan_currency, 'completed',
          'Loan disbursement — ' || p_collateral_amount::text || ' ' || p_collateral_currency || ' collateral (' || p_collateral_ratio || 'x)');

  RETURN v_loan_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.loan_repay(
  p_loan_id uuid,
  p_amount numeric
) RETURNS boolean  -- returns true if fully paid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_loan record;
  v_usd_balance numeric;
  v_new_remaining numeric;
  v_fully_paid boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id AND user_id = v_user FOR UPDATE;
  IF v_loan.id IS NULL THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status NOT IN ('active','approved') THEN RAISE EXCEPTION 'Loan is not active'; END IF;
  IF p_amount > v_loan.remaining_balance THEN RAISE EXCEPTION 'Amount exceeds remaining balance'; END IF;

  SELECT balance INTO v_usd_balance FROM wallets
  WHERE user_id = v_user AND currency = v_loan.loan_currency
  FOR UPDATE;

  IF v_usd_balance IS NULL OR v_usd_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient % balance', v_loan.loan_currency;
  END IF;

  v_new_remaining := v_loan.remaining_balance - p_amount;
  v_fully_paid := v_new_remaining <= 0.01;

  -- Deduct loan-currency
  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = v_loan.loan_currency;

  -- Update loan
  UPDATE loans SET
    remaining_balance = CASE WHEN v_fully_paid THEN 0 ELSE v_new_remaining END,
    status = CASE WHEN v_fully_paid THEN 'paid' ELSE 'active' END,
    updated_at = now()
  WHERE id = p_loan_id;

  -- Repayment tx
  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, 'send', p_amount, v_loan.loan_currency, 'completed',
          'Loan repayment' || CASE WHEN v_fully_paid THEN ' (fully paid)' ELSE '' END || ' — ' || p_amount::text);

  -- Unlock collateral if fully paid
  IF v_fully_paid THEN
    PERFORM public._ensure_wallet(v_user, v_loan.collateral_currency);
    UPDATE wallets SET balance = balance + v_loan.collateral_amount, updated_at = now()
    WHERE user_id = v_user AND currency = v_loan.collateral_currency;

    INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
    VALUES (v_user, 'receive', v_loan.collateral_amount, v_loan.collateral_currency, 'completed',
            'Collateral unlocked — ' || v_loan.collateral_amount::text || ' ' || v_loan.collateral_currency || ' returned after loan repayment');
  END IF;

  RETURN v_fully_paid;
END;
$$;

-- =========================================================
-- 7. stake_nxa / unstake_nxa
-- =========================================================
CREATE OR REPLACE FUNCTION public.stake_nxa(
  p_amount numeric,
  p_lock_period_days int,
  p_apy numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance numeric;
  v_stake_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF p_lock_period_days <= 0 THEN RAISE EXCEPTION 'Invalid lock period'; END IF;

  SELECT balance INTO v_balance FROM wallets
  WHERE user_id = v_user AND currency = 'NXA' FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient NXA balance'; END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = 'NXA';

  INSERT INTO nxa_stakes (user_id, amount, lock_period_days, apy, end_date)
  VALUES (v_user, p_amount, p_lock_period_days, p_apy, now() + (p_lock_period_days || ' days')::interval)
  RETURNING id INTO v_stake_id;

  RETURN v_stake_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unstake_nxa(p_stake_id uuid)
RETURNS numeric  -- total returned
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_stake record;
  v_total numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_stake FROM nxa_stakes WHERE id = p_stake_id AND user_id = v_user FOR UPDATE;
  IF v_stake.id IS NULL THEN RAISE EXCEPTION 'Stake not found'; END IF;
  IF v_stake.status <> 'active' THEN RAISE EXCEPTION 'Stake is not active'; END IF;
  IF v_stake.end_date > now() THEN RAISE EXCEPTION 'Stake is still locked until %', v_stake.end_date; END IF;

  v_total := v_stake.amount + COALESCE(v_stake.earned_rewards, 0);

  PERFORM public._ensure_wallet(v_user, 'NXA');
  UPDATE wallets SET balance = balance + v_total, updated_at = now()
  WHERE user_id = v_user AND currency = 'NXA';

  UPDATE nxa_stakes SET status = 'completed' WHERE id = p_stake_id;

  RETURN v_total;
END;
$$;

-- =========================================================
-- 8. Grant execute on RPCs to authenticated users
-- =========================================================
GRANT EXECUTE ON FUNCTION public.wallet_credit(text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_debit(text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_transfer(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_swap(text, text, numeric, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loan_apply(numeric, text, numeric, text, numeric, numeric, int, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loan_repay(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stake_nxa(numeric, int, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unstake_nxa(uuid) TO authenticated;
-- _ensure_wallet is internal; do not grant.
REVOKE EXECUTE ON FUNCTION public._ensure_wallet(uuid, text) FROM PUBLIC;
