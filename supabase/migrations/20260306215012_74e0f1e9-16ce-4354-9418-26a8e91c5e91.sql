
-- Create loans table for NXA-collateralized lending
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loan_amount numeric NOT NULL,
  loan_currency text NOT NULL DEFAULT 'USD',
  collateral_amount numeric NOT NULL,
  collateral_currency text NOT NULL DEFAULT 'NXA',
  collateral_ratio numeric NOT NULL DEFAULT 2.0,
  interest_rate numeric NOT NULL DEFAULT 5.0,
  term_days integer NOT NULL DEFAULT 30,
  monthly_payment numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamp with time zone,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all loans" ON public.loans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
