import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, ArrowRight, TrendingDown, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface BurnEvent {
  id: string;
  amount: number;
  source: string;
  created_at: string;
  transaction_id: string | null;
}

const sourceConfig: Record<string, { label: string; icon: typeof Flame; color: string; bg: string }> = {
  swap_fee: { label: 'Swap Fee Burn', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  trade_fee: { label: 'Trade Fee Burn', icon: TrendingDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  admin_manual_burn: { label: 'Manual Burn', icon: Settings, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function BurnHistoryTimeline() {
  const [burns, setBurns] = useState<BurnEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchBurns = async () => {
      const { data } = await supabase
        .from('nxa_burn_log')
        .select('id, amount, source, created_at, transaction_id')
        .order('created_at', { ascending: false })
        .limit(expanded ? 100 : 10);
      
      if (data) setBurns(data as BurnEvent[]);
      setLoading(false);
    };

    fetchBurns();

    // Real-time subscription for new burns
    const channel = supabase
      .channel('burn-history')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'nxa_burn_log' },
        (payload) => {
          setBurns(prev => [payload.new as BurnEvent, ...prev.slice(0, expanded ? 99 : 9)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [expanded]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
    return amount.toFixed(amount < 1 ? 6 : 2);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (burns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No burn events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" />
          Recent Burn Events
        </h4>
        <span className="text-xs text-muted-foreground">
          {burns.length} {expanded ? 'events' : 'recent'}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-destructive/50 via-destructive/30 to-transparent" />

        <div className="space-y-3">
          {burns.map((burn, index) => {
            const config = sourceConfig[burn.source] || { 
              label: burn.source.replace(/_/g, ' '), 
              icon: Flame, 
              color: 'text-muted-foreground', 
              bg: 'bg-muted' 
            };
            const Icon = config.icon;
            const { date, time } = formatDate(burn.created_at);
            const isFirst = index === 0;

            return (
              <div 
                key={burn.id} 
                className={cn(
                  "relative flex items-start gap-3 pl-1",
                  isFirst && "animate-in slide-in-from-left-2 duration-500"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  config.bg,
                  isFirst && "ring-2 ring-destructive/50 ring-offset-2 ring-offset-background"
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>

                {/* Content card */}
                <div className="flex-1 min-w-0">
                  <div className="glass-card p-3 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs font-medium capitalize", config.bg, config.color)}
                          >
                            {config.label}
                          </Badge>
                          {isFirst && (
                            <Badge variant="destructive" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <span>{date}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{time}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-destructive tabular-nums">
                          -{formatAmount(burn.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">NXA</p>
                      </div>
                    </div>

                    {/* Transaction link if available */}
                    {burn.transaction_id && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          TX: {burn.transaction_id.slice(0, 16)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View more/less button */}
      {burns.length >= 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? 'Show less ↑' : 'View more burn history ↓'}
        </button>
      )}
    </div>
  );
}
