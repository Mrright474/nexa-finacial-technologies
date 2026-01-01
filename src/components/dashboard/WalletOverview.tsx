import { useApp } from '@/context/AppContext';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const currencySymbols: Record<string, string> = {
  UGX: 'UGX',
  USD: '$',
  EUR: '€',
  USDT: '₮',
  BTC: '₿',
  ETH: 'Ξ',
};

export function WalletOverview() {
  const { wallets, totalBalance } = useApp();
  const [showBalance, setShowBalance] = useState(true);

  const fiatWallets = wallets.filter(w => w.type === 'fiat');

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold text-foreground">
              {showBalance ? `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-success text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+2.4%</span>
            </div>
            <span className="text-muted-foreground text-sm">this month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {fiatWallets.map((wallet) => (
          <div
            key={wallet.id}
            className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <p className="text-xs text-muted-foreground mb-1">{wallet.currency}</p>
            <p className="text-lg font-semibold text-foreground">
              {showBalance
                ? `${currencySymbols[wallet.currency]}${wallet.balance.toLocaleString()}`
                : '••••'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
