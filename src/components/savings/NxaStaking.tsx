import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Coins, Lock, TrendingUp, Clock, Zap, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import nexaCoinImg from '@/assets/nexa-coin.png';

const STAKING_TIERS = [
  { days: 30, apy: 8.5, label: '30 Days', color: 'from-blue-500 to-cyan-500' },
  { days: 90, apy: 12.0, label: '90 Days', color: 'from-purple-500 to-pink-500' },
  { days: 180, apy: 18.0, label: '180 Days', color: 'from-amber-500 to-orange-500' },
  { days: 365, apy: 25.0, label: '1 Year', color: 'from-emerald-500 to-green-500' },
];

interface NxaStake {
  id: string;
  amount: number;
  lock_period_days: number;
  apy: number;
  start_date: string;
  end_date: string;
  earned_rewards: number;
  status: string;
}

export default function NxaStaking() {
  const { user } = useAuth();
  const [stakes, setStakes] = useState<NxaStake[]>([]);
  const [nxaBalance, setNxaBalance] = useState(0);
  const [showStakeForm, setShowStakeForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStakes();
      fetchNxaBalance();
    }
  }, [user]);

  const fetchStakes = async () => {
    const { data, error } = await supabase
      .from('nxa_stakes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStakes(data);
    setLoading(false);
  };

  const fetchNxaBalance = async () => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('currency', 'NXA')
      .single();
    if (data) setNxaBalance(Number(data.balance));
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > nxaBalance) return toast.error('Insufficient NXA balance');

    const tier = STAKING_TIERS[selectedTier];

    const { error } = await supabase.rpc('stake_nxa' as any, {
      p_amount: amount,
      p_lock_period_days: tier.days,
      p_apy: tier.apy,
    });

    if (error) return toast.error(error.message || 'Failed to create stake');

    toast.success(`Staked ${amount} NXA for ${tier.label} at ${tier.apy}% APY`);
    setStakeAmount('');
    setShowStakeForm(false);
    fetchStakes();
    fetchNxaBalance();
  };

  const handleUnstake = async (stake: NxaStake) => {
    const now = new Date();
    const endDate = new Date(stake.end_date);
    if (now < endDate) {
      toast.error(`Locked until ${endDate.toLocaleDateString()}. Early unstake not allowed.`);
      return;
    }

    const { error } = await supabase.rpc('unstake_nxa' as any, { p_stake_id: stake.id });
    if (error) return toast.error(error.message || 'Failed to return funds');

    toast.success(`Unstaked ${stake.amount} NXA + ${stake.earned_rewards.toFixed(2)} NXA rewards!`);
    fetchStakes();
    fetchNxaBalance();
  };


  const totalStaked = stakes.filter(s => s.status === 'active').reduce((a, s) => a + Number(s.amount), 0);
  const totalRewards = stakes.filter(s => s.status === 'active').reduce((a, s) => a + Number(s.earned_rewards), 0);
  const activeStakes = stakes.filter(s => s.status === 'active');

  const getProgress = (stake: NxaStake) => {
    const start = new Date(stake.start_date).getTime();
    const end = new Date(stake.end_date).getTime();
    const now = Date.now();
    return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
  };

  const getDaysRemaining = (stake: NxaStake) => {
    const end = new Date(stake.end_date).getTime();
    const remaining = Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
    return remaining;
  };

  // Calculate live estimated rewards for display
  const estimateRewards = (stake: NxaStake) => {
    const start = new Date(stake.start_date).getTime();
    const now = Date.now();
    const elapsed = (now - start) / (365.25 * 24 * 60 * 60 * 1000);
    return Number(stake.amount) * (Number(stake.apy) / 100) * elapsed;
  };

  if (loading) return <div className="text-center text-muted-foreground py-8">Loading stakes...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={nexaCoinImg} alt="NXA" className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">NexaCoin Staking</h2>
            <p className="text-sm text-muted-foreground">Lock NXA tokens to earn interest rewards</p>
          </div>
        </div>
        <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowStakeForm(!showStakeForm)}>
          <Plus className="w-4 h-4" /> Stake NXA
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Available NXA</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{nxaBalance.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Staked</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalStaked.toLocaleString()} NXA</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Est. Rewards</span>
          </div>
          <p className="text-2xl font-bold text-success">
            +{activeStakes.reduce((a, s) => a + estimateRewards(s), 0).toFixed(2)} NXA
          </p>
        </div>
      </div>

      {/* Stake Form */}
      {showStakeForm && (
        <div className="glass-card p-6 animate-scale-in space-y-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> New Stake
          </h3>

          {/* Tier Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STAKING_TIERS.map((tier, i) => (
              <button
                key={tier.days}
                onClick={() => setSelectedTier(i)}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  selectedTier === i
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2', tier.color)}>
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <p className="font-semibold text-foreground">{tier.label}</p>
                <p className="text-lg font-bold text-success">{tier.apy}% APY</p>
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Amount (NXA)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={() => setStakeAmount(String(nxaBalance))}>Max</Button>
            </div>
            {stakeAmount && (
              <p className="text-xs text-muted-foreground mt-2">
                Estimated earnings: <span className="text-success font-medium">
                  +{(parseFloat(stakeAmount || '0') * STAKING_TIERS[selectedTier].apy / 100 * STAKING_TIERS[selectedTier].days / 365).toFixed(2)} NXA
                </span> over {STAKING_TIERS[selectedTier].label}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleStake}>Confirm Stake</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowStakeForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Active Stakes */}
      {activeStakes.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Active Stakes</h3>
          {activeStakes.map((stake) => {
            const progress = getProgress(stake);
            const daysLeft = getDaysRemaining(stake);
            const estRewards = estimateRewards(stake);
            const tier = STAKING_TIERS.find(t => t.days === stake.lock_period_days);
            const isMatured = daysLeft === 0;

            return (
              <div key={stake.id} className="glass-card p-5 hover:border-primary/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', tier?.color || 'from-primary to-purple-500')}>
                      <img src={nexaCoinImg} alt="NXA" className="w-7 h-7 rounded-full" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{Number(stake.amount).toLocaleString()} NXA</h4>
                      <p className="text-sm text-muted-foreground">{stake.lock_period_days} days • {stake.apy}% APY</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="font-semibold text-success">+{estRewards.toFixed(2)} NXA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Days Left</p>
                      <p className={cn('font-semibold', isMatured ? 'text-success' : 'text-foreground')}>
                        {isMatured ? 'Matured!' : daysLeft}
                      </p>
                    </div>
                    <Button
                      variant={isMatured ? 'gradient' : 'secondary'}
                      size="sm"
                      onClick={() => handleUnstake(stake)}
                      disabled={!isMatured}
                    >
                      {isMatured ? 'Claim' : 'Locked'}
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{new Date(stake.start_date).toLocaleDateString()}</span>
                    <span>{progress}%</span>
                    <span>{new Date(stake.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !showStakeForm && (
        <div className="glass-card p-8 text-center">
          <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No Active Stakes</h3>
          <p className="text-sm text-muted-foreground mb-4">Stake your NXA tokens to earn up to 25% APY</p>
          <Button variant="gradient" size="sm" onClick={() => setShowStakeForm(true)}>Start Staking</Button>
        </div>
      )}

      {/* Completed Stakes */}
      {stakes.filter(s => s.status === 'completed').length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-muted-foreground text-sm">Completed Stakes</h3>
          {stakes.filter(s => s.status === 'completed').map((stake) => (
            <div key={stake.id} className="glass-card p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{Number(stake.amount).toLocaleString()} NXA</span>
                  <span className="text-xs text-muted-foreground">• {stake.lock_period_days}d @ {stake.apy}%</span>
                </div>
                <span className="text-sm text-success">+{Number(stake.earned_rewards).toFixed(2)} NXA earned</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
