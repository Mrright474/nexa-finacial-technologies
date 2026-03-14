import { Coins, Users, Landmark, ShieldCheck, Flame, Gift, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const distribution = [
  { label: 'Community & Rewards', pct: 35, color: 'bg-primary' },
  { label: 'Staking Pool', pct: 25, color: 'bg-success' },
  { label: 'Development Fund', pct: 20, color: 'bg-warning' },
  { label: 'Team & Advisors', pct: 10, color: 'bg-accent' },
  { label: 'Liquidity & Exchange', pct: 10, color: 'bg-destructive' },
];

const useCases = [
  { icon: Gift, title: 'Signup Bonus', description: 'Every new user receives 100 NXA to get started instantly.' },
  { icon: Landmark, title: 'Staking & Yield', description: 'Stake NXA for 8.5% – 25% APY across flexible lock periods.' },
  { icon: ShieldCheck, title: 'Loan Collateral', description: 'Use staked NXA as collateral for instant, low-interest loans.' },
  { icon: Flame, title: 'Fee Discounts', description: 'Pay swap and trading fees with NXA for up to 50% off.' },
  { icon: Users, title: 'Governance', description: 'Vote on platform decisions proportional to your NXA holdings.' },
  { icon: Coins, title: 'Referral Rewards', description: 'Earn NXA when you invite friends and they start transacting.' },
];

const supplyStats = [
  { value: '1B', label: 'Max Supply' },
  { value: '420M', label: 'Circulating' },
  { value: '25%', label: 'Staked' },
  { value: '$0.42', label: 'Token Price' },
];

export function Tokenomics() {
  return (
    <section id="tokenomics" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-radial from-success/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            <Coins className="w-4 h-4" />
            NXA Token
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Tokenomics &
            <span className="gradient-text"> Distribution</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            NXA powers every layer of the NEXA ecosystem — from staking rewards to governance votes.
          </p>
        </div>

        {/* Supply Stats */}
        <div className="glass-card p-8 sm:p-10 mb-12 animate-slide-up delay-100">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {supplyStats.map((s, i) => (
              <div key={s.label} className={`animate-slide-up delay-${(i + 1) * 100}`}>
                <p className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{s.value}</p>
                <p className="text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution + Use Cases */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Distribution Bar */}
          <div className="glass-card p-8 animate-slide-up delay-200">
            <h3 className="text-xl font-semibold text-foreground mb-6">Token Distribution</h3>

            {/* Stacked bar */}
            <div className="flex h-6 rounded-full overflow-hidden mb-8">
              {distribution.map((d) => (
                <div
                  key={d.label}
                  className={cn('transition-all', d.color)}
                  style={{ width: `${d.pct}%` }}
                  title={`${d.label} — ${d.pct}%`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {distribution.map((d) => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-3 h-3 rounded-full', d.color)} />
                    <span className="text-sm text-foreground">{d.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div className="glass-card p-8 animate-slide-up delay-300">
            <h3 className="text-xl font-semibold text-foreground mb-6">NXA Use Cases</h3>
            <div className="grid gap-4">
              {useCases.map((uc) => (
                <div key={uc.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <uc.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{uc.title}</p>
                    <p className="text-xs text-muted-foreground">{uc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-slide-up delay-400">
          <Link
            to="/about-nxa"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Learn more about NXA
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
