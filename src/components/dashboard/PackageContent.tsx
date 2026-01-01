import { useApp } from '@/context/AppContext';
import { BookOpen, Moon, Globe, Heart, Calculator, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const packageContent = {
  steward: {
    icon: BookOpen,
    gradient: 'from-steward to-orange-500',
    title: 'Daily Verse',
    quote: '"For where your treasure is, there your heart will be also." - Matthew 6:21',
    actions: [
      { icon: Heart, label: 'Track Tithe', description: 'You\'ve given $320 this month' },
      { icon: BookOpen, label: 'Devotional', description: 'Read today\'s reflection' },
    ],
  },
  amanah: {
    icon: Moon,
    gradient: 'from-amanah to-emerald-400',
    title: 'Daily Reminder',
    quote: '"Wealth is not in having many possessions, but true wealth is the richness of the soul."',
    actions: [
      { icon: Calculator, label: 'Zakat Due', description: 'Calculate your annual Zakat' },
      { icon: Heart, label: 'Sadaqah', description: 'Give to those in need' },
    ],
  },
  cultura: {
    icon: Globe,
    gradient: 'from-cultura to-purple-500',
    title: 'Market Insight',
    quote: 'Markets are up 1.2% today. Your portfolio is outperforming the index.',
    actions: [
      { icon: TrendingUp, label: 'Analytics', description: 'View detailed insights' },
      { icon: Globe, label: 'Global News', description: '3 new updates' },
    ],
  },
};

export function PackageContent() {
  const { packageType } = useApp();
  const content = packageContent[packageType];
  const Icon = content.icon;

  return (
    <div className="glass-card p-6 animate-slide-up delay-300">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', content.gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{content.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground italic mb-6 leading-relaxed">
        "{content.quote}"
      </p>

      <div className="space-y-3">
        {content.actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.label}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
            >
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center opacity-80', content.gradient)}>
                <ActionIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
