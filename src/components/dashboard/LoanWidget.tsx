import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Landmark, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NXA_PRICE = 8.50;

interface LoanSummary {
  activeCount: number;
  totalCollateral: number;
  totalDebt: number;
  lowestHealth: number | null;
}

export function LoanWidget() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LoanSummary>({ activeCount: 0, totalCollateral: 0, totalDebt: 0, lowestHealth: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('loans')
        .select('collateral_amount, remaining_balance')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (data && data.length > 0) {
        let totalCollateral = 0, totalDebt = 0, lowestHealth = Infinity;
        for (const l of data) {
          totalCollateral += Number(l.collateral_amount);
          totalDebt += Number(l.remaining_balance);
          const h = (Number(l.collateral_amount) * NXA_PRICE) / Number(l.remaining_balance);
          if (h < lowestHealth) lowestHealth = h;
        }
        setSummary({ activeCount: data.length, totalCollateral, totalDebt, lowestHealth });
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return null;
  if (summary.activeCount === 0) {
    return (
      <div className="glass-card p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Landmark className="w-4 h-4 text-primary" /> Lending
          </h3>
          <Link to="/lending" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            Apply <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">No active loans. Borrow USD using your NXA as collateral.</p>
      </div>
    );
  }

  const healthColor = summary.lowestHealth && summary.lowestHealth <= 1.2
    ? 'text-destructive'
    : summary.lowestHealth && summary.lowestHealth <= 1.5
      ? 'text-amber-500'
      : 'text-green-500';

  const HealthIcon = summary.lowestHealth && summary.lowestHealth <= 1.5 ? AlertTriangle : ShieldCheck;

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Landmark className="w-4 h-4 text-primary" /> Active Loans
        </h3>
        <Link to="/lending" className="text-xs text-primary hover:underline flex items-center gap-0.5">
          Manage <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Loans</p>
          <p className="text-lg font-bold text-foreground">{summary.activeCount}</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Total Debt</p>
          <p className="text-lg font-bold text-foreground">${summary.totalDebt.toLocaleString()}</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Collateral Locked</p>
          <p className="text-lg font-bold text-foreground">{summary.totalCollateral.toFixed(1)} NXA</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Health</p>
          <p className={cn('text-lg font-bold flex items-center gap-1', healthColor)}>
            <HealthIcon className="w-4 h-4" />
            {summary.lowestHealth?.toFixed(2)}x
          </p>
        </div>
      </div>
    </div>
  );
}
