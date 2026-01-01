import { Button } from '@/components/ui/button';
import { Check, Cross, BookOpen, Moon, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const packages = [
  {
    id: 'steward',
    name: 'Steward',
    tagline: 'For the Faith-Driven',
    icon: BookOpen,
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
    features: [
      'Daily Bible verses & devotionals',
      'Tithe tracking & reminders',
      'Christian charity integrations',
      'Faith-based savings goals',
      'All core NEXA features',
      'Interest-bearing accounts available',
    ],
    accent: 'steward',
    buttonVariant: 'steward' as const,
  },
  {
    id: 'amanah',
    name: 'Amanah',
    tagline: 'Sharia-Compliant Finance',
    icon: Moon,
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    features: [
      'Zakat calculator & reminders',
      'Islamic finance education',
      'Halal investment screening',
      'Sadaqah & charity tools',
      'All core NEXA features',
      'Riba-free lending options',
    ],
    accent: 'amanah',
    buttonVariant: 'amanah' as const,
  },
  {
    id: 'cultura',
    name: 'Cultura',
    tagline: 'Global Citizen',
    icon: Globe,
    gradient: 'from-blue-500 to-purple-600',
    shadow: 'shadow-blue-500/20',
    popular: true,
    features: [
      'Neutral, global-ready design',
      'Full trading suite access',
      'Multi-currency optimization',
      'Global merchant network',
      'All core NEXA features',
      'Advanced analytics & tools',
    ],
    accent: 'cultura',
    buttonVariant: 'cultura' as const,
  },
];

export function Packages() {
  return (
    <section id="packages" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Choose Your
            <span className="gradient-text"> Experience</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Same powerful platform, personalized to your values. All packages include full wallet, card, and trading features.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={cn(
                'relative group glass-card p-8 hover:bg-white/10 transition-all duration-300 animate-slide-up',
                pkg.popular && 'ring-2 ring-primary',
                `delay-${(index + 1) * 100}`
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-purple-500 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center',
                    pkg.gradient
                  )}
                >
                  <pkg.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.tagline}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {pkg.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={cn('w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center', pkg.gradient)}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to={`/auth?mode=signup&package=${pkg.id}`}>
                <Button variant={pkg.buttonVariant} className="w-full" size="lg">
                  Get Started with {pkg.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          You can switch packages anytime. Core features remain the same across all packages.
        </p>
      </div>
    </section>
  );
}
