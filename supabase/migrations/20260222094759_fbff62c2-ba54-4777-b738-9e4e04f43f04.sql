
-- Function: award points on signup (called from handle_new_user or separately)
CREATE OR REPLACE FUNCTION public.award_signup_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.points_ledger (user_id, points, type, action)
  VALUES (NEW.user_id, 100, 'earned', 'Welcome bonus for signing up');
  RETURN NEW;
END;
$$;

-- Trigger: award points when a new profile is created (i.e. signup)
CREATE TRIGGER award_signup_points_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_signup_points();

-- Function: award points on completed transaction
CREATE OR REPLACE FUNCTION public.award_transaction_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pts INTEGER;
BEGIN
  -- Only award for completed transactions
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Points based on transaction type
  CASE NEW.transaction_type
    WHEN 'deposit' THEN pts := 10;
    WHEN 'withdraw' THEN pts := 5;
    WHEN 'send' THEN pts := 25;
    WHEN 'receive' THEN pts := 10;
    ELSE pts := 5;
  END CASE;

  -- Bonus for larger amounts (over 100 in any currency)
  IF NEW.amount >= 100 THEN
    pts := pts + 15;
  END IF;

  INSERT INTO public.points_ledger (user_id, points, type, action)
  VALUES (NEW.user_id, pts, 'earned', 
    'Transaction: ' || initcap(NEW.transaction_type) || ' ' || NEW.currency || ' ' || NEW.amount::text);
  
  RETURN NEW;
END;
$$;

-- Trigger: award points on new transaction
CREATE TRIGGER award_transaction_points_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_transaction_points();

-- Function: award points on KYC verification
CREATE OR REPLACE FUNCTION public.award_kyc_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award when KYC status changes to verified
  IF NEW.kyc_status = 'verified' AND (OLD.kyc_status IS NULL OR OLD.kyc_status != 'verified') THEN
    INSERT INTO public.points_ledger (user_id, points, type, action)
    VALUES (NEW.user_id, 250, 'earned', 'KYC verification completed');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: award points when profile kyc_status updated to verified
CREATE TRIGGER award_kyc_points_trigger
  AFTER UPDATE OF kyc_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_kyc_points();

-- Award points per KYC document upload (50 pts each)
CREATE OR REPLACE FUNCTION public.award_kyc_upload_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.points_ledger (user_id, points, type, action)
  VALUES (NEW.user_id, 50, 'earned', 'Uploaded KYC document: ' || replace(NEW.document_type, '_', ' '));
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_kyc_upload_points_trigger
  AFTER INSERT ON public.kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.award_kyc_upload_points();
