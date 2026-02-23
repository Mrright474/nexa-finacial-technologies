import { PackageType } from '@/types';
import { cn } from '@/lib/utils';
import { Wifi } from 'lucide-react';

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
    gradient: 'from-amber-700 via-yellow-600 to-amber-800',
    shimmer: 'from-yellow-400/0 via-yellow-300/40 to-yellow-400/0',
    name: 'STEWARD',
    tagline: 'Faithful Stewardship',
    accent: 'bg-amber-300/15 border border-amber-400/20',
    textAccent: 'text-amber-100/80',
    holographic: 'from-yellow-400 via-orange-300 to-amber-500',
    chipColor: 'from-yellow-200 to-yellow-400',
    networkLogo: 'VISA',
  },
  amanah: {
    gradient: 'from-emerald-800 via-teal-600 to-emerald-900',
    shimmer: 'from-emerald-400/0 via-emerald-300/40 to-emerald-400/0',
    name: 'AMANAH',
    tagline: 'Trust & Integrity',
    accent: 'bg-emerald-300/15 border border-emerald-400/20',
    textAccent: 'text-emerald-100/80',
    holographic: 'from-emerald-400 via-teal-300 to-green-500',
    chipColor: 'from-yellow-200 to-yellow-400',
    networkLogo: 'VISA',
  },
  cultura: {
    gradient: 'from-slate-900 via-indigo-900 to-slate-950',
    shimmer: 'from-blue-400/0 via-blue-300/30 to-blue-400/0',
    name: 'CULTURA',
    tagline: 'Global Citizen',
    accent: 'bg-blue-300/15 border border-blue-400/20',
    textAccent: 'text-blue-100/80',
    holographic: 'from-blue-400 via-purple-400 to-indigo-500',
    chipColor: 'from-yellow-200 to-yellow-400',
    networkLogo: 'VISA',
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
        'relative w-full max-w-md aspect-[1.586/1] rounded-2xl overflow-hidden',
        'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]',
        'group cursor-pointer',
        className
      )}
    >
      {/* Base Gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', config.gradient)} />

      {/* Metallic Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.08] bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />

      {/* Soft Light Refraction */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-1/2 -left-1/4 w-3/4 h-full bg-white/10 rounded-full blur-[80px] rotate-12" />
        <div className="absolute -bottom-1/3 -right-1/4 w-1/2 h-full bg-white/5 rounded-full blur-[60px]" />
      </div>

      {/* Holographic Strip */}
      <div className={cn(
        'absolute top-[22%] right-6 w-10 h-14 rounded-sm overflow-hidden opacity-60 group-hover:opacity-90 transition-opacity duration-500'
      )}>
        <div className={cn(
          'absolute inset-0 bg-gradient-to-b', config.holographic,
          'animate-pulse-glow'
        )} />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(255,255,255,0.15)_1px,rgba(255,255,255,0.15)_2px)]" />
      </div>

      {/* Shimmer Sweep Effect */}
      <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className={cn(
          'absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-in-out',
          'bg-gradient-to-r', config.shimmer
        )} />
      </div>

      {/* Card Content */}
      <div className="relative h-full flex flex-col justify-between text-white p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11px] font-bold tracking-[0.35em] opacity-90 drop-shadow-sm">NEXA</span>
              <span className={cn(
                'px-2.5 py-0.5 rounded-md text-[9px] font-bold tracking-[0.2em]',
                config.accent
              )}>
                {config.name}
              </span>
            </div>
            <p className={cn('text-[9px] tracking-[0.15em] mt-0.5', config.textAccent)}>
              {config.tagline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {type === 'virtual' && (
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 font-semibold tracking-wider">
                VIRTUAL
              </span>
            )}
            <Wifi className="w-4 h-4 rotate-90 opacity-50" />
          </div>
        </div>

        {/* EMV Chip */}
        <div className="flex items-center gap-5">
          <div className="w-[52px] h-[38px] rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative">
            <div className={cn('absolute inset-0 bg-gradient-to-br', config.chipColor)} />
            <div className="absolute inset-0 flex flex-col justify-center gap-[3px] px-[6px]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[3px] bg-yellow-700/25 rounded-full" />
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-yellow-700/20 rounded-sm" />
          </div>

          {/* Contactless Symbol */}
          <div className="flex flex-col items-center gap-[2px] opacity-40">
            <div className="w-3 h-1.5 border-t-2 border-white rounded-t-full" />
            <div className="w-5 h-2.5 border-t-2 border-white rounded-t-full" />
            <div className="w-7 h-3.5 border-t-2 border-white rounded-t-full" />
          </div>

          {balance !== undefined && (
            <div className="ml-auto text-right">
              <p className="text-[9px] uppercase tracking-widest opacity-50">Balance</p>
              <p className="text-xl font-bold tracking-tight drop-shadow-sm">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        {/* Card Number */}
        <div className="space-y-5">
          <div className="flex items-center gap-5 text-[17px] tracking-[0.25em] font-mono drop-shadow-sm">
            <span className="opacity-40">••••</span>
            <span className="opacity-40">••••</span>
            <span className="opacity-40">••••</span>
            <span className="font-semibold">{lastFour}</span>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 mb-1">Card Holder</p>
              <p className="text-[13px] font-semibold tracking-[0.12em] drop-shadow-sm">{holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 mb-1">Valid Thru</p>
              <p className="text-[13px] font-semibold tracking-wider drop-shadow-sm">{expiryDate}</p>
            </div>
            {/* Card Network Logo */}
            <div className="flex items-center ml-2">
              <div className="relative w-12 h-8 flex items-center justify-center">
                <div className="absolute w-7 h-7 rounded-full bg-red-500/80 -left-0.5" />
                <div className="absolute w-7 h-7 rounded-full bg-yellow-500/70 left-3" />
                <div className="absolute w-7 h-7 rounded-full bg-orange-500/50 left-1.5" style={{ mixBlendMode: 'multiply' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
    </div>
  );
}
