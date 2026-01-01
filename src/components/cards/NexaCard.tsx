import { PackageType } from '@/types';
import { cn } from '@/lib/utils';
import { Wifi, CreditCard } from 'lucide-react';

interface NexaCardProps {
  packageType: PackageType;
  type: 'virtual' | 'physical';
  lastFour: string;
  balance?: number;
  expiryDate?: string;
  holderName?: string;
  className?: string;
}

const packageConfig = {
  steward: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-600',
    name: 'STEWARD',
    tagline: 'Faithful Stewardship',
    accent: 'bg-amber-400/20',
    textAccent: 'text-amber-200',
  },
  amanah: {
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    name: 'AMANAH',
    tagline: 'Trust & Integrity',
    accent: 'bg-emerald-400/20',
    textAccent: 'text-emerald-200',
  },
  cultura: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    name: 'CULTURA',
    tagline: 'Global Citizen',
    accent: 'bg-blue-400/20',
    textAccent: 'text-blue-200',
  },
};

export function NexaCard({
  packageType,
  type,
  lastFour,
  balance,
  expiryDate = '12/28',
  holderName = 'ALEX NAKAMURA',
  className,
}: NexaCardProps) {
  const config = packageConfig[packageType];

  return (
    <div
      className={cn(
        'relative w-full max-w-md aspect-[1.586/1] rounded-2xl p-6 overflow-hidden shadow-2xl',
        'bg-gradient-to-br',
        config.gradient,
        className
      )}
    >
      {/* Card Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,white_0%,transparent_50%)]" />
      </div>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Card Content */}
      <div className="relative h-full flex flex-col justify-between text-white">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium tracking-widest opacity-80">NEXA</span>
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', config.accent)}>
                {config.name}
              </span>
            </div>
            <p className={cn('text-[10px] tracking-wide', config.textAccent)}>{config.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            {type === 'virtual' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-medium">VIRTUAL</span>
            )}
            <Wifi className="w-5 h-5 rotate-90 opacity-80" />
          </div>
        </div>

        {/* Chip */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg">
            <div className="w-full h-full grid grid-cols-3 gap-px p-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-yellow-600/40 rounded-sm" />
              ))}
            </div>
          </div>
          {balance !== undefined && (
            <div>
              <p className="text-[10px] opacity-70">Balance</p>
              <p className="text-lg font-bold">${balance.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Card Number */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-lg tracking-[0.2em] font-mono">
            <span className="opacity-60">••••</span>
            <span className="opacity-60">••••</span>
            <span className="opacity-60">••••</span>
            <span>{lastFour}</span>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] opacity-60 mb-0.5">CARD HOLDER</p>
              <p className="text-sm font-medium tracking-wider">{holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-60 mb-0.5">EXPIRES</p>
              <p className="text-sm font-medium">{expiryDate}</p>
            </div>
            <div className="flex items-center">
              <CreditCard className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
