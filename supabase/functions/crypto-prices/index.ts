import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// NXA Tokenomics Constants
const NXA_BASE_PRICE = 8.50;        // Genesis price
const NXA_MAX_SUPPLY = 1_000_000_000; // 1B tokens
const PRICE_SMOOTHING = 0.15;        // Max % move per tick to prevent wild swings

interface NxaMetrics {
  total_supply: number;
  circulating_supply: number;
  total_staked: number;
  total_collateral: number;
  tx_volume_24h: number;
  active_users_24h: number;
  demand_score: number;
  supply_pressure: number;
}

/**
 * Compute NXA price from real supply/demand metrics.
 * 
 * Formula:
 *   price = base_price * scarcity_multiplier * demand_multiplier * activity_bonus
 * 
 * Scarcity: As more NXA is staked/locked, circulating supply drops → price rises
 * Demand: High demand score (staking + collateral + activity) → price rises  
 * Activity: Transaction volume and user count provide a small bonus
 */
function computeNxaPrice(metrics: NxaMetrics, lastPrice: number | null, totalBurned: number): { price: number; change24h: number } {
  const { total_supply, circulating_supply, total_staked, total_collateral, demand_score, supply_pressure, tx_volume_24h, active_users_24h } = metrics;

  // 1. Scarcity multiplier: less circulating = higher price
  // If 50% is locked, multiplier = 1.5. If 0% locked, multiplier = 1.0
  const lockedRatio = total_supply > 0 
    ? (total_staked + total_collateral) / total_supply 
    : 0;
  const scarcityMultiplier = 1 + (lockedRatio * 1.5); // Range: 1.0 - 2.5

  // 2. Demand multiplier based on demand_score (0-100)
  // At 50 demand = 1.0x, at 100 = 1.25x, at 0 = 0.85x
  const demandMultiplier = 0.85 + (Number(demand_score) / 100) * 0.40; // Range: 0.85 - 1.25

  // 3. Activity bonus: small upward pressure from active usage
  const volumeBonus = Math.min(tx_volume_24h / 10000, 0.05); // Up to 5% from volume
  const userBonus = Math.min(active_users_24h * 0.005, 0.03);  // Up to 3% from users
  const activityMultiplier = 1 + volumeBonus + userBonus; // Range: 1.0 - 1.08

  // 4. Supply dilution factor: total minted vs max supply
  // More tokens minted = slight downward pressure
  const dilutionFactor = 1 - (total_supply / NXA_MAX_SUPPLY) * 0.1; // Range: 0.9 - 1.0

  // 4b. Burn bonus: burned tokens permanently reduce supply, adding upward pressure
  const burnRatio = totalBurned / Math.max(total_supply, 1);
  const burnMultiplier = 1 + Math.min(burnRatio * 2, 0.15); // Up to 15% bonus from burns

  // 5. Market micro-volatility (small realistic noise)
  const noise = 1 + (Math.random() - 0.5) * 0.01; // ±0.5%

  // Compute raw price
  let rawPrice = NXA_BASE_PRICE * scarcityMultiplier * demandMultiplier * activityMultiplier * dilutionFactor * burnMultiplier * noise;

  // 6. Smooth against last known price to prevent wild jumps
  if (lastPrice && lastPrice > 0) {
    const maxChange = lastPrice * PRICE_SMOOTHING;
    const diff = rawPrice - lastPrice;
    if (Math.abs(diff) > maxChange) {
      rawPrice = lastPrice + Math.sign(diff) * maxChange;
    }
  }

  // Floor price at $0.01
  rawPrice = Math.max(rawPrice, 0.01);

  // Calculate 24h change
  const referencePrice = lastPrice || NXA_BASE_PRICE;
  const change24h = ((rawPrice - referencePrice) / referencePrice) * 100;

  return {
    price: parseFloat(rawPrice.toFixed(4)),
    change24h: parseFloat(change24h.toFixed(2)),
  };
}

async function getLastNxaPrice(supabase: ReturnType<typeof createClient>): Promise<number | null> {
  const { data } = await supabase
    .from('nxa_price_history')
    .select('price')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data?.price ? Number(data.price) : null;
}

async function recordPriceHistory(
  supabase: ReturnType<typeof createClient>,
  price: number,
  metrics: NxaMetrics
) {
  await supabase.from('nxa_price_history').insert({
    price,
    total_supply: metrics.total_supply,
    circulating_supply: metrics.circulating_supply,
    total_staked: metrics.total_staked,
    total_collateral: metrics.total_collateral,
    transaction_volume_24h: metrics.tx_volume_24h,
    active_users_24h: metrics.active_users_24h,
    demand_score: metrics.demand_score,
    supply_pressure: metrics.supply_pressure,
  });
}

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch external crypto prices and NXA metrics in parallel
    const [coingeckoRes, metricsRes, lastPrice] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,usd-coin&vs_currencies=usd&include_24hr_change=true`
      ),
      supabase.rpc('compute_nxa_metrics'),
      getLastNxaPrice(supabase),
    ]);

    // Parse CoinGecko data
    let data: Record<string, any> = {};
    if (coingeckoRes.ok) {
      data = await coingeckoRes.json();
    } else {
      console.error('CoinGecko API error:', coingeckoRes.status);
    }

    // Compute NXA price from real metrics
    const metrics: NxaMetrics = metricsRes.data?.[0] || {
      total_supply: 0, circulating_supply: 0, total_staked: 0,
      total_collateral: 0, tx_volume_24h: 0, active_users_24h: 0,
      demand_score: 50, supply_pressure: 100,
    };

    const totalBurned = (metricsRes.data?.[0] as any)?.total_burned ?? 0;
    const nxa = computeNxaPrice(metrics, lastPrice, totalBurned);

    // Record price snapshot in background (don't block response)
    recordPriceHistory(supabase, nxa.price, metrics).catch(e => 
      console.error('Failed to record price history:', e)
    );

    const prices: Record<string, { usd: number; usd_24h_change: number }> = {
      NXA: { usd: nxa.price, usd_24h_change: nxa.change24h },
      BTC: { usd: data.bitcoin?.usd ?? 0, usd_24h_change: data.bitcoin?.usd_24h_change ?? 0 },
      ETH: { usd: data.ethereum?.usd ?? 0, usd_24h_change: data.ethereum?.usd_24h_change ?? 0 },
      SOL: { usd: data.solana?.usd ?? 0, usd_24h_change: data.solana?.usd_24h_change ?? 0 },
      USDT: { usd: data.tether?.usd ?? 1, usd_24h_change: data.tether?.usd_24h_change ?? 0 },
      USDC: { usd: data['usd-coin']?.usd ?? 1, usd_24h_change: data['usd-coin']?.usd_24h_change ?? 0 },
      USD: { usd: 1, usd_24h_change: 0 },
    };

    // Check price alerts in the background
    checkPriceAlerts(prices);

    return new Response(JSON.stringify({ 
      prices, 
      timestamp: Date.now(),
      nxa_metrics: {
        total_supply: metrics.total_supply,
        circulating_supply: metrics.circulating_supply,
        total_staked: metrics.total_staked,
        total_collateral: metrics.total_collateral,
        demand_score: metrics.demand_score,
        supply_pressure: metrics.supply_pressure,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching prices:', error);

    const fallback = {
      NXA: { usd: NXA_BASE_PRICE, usd_24h_change: 0 },
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
