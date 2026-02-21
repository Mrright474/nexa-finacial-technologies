import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Users, Star, Copy, Trophy, Zap, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const referralCode = 'NEXA-7K2X9';

const pointsHistory = [
  { id: '1', action: 'Friend signed up', points: 500, date: '2026-02-20', type: 'earned' as const },
  { id: '2', action: 'First deposit bonus', points: 250, date: '2026-02-18', type: 'earned' as const },
  { id: '3', action: 'Redeemed cashback', points: -1000, date: '2026-02-15', type: 'redeemed' as const },
  { id: '4', action: 'Monthly trading bonus', points: 300, date: '2026-02-10', type: 'earned' as const },
  { id: '5', action: 'Completed KYC', points: 200, date: '2026-02-05', type: 'earned' as const },
];

const rewards = [
  { id: '1', name: '0.5% Cashback', description: 'Get 0.5% cashback on your next 5 transactions', cost: 500, icon: Zap, gradient: 'from-amber-500 to-orange-500' },
  { id: '2', name: 'Free Transfer', description: 'One free international transfer up to $500', cost: 750, icon: ArrowRight, gradient: 'from-blue-500 to-cyan-500' },
  { id: '3', name: 'Premium 1 Month', description: 'Unlock premium features for 1 month', cost: 2000, icon: Star, gradient: 'from-purple-500 to-pink-500' },
  { id: '4', name: 'Priority Support', description: '24/7 priority customer support for 30 days', cost: 1000, icon: ShieldCheck, gradient: 'from-emerald-500 to-teal-500' },
];

const referrals = [
  { id: '1', name: 'Alice M.', status: 'active', joined: '2026-02-19', earned: 500 },
  { id: '2', name: 'James K.', status: 'pending', joined: '2026-02-21', earned: 0 },
  { id: '3', name: 'Sarah L.', status: 'active', joined: '2026-01-30', earned: 500 },
];

const challenges = [
  { id: '1', title: 'First Trade', description: 'Complete your first crypto trade', points: 100, progress: 100, completed: true },
  { id: '2', title: 'Savings Starter', description: 'Create a savings goal', points: 150, progress: 100, completed: true },
  { id: '3', title: 'Social Butterfly', description: 'Refer 5 friends', points: 1000, progress: 60, completed: false },
  { id: '4', title: 'Power Trader', description: 'Make 20 trades this month', points: 500, progress: 35, completed: false },
];

export default function Rewards() {
  const [totalPoints] = useState(1250);
  const tierProgress = (totalPoints / 5000) * 100;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const redeemReward = (reward: typeof rewards[0]) => {
    if (totalPoints < reward.cost) {
      toast.error('Not enough points');
      return;
    }
    toast.success(`Redeemed: ${reward.name}`);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const Icon = reward.icon;
                const canAfford = totalPoints >= reward.cost;
                return (
                  <Card key={reward.id} className="glass-card border-0">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', reward.gradient)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{reward.cost} pts</span>
                          <Button size="sm" variant={canAfford ? 'gradient' : 'outline'} disabled={!canAfford} onClick={() => redeemReward(reward)}>
                            Redeem
                          </Button>
                        </div>
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
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{ref.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ref.name}</p>
                        <p className="text-xs text-muted-foreground">Joined {ref.joined}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={ref.status === 'active' ? 'default' : 'secondary'} className="mb-1">{ref.status}</Badge>
                      <p className="text-xs text-muted-foreground">+{ref.earned} pts</p>
                    </div>
                  </div>
                ))}
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
                {pointsHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <span className={cn('text-sm font-semibold', item.type === 'earned' ? 'text-emerald-500' : 'text-destructive')}>
                      {item.type === 'earned' ? '+' : ''}{item.points} pts
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
