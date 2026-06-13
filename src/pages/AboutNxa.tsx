import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Coins, Gift, Landmark, ShieldCheck, Flame, Users, Vote,
  Rocket, Globe, Zap, Target, CheckCircle2, ArrowRight,
  Lock, TrendingUp, Clock, BookOpen, Gem
} from 'lucide-react';
import { LEGACY_VERSE_URL, LEGACY_VERSE_LABEL, LEGACY_VERSE_ARIA } from '@/config/externalLinks';
import { BurnCounter } from '@/components/nxa/BurnCounter';
import { BurnHistoryTimeline } from '@/components/nxa/BurnHistoryTimeline';
import { BurnLeaderboard } from '@/components/nxa/BurnLeaderboard';

/* ─── Token Utility ─── */
const utilities = [
  { icon: Gift, title: 'Signup Bonus', desc: 'Every new user receives 100 NXA to explore the platform from day one.' },
  { icon: Landmark, title: 'Staking Rewards', desc: 'Lock NXA to earn up to 25% APY with tiered staking pools.' },
  { icon: ShieldCheck, title: 'Loan Collateral', desc: 'Borrow instantly against staked NXA with low interest rates.' },
  { icon: Flame, title: 'Fee Discounts', desc: 'Pay trading & swap fees with NXA for up to 50% off.' },
  { icon: Users, title: 'Governance', desc: 'Vote on platform decisions proportional to your NXA holdings.' },
  { icon: Coins, title: 'Referral Rewards', desc: 'Earn NXA when you invite friends and they start transacting.' },
];

/* ─── Staking Tiers ─── */
const stakingTiers = [
  { name: 'Flex', lockDays: '30', apy: '8.5%', minStake: '100 NXA', color: 'from-primary to-blue-400', badge: '' },
  { name: 'Growth', lockDays: '90', apy: '14%', minStake: '500 NXA', color: 'from-success to-emerald-400', badge: 'Popular' },
  { name: 'Power', lockDays: '180', apy: '20%', minStake: '2,000 NXA', color: 'from-warning to-amber-400', badge: '' },
  { name: 'Diamond', lockDays: '365', apy: '25%', minStake: '10,000 NXA', color: 'from-destructive to-pink-400', badge: 'Max Yield' },
];

/* ─── Distribution ─── */
const distribution = [
  { label: 'Community & Rewards', pct: 35, color: 'bg-primary' },
  { label: 'Staking Pool', pct: 25, color: 'bg-success' },
  { label: 'Development Fund', pct: 20, color: 'bg-warning' },
  { label: 'Team & Advisors', pct: 10, color: 'bg-accent' },
  { label: 'Liquidity & Exchange', pct: 10, color: 'bg-destructive' },
];

/* ─── Roadmap ─── */
const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Foundation',
    period: 'Q1 – Q2 2025',
    status: 'done' as const,
    items: ['Token launch & airdrop', 'Staking pools live', 'Signup bonus program', 'Initial exchange listing'],
  },
  {
    phase: 'Phase 2',
    title: 'Expansion',
    period: 'Q3 – Q4 2025',
    status: 'active' as const,
    items: ['Governance voting portal', 'Fee discount engine', 'Cross-chain bridge (BSC, Polygon)', 'Mobile staking interface'],
  },
  {
    phase: 'Phase 3',
    title: 'DeFi Integration',
    period: 'Q1 – Q2 2026',
    status: 'upcoming' as const,
    items: ['Liquidity farming pools', 'NXA-backed stablecoin', 'Institutional staking API', 'DAO treasury launch'],
  },
  {
    phase: 'Phase 4',
    title: 'Global Scale',
    period: 'Q3 2026+',
    status: 'upcoming' as const,
    items: ['Multi-chain deployment', 'Real-world asset tokenization', 'NXA payment card rewards', 'Ecosystem grants program'],
  },
];

const statusStyles = {
  done: 'bg-success/10 text-success border-success/30',
  active: 'bg-primary/10 text-primary border-primary/30',
  upcoming: 'bg-muted text-muted-foreground border-border',
};

const statusLabel = { done: 'Completed', active: 'In Progress', upcoming: 'Upcoming' };

/* ─── Supply Stats ─── */
const supplyStats = [
  { icon: Coins, value: '1,000,000,000', label: 'Max Supply' },
  { icon: Globe, value: '420,000,000', label: 'Circulating Supply' },
  { icon: Lock, value: '250,000,000', label: 'Staked' },
  { icon: TrendingUp, value: '$0.42', label: 'Token Price' },
];

export default function AboutNxa() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 animate-slide-up">
              <Coins className="w-4 h-4" />
              NXA Token
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up delay-100">
              The Fuel Behind
              <span className="gradient-text block">NEXA Ecosystem</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up delay-200">
              NexaCoin (NXA) powers staking, governance, fee discounts, and lending across the entire NEXA platform — aligning incentives for every user.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up delay-300">
              <Link to="/auth?mode=signup">
                <Button variant="gradient" size="lg" className="gap-2">
                  <Rocket className="w-5 h-5" /> Get 100 NXA Free
                </Button>
              </Link>
              <Link to="/savings">
                <Button variant="outline" size="lg" className="gap-2">
                  <Landmark className="w-5 h-5" /> Start Staking
                </Button>
              </Link>
              <Link to="/api-docs">
                <Button variant="outline" size="lg" className="gap-2">
                  <BookOpen className="w-5 h-5" /> API Docs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Supply Stats */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-8 sm:p-10">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {supplyStats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <s.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Live Burn Counter */}
        <BurnCounter />

        {/* Burn History & Leaderboard */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 sm:p-8">
                <BurnHistoryTimeline />
              </div>
              <div className="glass-card p-6 sm:p-8">
                <BurnLeaderboard />
              </div>
            </div>
          </div>
        </section>

        {/* Token Utility */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                What Can You Do With <span className="gradient-text">NXA</span>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                NXA isn't just a token — it's the key to unlocking every feature in the NEXA ecosystem.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {utilities.map((u) => (
                <div key={u.title} className="glass-card p-6 hover:bg-secondary/30 transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <u.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Staking Tiers */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-radial from-success/5 via-transparent to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Staking <span className="gradient-text">Tiers</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Choose the tier that fits your strategy — from flexible 30-day locks to maximum-yield annual commitments.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stakingTiers.map((tier) => (
                <div key={tier.name} className="glass-card p-6 relative overflow-hidden group hover:ring-1 hover:ring-primary/30 transition-all">
                  {tier.badge && (
                    <span className={cn(
                      'absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      'bg-gradient-to-r text-white',
                      tier.color
                    )}>
                      {tier.badge}
                    </span>
                  )}
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5', tier.color)}>
                    <Landmark className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{tier.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">APY:</span>
                      <span className="font-semibold text-foreground ml-auto">{tier.apy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Lock:</span>
                      <span className="font-semibold text-foreground ml-auto">{tier.lockDays} days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Min:</span>
                      <span className="font-semibold text-foreground ml-auto">{tier.minStake}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Token Distribution */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Token <span className="gradient-text">Distribution</span>
              </h2>
            </div>
            <div className="glass-card p-8">
              <div className="flex h-8 rounded-full overflow-hidden mb-8">
                {distribution.map((d) => (
                  <div
                    key={d.label}
                    className={cn('transition-all', d.color)}
                    style={{ width: `${d.pct}%` }}
                    title={`${d.label} — ${d.pct}%`}
                  />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {distribution.map((d) => (
                  <div key={d.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={cn('w-3 h-3 rounded-full', d.color)} />
                      <span className="text-sm text-foreground">{d.label}</span>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                NXA <span className="gradient-text">Roadmap</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Our journey from token launch to a fully decentralized financial ecosystem.
              </p>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />

              <div className="space-y-10">
                {roadmap.map((phase, idx) => (
                  <div key={phase.phase} className="relative flex gap-6 sm:gap-8">
                    {/* Timeline dot */}
                    <div className="relative z-10 shrink-0">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center border-2',
                        statusStyles[phase.status]
                      )}>
                        {phase.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : phase.status === 'active' ? (
                          <Zap className="w-5 h-5" />
                        ) : (
                          <Target className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="glass-card p-6 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{phase.phase}</span>
                        <span className={cn(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border',
                          statusStyles[phase.status]
                        )}>
                          {statusLabel[phase.status]}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{phase.period}</p>
                      <ul className="space-y-2">
                        {phase.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-card p-10 sm:p-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to Join the <span className="gradient-text">NXA Economy</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Sign up today and receive 100 NXA instantly. Start staking, trading, and governing the future of finance.
              </p>
              <Link to="/auth?mode=signup">
                <Button variant="gradient" size="lg" className="gap-2">
                  <Rocket className="w-5 h-5" /> Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
