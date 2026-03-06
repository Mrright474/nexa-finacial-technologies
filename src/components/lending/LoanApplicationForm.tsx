import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLLATERAL_OPTIONS = [
  { ratio: 2, label: '2x Collateral', apr: 5.0, description: 'Standard — Lower collateral, higher rate' },
  { ratio: 3, label: '3x Collateral', apr: 3.5, description: 'Premium — More secure, lower rate' },
];

const TERM_OPTIONS = [
  { days: 30, label: '30 Days' },
  { days: 60, label: '60 Days' },
  { days: 90, label: '90 Days' },
];

interface Props {
  userId: string;
  nxaBalance: number;
  nxaPrice: number;
  onSuccess: () => void;
}

export function LoanApplicationForm({ userId, nxaBalance, nxaPrice, onSuccess }: Props) {
  const [loanAmount, setLoanAmount] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(2);
  const [selectedTerm, setSelectedTerm] = useState(30);
  const [applying, setApplying] = useState(false);

  const parsedAmount = parseFloat(loanAmount) || 0;
  const option = COLLATERAL_OPTIONS.find(o => o.ratio === selectedRatio)!;
  const requiredNxa = nxaPrice > 0 ? (parsedAmount * selectedRatio) / nxaPrice : 0;
  const hasEnoughNxa = requiredNxa <= nxaBalance;
  const interest = parsedAmount * (option.apr / 100) * (selectedTerm / 365);
  const totalRepayment = parsedAmount + interest;
  const monthlyPayment = totalRepayment / (selectedTerm / 30);

  const handleApply = async () => {
    if (parsedAmount <= 0) return toast.error('Enter a loan amount');
    if (!hasEnoughNxa) return toast.error(`Insufficient NXA. Need ${requiredNxa.toFixed(2)} NXA`);

    setApplying(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + selectedTerm);

      // Lock collateral (deduct from NXA wallet)
      const newBalance = nxaBalance - requiredNxa;
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .eq('currency', 'NXA');
      if (walletErr) throw walletErr;

      // Create loan
      const { error: loanErr } = await supabase.from('loans').insert({
        user_id: userId,
        loan_amount: parsedAmount,
        loan_currency: 'USD',
        collateral_amount: requiredNxa,
        collateral_currency: 'NXA',
        collateral_ratio: selectedRatio,
        interest_rate: option.apr,
        term_days: selectedTerm,
        monthly_payment: monthlyPayment,
        remaining_balance: totalRepayment,
        status: 'active',
        approved_at: new Date().toISOString(),
        due_date: dueDate.toISOString(),
      });
      if (loanErr) throw loanErr;

      // Credit USD to wallet
      const { data: usdWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('currency', 'USD')
        .single();

      if (usdWallet) {
        await supabase.from('wallets').update({ balance: Number(usdWallet.balance) + parsedAmount }).eq('user_id', userId).eq('currency', 'USD');
      }

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        amount: parsedAmount,
        currency: 'USD',
        transaction_type: 'receive',
        status: 'completed',
        description: `Loan disbursement — ${requiredNxa.toFixed(2)} NXA collateral (${selectedRatio}x)`,
      });

      toast.success(`Loan approved! $${parsedAmount.toLocaleString()} credited to your wallet`);
      setLoanAmount('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Loan application failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-5 animate-slide-up delay-100">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Apply for a Loan</h2>
      </div>

      {/* Collateral Ratio Selection */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Collateral Ratio</label>
        <div className="grid grid-cols-2 gap-3">
          {COLLATERAL_OPTIONS.map((opt) => (
            <button
              key={opt.ratio}
              onClick={() => setSelectedRatio(opt.ratio)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                selectedRatio === opt.ratio
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-secondary/20'
              )}
            >
              <p className="font-semibold text-foreground text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
              <p className="text-xs font-medium text-primary mt-1">{opt.apr}% APR</p>
            </button>
          ))}
        </div>
      </div>

      {/* Term Selection */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Loan Term</label>
        <div className="flex gap-2">
          {TERM_OPTIONS.map((t) => (
            <button
              key={t.days}
              onClick={() => setSelectedTerm(t.days)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                selectedTerm === t.days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Amount */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Loan Amount (USD)</label>
        <Input
          type="number"
          placeholder="Enter amount..."
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          className="text-lg font-semibold"
        />
      </div>

      {/* Breakdown */}
      {parsedAmount > 0 && nxaPrice > 0 && (
        <div className="bg-secondary/20 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required NXA ({selectedRatio}x)</span>
            <span className={cn('font-medium', hasEnoughNxa ? 'text-foreground' : 'text-destructive')}>
              {requiredNxa.toFixed(2)} NXA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NXA Price</span>
            <span className="text-foreground">${nxaPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Interest ({option.apr}% APR)</span>
            <span className="text-foreground">${interest.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground font-medium">Total Repayment</span>
            <span className="text-foreground font-bold">${totalRepayment.toFixed(2)}</span>
          </div>
          {!hasEnoughNxa && (
            <p className="text-xs text-destructive">You need {(requiredNxa - nxaBalance).toFixed(2)} more NXA</p>
          )}
        </div>
      )}

      <Button
        variant="gradient"
        size="lg"
        className="w-full gap-2"
        onClick={handleApply}
        disabled={applying || parsedAmount <= 0 || !hasEnoughNxa}
      >
        {applying ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : (
          <><ArrowRight className="w-5 h-5" /> Apply for Loan</>
        )}
      </Button>
    </div>
  );
}
