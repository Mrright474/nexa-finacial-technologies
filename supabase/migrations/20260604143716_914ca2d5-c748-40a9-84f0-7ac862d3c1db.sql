
REVOKE EXECUTE ON FUNCTION public.wallet_credit(text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_debit(text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_transfer(text, text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_swap(text, text, numeric, numeric, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.loan_apply(numeric, text, numeric, text, numeric, numeric, int, numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.loan_repay(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.stake_nxa(numeric, int, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unstake_nxa(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._ensure_wallet(uuid, text) FROM PUBLIC, anon, authenticated;
