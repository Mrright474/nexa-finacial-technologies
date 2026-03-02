import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// NXA is pegged internally — 1 NXA = $8.50 base price with slight simulated volatility
const NXA_BASE_PRICE = 8.50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch live prices from CoinGecko (free, no API key)
    const ids = 'bitcoin,ethereum,solana,tether,usd-coin';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    // Add slight volatility to NXA price (±2%)
    const volatility = 1 + (Math.random() - 0.5) * 0.04;
    const nxaPrice = NXA_BASE_PRICE * volatility;
    const nxa24hChange = (Math.random() - 0.3) * 8; // Slightly bullish bias

    const prices: Record<string, { usd: number; usd_24h_change: number }> = {
      NXA: { usd: parseFloat(nxaPrice.toFixed(4)), usd_24h_change: parseFloat(nxa24hChange.toFixed(2)) },
      BTC: { usd: data.bitcoin?.usd ?? 0, usd_24h_change: data.bitcoin?.usd_24h_change ?? 0 },
      ETH: { usd: data.ethereum?.usd ?? 0, usd_24h_change: data.ethereum?.usd_24h_change ?? 0 },
      SOL: { usd: data.solana?.usd ?? 0, usd_24h_change: data.solana?.usd_24h_change ?? 0 },
      USDT: { usd: data.tether?.usd ?? 1, usd_24h_change: data.tether?.usd_24h_change ?? 0 },
      USDC: { usd: data['usd-coin']?.usd ?? 1, usd_24h_change: data['usd-coin']?.usd_24h_change ?? 0 },
      USD: { usd: 1, usd_24h_change: 0 },
    };

    return new Response(JSON.stringify({ prices, timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Fallback prices if CoinGecko is unavailable
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
