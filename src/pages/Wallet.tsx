import { Navbar } from '@/components/layout/Navbar';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const currencyIcons: Record<string, string> = {
  UGX: '🇺🇬',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  USDT: '₮',
  BTC: '₿',
  ETH: 'Ξ',
  USDC: '$',
};

export default function Wallet() {
  const { wallets, totalBalance } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your currencies and balances</p>
        </div>

        {/* Total Balance Card */}
        <div className="glass-card p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
              <h2 className="text-5xl font-bold text-foreground">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+$456.32 (2.4%)</span>
                </div>
                <span className="text-muted-foreground text-sm">this month</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="gradient" className="gap-2">
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet, index) => (
            <div
              key={wallet.id}
              className={cn(
                'glass-card p-6 hover:bg-white/10 transition-all cursor-pointer group animate-slide-up',
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {currencyIcons[wallet.currency]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{wallet.currency}</p>
                    <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground">
                  {wallet.currency === 'UGX' && 'UGX '}
                  {wallet.currency === 'USD' && '$'}
                  {wallet.currency === 'EUR' && '€'}
                  {wallet.balance.toLocaleString(undefined, {
                    minimumFractionDigits: wallet.type === 'crypto' ? 4 : 2,
                    maximumFractionDigits: wallet.type === 'crypto' ? 4 : 2,
                  })}
                </p>
                {wallet.type !== 'fiat' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ ${(wallet.balance * (wallet.currency === 'BTC' ? 63000 : wallet.currency === 'ETH' ? 1950 : 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Add Currency Card */}
          <div className="glass-card p-6 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer animate-slide-up delay-500">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Add Currency</p>
          </div>
        </div>
      </main>
    </div>
  );
}
