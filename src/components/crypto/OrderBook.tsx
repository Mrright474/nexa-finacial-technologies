import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OrderBookProps {
  symbol: string;
  currentPrice: number;
}

function generateOrders(basePrice: number, side: 'ask' | 'bid', count = 12) {
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const offset = (i * 0.001 + Math.random() * 0.002) * basePrice;
    const price = side === 'ask' ? basePrice + offset : basePrice - offset;
    const amount = +(Math.random() * 5 + 0.01).toFixed(4);
    orders.push({ price: +price.toFixed(price > 100 ? 2 : price > 1 ? 4 : 6), amount, total: +(price * amount).toFixed(2) });
  }
  return side === 'ask' ? orders.reverse() : orders;
}

export function OrderBook({ symbol, currentPrice }: OrderBookProps) {
  const asks = useMemo(() => generateOrders(currentPrice, 'ask'), [currentPrice]);
  const bids = useMemo(() => generateOrders(currentPrice, 'bid'), [currentPrice]);
  const maxTotal = Math.max(...asks.map(o => o.total), ...bids.map(o => o.total));

  const renderRow = (order: { price: number; amount: number; total: number }, side: 'ask' | 'bid') => {
    const barWidth = (order.total / maxTotal) * 100;
    return (
      <div key={`${side}-${order.price}`} className="relative grid grid-cols-3 text-xs font-mono py-1 px-3 hover:bg-secondary/30 transition-colors">
        <div
          className={cn('absolute inset-y-0 right-0 opacity-10', side === 'ask' ? 'bg-destructive' : 'bg-success')}
          style={{ width: `${barWidth}%` }}
        />
        <span className={cn('relative z-10', side === 'ask' ? 'text-destructive' : 'text-success')}>
          {order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
        <span className="relative z-10 text-right text-foreground">{order.amount}</span>
        <span className="relative z-10 text-right text-muted-foreground">${order.total.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground p-3 border-b border-border">
        <span>Price (USD)</span>
        <span className="text-right">Amount ({symbol})</span>
        <span className="text-right">Total</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {asks.map(o => renderRow(o, 'ask'))}
      </div>
      <div className="text-center py-2 border-y border-border bg-secondary/20">
        <span className="text-sm font-bold text-foreground">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className="text-xs text-muted-foreground ml-2">Spread</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {bids.map(o => renderRow(o, 'bid'))}
      </div>
    </div>
  );
}
