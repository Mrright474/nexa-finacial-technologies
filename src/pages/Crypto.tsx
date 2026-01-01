import { Navbar } from '@/components/layout/Navbar';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowLeftRight, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin', price: 63245.80, change: 2.34, marketCap: '1.24T', volume: '28.5B' },
  { symbol: 'ETH', name: 'Ethereum', price: 1950.42, change: -1.23, marketCap: '234.5B', volume: '12.3B' },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.01, marketCap: '83.2B', volume: '45.6B' },
  { symbol: 'BNB', name: 'BNB', price: 245.30, change: 0.87, marketCap: '37.8B', volume: '1.2B' },
  { symbol: 'SOL', name: 'Solana', price: 148.25, change: 5.67, marketCap: '65.4B', volume: '3.4B' },
  { symbol: 'XRP', name: 'XRP', price: 0.52, change: -0.45, marketCap: '28.1B', volume: '892M' },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00, change: 0.00, marketCap: '24.5B', volume: '5.6B' },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change: 1.23, marketCap: '15.8B', volume: '456M' },
];

export default function Crypto() {
  const { cryptoAssets } = useApp();

  const totalCryptoValue = cryptoAssets.reduce((acc, asset) => acc + asset.value, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Crypto</h1>
          <p className="text-muted-foreground mt-1">Trade and manage your cryptocurrency portfolio</p>
        </div>

        {/* Portfolio Overview */}
        <div className="glass-card p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crypto Portfolio</p>
              <h2 className="text-4xl font-bold text-foreground">
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
          {/* Holdings */}
          <div className="lg:col-span-1 space-y-4 animate-slide-up delay-100">
            <h3 className="text-lg font-semibold text-foreground">Your Holdings</h3>
            {cryptoAssets.map((asset) => (
              <div
                key={asset.symbol}
                className="glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-bold">
                      {asset.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{asset.symbol}</p>
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
                    <tr key={coin.symbol} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold">
                            {coin.symbol[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{coin.name}</p>
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
                        <Button variant="outline" size="sm">Trade</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
