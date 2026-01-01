import { useApp } from '@/context/AppContext';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
  send: { icon: ArrowUpRight, color: 'text-destructive', bgColor: 'bg-destructive/20' },
  receive: { icon: ArrowDownLeft, color: 'text-success', bgColor: 'bg-success/20' },
  exchange: { icon: ArrowLeftRight, color: 'text-primary', bgColor: 'bg-primary/20' },
  payment: { icon: CreditCard, color: 'text-warning', bgColor: 'bg-warning/20' },
  deposit: { icon: Wallet, color: 'text-success', bgColor: 'bg-success/20' },
  withdraw: { icon: Wallet, color: 'text-destructive', bgColor: 'bg-destructive/20' },
};

export function RecentTransactions() {
  const { transactions } = useApp();

  return (
    <div className="glass-card p-6 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-3">
        {transactions.slice(0, 5).map((tx) => {
          const config = typeConfig[tx.type];
          const Icon = config.icon;
          const isPositive = tx.type === 'receive' || tx.type === 'deposit';

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgColor)}>
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('font-semibold', isPositive ? 'text-success' : 'text-foreground')}>
                  {isPositive ? '+' : '-'}{tx.currency === 'UGX' ? 'UGX ' : '$'}
                  {tx.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
