import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';

interface TradeFormProps {
  symbol: string;
  currentPrice: number;
  onTradeComplete?: () => void;
}

export function TradeForm({ symbol, currentPrice, onTradeComplete }: TradeFormProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState(currentPrice.toString());
  const [submitting, setSubmitting] = useState(false);
  const [usdBalance, setUsdBalance] = useState(0);
  const [cryptoBalance, setCryptoBalance] = useState(0);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const { deposit, withdraw, fetchWallets } = useWallet();
  const { user } = useAuth();

  // Fetch real wallet balances
  useEffect(() => {
    if (!user) return;
    setBalancesLoading(true);
    fetchWallets().then((wallets) => {
      const usd = wallets.find(w => w.currency === 'USD');
      const crypto = wallets.find(w => w.currency === symbol);
      setUsdBalance(Number(usd?.balance ?? 0));
      setCryptoBalance(Number(crypto?.balance ?? 0));
    }).finally(() => setBalancesLoading(false));
  }, [user, symbol]);

  const refreshBalances = async () => {
    const wallets = await fetchWallets();
    const usd = wallets.find(w => w.currency === 'USD');
    const crypto = wallets.find(w => w.currency === symbol);
    setUsdBalance(Number(usd?.balance ?? 0));
    setCryptoBalance(Number(crypto?.balance ?? 0));
  };

  const price = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || 0;
  const qty = parseFloat(amount) || 0;
  const total = qty * price;
  const fee = total * 0.001;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to trade');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (orderType === 'limit' && (!price || price <= 0)) {
      toast.error('Enter a valid limit price');
      return;
    }

    setSubmitting(true);
    try {
      if (side === 'buy') {
        // Withdraw USD to pay, then deposit crypto
        const usdCost = total + fee;
        const withdrew = await withdraw('USD', usdCost);
        if (!withdrew) {
          setSubmitting(false);
          return;
        }
        await deposit(symbol, qty);
      } else {
        // Withdraw crypto, then deposit USD proceeds
        const withdrew = await withdraw(symbol, qty);
        if (!withdrew) {
          setSubmitting(false);
          return;
        }
        const usdProceeds = total - fee;
        await deposit('USD', usdProceeds);
      }

      toast.success(
        `${side === 'buy' ? 'Buy' : 'Sell'} ${orderType} order executed`,
        { description: `${qty} ${symbol} @ $${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
      );

      // Burn 10% of the trade fee in NXA terms
      const BURN_RATE = 0.10;
      let nxaBurnAmount = 0;
      if (symbol === 'NXA') {
        // Fee is in USD; convert to NXA
        nxaBurnAmount = (fee / price) * BURN_RATE;
      } else {
        // Non-NXA trade: burn equivalent NXA value (assume NXA ~= currentPrice placeholder)
        nxaBurnAmount = (fee / 8.5) * BURN_RATE; // approximate NXA price
      }

      if (nxaBurnAmount > 0.000001 && user) {
        await supabase.from('nxa_burn_log' as any).insert({
          user_id: user.id,
          amount: nxaBurnAmount,
          source: 'trade_fee',
        });
      }

      setAmount('');
      await refreshBalances();
      onTradeComplete?.();
    } catch (err: any) {
      toast.error('Trade failed', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const percentages = [25, 50, 75, 100];

  return (
    <div className="glass-card p-5 animate-slide-up">
      <h3 className="text-lg font-bold text-foreground mb-4">Trade {symbol}</h3>

      {/* Available balance */}
      <div className="flex justify-between items-center mb-4 p-2.5 rounded-lg bg-muted/50 text-sm">
        <span className="text-muted-foreground">Available</span>
        {balancesLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className="font-medium text-foreground">
            {side === 'buy'
              ? `$${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : `${cryptoBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`}
          </span>
        )}
      </div>

      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant={side === 'buy' ? 'default' : 'outline'}
          className={cn(side === 'buy' && 'bg-success hover:bg-success/90 shadow-success/25')}
          onClick={() => setSide('buy')}
        >
          Buy
        </Button>
        <Button
          variant={side === 'sell' ? 'default' : 'outline'}
          className={cn(side === 'sell' && 'bg-destructive hover:bg-destructive/90 shadow-destructive/25')}
          onClick={() => setSide('sell')}
        >
          Sell
        </Button>
      </div>

      {/* Order type */}
      <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')} className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="market" id="market" />
          <Label htmlFor="market" className="cursor-pointer text-sm text-muted-foreground">Market</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="limit" id="limit" />
          <Label htmlFor="limit" className="cursor-pointer text-sm text-muted-foreground">Limit</Label>
        </div>
      </RadioGroup>

      {/* Limit price */}
      {orderType === 'limit' && (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Price (USD)</Label>
          <Input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0.00"
            step="any"
          />
        </div>
      )}

      {/* Amount */}
      <div className="mb-3">
        <Label className="text-xs text-muted-foreground mb-1.5 block">Amount ({symbol})</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="any"
        />
      </div>

      {/* Quick percentages based on real balance */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {percentages.map((p) => {
          const maxQty = side === 'buy'
            ? (usdBalance * (p / 100)) / (price * 1.001) // account for fee
            : cryptoBalance * (p / 100);
          return (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAmount(maxQty > 0 ? maxQty.toFixed(6) : '0')}
            >
              {p}%
            </Button>
          );
        })}
        
      </div>

      {/* Summary */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Price</span>
          <span className="text-foreground">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Fee (0.1%)</span>
          <span className="text-foreground">${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2">
          <span>Total</span>
          <span>${(total + fee).toFixed(2)}</span>
        </div>
      </div>

      <Button
        className={cn(
          'w-full',
          side === 'buy'
            ? 'bg-success hover:bg-success/90 text-white shadow-success/25'
            : 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/25'
        )}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
      </Button>
    </div>
  );
}
