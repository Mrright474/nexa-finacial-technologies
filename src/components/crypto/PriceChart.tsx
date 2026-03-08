import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

interface PriceChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
}

function generateHistoricalData(basePrice: number, range: TimeRange) {
  const points: { date: string; price: number }[] = [];
  let count: number;
  let volatility: number;

  switch (range) {
    case '1D': count = 24; volatility = 0.005; break;
    case '1W': count = 7; volatility = 0.02; break;
    case '1M': count = 30; volatility = 0.04; break;
    case '3M': count = 90; volatility = 0.06; break;
    case '1Y': count = 52; volatility = 0.1; break;
  }

  let price = basePrice * (1 - volatility * 2);
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now);
    if (range === '1D') d.setHours(d.getHours() - i);
    else if (range === '1W') d.setDate(d.getDate() - i);
    else if (range === '1M') d.setDate(d.getDate() - i);
    else if (range === '3M') d.setDate(d.getDate() - i);
    else d.setDate(d.getDate() - i * 7);

    const change = (Math.random() - 0.45) * volatility * basePrice;
    price = Math.max(price + change, basePrice * 0.5);

    const label = range === '1D'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    points.push({ date: label, price: +price.toFixed(2) });
  }

  // Ensure last point matches current price
  points[points.length - 1].price = basePrice;
  return points;
}

export function PriceChart({ symbol, name, currentPrice, change24h }: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>('1M');
  const [data] = useState(() => {
    const cache: Record<TimeRange, ReturnType<typeof generateHistoricalData>> = {} as any;
    for (const r of TIME_RANGES) cache[r] = generateHistoricalData(currentPrice, r);
    return cache;
  });

  const chartData = data[range];
  const isPositive = change24h >= 0;
  const strokeColor = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            {name} <span className="text-muted-foreground font-normal text-sm">({symbol})</span>
          </CardTitle>
          <p className="text-2xl font-bold text-foreground mt-1">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className={cn('text-sm ml-2 font-medium', isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? '+' : ''}{change24h}%
            </span>
          </p>
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2.5 text-xs', range === r && 'bg-primary text-primary-foreground')}
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(2)}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#gradient-${symbol})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
