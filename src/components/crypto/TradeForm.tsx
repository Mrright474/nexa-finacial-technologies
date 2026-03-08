import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

export function TradeForm({ symbol, currentPrice }: TradeFormProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState(currentPrice.toString());

  const price = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || 0;
  const qty = parseFloat(amount) || 0;
  const total = qty * price;
  const fee = total * 0.001;

  const handleSubmit = () => {
    if (!qty || qty <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (orderType === 'limit' && (!price || price <= 0)) {
      toast.error('Enter a valid limit price');
      return;
    }
    toast.success(
      `${side === 'buy' ? 'Buy' : 'Sell'} ${orderType} order placed`,
      { description: `${qty} ${symbol} @ $${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
    );
    setAmount('');
  };

  const percentages = [25, 50, 75, 100];

  return (
    <div className="glass-card p-5 animate-slide-up">
      <h3 className="text-lg font-bold text-foreground mb-4">Trade {symbol}</h3>

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

      {/* Quick percentages */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {percentages.map((p) => (
          <Button
            key={p}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setAmount(((p / 100) * 1000 / price).toFixed(6))}
          >
            {p}%
          </Button>
        ))}
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
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </Button>
    </div>
  );
}
