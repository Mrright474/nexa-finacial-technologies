import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NXA_BASE_PRICE = 8.50;
const LIQUIDATION_THRESHOLD = 1.1; // Liquidate when collateral value drops to 110% of loan

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get current NXA price (with volatility)
    const volatility = 1 + (Math.random() - 0.5) * 0.04;
    const nxaPrice = NXA_BASE_PRICE * volatility;

    // Fetch all active loans
    const { data: activeLoans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const liquidated: string[] = [];
    const warnings: string[] = [];

    for (const loan of (activeLoans || [])) {
      const collateralValueUsd = loan.collateral_amount * nxaPrice;
      const loanValueUsd = loan.remaining_balance;
      const healthRatio = collateralValueUsd / loanValueUsd;

      if (healthRatio <= LIQUIDATION_THRESHOLD) {
        // LIQUIDATE: collateral value too low
        // 1. Mark loan as liquidated
        await supabase
          .from('loans')
          .update({ status: 'liquidated', updated_at: new Date().toISOString() })
          .eq('id', loan.id);

        // 2. Collateral is seized (already locked, just don't return it)
        // 3. Record transaction
        await supabase.from('transactions').insert({
          user_id: loan.user_id,
          amount: loan.collateral_amount,
          currency: 'NXA',
          transaction_type: 'withdraw',
          status: 'completed',
          description: `Loan liquidated — ${loan.collateral_amount.toFixed(2)} NXA collateral seized (health ratio: ${healthRatio.toFixed(2)})`,
        });

        liquidated.push(loan.id);
      } else if (healthRatio <= 1.5) {
        // WARNING zone — collateral getting close to threshold
        warnings.push(loan.id);
      }
    }

    return new Response(JSON.stringify({
      nxa_price: nxaPrice,
      checked: activeLoans?.length || 0,
      liquidated,
      warnings,
      threshold: LIQUIDATION_THRESHOLD,
      timestamp: Date.now(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Liquidation check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
