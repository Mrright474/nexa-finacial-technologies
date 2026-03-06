import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwapTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  fee: number | null;
  created_at: string;
  status: string;
}

export function SwapHistory({ userId }: { userId: string }) {
  const [swaps, setSwaps] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwaps = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, currency, description, fee, created_at, status')
        .eq('user_id', userId)
        .eq('transaction_type', 'swap')
        .order('created_at', { ascending: false })
        .limit(10);
      setSwaps(data || []);
      setLoading(false);
    };
    fetchSwaps();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-5 bg-secondary/50 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (swaps.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No swap history yet</p>
      </div>
    );
  }

  // Parse "Swapped 10 NXA → 5.0000 USD" from description
  const parseSwap = (desc: string) => {
    const match = desc?.match(/Swapped ([\d.]+) (\w+) → ([\d.]+) (\w+)/);
    if (!match) return null;
    return { fromAmount: match[1], fromCurrency: match[2], toAmount: match[3], toCurrency: match[4] };
  };

  return (
    <div className="glass-card p-6 animate-slide-up delay-200">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Swap History</h3>
      </div>
      <div className="space-y-2">
        {swaps.map((tx) => {
          const parsed = parseSwap(tx.description);
          return (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  {parsed ? (
                    <p className="text-sm font-medium text-foreground">
                      {parsed.fromAmount} {parsed.fromCurrency} <span className="text-muted-foreground">→</span> {parsed.toAmount} {parsed.toCurrency}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {parsed && (
                  <p className="text-xs text-muted-foreground">
                    Rate: 1 {parsed.fromCurrency} = {(parseFloat(parsed.toAmount) / parseFloat(parsed.fromAmount)).toFixed(4)} {parsed.toCurrency}
                  </p>
                )}
                <span className={cn('text-xs font-medium', tx.status === 'completed' ? 'text-success' : 'text-warning')}>
                  {tx.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
