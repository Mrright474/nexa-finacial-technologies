import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceChart } from '@/components/crypto/PriceChart';
import { ArrowLeft, Plus, ArrowLeftRight, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import nexaCoinImg from '@/assets/nexa-coin.png';
import { OrderBook } from '@/components/crypto/OrderBook';
import { TradeHistory } from '@/components/crypto/TradeHistory';
import { AssetStats } from '@/components/crypto/AssetStats';

const marketData: Record<string, { price: number; change: number; marketCap: string; volume: string; high24h: number; low24h: number; supply: string; maxSupply: string }> = {
  NXA: { price: 8.50, change: 12.45, marketCap: '850M', volume: '125M', high24h: 9.12, low24h: 7.80, supply: '100M', maxSupply: '500M' },
  BTC: { price: 63245.80, change: 2.34, marketCap: '1.24T', volume: '28.5B', high24h: 64100, low24h: 62500, supply: '19.6M', maxSupply: '21M' },
  ETH: { price: 1950.42, change: -1.23, marketCap: '234.5B', volume: '12.3B', high24h: 2010, low24h: 1920, supply: '120.2M', maxSupply: '∞' },
  USDT: { price: 1.00, change: 0.01, marketCap: '83.2B', volume: '45.6B', high24h: 1.001, low24h: 0.999, supply: '83.2B', maxSupply: '∞' },
  BNB: { price: 245.30, change: 0.87, marketCap: '37.8B', volume: '1.2B', high24h: 248.50, low24h: 242.10, supply: '153.8M', maxSupply: '200M' },
  SOL: { price: 148.25, change: 5.67, marketCap: '65.4B', volume: '3.4B', high24h: 152.30, low24h: 140.20, supply: '441M', maxSupply: '∞' },
  XRP: { price: 0.52, change: -0.45, marketCap: '28.1B', volume: '892M', high24h: 0.535, low24h: 0.515, supply: '54B', maxSupply: '100B' },
  USDC: { price: 1.00, change: 0.00, marketCap: '24.5B', volume: '5.6B', high24h: 1.001, low24h: 0.999, supply: '24.5B', maxSupply: '∞' },
  ADA: { price: 0.45, change: 1.23, marketCap: '15.8B', volume: '456M', high24h: 0.462, low24h: 0.441, supply: '35.5B', maxSupply: '45B' },
};

const coinNames: Record<string, string> = {
  NXA: 'NexaCoin', BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether',
  BNB: 'BNB', SOL: 'Solana', XRP: 'XRP', USDC: 'USD Coin', ADA: 'Cardano',
};

export default function CryptoAsset() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { cryptoAssets } = useApp();
  const upperSymbol = symbol?.toUpperCase() ?? '';
  const data = marketData[upperSymbol];
  const name = coinNames[upperSymbol] ?? upperSymbol;
  const holding = cryptoAssets.find(a => a.symbol === upperSymbol);

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 px-4 max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground mt-20">Asset not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/crypto')}>Back to Crypto</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 animate-slide-up">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            {upperSymbol === 'NXA' ? (
              <img src={nexaCoinImg} alt="NXA" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-bold">
                {upperSymbol[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {name}
                <span className="text-muted-foreground text-base font-normal">{upperSymbol}</span>
                {upperSymbol === 'NXA' && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-foreground">${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className={cn('flex items-center gap-1 text-sm font-medium', data.change >= 0 ? 'text-success' : 'text-destructive')}>
                  {data.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {data.change >= 0 ? '+' : ''}{data.change}%
                </span>
              </div>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="gradient" className="gap-2"><Plus className="w-4 h-4" /> Buy</Button>
            <Button variant="outline" className="gap-2"><ArrowLeftRight className="w-4 h-4" /> Swap</Button>
          </div>
        </div>

        {/* Your holding */}
        {holding && (
          <div className="glass-card p-4 mb-6 animate-slide-up flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your Balance</p>
              <p className="text-lg font-bold text-foreground">{holding.balance.toLocaleString()} {upperSymbol}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Value</p>
              <p className="text-lg font-bold text-foreground">${holding.value.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Full Chart */}
        <div className="mb-6 animate-slide-up">
          <PriceChart symbol={upperSymbol} name={name} currentPrice={data.price} change24h={data.change} />
        </div>

        {/* Stats Bar */}
        <AssetStats data={data} symbol={upperSymbol} />

        {/* Tabs: Order Book / Trade History */}
        <Tabs defaultValue="orderbook" className="mt-6 animate-slide-up">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
          </TabsList>
          <TabsContent value="orderbook">
            <OrderBook symbol={upperSymbol} currentPrice={data.price} />
          </TabsContent>
          <TabsContent value="trades">
            <TradeHistory symbol={upperSymbol} currentPrice={data.price} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
