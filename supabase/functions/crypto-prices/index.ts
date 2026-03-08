import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NXA_BASE_PRICE = 8.50;

async function checkPriceAlerts(prices: Record<string, { usd: number; usd_24h_change: number }>) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('triggered', false);

    if (!alerts || alerts.length === 0) return;

    for (const alert of alerts) {
      const priceData = prices[alert.symbol];
      if (!priceData) continue;

      const currentPrice = priceData.usd;
      const hit = alert.condition === 'above'
        ? currentPrice >= alert.target_price
        : currentPrice <= alert.target_price;

      if (hit) {
        await supabase
          .from('price_alerts')
          .update({ triggered: true })
          .eq('id', alert.id);

        const direction = alert.condition === 'above' ? 'risen above' : 'dropped below';
        await supabase.from('notifications').insert({
          user_id: alert.user_id,
          type: 'price_alert',
          title: `${alert.symbol} Price Alert`,
          message: `${alert.symbol} has ${direction} your target of $${Number(alert.target_price).toLocaleString()}. Current price: $${currentPrice.toLocaleString()}.`,
          icon: alert.condition === 'above' ? 'trending-up' : 'trending-down',
          color: alert.condition === 'above' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
        });
      }
    }
  } catch (e) {
    console.error('Price alert check error:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ids = 'bitcoin,ethereum,solana,tether,usd-coin';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    const volatility = 1 + (Math.random() - 0.5) * 0.04;
    const nxaPrice = NXA_BASE_PRICE * volatility;
    const nxa24hChange = (Math.random() - 0.3) * 8;

    const prices: Record<string, { usd: number; usd_24h_change: number }> = {
      NXA: { usd: parseFloat(nxaPrice.toFixed(4)), usd_24h_change: parseFloat(nxa24hChange.toFixed(2)) },
      BTC: { usd: data.bitcoin?.usd ?? 0, usd_24h_change: data.bitcoin?.usd_24h_change ?? 0 },
      ETH: { usd: data.ethereum?.usd ?? 0, usd_24h_change: data.ethereum?.usd_24h_change ?? 0 },
      SOL: { usd: data.solana?.usd ?? 0, usd_24h_change: data.solana?.usd_24h_change ?? 0 },
      USDT: { usd: data.tether?.usd ?? 1, usd_24h_change: data.tether?.usd_24h_change ?? 0 },
      USDC: { usd: data['usd-coin']?.usd ?? 1, usd_24h_change: data['usd-coin']?.usd_24h_change ?? 0 },
      USD: { usd: 1, usd_24h_change: 0 },
    };

    // Check price alerts in the background
    checkPriceAlerts(prices);

    return new Response(JSON.stringify({ prices, timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    const fallback = {
      NXA: { usd: NXA_BASE_PRICE, usd_24h_change: 2.45 },
      BTC: { usd: 65000, usd_24h_change: 1.2 },
      ETH: { usd: 3400, usd_24h_change: -0.5 },
      SOL: { usd: 145, usd_24h_change: 3.1 },
      USDT: { usd: 1, usd_24h_change: 0 },
      USDC: { usd: 1, usd_24h_change: 0 },
      USD: { usd: 1, usd_24h_change: 0 },
    };

    return new Response(JSON.stringify({ prices: fallback, timestamp: Date.now(), fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
