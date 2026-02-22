import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Users, Star, Copy, Trophy, Zap, ShieldCheck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const availableRewards = [
  { id: '1', name: '0.5% Cashback', description: 'Get 0.5% cashback on your next 5 transactions', cost: 500, icon: Zap, gradient: 'from-amber-500 to-orange-500' },
  { id: '2', name: 'Free Transfer', description: 'One free international transfer up to $500', cost: 750, icon: ArrowRight, gradient: 'from-blue-500 to-cyan-500' },
  { id: '3', name: 'Priority Support', description: '24/7 priority customer support for 30 days', cost: 1000, icon: ShieldCheck, gradient: 'from-emerald-500 to-teal-500' },
  { id: '4', name: 'Premium 1 Month', description: 'Unlock premium features for 1 month', cost: 2000, icon: Star, gradient: 'from-purple-500 to-pink-500' },
];

const pointsBreakdown = [
  { action: 'Sign up', points: 100 },
  { action: 'Each transaction', points: '5–40' },
  { action: 'Upload KYC document', points: 50 },
  { action: 'Complete KYC verification', points: 250 },
  { action: 'Refer a friend', points: 500 },
];

const challenges = [
  { id: '1', title: 'First Trade', description: 'Complete your first crypto trade', points: 100, progress: 100, completed: true },
  { id: '2', title: 'Savings Starter', description: 'Create a savings goal', points: 150, progress: 100, completed: true },
  { id: '3', title: 'Social Butterfly', description: 'Refer 5 friends', points: 1000, progress: 60, completed: false },
  { id: '4', title: 'Power Trader', description: 'Make 20 trades this month', points: 500, progress: 35, completed: false },
];

export default function Rewards() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);

  const tierProgress = (totalPoints / 5000) * 100;

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [pointsRes, historyRes, referralsRes, profileRes] = await Promise.all([
      supabase.rpc('get_user_points', { p_user_id: user!.id }),
      supabase.from('points_ledger').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('referrals').select('*').eq('referrer_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('referral_code').eq('user_id', user!.id).single(),
    ]);

    if (pointsRes.data !== null) setTotalPoints(pointsRes.data as number);
    if (historyRes.data) setPointsHistory(historyRes.data);
    if (referralsRes.data) setReferrals(referralsRes.data);
    if (profileRes.data?.referral_code) {
      setReferralCode(profileRes.data.referral_code);
    } else {
      // Generate code for existing profiles
      const code = 'NEXA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      await supabase.from('profiles').update({ referral_code: code } as any).eq('user_id', user!.id);
      setReferralCode(code);
    }
    setLoading(false);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const redeemReward = async (reward: typeof availableRewards[0]) => {
    if (totalPoints < reward.cost) {
      toast.error('Not enough points');
      return;
    }
    // Insert redemption record
    const { error: redeemErr } = await supabase.from('redeemed_rewards').insert({
      user_id: user!.id,
      reward_name: reward.name,
      points_cost: reward.cost,
    } as any);
    if (redeemErr) { toast.error('Redemption failed'); return; }

    // Deduct points
    const { error: ledgerErr } = await supabase.from('points_ledger').insert({
      user_id: user!.id,
      action: `Redeemed: ${reward.name}`,
      points: reward.cost,
      type: 'redeemed',
    } as any);
    if (ledgerErr) { toast.error('Failed to record points'); return; }

    toast.success(`Redeemed: ${reward.name}`);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rewards & Referrals</h1>
          <p className="text-muted-foreground">Earn points, invite friends, and unlock exclusive rewards</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Friends Referred</p>
                <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tier Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={tierProgress} className="w-24 h-2" />
                  <span className="text-xs text-muted-foreground">Gold</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Card */}
        <Card className="glass-card border-0 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Invite Friends, Earn 500 Points Each</h2>
                <p className="text-muted-foreground text-sm">Share your referral code and both you and your friend earn rewards</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-background/80 backdrop-blur px-4 py-2.5 rounded-xl font-mono text-lg font-semibold text-foreground tracking-wider">
                  {referralCode}
                </div>
                <Button variant="gradient" size="sm" onClick={copyReferralCode} className="gap-2">
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="glass-card border-0 p-1">
            <TabsTrigger value="rewards" className="gap-2"><Gift className="w-4 h-4" /> Rewards</TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2"><Trophy className="w-4 h-4" /> Challenges</TabsTrigger>
            <TabsTrigger value="referrals" className="gap-2"><Users className="w-4 h-4" /> Referrals</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Star className="w-4 h-4" /> History</TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            {/* How to earn */}
            <Card className="glass-card border-0 mb-6">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> How You Earn Points</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {pointsBreakdown.map((item) => (
                    <div key={item.action} className="text-center p-3 rounded-xl bg-secondary/40">
                      <p className="text-lg font-bold text-primary">+{item.points}</p>
                      <p className="text-xs text-muted-foreground">{item.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRewards.map((reward) => {
                const Icon = reward.icon;
                const canAfford = totalPoints >= reward.cost;
                const progressPct = Math.min((totalPoints / reward.cost) * 100, 100);
                return (
                  <Card key={reward.id} className="glass-card border-0">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', reward.gradient)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{totalPoints.toLocaleString()} / {reward.cost.toLocaleString()} pts</span>
                            <span className={cn("font-medium", canAfford ? "text-emerald-500" : "text-muted-foreground")}>
                              {canAfford ? 'Ready!' : `${Math.max(reward.cost - totalPoints, 0).toLocaleString()} more needed`}
                            </span>
                          </div>
                          <Progress value={progressPct} className="h-2" />
                        </div>
                        <Button size="sm" variant={canAfford ? 'gradient' : 'outline'} disabled={!canAfford} onClick={() => redeemReward(reward)} className="w-full">
                          {canAfford ? 'Redeem Now' : 'Keep Earning'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="space-y-4">
              {challenges.map((ch) => (
                <Card key={ch.id} className="glass-card border-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', ch.completed ? 'bg-emerald-500/20' : 'bg-secondary')}>
                      {ch.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Trophy className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-foreground">{ch.title}</h3>
                        <Badge variant={ch.completed ? 'default' : 'secondary'}>{ch.points} pts</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ch.description}</p>
                      <Progress value={ch.progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Your Referrals</CardTitle>
                <CardDescription>Track friends you've invited</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share your code to get started!</p>
                ) : (
                  referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{(ref.referred_name || ref.referred_email)[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{ref.referred_name || ref.referred_email}</p>
                          <p className="text-xs text-muted-foreground">Joined {new Date(ref.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={ref.status === 'active' ? 'default' : 'secondary'} className="mb-1">{ref.status}</Badge>
                        <p className="text-xs text-muted-foreground">+{ref.points_earned} pts</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Points History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pointsHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No points activity yet.</p>
                ) : (
                  pointsHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={cn('text-sm font-semibold', item.type === 'earned' ? 'text-emerald-500' : 'text-destructive')}>
                        {item.type === 'earned' ? '+' : '-'}{item.points} pts
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
