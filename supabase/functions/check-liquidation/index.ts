import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NXA_BASE_PRICE = 8.50;
const LIQUIDATION_THRESHOLD = 1.1;
const WARNING_THRESHOLD = 1.5;
const CRITICAL_THRESHOLD = 1.2;

async function sendWarningEmail(
  email: string,
  loan: any,
  healthRatio: number,
  nxaPrice: number,
  resendApiKey: string
) {
  const isCritical = healthRatio <= CRITICAL_THRESHOLD;
  const collateralValueUsd = (loan.collateral_amount * nxaPrice).toFixed(2);
  const healthPercent = (healthRatio * 100).toFixed(0);

  const riskColor = isCritical ? '#ef4444' : '#f59e0b';
  const riskLabel = isCritical ? 'CRITICAL — Liquidation Imminent' : 'Warning — Collateral Declining';
  const riskIcon = isCritical ? '🚨' : '⚠️';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333; }
        .logo { font-size: 28px; font-weight: bold; color: #d4af37; margin-bottom: 30px; }
        .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; background: ${riskColor}20; color: ${riskColor}; border: 1px solid ${riskColor}40; }
        .alert-icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
        p { color: #a0a0a0; line-height: 1.6; margin-bottom: 15px; }
        .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 25px 0; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #888; }
        .detail-value { color: #fff; font-weight: 500; }
        .health-bar { height: 8px; border-radius: 4px; background: #333; margin: 15px 0; overflow: hidden; }
        .health-fill { height: 100%; border-radius: 4px; background: ${riskColor}; width: ${Math.min(healthRatio / 2 * 100, 100)}%; }
        .warning-box { background: ${riskColor}15; border: 1px solid ${riskColor}40; border-radius: 8px; padding: 15px; margin-top: 25px; }
        .warning-box p { color: ${riskColor}; margin: 0; font-size: 14px; }
        .cta { display: inline-block; margin-top: 25px; padding: 14px 28px; background: #d4af37; color: #000; font-weight: 600; border-radius: 8px; text-decoration: none; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">NEXA</div>
          <div class="alert-badge">${riskLabel}</div>
          <div class="alert-icon">${riskIcon}</div>
          <h1>Loan Health Alert</h1>
          <p>Your loan's collateral health ratio has dropped to <strong style="color:${riskColor}">${healthPercent}%</strong>. ${
            isCritical
              ? 'Liquidation will occur if it drops to 110%. Immediate action is required.'
              : 'If NXA price continues to fall, your collateral may be liquidated.'
          }</p>

          <div class="health-bar"><div class="health-fill"></div></div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Loan Amount</span>
              <span class="detail-value">$${Number(loan.loan_amount).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Remaining Balance</span>
              <span class="detail-value">$${Number(loan.remaining_balance).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Collateral Locked</span>
              <span class="detail-value">${Number(loan.collateral_amount).toFixed(2)} NXA</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Collateral Value</span>
              <span class="detail-value">$${collateralValueUsd}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current NXA Price</span>
              <span class="detail-value">$${nxaPrice.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Health Ratio</span>
              <span class="detail-value" style="color:${riskColor}">${healthRatio.toFixed(2)}x</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Liquidation At</span>
              <span class="detail-value" style="color:#ef4444">≤ 1.10x</span>
            </div>
          </div>

          <div class="warning-box">
            <p>${isCritical
              ? '🚨 Your loan is critically close to liquidation. Repay part of your loan now to restore your health ratio and protect your NXA collateral.'
              : '⚠️ Consider making a partial repayment to improve your health ratio and avoid potential liquidation.'
            }</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated risk alert from NEXA Financial Technologies.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isCritical
    ? `🚨 CRITICAL: Loan Liquidation Imminent — Health at ${healthPercent}%`
    : `⚠️ Loan Health Warning — Collateral at ${healthPercent}%`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NEXA Alerts <security@resend.dev>",
        to: [email],
        subject,
        html: emailHtml,
      }),
    });

    if (res.ok) {
      console.log(`Warning email sent to ${email} (health: ${healthRatio.toFixed(2)})`);
    } else {
      console.error("Failed to send warning email:", await res.text());
    }
  } catch (e) {
    console.error("Email send error:", e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    const volatility = 1 + (Math.random() - 0.5) * 0.04;
    const nxaPrice = NXA_BASE_PRICE * volatility;

    const { data: activeLoans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const liquidated: string[] = [];
    const warnings: string[] = [];
    const emailsSent: string[] = [];

    for (const loan of (activeLoans || [])) {
      const collateralValueUsd = loan.collateral_amount * nxaPrice;
      const loanValueUsd = loan.remaining_balance;
      const healthRatio = collateralValueUsd / loanValueUsd;

      if (healthRatio <= LIQUIDATION_THRESHOLD) {
        await supabase
          .from('loans')
          .update({ status: 'liquidated', updated_at: new Date().toISOString() })
          .eq('id', loan.id);

        await supabase.from('transactions').insert({
          user_id: loan.user_id,
          amount: loan.collateral_amount,
          currency: 'NXA',
          transaction_type: 'withdraw',
          status: 'completed',
          description: `Loan liquidated — ${loan.collateral_amount.toFixed(2)} NXA collateral seized (health ratio: ${healthRatio.toFixed(2)})`,
        });

        liquidated.push(loan.id);
      } else if (healthRatio <= WARNING_THRESHOLD) {
        warnings.push(loan.id);

        // Send email warning if Resend is configured
        if (resendApiKey) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', loan.user_id)
            .single();

          if (profile?.email) {
            await sendWarningEmail(profile.email, loan, healthRatio, nxaPrice, resendApiKey);
            emailsSent.push(loan.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      nxa_price: nxaPrice,
      checked: activeLoans?.length || 0,
      liquidated,
      warnings,
      emails_sent: emailsSent,
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
