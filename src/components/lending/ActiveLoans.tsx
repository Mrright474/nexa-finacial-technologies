import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Loan {
  id: string;
  loan_amount: number;
  loan_currency: string;
  collateral_amount: number;
  collateral_currency: string;
  collateral_ratio: number;
  interest_rate: number;
  term_days: number;
  remaining_balance: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/20' },
  active: { icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/20' },
  paid: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/20' },
  defaulted: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20' },
};

export function ActiveLoans({ loans, loading }: { loans: Loan[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-5 bg-secondary/50 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-secondary/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No loans yet. Apply for your first loan above.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-slide-up delay-200">
      <h3 className="text-lg font-semibold text-foreground mb-4">Your Loans</h3>
      <div className="space-y-3">
        {loans.map((loan) => {
          const config = statusConfig[loan.status] || statusConfig.pending;
          const Icon = config.icon;
          const paidPercent = loan.remaining_balance > 0 && loan.loan_amount > 0
            ? Math.max(0, ((loan.loan_amount - loan.remaining_balance + loan.loan_amount) / (loan.remaining_balance)) * 50)
            : 100;

          return (
            <div key={loan.id} className="p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', config.bgColor)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      ${loan.loan_amount.toLocaleString()} {loan.loan_currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {loan.collateral_amount.toFixed(2)} {loan.collateral_currency} collateral ({loan.collateral_ratio}x)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full capitalize', config.bgColor, config.color)}>
                    {loan.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{loan.interest_rate}% APR · {loan.term_days} days</span>
                {loan.due_date && (
                  <span>Due {new Date(loan.due_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
