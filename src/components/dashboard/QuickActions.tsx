import { Send, Download, ArrowLeftRight, BarChart3, CreditCard, Smartphone, Receipt, TrendingUp, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: Send, label: 'Send', gradient: 'from-blue-500 to-cyan-500', path: '/transfers' },
  { icon: Download, label: 'Receive', gradient: 'from-green-500 to-emerald-500', path: '/wallet' },
  { icon: ArrowLeftRight, label: 'Exchange', gradient: 'from-purple-500 to-pink-500', path: '/crypto' },
  { icon: BarChart3, label: 'Trade', gradient: 'from-orange-500 to-red-500', path: '/trading' },
  { icon: Receipt, label: 'Bills', gradient: 'from-amber-500 to-yellow-500', path: '/bills' },
  { icon: CreditCard, label: 'Cards', gradient: 'from-slate-500 to-zinc-500', path: '/cards' },
  { icon: PiggyBank, label: 'Save', gradient: 'from-teal-500 to-cyan-500', path: '/savings' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6 animate-slide-up delay-100">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary/50 transition-all group"
          >
            <div
              className={cn(
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                'group-hover:scale-110 transition-transform',
                action.gradient
              )}
            >
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
