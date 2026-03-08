import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TradeHistoryProps {
  symbol: string;
  currentPrice: number;
}

function generateTrades(basePrice: number, count = 30) {
  const trades = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const offset = (Math.random() * 0.004 - 0.002) * basePrice;
    const price = +(basePrice + offset).toFixed(basePrice > 100 ? 2 : basePrice > 1 ? 4 : 6);
    const amount = +(Math.random() * 3 + 0.001).toFixed(4);
    const time = new Date(now - i * (Math.random() * 60000 + 5000));
    trades.push({ price, amount, total: +(price * amount).toFixed(2), side, time });
  }
  return trades;
}

export function TradeHistory({ symbol, currentPrice }: TradeHistoryProps) {
  const trades = useMemo(() => generateTrades(currentPrice), [currentPrice]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground p-3 border-b border-border">
        <span>Price (USD)</span>
        <span className="text-right">Amount ({symbol})</span>
        <span className="text-right">Total</span>
        <span className="text-right">Time</span>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        {trades.map((t, i) => (
          <div key={i} className="grid grid-cols-4 text-xs font-mono py-1.5 px-3 hover:bg-secondary/30 transition-colors">
            <span className={cn(t.side === 'buy' ? 'text-success' : 'text-destructive')}>
              {t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-right text-foreground">{t.amount}</span>
            <span className="text-right text-muted-foreground">${t.total.toLocaleString()}</span>
            <span className="text-right text-muted-foreground">
              {t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
