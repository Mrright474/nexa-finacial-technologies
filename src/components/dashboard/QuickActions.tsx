import { Button } from '@/components/ui/button';
import { Send, Download, ArrowLeftRight, QrCode, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { icon: Send, label: 'Send', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Download, label: 'Receive', gradient: 'from-green-500 to-emerald-500' },
  { icon: ArrowLeftRight, label: 'Exchange', gradient: 'from-purple-500 to-pink-500' },
  { icon: QrCode, label: 'Pay', gradient: 'from-orange-500 to-red-500' },
  { icon: CreditCard, label: 'Card', gradient: 'from-slate-500 to-zinc-500' },
  { icon: Smartphone, label: 'Mobile', gradient: 'from-amber-500 to-yellow-500' },
];

export function QuickActions() {
  return (
    <div className="glass-card p-6 animate-slide-up delay-100">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
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
