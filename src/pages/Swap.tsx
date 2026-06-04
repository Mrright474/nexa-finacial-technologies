import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, RefreshCw, TrendingUp, TrendingDown, Loader2, Info, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import nexaCoinImg from '@/assets/nexa-coin.png';
import { SwapHistory } from '@/components/swap/SwapHistory';

interface PriceData {
  usd: number;
  usd_24h_change: number;
}

const SUPPORTED_CURRENCIES = [
  { symbol: 'NXA', name: 'NexaCoin', icon: nexaCoinImg, type: 'crypto', color: 'from-primary to-purple-500' },
  { symbol: 'USD', name: 'US Dollar', icon: '💵', type: 'fiat', color: 'from-green-500 to-emerald-500' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', type: 'crypto', color: 'from-amber-500 to-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', type: 'crypto', color: 'from-indigo-500 to-purple-500' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', type: 'crypto', color: 'from-violet-500 to-fuchsia-500' },
  { symbol: 'USDT', name: 'Tether', icon: '₮', type: 'crypto', color: 'from-emerald-500 to-green-500' },
];

const SWAP_FEE_PERCENT = 0.5;

export default function Swap() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [fromCurrency, setFromCurrency] = useState('NXA');
  const [toCurrency, setToCurrency] = useState('USD');
  const [fromAmount, setFromAmount] = useState('');
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const fetchPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('crypto-prices');
      if (error) throw error;
      setPrices(data.prices);
    } catch {
      console.error('Failed to fetch prices');
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('wallets').select('currency, balance');
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((w) => (map[w.currency] = Number(w.balance)));
      setWallets(map);
    }
  }, [user]);

  useEffect(() => {
    fetchPrices();
    fetchWallets();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPrices, fetchWallets]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  const fromPrice = prices[fromCurrency]?.usd || 0;
  const toPrice = prices[toCurrency]?.usd || 0;
  const rate = toPrice > 0 ? fromPrice / toPrice : 0;
  const parsedFromAmount = parseFloat(fromAmount) || 0;
  const rawToAmount = parsedFromAmount * rate;
  const fee = rawToAmount * (SWAP_FEE_PERCENT / 100);
  const toAmount = rawToAmount - fee;
  const fromBalance = wallets[fromCurrency] || 0;

  const handleFlip = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount('');
  };

  const handleSwap = async () => {
    if (parsedFromAmount <= 0) return toast.error('Enter an amount');
    if (parsedFromAmount > fromBalance) return toast.error(`Insufficient ${fromCurrency} balance`);
    if (fromCurrency === toCurrency) return toast.error('Select different currencies');

    setSwapping(true);
    try {
      const description = `Swapped ${parsedFromAmount} ${fromCurrency} → ${toAmount.toFixed(4)} ${toCurrency}`;
      const { data: txId, error: swapErr } = await supabase.rpc('wallet_swap' as any, {
        p_from_currency: fromCurrency,
        p_to_currency: toCurrency,
        p_from_amount: parsedFromAmount,
        p_to_amount: toAmount,
        p_fee: fee * (toPrice || 1),
        p_description: description,
      });
      if (swapErr) throw swapErr;

      // Get burn rate from settings
      const { data: settingsData } = await supabase
        .from('nxa_settings' as any)
        .select('burn_rate_percent')
        .limit(1)
        .single();
      const BURN_RATE = (Number((settingsData as any)?.burn_rate_percent) || 10) / 100;
      let nxaBurnAmount = 0;
      const nxaPrice = prices['NXA']?.usd || 1;

      if (fromCurrency === 'NXA') {
        nxaBurnAmount = (fee * (toPrice || 1) / nxaPrice) * BURN_RATE;
      } else if (toCurrency === 'NXA') {
        nxaBurnAmount = fee * BURN_RATE;
      } else {
        nxaBurnAmount = (fee * (toPrice || 1) / nxaPrice) * BURN_RATE;
      }

      if (nxaBurnAmount > 0.000001) {
        await supabase.from('nxa_burn_log' as any).insert({
          user_id: user.id,
          amount: nxaBurnAmount,
          source: 'swap_fee',
          transaction_id: (txId as any) || null,
        });
      }


      toast.success(`Swapped ${parsedFromAmount} ${fromCurrency} → ${toAmount.toFixed(4)} ${toCurrency}`);
      setFromAmount('');
      fetchWallets();
    } catch (err: any) {
      toast.error(err.message || 'Swap failed');
      fetchWallets(); // Re-sync
    } finally {
      setSwapping(false);
    }
  };

  const CurrencyPicker = ({
    selected,
    onSelect,
    show,
    setShow,
    exclude,
  }: {
    selected: string;
    onSelect: (s: string) => void;
    show: boolean;
    setShow: (b: boolean) => void;
    exclude: string;
  }) => {
    const curr = SUPPORTED_CURRENCIES.find(c => c.symbol === selected)!;
    return (
      <div className="relative">
        <button
          onClick={() => { setShow(!show); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          {typeof curr.icon === 'string' && curr.icon.startsWith('/') || curr.icon.includes('assets') ? (
            <img src={curr.icon as string} alt={curr.symbol} className="w-6 h-6 rounded-full" />
          ) : (
            <span className="text-lg">{curr.icon}</span>
          )}
          <span className="font-semibold text-foreground">{curr.symbol}</span>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {show && (
          <div className="absolute top-full mt-2 left-0 w-56 glass-card p-2 animate-fade-in z-50">
            {SUPPORTED_CURRENCIES.filter(c => c.symbol !== exclude).map(c => (
              <button
                key={c.symbol}
                onClick={() => { onSelect(c.symbol); setShow(false); }}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left',
                  c.symbol === selected ? 'bg-primary/10' : 'hover:bg-secondary/50'
                )}
              >
                {typeof c.icon === 'string' && (c.icon.startsWith('/') || c.icon.includes('assets')) ? (
                  <img src={c.icon as string} alt={c.symbol} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className={cn('w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold', c.color)}>
                    {c.icon}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.symbol}</p>
                  <p className="text-xs text-muted-foreground">{c.name}</p>
                </div>
                {prices[c.symbol] && (
                  <span className="ml-auto text-xs text-muted-foreground">${prices[c.symbol].usd.toLocaleString()}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <img src={nexaCoinImg} alt="NXA" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Swap</h1>
              <p className="text-muted-foreground">Exchange NXA & crypto with live rates</p>
            </div>
          </div>
        </div>

        {/* Live Rates Ticker */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {Object.entries(prices).filter(([k]) => k !== 'USD' && k !== 'USDC').map(([symbol, p]) => (
            <div key={symbol} className="glass-card p-3 min-w-[120px] flex-shrink-0">
              <p className="text-xs text-muted-foreground">{symbol}</p>
              <p className="font-semibold text-foreground text-sm">${p.usd.toLocaleString()}</p>
              <p className={cn('text-xs font-medium', p.usd_24h_change >= 0 ? 'text-success' : 'text-destructive')}>
                {p.usd_24h_change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                {p.usd_24h_change?.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>

        {/* Swap Card */}
        <div className="glass-card p-6 space-y-4 animate-slide-up delay-100">
          {/* From */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You pay</span>
              <button className="text-xs text-primary hover:underline" onClick={() => setFromAmount(String(fromBalance))}>
                Balance: {fromBalance.toLocaleString()} {fromCurrency}
              </button>
            </div>
            <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3">
              <CurrencyPicker
                selected={fromCurrency}
                onSelect={(s) => { setFromCurrency(s); setShowToPicker(false); }}
                show={showFromPicker}
                setShow={(b) => { setShowFromPicker(b); setShowToPicker(false); }}
                exclude={toCurrency}
              />
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-right text-xl font-bold border-0 bg-transparent focus-visible:ring-0 flex-1"
              />
            </div>
            {fromAmount && fromPrice > 0 && (
              <p className="text-xs text-muted-foreground text-right">≈ ${(parsedFromAmount * fromPrice).toFixed(2)} USD</p>
            )}
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={handleFlip}
              className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:rotate-180 duration-300"
            >
              <ArrowDownUp className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You receive</span>
              <span className="text-xs text-muted-foreground">
                Balance: {(wallets[toCurrency] || 0).toLocaleString()} {toCurrency}
              </span>
            </div>
            <div className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3">
              <CurrencyPicker
                selected={toCurrency}
                onSelect={(s) => { setToCurrency(s); setShowFromPicker(false); }}
                show={showToPicker}
                setShow={(b) => { setShowToPicker(b); setShowFromPicker(false); }}
                exclude={fromCurrency}
              />
              <div className="text-right flex-1">
                <p className="text-xl font-bold text-foreground">
                  {toAmount > 0 ? toAmount.toFixed(4) : '0.00'}
                </p>
              </div>
            </div>
            {toAmount > 0 && toPrice > 0 && (
              <p className="text-xs text-muted-foreground text-right">≈ ${(toAmount * toPrice).toFixed(2)} USD</p>
            )}
          </div>

          {/* Swap Details */}
          {parsedFromAmount > 0 && rate > 0 && (
            <div className="bg-secondary/20 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" /> Rate</span>
                <span className="text-foreground font-medium">1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee ({SWAP_FEE_PERCENT}%)</span>
                <span className="text-foreground">{fee.toFixed(4)} {toCurrency}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">You receive</span>
                <span className="text-foreground font-bold">{toAmount.toFixed(4)} {toCurrency}</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 text-lg"
            onClick={handleSwap}
            disabled={swapping || parsedFromAmount <= 0 || parsedFromAmount > fromBalance || loadingPrices}
          >
            {swapping ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Swapping...</>
            ) : loadingPrices ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Loading rates...</>
            ) : (
              <>
                <ArrowDownUp className="w-5 h-5" /> Swap {fromCurrency} → {toCurrency}
              </>
            )}
          </Button>

          {/* Rate refresh indicator */}
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" /> Rates refresh every 30s •
            <button onClick={fetchPrices} className="text-primary hover:underline">Refresh now</button>
          </p>
        </div>

        {/* Swap History */}
        <div className="mt-6">
          <SwapHistory userId={user.id} />
        </div>
      </main>
    </div>
  );
}
