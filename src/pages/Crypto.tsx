import { Navbar } from '@/components/layout/Navbar';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowLeftRight, Plus, Search, Star, Zap, Shield, Globe } from 'lucide-react';
import { PriceAlerts } from '@/components/crypto/PriceAlerts';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import nexaCoinImg from '@/assets/nexa-coin.png';

const marketData = [
  { symbol: 'NXA', name: 'NexaCoin', price: 8.50, change: 12.45, marketCap: '850M', volume: '125M', featured: true },
  { symbol: 'BTC', name: 'Bitcoin', price: 63245.80, change: 2.34, marketCap: '1.24T', volume: '28.5B', featured: false },
  { symbol: 'ETH', name: 'Ethereum', price: 1950.42, change: -1.23, marketCap: '234.5B', volume: '12.3B', featured: false },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.01, marketCap: '83.2B', volume: '45.6B', featured: false },
  { symbol: 'BNB', name: 'BNB', price: 245.30, change: 0.87, marketCap: '37.8B', volume: '1.2B', featured: false },
  { symbol: 'SOL', name: 'Solana', price: 148.25, change: 5.67, marketCap: '65.4B', volume: '3.4B', featured: false },
  { symbol: 'XRP', name: 'XRP', price: 0.52, change: -0.45, marketCap: '28.1B', volume: '892M', featured: false },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00, change: 0.00, marketCap: '24.5B', volume: '5.6B', featured: false },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change: 1.23, marketCap: '15.8B', volume: '456M', featured: false },
];

export default function Crypto() {
  const { cryptoAssets } = useApp();

  const totalCryptoValue = cryptoAssets.reduce((acc, asset) => acc + asset.value, 0);
  const nexaAsset = cryptoAssets.find(a => a.symbol === 'NXA');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Crypto</h1>
          <p className="text-muted-foreground mt-1">Trade and manage your cryptocurrency portfolio</p>
        </div>

        {/* NexaCoin Featured Banner */}
        <div className="relative overflow-hidden rounded-2xl mb-8 animate-slide-up border border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-amber-500/10" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px]" />

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-125" />
              <img src={nexaCoinImg} alt="NexaCoin" className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full animate-float" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Native Token</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                NexaCoin <span className="text-muted-foreground font-normal text-lg">(NXA)</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                The utility token powering the Nexa ecosystem. Earn through transactions, staking, and rewards.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-xl font-bold text-foreground">$8.50</p>
                </div>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Your Balance</p>
                  <p className="text-xl font-bold text-foreground">{nexaAsset?.balance.toLocaleString() ?? '0'} NXA</p>
                </div>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  <p className="text-xl font-bold text-success flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +12.45%
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Earn via transactions</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Staking rewards</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-primary" /> Fee discounts</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" /> Buy NXA
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowLeftRight className="w-4 h-4" /> Swap
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="glass-card p-6 sm:p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crypto Portfolio</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalCryptoValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+$234.56 (3.2%)</span>
                </div>
                <span className="text-muted-foreground text-sm">24h</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" /> Buy
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowLeftRight className="w-4 h-4" /> Swap
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Holdings & Price Alerts */}
          <div className="lg:col-span-1 space-y-4 animate-slide-up delay-100">
            <PriceAlerts />
            <h3 className="text-lg font-semibold text-foreground">Your Holdings</h3>
            {cryptoAssets.map((asset) => (
              <div
                key={asset.symbol}
                className={cn(
                  "glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer",
                  asset.symbol === 'NXA' && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {asset.symbol === 'NXA' ? (
                      <img src={nexaCoinImg} alt="NXA" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-bold">
                        {asset.icon}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        {asset.symbol}
                        {asset.symbol === 'NXA' && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{asset.balance} {asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${asset.value.toLocaleString()}</p>
                    <div className={cn(
                      'flex items-center justify-end gap-1 text-xs',
                      asset.change24h >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{asset.change24h >= 0 ? '+' : ''}{asset.change24h}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Market */}
          <div className="lg:col-span-2 animate-slide-up delay-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Market</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search coins..." className="pl-9 w-48" />
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">24h</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Market Cap</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((coin) => (
                      <tr key={coin.symbol} className={cn(
                        "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                        coin.featured && "bg-primary/5"
                      )}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {coin.symbol === 'NXA' ? (
                              <img src={nexaCoinImg} alt="NXA" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold">
                                {coin.symbol[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground flex items-center gap-1">
                                {coin.name}
                                {coin.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-foreground">
                          ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={cn(
                          'p-4 text-right hidden sm:table-cell',
                          coin.change >= 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {coin.change >= 0 ? '+' : ''}{coin.change}%
                        </td>
                        <td className="p-4 text-right text-muted-foreground hidden md:table-cell">
                          ${coin.marketCap}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant={coin.featured ? "gradient" : "outline"} size="sm">
                            {coin.featured ? 'Buy NXA' : 'Trade'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
