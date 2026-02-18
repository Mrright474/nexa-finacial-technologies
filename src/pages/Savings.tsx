import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target, Plus, TrendingUp, Wallet, Percent, Clock, ArrowUpRight, ArrowDownRight,
  Coins, Lock, Droplets, Layers, Shield, Zap, ChevronRight, RefreshCw, Settings,
  PiggyBank, Calendar, DollarSign, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Demo Data ──────────────────────────────────────────────────────────────────

const savingsGoals = [
  { id: '1', name: 'Emergency Fund', target: 5000, saved: 3250, icon: Shield, color: 'from-blue-500 to-cyan-500', autoSave: true, autoAmount: 50, frequency: 'weekly', interestRate: 4.5 },
  { id: '2', name: 'New Laptop', target: 1500, saved: 890, icon: Target, color: 'from-purple-500 to-pink-500', autoSave: true, autoAmount: 100, frequency: 'monthly', interestRate: 3.2 },
  { id: '3', name: 'Vacation Fund', target: 3000, saved: 450, icon: PiggyBank, color: 'from-amber-500 to-orange-500', autoSave: false, autoAmount: 0, frequency: 'none', interestRate: 4.5 },
  { id: '4', name: 'Investment Capital', target: 10000, saved: 7800, icon: TrendingUp, color: 'from-emerald-500 to-green-500', autoSave: true, autoAmount: 200, frequency: 'monthly', interestRate: 5.8 },
];

const fixedDeposits = [
  { id: '1', name: '30-Day Lock', amount: 2000, rate: 6.5, term: '30 days', maturity: '2026-03-20', earned: 10.68 },
  { id: '2', name: '90-Day Lock', amount: 5000, rate: 8.2, term: '90 days', maturity: '2026-05-18', earned: 56.16 },
  { id: '3', name: '180-Day Lock', amount: 3000, rate: 10.5, term: '180 days', maturity: '2026-08-17', earned: 51.78 },
];

const stakingPools = [
  { id: '1', token: 'ETH', name: 'Ethereum 2.0', staked: 1.2, value: 2340, apy: 4.8, rewards: 0.0048, icon: 'Ξ', color: 'from-indigo-500 to-purple-500', lockPeriod: 'Flexible', tvl: '32.5B' },
  { id: '2', token: 'SOL', name: 'Solana', staked: 45, value: 1575, apy: 7.2, rewards: 0.27, icon: '◎', color: 'from-violet-500 to-fuchsia-500', lockPeriod: '14 days', tvl: '12.8B' },
  { id: '3', token: 'ATOM', name: 'Cosmos', staked: 120, value: 960, apy: 18.5, rewards: 1.85, icon: '⚛', color: 'from-blue-600 to-indigo-600', lockPeriod: '21 days', tvl: '2.1B' },
  { id: '4', token: 'MATIC', name: 'Polygon', staked: 2500, value: 1750, apy: 5.4, rewards: 11.25, icon: '⬡', color: 'from-purple-600 to-violet-600', lockPeriod: 'Flexible', tvl: '4.3B' },
];

const yieldFarms = [
  { id: '1', pair: 'ETH/USDC', protocol: 'Uniswap V3', deposited: 3200, apy: 24.5, daily: 2.15, rewards: 'UNI', tvl: '458M', risk: 'Medium', color: 'from-pink-500 to-rose-500' },
  { id: '2', pair: 'BTC/ETH', protocol: 'SushiSwap', deposited: 5100, apy: 12.8, daily: 1.79, rewards: 'SUSHI', tvl: '125M', risk: 'Low', color: 'from-orange-500 to-red-500' },
  { id: '3', pair: 'USDT/USDC', protocol: 'Curve', deposited: 8000, apy: 8.4, daily: 1.84, rewards: 'CRV', tvl: '2.1B', risk: 'Low', color: 'from-cyan-500 to-blue-500' },
  { id: '4', pair: 'SOL/USDC', protocol: 'Raydium', deposited: 2400, apy: 32.1, daily: 2.11, rewards: 'RAY', tvl: '89M', risk: 'High', color: 'from-green-500 to-emerald-500' },
];

const liquidityPools = [
  { id: '1', pair: 'ETH/USDT', share: 0.0012, value: 4200, fees24h: 3.45, volume24h: '12.5M', apy: 18.2, color: 'from-blue-500 to-indigo-500' },
  { id: '2', pair: 'BTC/USDC', share: 0.0008, value: 6800, fees24h: 5.12, volume24h: '28.3M', apy: 14.6, color: 'from-amber-500 to-orange-500' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function Savings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [activeTab, setActiveTab] = useState('goals');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  const totalSaved = savingsGoals.reduce((a, g) => a + g.saved, 0);
  const totalStaked = stakingPools.reduce((a, p) => a + p.value, 0);
  const totalFarming = yieldFarms.reduce((a, f) => a + f.deposited, 0);
  const totalLiquidity = liquidityPools.reduce((a, l) => a + l.value, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Stats */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Savings & DeFi</h1>
          <p className="text-muted-foreground">Grow your wealth with savings goals, staking & yield farming</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Savings', value: totalSaved, icon: PiggyBank, color: 'from-blue-500 to-cyan-500' },
              { label: 'Staked', value: totalStaked, icon: Lock, color: 'from-purple-500 to-pink-500' },
              { label: 'Farming', value: totalFarming, icon: Droplets, color: 'from-green-500 to-emerald-500' },
              { label: 'Liquidity', value: totalLiquidity, icon: Layers, color: 'from-amber-500 to-orange-500' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', s.color)}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">${s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up delay-100">
          <TabsList className="grid grid-cols-4 w-full max-w-xl bg-secondary/50 mb-6">
            <TabsTrigger value="goals" className="gap-1"><Target className="w-4 h-4" /> Goals</TabsTrigger>
            <TabsTrigger value="fixed" className="gap-1"><Lock className="w-4 h-4" /> Fixed</TabsTrigger>
            <TabsTrigger value="staking" className="gap-1"><Coins className="w-4 h-4" /> Staking</TabsTrigger>
            <TabsTrigger value="defi" className="gap-1"><Droplets className="w-4 h-4" /> DeFi</TabsTrigger>
          </TabsList>

          {/* ── Savings Goals ── */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Savings Goals</h2>
              <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowNewGoal(!showNewGoal)}>
                <Plus className="w-4 h-4" /> New Goal
              </Button>
            </div>

            {showNewGoal && (
              <div className="glass-card p-6 animate-scale-in space-y-4">
                <h3 className="font-semibold text-foreground">Create New Goal</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-sm text-muted-foreground mb-1 block">Goal Name</label><Input placeholder="e.g. New Car" /></div>
                  <div><label className="text-sm text-muted-foreground mb-1 block">Target Amount ($)</label><Input type="number" placeholder="5000" /></div>
                  <div><label className="text-sm text-muted-foreground mb-1 block">Auto-Save Amount ($)</label><Input type="number" placeholder="50" /></div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Frequency</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option>Daily</option><option>Weekly</option><option>Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm">Create Goal</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewGoal(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {savingsGoals.map((goal) => {
                const pct = Math.round((goal.saved / goal.target) * 100);
                return (
                  <div key={goal.id} className="glass-card p-6 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', goal.color)}>
                          <goal.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground">{goal.interestRate}% APY</p>
                        </div>
                      </div>
                      {goal.autoSave && (
                        <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Auto
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">${goal.saved.toLocaleString()}</span>
                        <span className="text-foreground font-medium">${goal.target.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{pct}% complete</span>
                        {goal.autoSave && (
                          <span className="text-xs text-muted-foreground">${goal.autoAmount}/{goal.frequency}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" className="flex-1 gap-1"><Plus className="w-3 h-3" /> Add</Button>
                      <Button variant="ghost" size="sm" className="gap-1"><Settings className="w-3 h-3" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Fixed Deposits ── */}
          <TabsContent value="fixed" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Fixed Deposits</h2>
              <Button variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Deposit</Button>
            </div>
            <div className="space-y-4">
              {fixedDeposits.map((fd) => (
                <div key={fd.id} className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{fd.name}</h3>
                      <p className="text-sm text-muted-foreground">{fd.term} • Matures {fd.maturity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Deposited</p>
                      <p className="font-semibold text-foreground">${fd.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-semibold text-success">{fd.rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="font-semibold text-success">${fd.earned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Staking ── */}
          <TabsContent value="staking" className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Staking Pools</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {stakingPools.map((pool) => (
                <div key={pool.id} className="glass-card p-6 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl font-bold text-white', pool.color)}>
                        {pool.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{pool.name}</h3>
                        <p className="text-sm text-muted-foreground">{pool.token} • Lock: {pool.lockPeriod}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-success">{pool.apy}% APY</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div><p className="text-xs text-muted-foreground">Staked</p><p className="font-semibold text-foreground">{pool.staked} {pool.token}</p></div>
                    <div><p className="text-xs text-muted-foreground">Value</p><p className="font-semibold text-foreground">${pool.value.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rewards</p><p className="font-semibold text-success">+{pool.rewards} {pool.token}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>TVL: ${pool.tvl}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="gradient" size="sm" className="flex-1">Stake More</Button>
                    <Button variant="secondary" size="sm" className="flex-1">Unstake</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── DeFi (Yield Farming + Liquidity) ── */}
          <TabsContent value="defi" className="space-y-8">
            {/* Yield Farming */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-primary" /> Yield Farms</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {yieldFarms.map((farm) => (
                  <div key={farm.id} className="glass-card p-6 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', farm.color)}>
                          <Droplets className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{farm.pair}</h3>
                          <p className="text-sm text-muted-foreground">{farm.protocol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-success">{farm.apy}%</span>
                        <p className="text-xs text-muted-foreground">APY</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div><p className="text-xs text-muted-foreground">Deposited</p><p className="font-semibold text-foreground">${farm.deposited.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Daily</p><p className="font-semibold text-success">${farm.daily}</p></div>
                      <div><p className="text-xs text-muted-foreground">Rewards</p><p className="font-semibold text-foreground">{farm.rewards}</p></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>TVL: ${farm.tvl}</span>
                      <span className={cn('px-2 py-0.5 rounded-full', farm.risk === 'Low' ? 'bg-success/20 text-success' : farm.risk === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')}>{farm.risk} Risk</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="gradient" size="sm" className="flex-1">Deposit</Button>
                      <Button variant="secondary" size="sm" className="flex-1">Harvest</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Liquidity Pools */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Liquidity Pools</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {liquidityPools.map((lp) => (
                  <div key={lp.id} className="glass-card p-6 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', lp.color)}>
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{lp.pair}</h3>
                        <p className="text-sm text-muted-foreground">Pool share: {(lp.share * 100).toFixed(4)}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div><p className="text-xs text-muted-foreground">Value</p><p className="font-semibold text-foreground">${lp.value.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Fees (24h)</p><p className="font-semibold text-success">${lp.fees24h}</p></div>
                      <div><p className="text-xs text-muted-foreground">APY</p><p className="font-semibold text-success">{lp.apy}%</p></div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">24h Volume: ${lp.volume24h}</p>
                    <div className="flex gap-2">
                      <Button variant="gradient" size="sm" className="flex-1">Add Liquidity</Button>
                      <Button variant="secondary" size="sm" className="flex-1">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
