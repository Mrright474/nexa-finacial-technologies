
-- Update handle_new_user to also create a NXA wallet
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default wallets including NXA
  INSERT INTO public.wallets (user_id, currency, balance, wallet_type) VALUES
    (NEW.id, 'USD', 0, 'fiat'),
    (NEW.id, 'EUR', 0, 'fiat'),
    (NEW.id, 'UGX', 0, 'fiat'),
    (NEW.id, 'NXA', 100, 'crypto');
  
  RETURN NEW;
END;
$function$;
