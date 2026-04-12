import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Lock, TrendingUp, Coins, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface NxaMetrics {
  total_supply: number;
  circulating_supply: number;
  total_staked: number;
  total_collateral: number;
  tx_volume_24h: number;
  active_users_24h: number;
  demand_score: number;
  supply_pressure: number;
  total_burned: number;
}

export function TokenomicsWidget() {
  const [metrics, setMetrics] = useState<NxaMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await supabase.rpc('compute_nxa_metrics');
        if (data && data.length > 0) {
          setMetrics(data[0] as NxaMetrics);
        }
      } catch (e) {
        console.error('Failed to fetch NXA metrics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(2);
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-slide-up space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const maxSupply = 1_000_000_000;
  const lockedPercent = metrics.total_supply > 0
    ? ((metrics.total_staked + metrics.total_collateral) / metrics.total_supply) * 100
    : 0;

  const items = [
    {
      label: 'Circulating Supply',
      value: fmt(metrics.circulating_supply),
      icon: Coins,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Total Staked',
      value: fmt(metrics.total_staked),
      icon: Lock,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Collateral Locked',
      value: fmt(metrics.total_collateral),
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Total Burned',
      value: fmt(metrics.total_burned),
      icon: Flame,
      color: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> NXA Tokenomics
        </h3>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>

      {/* Demand Score Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Demand Score</span>
          <span className="font-semibold text-foreground">{Number(metrics.demand_score).toFixed(1)}/100</span>
        </div>
        <Progress value={Number(metrics.demand_score)} className="h-2" />
      </div>

      {/* Locked Supply */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Supply Locked</span>
          <span className="font-semibold text-foreground">{lockedPercent.toFixed(1)}%</span>
        </div>
        <Progress value={lockedPercent} className="h-2" />
      </div>

      {/* Metric Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', item.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>

      {/* 24h Activity */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> 24h Active Users
        </span>
        <span className="font-medium text-foreground">{metrics.active_users_24h}</span>
      </div>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-muted-foreground">24h Volume</span>
        <span className="font-medium text-foreground">{fmt(metrics.tx_volume_24h)} NXA</span>
      </div>
    </div>
  );
}
