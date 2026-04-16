import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-wallet-address, x-wallet-signature, x-wallet-message",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ─── Helpers ───

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Auth: API Key or Wallet Signature ───

interface AuthResult {
  userId: string;
  permissions: string[];
  method: "api_key" | "wallet" | "bearer";
}

async function authenticate(req: Request): Promise<AuthResult | Response> {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Check X-API-Key header
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey) {
    const keyHash = await hashKey(apiKey);
    const { data, error } = await supabaseAdmin
      .from("web3_api_keys")
      .select("user_id, permissions, is_active")
      .eq("key_hash", keyHash)
      .single();

    if (error || !data || !data.is_active) {
      return errorResponse("Invalid or inactive API key", 401);
    }

    // Update last_used_at
    await supabaseAdmin
      .from("web3_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash);

    return {
      userId: data.user_id,
      permissions: data.permissions as string[],
      method: "api_key",
    };
  }

  // 2. Check wallet signature (X-Wallet-Address + X-Wallet-Signature + X-Wallet-Message)
  const walletAddress = req.headers.get("X-Wallet-Address");
  const walletSig = req.headers.get("X-Wallet-Signature");
  const walletMsg = req.headers.get("X-Wallet-Message");

  if (walletAddress && walletSig && walletMsg) {
    // Verify the message contains a recent timestamp (within 5 minutes)
    const timestampMatch = walletMsg.match(/timestamp:(\d+)/);
    if (!timestampMatch) {
      return errorResponse("Message must contain timestamp:UNIX_SECONDS", 400);
    }
    const msgTimestamp = parseInt(timestampMatch[1]);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - msgTimestamp) > 300) {
      return errorResponse("Signature expired (>5 minutes)", 401);
    }

    // Look up user by linked wallet address
    const { data: existingWallet } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("wallet_address", walletAddress)
      .single();

    if (!existingWallet) {
      return errorResponse(
        "Wallet not linked to any account. Link your wallet address in your Profile settings first.",
        403
      );
    }

    return {
      userId: existingWallet.user_id,
      permissions: ["read", "trade", "burn"],
      method: "wallet",
    };
  }

  // 3. Check standard Bearer token
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await supabaseUser.auth.getUser(token);
    if (error || !data?.user) {
      return errorResponse("Invalid bearer token", 401);
    }
    return {
      userId: data.user.id,
      permissions: ["read", "trade", "burn", "transfer"],
      method: "bearer",
    };
  }

  return errorResponse("Authentication required. Provide X-API-Key, wallet signature headers, or Bearer token.", 401);
}

function hasPermission(auth: AuthResult, perm: string): boolean {
  return auth.permissions.includes(perm);
}

// ─── Route Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/nxa-web3-api/, "").replace(/\/$/, "") || "/";

  // Public endpoints (no auth needed)
  if (req.method === "GET" && path === "/health") {
    return jsonResponse({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
  }

  if (req.method === "GET" && path === "/price") {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: metrics } = await supabaseAdmin.rpc("compute_nxa_metrics");
    const { data: latestPrice } = await supabaseAdmin
      .from("nxa_price_history")
      .select("price, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return jsonResponse({
      price: latestPrice?.price || null,
      price_updated_at: latestPrice?.created_at || null,
      metrics: metrics?.[0] || null,
    });
  }

  if (req.method === "GET" && path === "/supply") {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabaseAdmin.rpc("compute_nxa_metrics");
    const m = data?.[0];
    return jsonResponse({
      max_supply: 1_000_000_000,
      total_supply: m?.total_supply || 0,
      circulating_supply: m?.circulating_supply || 0,
      total_staked: m?.total_staked || 0,
      total_collateral: m?.total_collateral || 0,
      total_burned: m?.total_burned || 0,
      demand_score: m?.demand_score || 0,
      supply_pressure: m?.supply_pressure || 0,
    });
  }

  if (req.method === "GET" && path === "/leaderboard") {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const { data } = await supabaseAdmin.rpc("get_burn_leaderboard", {
      p_limit: Math.min(Math.max(limit, 1), 100),
    });
    return jsonResponse({ leaderboard: data || [] });
  }

  // ─── Authenticated endpoints ───
  const authResult = await authenticate(req);
  if (authResult instanceof Response) return authResult;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // GET /balance — user's NXA wallet balance
  if (req.method === "GET" && path === "/balance") {
    if (!hasPermission(authResult, "read")) return errorResponse("Permission denied", 403);

    const { data } = await supabaseAdmin
      .from("wallets")
      .select("balance, updated_at")
      .eq("user_id", authResult.userId)
      .eq("currency", "NXA")
      .single();

    return jsonResponse({ balance: data?.balance || 0, updated_at: data?.updated_at });
  }

  // GET /burns — user's burn history
  if (req.method === "GET" && path === "/burns") {
    if (!hasPermission(authResult, "read")) return errorResponse("Permission denied", 403);

    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const { data } = await supabaseAdmin
      .from("nxa_burn_log")
      .select("id, amount, source, created_at, transaction_id")
      .eq("user_id", authResult.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return jsonResponse({ burns: data || [] });
  }

  // POST /trade — record an external trade and apply burn
  if (req.method === "POST" && path === "/trade") {
    if (!hasPermission(authResult, "trade")) return errorResponse("Permission denied", 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const amount = Number(body.amount);
    const tradeType = String(body.type || "swap");
    const fromCurrency = String(body.from_currency || "NXA");
    const toCurrency = String(body.to_currency || "USD");

    if (!amount || amount <= 0) return errorResponse("amount must be a positive number", 400);
    if (amount > 1_000_000_000) return errorResponse("amount exceeds maximum", 400);

    // Calculate fee & burn
    const feeRate = tradeType === "swap" ? 0.005 : 0.001;
    const fee = amount * feeRate;

    // Get burn rate from settings
    const { data: settings } = await supabaseAdmin
      .from("nxa_settings")
      .select("burn_rate_percent")
      .limit(1)
      .single();
    const burnRatePercent = Number(settings?.burn_rate_percent) || 10;
    const burnAmount = fee * (burnRatePercent / 100);

    // Record transaction
    const { data: txData, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: authResult.userId,
        amount,
        currency: fromCurrency,
        transaction_type: tradeType,
        fee,
        status: "completed",
        description: `Web3 ${tradeType}: ${fromCurrency} → ${toCurrency}`,
      })
      .select("id")
      .single();

    if (txError) return errorResponse("Failed to record transaction: " + txError.message, 500);

    // Record burn
    let burnId: string | null = null;
    if (burnAmount > 0.000001) {
      const { data: burnData } = await supabaseAdmin
        .from("nxa_burn_log")
        .insert({
          user_id: authResult.userId,
          amount: burnAmount,
          source: `web3_${tradeType}_fee`,
          transaction_id: txData?.id,
        })
        .select("id")
        .single();
      burnId = burnData?.id || null;
    }

    return jsonResponse({
      transaction_id: txData?.id,
      amount,
      fee,
      burn_amount: burnAmount,
      burn_id: burnId,
      burn_rate_percent: burnRatePercent,
      type: tradeType,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });
  }

  // POST /burn — manually burn NXA
  if (req.method === "POST" && path === "/burn") {
    if (!hasPermission(authResult, "burn")) return errorResponse("Permission denied", 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const amount = Number(body.amount);
    if (!amount || amount <= 0) return errorResponse("amount must be a positive number", 400);
    if (amount > 1_000_000) return errorResponse("amount exceeds maximum single burn", 400);

    // Verify user has sufficient balance
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", authResult.userId)
      .eq("currency", "NXA")
      .single();

    if (!wallet || wallet.balance < amount) {
      return errorResponse("Insufficient NXA balance", 400);
    }

    // Deduct from wallet
    const { error: walletError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: wallet.balance - amount })
      .eq("user_id", authResult.userId)
      .eq("currency", "NXA");

    if (walletError) return errorResponse("Failed to deduct balance", 500);

    // Record burn
    const { data: burnData, error: burnError } = await supabaseAdmin
      .from("nxa_burn_log")
      .insert({
        user_id: authResult.userId,
        amount,
        source: "web3_manual_burn",
      })
      .select("id")
      .single();

    if (burnError) return errorResponse("Failed to record burn: " + burnError.message, 500);

    return jsonResponse({
      burn_id: burnData?.id,
      amount,
      remaining_balance: wallet.balance - amount,
    });
  }

  // POST /transfer — transfer NXA between users
  if (req.method === "POST" && path === "/transfer") {
    if (!hasPermission(authResult, "transfer")) return errorResponse("Permission denied", 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const amount = Number(body.amount);
    const recipientId = String(body.recipient_id || "");
    if (!amount || amount <= 0) return errorResponse("amount must be positive", 400);
    if (!recipientId) return errorResponse("recipient_id is required", 400);

    // Check sender balance
    const { data: senderWallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", authResult.userId)
      .eq("currency", "NXA")
      .single();

    if (!senderWallet || senderWallet.balance < amount) {
      return errorResponse("Insufficient NXA balance", 400);
    }

    // Check recipient exists
    const { data: recipientWallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", recipientId)
      .eq("currency", "NXA")
      .single();

    if (!recipientWallet) return errorResponse("Recipient not found", 404);

    // Execute transfer
    await supabaseAdmin
      .from("wallets")
      .update({ balance: senderWallet.balance - amount })
      .eq("user_id", authResult.userId)
      .eq("currency", "NXA");

    await supabaseAdmin
      .from("wallets")
      .update({ balance: recipientWallet.balance + amount })
      .eq("user_id", recipientId)
      .eq("currency", "NXA");

    // Record transactions
    const { data: txData } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: authResult.userId,
        amount,
        currency: "NXA",
        transaction_type: "send",
        status: "completed",
        recipient_id: recipientId,
        description: "Web3 NXA transfer",
      })
      .select("id")
      .single();

    return jsonResponse({
      transaction_id: txData?.id,
      amount,
      recipient_id: recipientId,
      sender_remaining: senderWallet.balance - amount,
    });
  }

  return errorResponse(`Unknown endpoint: ${req.method} ${path}`, 404);
});
