import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, AlertTriangle, Coins, Loader2, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Loan {
  id: string;
  user_id: string;
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

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/20', label: 'Pending' },
  active: { icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/20', label: 'Active' },
  paid: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/20', label: 'Paid' },
  liquidated: { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/20', label: 'Liquidated' },
  defaulted: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20', label: 'Defaulted' },
};

interface Props {
  loans: Loan[];
  loading: boolean;
  nxaPrice: number;
  onRepaid: () => void;
}

export function ActiveLoans({ loans, loading, nxaPrice, onRepaid }: Props) {
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleRepay = async (loan: Loan) => {
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > loan.remaining_balance) return toast.error('Amount exceeds remaining balance');

    setProcessing(true);
    try {
      // Check USD balance
      const { data: usdWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', loan.user_id)
        .eq('currency', 'USD')
        .single();

      const usdBalance = Number(usdWallet?.balance || 0);
      if (amount > usdBalance) {
        toast.error(`Insufficient USD balance ($${usdBalance.toFixed(2)})`);
        setProcessing(false);
        return;
      }

      const newRemaining = loan.remaining_balance - amount;
      const isFullyPaid = newRemaining <= 0.01;

      // 1. Deduct USD
      await supabase
        .from('wallets')
        .update({ balance: usdBalance - amount })
        .eq('user_id', loan.user_id)
        .eq('currency', 'USD');

      // 2. Update loan
      await supabase
        .from('loans')
        .update({
          remaining_balance: isFullyPaid ? 0 : newRemaining,
          status: isFullyPaid ? 'paid' : 'active',
        })
        .eq('id', loan.id);

      // 3. If fully paid, unlock collateral
      if (isFullyPaid) {
        const { data: nxaWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', loan.user_id)
          .eq('currency', 'NXA')
          .single();

        await supabase
          .from('wallets')
          .update({ balance: Number(nxaWallet?.balance || 0) + loan.collateral_amount })
          .eq('user_id', loan.user_id)
          .eq('currency', 'NXA');

        await supabase.from('transactions').insert({
          user_id: loan.user_id,
          amount: loan.collateral_amount,
          currency: 'NXA',
          transaction_type: 'receive',
          status: 'completed',
          description: `Collateral unlocked — ${loan.collateral_amount.toFixed(2)} NXA returned after loan repayment`,
        });
      }

      // 4. Record repayment transaction
      await supabase.from('transactions').insert({
        user_id: loan.user_id,
        amount,
        currency: 'USD',
        transaction_type: 'send',
        status: 'completed',
        description: `Loan repayment${isFullyPaid ? ' (fully paid)' : ''} — $${amount.toFixed(2)}`,
      });

      toast.success(isFullyPaid
        ? `Loan fully repaid! ${loan.collateral_amount.toFixed(2)} NXA unlocked`
        : `Repaid $${amount.toFixed(2)} — $${newRemaining.toFixed(2)} remaining`
      );

      setRepayingId(null);
      setRepayAmount('');
      onRepaid();
    } catch (err: any) {
      toast.error(err.message || 'Repayment failed');
    } finally {
      setProcessing(false);
    }
  };

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
          const isActive = loan.status === 'active';
          const isRepaying = repayingId === loan.id;

          // Health ratio calculation
          const collateralValueUsd = loan.collateral_amount * nxaPrice;
          const healthRatio = loan.remaining_balance > 0 ? collateralValueUsd / loan.remaining_balance : 999;
          const isAtRisk = isActive && healthRatio <= 1.5;
          const isCritical = isActive && healthRatio <= 1.2;

          return (
            <div key={loan.id} className={cn(
              'p-4 rounded-xl transition-colors',
              isCritical ? 'bg-destructive/10 border border-destructive/30' :
              isAtRisk ? 'bg-warning/10 border border-warning/30' :
              'bg-secondary/20 hover:bg-secondary/30'
            )}>
              {/* Liquidation Warning */}
              {isAtRisk && (
                <div className={cn(
                  'flex items-center gap-2 mb-3 p-2 rounded-lg text-xs font-medium',
                  isCritical ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                )}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isCritical
                    ? `Critical — Health ratio ${healthRatio.toFixed(2)}x. Liquidation imminent!`
                    : `Warning — Health ratio ${healthRatio.toFixed(2)}x. Consider repaying to avoid liquidation.`
                  }
                </div>
              )}

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
                    {config.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(loan.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{loan.interest_rate}% APR · {loan.term_days} days</span>
                {loan.due_date && (
                  <span>Due {new Date(loan.due_date).toLocaleDateString()}</span>
                )}
              </div>

              {isActive && (
                <div className="flex items-center justify-between text-xs mt-1 mb-2">
                  <span className="text-muted-foreground">Remaining: <span className="text-foreground font-semibold">${loan.remaining_balance.toFixed(2)}</span></span>
                  {nxaPrice > 0 && (
                    <span className="text-muted-foreground">Collateral: <span className="text-foreground font-medium">${collateralValueUsd.toFixed(2)}</span></span>
                  )}
                </div>
              )}

              {/* Repay Section */}
              {isActive && !isRepaying && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 gap-2"
                  onClick={() => setRepayingId(loan.id)}
                >
                  <Unlock className="w-4 h-4" /> Repay Loan
                </Button>
              )}

              {isRepaying && (
                <div className="mt-3 space-y-2 p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">
                    Enter repayment amount (remaining: ${loan.remaining_balance.toFixed(2)})
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount in USD"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => handleRepay(loan)}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setRepayAmount(String(loan.remaining_balance))}
                    >
                      Pay full balance
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => { setRepayingId(null); setRepayAmount(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Liquidated notice */}
              {loan.status === 'liquidated' && (
                <p className="text-xs text-destructive mt-2">
                  Collateral was seized due to insufficient value relative to loan balance.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
