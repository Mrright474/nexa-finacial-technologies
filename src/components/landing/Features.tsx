import { Wallet, CreditCard, ArrowLeftRight, TrendingUp, Shield, Globe, Smartphone, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import cryptoBg from '@/assets/crypto-bg.jpg';
import securityShield from '@/assets/security-shield.jpg';

const features = [
  {
    icon: Wallet,
    title: 'Multi-Currency Wallets',
    description: 'Hold UGX, USD, EUR, and stablecoins in one place. Instant conversions at the best rates.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CreditCard,
    title: 'Virtual & Physical Cards',
    description: 'Get Visa/Mastercard cards branded to your package. Works worldwide, online and in-store.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: ArrowLeftRight,
    title: 'Instant Transfers',
    description: 'Send money to anyone, anywhere. P2P, mobile money, and bank transfers in seconds.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Crypto & Forex Trading',
    description: 'Trade 50+ cryptocurrencies and major forex pairs. Advanced charts and analytics included.',
    gradient: 'from-orange-500 to-red-500',
    image: cryptoBg,
  },
  {
    icon: Banknote,
    title: 'Lending & Credit',
    description: 'Access instant loans and credit lines. Interest-free options available for qualifying packages.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'End-to-end encryption, biometric auth, and PCI DSS compliance. Your money is always safe.',
    gradient: 'from-slate-500 to-zinc-500',
    image: securityShield,
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Works in 200+ countries. Local mobile money integration for Africa and emerging markets.',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile & Web',
    description: 'Seamless experience across iOS, Android, and web. Your wallet, wherever you are.',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Everything You Need,
            <span className="gradient-text"> One App</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From everyday payments to advanced trading – NEXA is the only financial app you'll ever need.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                'group glass-card p-6 hover:bg-white/10 transition-all duration-300 animate-slide-up overflow-hidden relative',
                `delay-${(index + 1) * 100}`
              )}
            >
              {feature.image && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                  <img src={feature.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="relative">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
                    'group-hover:scale-110 transition-transform duration-300',
                    feature.gradient
                  )}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
