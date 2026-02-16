import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, BarChart3, CandlestickChart,
  Clock, Wallet, ArrowUpDown, Activity, Eye, ChevronUp, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

// Generate fake candlestick data
const generateCandleData = (base: number, count: number) => {
  const data = [];
  let price = base;
  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * base * 0.02;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * base * 0.01;
    const low = Math.min(open, close) - Math.random() * base * 0.01;
    price = close;
    data.push({ open, close, high, low, time: i });
  }
  return data;
};

const tradingPairs = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 63245.80, change: 2.34, type: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 1950.42, change: -1.23, type: 'crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: 148.25, change: 5.67, type: 'crypto' },
  { symbol: 'BNB/USD', name: 'BNB', price: 245.30, change: 0.87, type: 'crypto' },
  { symbol: 'XRP/USD', name: 'XRP', price: 0.52, change: -0.45, type: 'crypto' },
  { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0842, change: 0.12, type: 'forex' },
  { symbol: 'GBP/USD', name: 'Pound/Dollar', price: 1.2651, change: -0.08, type: 'forex' },
  { symbol: 'USD/JPY', name: 'Dollar/Yen', price: 156.42, change: 0.34, type: 'forex' },
  { symbol: 'AUD/USD', name: 'Aussie/Dollar', price: 0.6534, change: -0.21, type: 'forex' },
  { symbol: 'USD/UGX', name: 'Dollar/Shilling', price: 3750.00, change: 0.05, type: 'forex' },
];

const indicators = ['RSI', 'MACD', 'Bollinger', 'EMA', 'SMA', 'Volume'];

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

export default function Trading() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [practiceMode, setPracticeMode] = useState(true);
  const [practiceBalance, setPracticeBalance] = useState(10000);
  const [marketFilter, setMarketFilter] = useState<'all' | 'crypto' | 'forex'>('all');

  const candleData = useMemo(() => generateCandleData(selectedPair.price, 60), [selectedPair.symbol]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const toggleIndicator = (ind: string) => {
    setActiveIndicators(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  const handleTrade = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (practiceMode) {
      const cost = amountNum * selectedPair.price;
      if (side === 'buy' && cost > practiceBalance) {
        toast.error('Insufficient practice balance');
        return;
      }
      setPracticeBalance(prev => side === 'buy' ? prev - cost : prev + cost);
    }

    toast.success(
      `${practiceMode ? '[PRACTICE] ' : ''}${side.toUpperCase()} ${amountNum} ${selectedPair.symbol} at $${selectedPair.price.toLocaleString()}`,
    );
    setAmount('');
  };

  const filteredPairs = tradingPairs.filter(p => marketFilter === 'all' || p.type === marketFilter);

  // Chart rendering with SVG candlesticks
  const chartWidth = 800;
  const chartHeight = 300;
  const candleWidth = chartWidth / candleData.length * 0.7;
  const allPrices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  const scaleY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 20) - 10;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading</h1>
            <p className="text-muted-foreground mt-1">Crypto & Forex trading platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                practiceMode
                  ? 'bg-warning/20 text-warning border border-warning/30'
                  : 'bg-success/20 text-success border border-success/30'
              )}
            >
              <Eye className="w-4 h-4" />
              {practiceMode ? 'Practice Mode' : 'Live Trading'}
            </button>
            {practiceMode && (
              <div className="glass-card px-4 py-2">
                <p className="text-xs text-muted-foreground">Practice Balance</p>
                <p className="font-bold text-foreground">${practiceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid xl:grid-cols-4 gap-6">
          {/* Market Watchlist */}
          <div className="xl:col-span-1 animate-slide-up">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Watchlist</h3>
              </div>
              <div className="flex gap-1 mb-3">
                {(['all', 'crypto', 'forex'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMarketFilter(f)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                      marketFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredPairs.map(pair => (
                  <button
                    key={pair.symbol}
                    onClick={() => setSelectedPair(pair)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl transition-all text-left',
                      selectedPair.symbol === pair.symbol ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/50'
                    )}
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{pair.symbol}</p>
                      <p className="text-xs text-muted-foreground">{pair.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-foreground">${pair.price.toLocaleString()}</p>
                      <p className={cn('text-xs', pair.change >= 0 ? 'text-success' : 'text-destructive')}>
                        {pair.change >= 0 ? '+' : ''}{pair.change}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="xl:col-span-2 space-y-4 animate-slide-up delay-100">
            {/* Pair Info */}
            <div className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedPair.symbol}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPair.name}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground font-mono">
                    ${selectedPair.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className={cn('text-sm font-medium', selectedPair.change >= 0 ? 'text-success' : 'text-destructive')}>
                    {selectedPair.change >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                    {selectedPair.change >= 0 ? '+' : ''}{selectedPair.change}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div><span className="block">24h High</span><span className="text-foreground font-medium">${(selectedPair.price * 1.03).toLocaleString()}</span></div>
                <div><span className="block">24h Low</span><span className="text-foreground font-medium">${(selectedPair.price * 0.97).toLocaleString()}</span></div>
                <div><span className="block">Volume</span><span className="text-foreground font-medium">$1.2B</span></div>
              </div>
            </div>

            {/* Timeframe & Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {timeframes.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selectedTimeframe === tf ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {indicators.map(ind => (
                  <button
                    key={ind}
                    onClick={() => toggleIndicator(ind)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      activeIndicators.includes(ind) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Candlestick Chart */}
            <div className="glass-card p-4 overflow-hidden">
              <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => {
                  const y = (chartHeight / 4) * i;
                  const price = maxPrice - (priceRange / 4) * i;
                  return (
                    <g key={i}>
                      <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="hsl(222 47% 16%)" strokeWidth={1} />
                      <text x={chartWidth - 5} y={y + 12} fill="hsl(215 20% 55%)" fontSize={10} textAnchor="end">
                        ${price.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                {/* Candles */}
                {candleData.map((candle, i) => {
                  const x = (chartWidth / candleData.length) * i + candleWidth * 0.2;
                  const isGreen = candle.close >= candle.open;
                  const color = isGreen ? 'hsl(142 76% 45%)' : 'hsl(0 84% 60%)';
                  const bodyTop = scaleY(Math.max(candle.open, candle.close));
                  const bodyBottom = scaleY(Math.min(candle.open, candle.close));
                  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

                  return (
                    <g key={i}>
                      {/* Wick */}
                      <line
                        x1={x + candleWidth / 2}
                        y1={scaleY(candle.high)}
                        x2={x + candleWidth / 2}
                        y2={scaleY(candle.low)}
                        stroke={color}
                        strokeWidth={1}
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={isGreen ? color : color}
                        rx={1}
                      />
                    </g>
                  );
                })}
                {/* RSI indicator line if active */}
                {activeIndicators.includes('EMA') && (
                  <polyline
                    fill="none"
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={1.5}
                    opacity={0.7}
                    points={candleData
                      .map((c, i) => {
                        const avg = candleData.slice(Math.max(0, i - 10), i + 1).reduce((s, d) => s + d.close, 0) / Math.min(i + 1, 11);
                        return `${(chartWidth / candleData.length) * i + candleWidth / 2},${scaleY(avg)}`;
                      })
                      .join(' ')}
                  />
                )}
                {activeIndicators.includes('Bollinger') && (
                  <>
                    <polyline
                      fill="none"
                      stroke="hsl(38 92% 55%)"
                      strokeWidth={1}
                      opacity={0.5}
                      strokeDasharray="4,4"
                      points={candleData
                        .map((c, i) => {
                          const slice = candleData.slice(Math.max(0, i - 20), i + 1);
                          const avg = slice.reduce((s, d) => s + d.close, 0) / slice.length;
                          const std = Math.sqrt(slice.reduce((s, d) => s + Math.pow(d.close - avg, 2), 0) / slice.length);
                          return `${(chartWidth / candleData.length) * i + candleWidth / 2},${scaleY(avg + std * 2)}`;
                        })
                        .join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="hsl(38 92% 55%)"
                      strokeWidth={1}
                      opacity={0.5}
                      strokeDasharray="4,4"
                      points={candleData
                        .map((c, i) => {
                          const slice = candleData.slice(Math.max(0, i - 20), i + 1);
                          const avg = slice.reduce((s, d) => s + d.close, 0) / slice.length;
                          const std = Math.sqrt(slice.reduce((s, d) => s + Math.pow(d.close - avg, 2), 0) / slice.length);
                          return `${(chartWidth / candleData.length) * i + candleWidth / 2},${scaleY(avg - std * 2)}`;
                        })
                        .join(' ')}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Open Positions */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Open Positions</h3>
              <div className="text-sm text-muted-foreground text-center py-6">
                No open positions. Place a trade to get started.
              </div>
            </div>
          </div>

          {/* Order Panel */}
          <div className="xl:col-span-1 animate-slide-up delay-200">
            <div className="glass-card p-5 sticky top-24">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSide('buy')}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold text-sm transition-all',
                    side === 'buy' ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  <ChevronUp className="w-4 h-4 inline mr-1" />
                  Buy / Long
                </button>
                <button
                  onClick={() => setSide('sell')}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold text-sm transition-all',
                    side === 'sell' ? 'bg-destructive text-white' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  <ChevronDown className="w-4 h-4 inline mr-1" />
                  Sell / Short
                </button>
              </div>

              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
                  <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
                </TabsList>

                <TabsContent value="market" className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="limit" className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Price</Label>
                    <Input
                      type="number"
                      placeholder={selectedPair.price.toString()}
                      value={limitPrice}
                      onChange={e => setLimitPrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Leverage */}
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Leverage: {leverage}x</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 5, 10, 25, 50].map(lev => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                        leverage === lev ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Take Profit</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Order summary */}
              {amount && (
                <div className="mt-4 p-3 rounded-xl bg-secondary/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Value</span>
                    <span className="text-foreground font-medium">
                      ${(parseFloat(amount || '0') * selectedPair.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With Leverage</span>
                    <span className="text-foreground font-medium">
                      ${(parseFloat(amount || '0') * selectedPair.price * leverage).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-foreground font-medium">$0.00</span>
                  </div>
                </div>
              )}

              <Button
                variant="gradient"
                size="lg"
                className={cn(
                  'w-full mt-4',
                  side === 'buy' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'
                )}
                onClick={handleTrade}
                disabled={!amount}
              >
                {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.symbol}
              </Button>

              {practiceMode && (
                <p className="text-xs text-warning text-center mt-2">
                  ⚠️ Practice mode — no real money involved
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
