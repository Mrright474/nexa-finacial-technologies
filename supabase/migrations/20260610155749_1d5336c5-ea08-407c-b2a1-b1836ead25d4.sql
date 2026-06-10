
-- 1. Audit table
CREATE TABLE public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  currency text NOT NULL,
  change_amount numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  source text NOT NULL,
  transaction_id uuid,
  loan_id uuid,
  stake_id uuid,
  counterparty_user_id uuid,
  actor_user_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_ledger TO authenticated;
GRANT ALL ON public.wallet_ledger TO service_role;

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wallet_ledger_user_created ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX idx_wallet_ledger_tx ON public.wallet_ledger(transaction_id);
CREATE INDEX idx_wallet_ledger_currency ON public.wallet_ledger(currency, created_at DESC);

-- 2. Internal helper to record ledger entries
CREATE OR REPLACE FUNCTION public._record_wallet_ledger(
  p_user_id uuid,
  p_currency text,
  p_change numeric,
  p_balance_before numeric,
  p_balance_after numeric,
  p_source text,
  p_transaction_id uuid DEFAULT NULL,
  p_loan_id uuid DEFAULT NULL,
  p_stake_id uuid DEFAULT NULL,
  p_counterparty uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO wallet_ledger(user_id, currency, change_amount, balance_before, balance_after,
                             source, transaction_id, loan_id, stake_id, counterparty_user_id,
                             actor_user_id, metadata)
  VALUES (p_user_id, p_currency, p_change, p_balance_before, p_balance_after,
          p_source, p_transaction_id, p_loan_id, p_stake_id, p_counterparty,
          auth.uid(), p_metadata);
END;
$$;

REVOKE EXECUTE ON FUNCTION public._record_wallet_ledger(uuid, text, numeric, numeric, numeric, text, uuid, uuid, uuid, uuid, jsonb) FROM public, anon, authenticated;

-- 3. Patch wallet_credit
CREATE OR REPLACE FUNCTION public.wallet_credit(p_currency text, p_amount numeric, p_description text DEFAULT NULL, p_tx_type text DEFAULT 'deposit')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_wallet_id uuid;
  v_before numeric;
  v_after numeric;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  v_wallet_id := public._ensure_wallet(v_user, p_currency);

  SELECT balance INTO v_before FROM wallets WHERE id = v_wallet_id FOR UPDATE;
  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_wallet_id RETURNING balance INTO v_after;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, p_tx_type, p_amount, p_currency, 'completed',
          COALESCE(p_description, initcap(p_tx_type) || ' ' || p_currency || ' ' || p_amount::text))
  RETURNING id INTO v_tx_id;

  PERFORM public._record_wallet_ledger(v_user, p_currency, p_amount, v_before, v_after,
    'credit:' || p_tx_type, v_tx_id, NULL, NULL, NULL, NULL);

  RETURN v_after;
END;
$$;

-- 4. Patch wallet_debit
CREATE OR REPLACE FUNCTION public.wallet_debit(p_currency text, p_amount numeric, p_description text DEFAULT NULL, p_tx_type text DEFAULT 'withdraw')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_before numeric;
  v_after numeric;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO v_before FROM wallets WHERE user_id = v_user AND currency = p_currency FOR UPDATE;
  IF v_before IS NULL THEN RAISE EXCEPTION 'Wallet not found for %', p_currency; END IF;
  IF v_before < p_amount THEN RAISE EXCEPTION 'Insufficient % balance', p_currency; END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_currency RETURNING balance INTO v_after;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, p_tx_type, p_amount, p_currency, 'completed',
          COALESCE(p_description, initcap(p_tx_type) || ' ' || p_currency || ' ' || p_amount::text))
  RETURNING id INTO v_tx_id;

  PERFORM public._record_wallet_ledger(v_user, p_currency, -p_amount, v_before, v_after,
    'debit:' || p_tx_type, v_tx_id, NULL, NULL, NULL, NULL);

  RETURN v_after;
END;
$$;

-- 5. Patch wallet_transfer
CREATE OR REPLACE FUNCTION public.wallet_transfer(p_recipient_email text, p_currency text, p_amount numeric, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_recipient_id uuid;
  v_recipient_name text;
  v_sender_name text;
  v_sender_before numeric;
  v_sender_after numeric;
  v_recip_before numeric;
  v_recip_after numeric;
  v_sender_profile record;
  v_recipient_profile record;
  v_tx_send uuid;
  v_tx_recv uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT user_id, first_name, last_name, email INTO v_recipient_profile
  FROM profiles WHERE email = p_recipient_email;
  IF v_recipient_profile.user_id IS NULL THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  IF v_recipient_profile.user_id = v_user THEN RAISE EXCEPTION 'Cannot transfer to yourself'; END IF;

  v_recipient_id := v_recipient_profile.user_id;
  v_recipient_name := COALESCE(NULLIF(TRIM(COALESCE(v_recipient_profile.first_name,'') || ' ' || COALESCE(v_recipient_profile.last_name,'')), ''), v_recipient_profile.email);

  SELECT balance INTO v_sender_before FROM wallets WHERE user_id = v_user AND currency = p_currency FOR UPDATE;
  IF v_sender_before IS NULL THEN RAISE EXCEPTION 'Sender wallet not found'; END IF;
  IF v_sender_before < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  PERFORM public._ensure_wallet(v_recipient_id, p_currency);
  SELECT balance INTO v_recip_before FROM wallets WHERE user_id = v_recipient_id AND currency = p_currency FOR UPDATE;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_currency RETURNING balance INTO v_sender_after;

  UPDATE wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_recipient_id AND currency = p_currency RETURNING balance INTO v_recip_after;

  SELECT first_name, last_name, email INTO v_sender_profile FROM profiles WHERE user_id = v_user;
  v_sender_name := COALESCE(NULLIF(TRIM(COALESCE(v_sender_profile.first_name,'') || ' ' || COALESCE(v_sender_profile.last_name,'')), ''), v_sender_profile.email);

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description, recipient_id, recipient_name)
  VALUES (v_user, 'send', p_amount, p_currency, 'completed', COALESCE(p_note, 'Transfer to ' || v_recipient_name), v_recipient_id, v_recipient_name)
  RETURNING id INTO v_tx_send;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description, recipient_id, recipient_name)
  VALUES (v_recipient_id, 'receive', p_amount, p_currency, 'completed', COALESCE(p_note, 'Received from ' || v_sender_name), v_user, v_sender_name)
  RETURNING id INTO v_tx_recv;

  PERFORM public._record_wallet_ledger(v_user, p_currency, -p_amount, v_sender_before, v_sender_after,
    'transfer_out', v_tx_send, NULL, NULL, v_recipient_id, NULL);
  PERFORM public._record_wallet_ledger(v_recipient_id, p_currency, p_amount, v_recip_before, v_recip_after,
    'transfer_in', v_tx_recv, NULL, NULL, v_user, NULL);
END;
$$;

-- 6. Patch wallet_swap
CREATE OR REPLACE FUNCTION public.wallet_swap(p_from_currency text, p_to_currency text, p_from_amount numeric, p_to_amount numeric, p_fee numeric DEFAULT 0, p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_from_before numeric;
  v_from_after numeric;
  v_to_before numeric;
  v_to_after numeric;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_from_currency = p_to_currency THEN RAISE EXCEPTION 'Currencies must differ'; END IF;
  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN RAISE EXCEPTION 'Amounts must be positive'; END IF;

  SELECT balance INTO v_from_before FROM wallets WHERE user_id = v_user AND currency = p_from_currency FOR UPDATE;
  IF v_from_before IS NULL THEN RAISE EXCEPTION 'Source wallet not found'; END IF;
  IF v_from_before < p_from_amount THEN RAISE EXCEPTION 'Insufficient % balance', p_from_currency; END IF;

  PERFORM public._ensure_wallet(v_user, p_to_currency);
  SELECT balance INTO v_to_before FROM wallets WHERE user_id = v_user AND currency = p_to_currency FOR UPDATE;

  UPDATE wallets SET balance = balance - p_from_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_from_currency RETURNING balance INTO v_from_after;

  UPDATE wallets SET balance = balance + p_to_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_to_currency RETURNING balance INTO v_to_after;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, fee, description)
  VALUES (v_user, 'swap', p_from_amount, p_from_currency, 'completed', COALESCE(p_fee, 0),
          COALESCE(p_description, 'Swapped ' || p_from_amount || ' ' || p_from_currency || ' → ' || p_to_amount || ' ' || p_to_currency))
  RETURNING id INTO v_tx_id;

  PERFORM public._record_wallet_ledger(v_user, p_from_currency, -p_from_amount, v_from_before, v_from_after,
    'swap_from', v_tx_id, NULL, NULL, NULL,
    jsonb_build_object('to_currency', p_to_currency, 'to_amount', p_to_amount, 'fee', p_fee));
  PERFORM public._record_wallet_ledger(v_user, p_to_currency, p_to_amount, v_to_before, v_to_after,
    'swap_to', v_tx_id, NULL, NULL, NULL,
    jsonb_build_object('from_currency', p_from_currency, 'from_amount', p_from_amount, 'fee', p_fee));

  RETURN v_tx_id;
END;
$$;

-- 7. Patch loan_apply
CREATE OR REPLACE FUNCTION public.loan_apply(p_loan_amount numeric, p_loan_currency text, p_collateral_amount numeric, p_collateral_currency text, p_collateral_ratio numeric, p_interest_rate numeric, p_term_days integer, p_monthly_payment numeric, p_total_repayment numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_coll_before numeric;
  v_coll_after numeric;
  v_loan_before numeric;
  v_loan_after numeric;
  v_loan_id uuid;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_loan_amount <= 0 OR p_collateral_amount <= 0 THEN RAISE EXCEPTION 'Amounts must be positive'; END IF;

  SELECT balance INTO v_coll_before FROM wallets WHERE user_id = v_user AND currency = p_collateral_currency FOR UPDATE;
  IF v_coll_before IS NULL OR v_coll_before < p_collateral_amount THEN
    RAISE EXCEPTION 'Insufficient % collateral', p_collateral_currency;
  END IF;

  UPDATE wallets SET balance = balance - p_collateral_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_collateral_currency RETURNING balance INTO v_coll_after;

  PERFORM public._ensure_wallet(v_user, p_loan_currency);
  SELECT balance INTO v_loan_before FROM wallets WHERE user_id = v_user AND currency = p_loan_currency FOR UPDATE;
  UPDATE wallets SET balance = balance + p_loan_amount, updated_at = now()
  WHERE user_id = v_user AND currency = p_loan_currency RETURNING balance INTO v_loan_after;

  INSERT INTO loans (user_id, loan_amount, loan_currency, collateral_amount, collateral_currency,
                     collateral_ratio, interest_rate, term_days, monthly_payment, remaining_balance,
                     status, approved_at, due_date)
  VALUES (v_user, p_loan_amount, p_loan_currency, p_collateral_amount, p_collateral_currency,
          p_collateral_ratio, p_interest_rate, p_term_days, p_monthly_payment, p_total_repayment,
          'active', now(), now() + (p_term_days || ' days')::interval)
  RETURNING id INTO v_loan_id;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, 'receive', p_loan_amount, p_loan_currency, 'completed',
          'Loan disbursement — ' || p_collateral_amount::text || ' ' || p_collateral_currency || ' collateral (' || p_collateral_ratio || 'x)')
  RETURNING id INTO v_tx_id;

  PERFORM public._record_wallet_ledger(v_user, p_collateral_currency, -p_collateral_amount, v_coll_before, v_coll_after,
    'collateral_lock', NULL, v_loan_id, NULL, NULL, NULL);
  PERFORM public._record_wallet_ledger(v_user, p_loan_currency, p_loan_amount, v_loan_before, v_loan_after,
    'loan_disbursement', v_tx_id, v_loan_id, NULL, NULL, NULL);

  RETURN v_loan_id;
END;
$$;

-- 8. Patch loan_repay
CREATE OR REPLACE FUNCTION public.loan_repay(p_loan_id uuid, p_amount numeric)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_loan record;
  v_pay_before numeric;
  v_pay_after numeric;
  v_coll_before numeric;
  v_coll_after numeric;
  v_new_remaining numeric;
  v_fully_paid boolean;
  v_tx_pay uuid;
  v_tx_unlock uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id AND user_id = v_user FOR UPDATE;
  IF v_loan.id IS NULL THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status NOT IN ('active','approved') THEN RAISE EXCEPTION 'Loan is not active'; END IF;
  IF p_amount > v_loan.remaining_balance THEN RAISE EXCEPTION 'Amount exceeds remaining balance'; END IF;

  SELECT balance INTO v_pay_before FROM wallets WHERE user_id = v_user AND currency = v_loan.loan_currency FOR UPDATE;
  IF v_pay_before IS NULL OR v_pay_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient % balance', v_loan.loan_currency;
  END IF;

  v_new_remaining := v_loan.remaining_balance - p_amount;
  v_fully_paid := v_new_remaining <= 0.01;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = v_loan.loan_currency RETURNING balance INTO v_pay_after;

  UPDATE loans SET
    remaining_balance = CASE WHEN v_fully_paid THEN 0 ELSE v_new_remaining END,
    status = CASE WHEN v_fully_paid THEN 'paid' ELSE 'active' END,
    updated_at = now()
  WHERE id = p_loan_id;

  INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
  VALUES (v_user, 'send', p_amount, v_loan.loan_currency, 'completed',
          'Loan repayment' || CASE WHEN v_fully_paid THEN ' (fully paid)' ELSE '' END || ' — ' || p_amount::text)
  RETURNING id INTO v_tx_pay;

  PERFORM public._record_wallet_ledger(v_user, v_loan.loan_currency, -p_amount, v_pay_before, v_pay_after,
    'loan_repayment', v_tx_pay, p_loan_id, NULL, NULL, NULL);

  IF v_fully_paid THEN
    PERFORM public._ensure_wallet(v_user, v_loan.collateral_currency);
    SELECT balance INTO v_coll_before FROM wallets WHERE user_id = v_user AND currency = v_loan.collateral_currency FOR UPDATE;
    UPDATE wallets SET balance = balance + v_loan.collateral_amount, updated_at = now()
    WHERE user_id = v_user AND currency = v_loan.collateral_currency RETURNING balance INTO v_coll_after;

    INSERT INTO transactions (user_id, transaction_type, amount, currency, status, description)
    VALUES (v_user, 'receive', v_loan.collateral_amount, v_loan.collateral_currency, 'completed',
            'Collateral unlocked — ' || v_loan.collateral_amount::text || ' ' || v_loan.collateral_currency || ' returned after loan repayment')
    RETURNING id INTO v_tx_unlock;

    PERFORM public._record_wallet_ledger(v_user, v_loan.collateral_currency, v_loan.collateral_amount, v_coll_before, v_coll_after,
      'collateral_unlock', v_tx_unlock, p_loan_id, NULL, NULL, NULL);
  END IF;

  RETURN v_fully_paid;
END;
$$;

-- 9. Patch stake_nxa
CREATE OR REPLACE FUNCTION public.stake_nxa(p_amount numeric, p_lock_period_days integer, p_apy numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_before numeric;
  v_after numeric;
  v_stake_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF p_lock_period_days <= 0 THEN RAISE EXCEPTION 'Invalid lock period'; END IF;

  SELECT balance INTO v_before FROM wallets WHERE user_id = v_user AND currency = 'NXA' FOR UPDATE;
  IF v_before IS NULL OR v_before < p_amount THEN RAISE EXCEPTION 'Insufficient NXA balance'; END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = v_user AND currency = 'NXA' RETURNING balance INTO v_after;

  INSERT INTO nxa_stakes (user_id, amount, lock_period_days, apy, end_date)
  VALUES (v_user, p_amount, p_lock_period_days, p_apy, now() + (p_lock_period_days || ' days')::interval)
  RETURNING id INTO v_stake_id;

  PERFORM public._record_wallet_ledger(v_user, 'NXA', -p_amount, v_before, v_after,
    'stake_lock', NULL, NULL, v_stake_id, NULL,
    jsonb_build_object('lock_period_days', p_lock_period_days, 'apy', p_apy));

  RETURN v_stake_id;
END;
$$;

-- 10. Patch unstake_nxa
CREATE OR REPLACE FUNCTION public.unstake_nxa(p_stake_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_stake record;
  v_before numeric;
  v_after numeric;
  v_total numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_stake FROM nxa_stakes WHERE id = p_stake_id AND user_id = v_user FOR UPDATE;
  IF v_stake.id IS NULL THEN RAISE EXCEPTION 'Stake not found'; END IF;
  IF v_stake.status <> 'active' THEN RAISE EXCEPTION 'Stake is not active'; END IF;
  IF v_stake.end_date > now() THEN RAISE EXCEPTION 'Stake is still locked until %', v_stake.end_date; END IF;

  v_total := v_stake.amount + COALESCE(v_stake.earned_rewards, 0);

  PERFORM public._ensure_wallet(v_user, 'NXA');
  SELECT balance INTO v_before FROM wallets WHERE user_id = v_user AND currency = 'NXA' FOR UPDATE;
  UPDATE wallets SET balance = balance + v_total, updated_at = now()
  WHERE user_id = v_user AND currency = 'NXA' RETURNING balance INTO v_after;

  UPDATE nxa_stakes SET status = 'completed' WHERE id = p_stake_id;

  PERFORM public._record_wallet_ledger(v_user, 'NXA', v_total, v_before, v_after,
    'stake_unlock', NULL, NULL, p_stake_id, NULL,
    jsonb_build_object('principal', v_stake.amount, 'rewards', COALESCE(v_stake.earned_rewards, 0)));

  RETURN v_total;
END;
$$;
