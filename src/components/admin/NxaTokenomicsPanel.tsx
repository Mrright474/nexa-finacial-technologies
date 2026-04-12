import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Lock, Coins, BarChart3, TrendingUp, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

interface PricePoint {
  created_at: string;
  price: number;
  demand_score: number;
}

export function NxaTokenomicsPanel() {
  const [metrics, setMetrics] = useState<NxaMetrics | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [metricsRes, historyRes] = await Promise.all([
        supabase.rpc('compute_nxa_metrics'),
        supabase.from('nxa_price_history').select('created_at, price, demand_score').order('created_at', { ascending: true }).limit(100),
      ]);
      if (metricsRes.data?.[0]) setMetrics(metricsRes.data[0] as NxaMetrics);
      if (historyRes.data) setPriceHistory(historyRes.data as PricePoint[]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics) return <p className="text-muted-foreground">No metrics available.</p>;

  const maxSupply = 1_000_000_000;
  const lockedPercent = metrics.total_supply > 0
    ? ((metrics.total_staked + metrics.total_collateral) / metrics.total_supply) * 100
    : 0;

  const chartData = priceHistory.map((p) => ({
    time: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    price: Number(p.price),
    demand: Number(p.demand_score),
  }));

  const statCards = [
    { label: 'Total Supply (wallets)', value: fmt(metrics.total_supply), icon: Coins, color: 'from-blue-500 to-cyan-500' },
    { label: 'Circulating', value: fmt(metrics.circulating_supply), icon: Activity, color: 'from-green-500 to-emerald-500' },
    { label: 'Total Staked', value: fmt(metrics.total_staked), icon: Lock, color: 'from-purple-500 to-pink-500' },
    { label: 'Collateral Locked', value: fmt(metrics.total_collateral), icon: BarChart3, color: 'from-amber-500 to-orange-500' },
    { label: 'Total Burned', value: fmt(metrics.total_burned), icon: Flame, color: 'from-red-500 to-rose-500' },
    { label: '24h Active Users', value: String(metrics.active_users_24h), icon: Users, color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2', s.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Demand & Supply Pressure */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Demand Score</span>
            <span className="text-sm font-bold text-primary">{Number(metrics.demand_score).toFixed(1)}/100</span>
          </div>
          <Progress value={Number(metrics.demand_score)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Weighted: 40% staking, 25% collateral, 20% volume, 15% users
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Supply Pressure</span>
            <span className="text-sm font-bold text-amber-500">{Number(metrics.supply_pressure).toFixed(1)}%</span>
          </div>
          <Progress value={Number(metrics.supply_pressure)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Percentage of supply freely circulating (lower = more locked = higher price)
          </p>
        </div>
      </div>

      {/* Price History Chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> NXA Price History
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Locked Supply Breakdown */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Supply Lock-up Breakdown</h4>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Locked ({lockedPercent.toFixed(1)}%)</span>
          <span className="text-muted-foreground">Max Supply: 1B NXA</span>
        </div>
        <Progress value={lockedPercent} className="h-3 mb-3" />
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="font-semibold text-foreground">{fmt(metrics.total_staked)}</p>
            <p className="text-muted-foreground">Staked</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{fmt(metrics.total_collateral)}</p>
            <p className="text-muted-foreground">Collateral</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{fmt(metrics.total_burned)}</p>
            <p className="text-muted-foreground">Burned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
