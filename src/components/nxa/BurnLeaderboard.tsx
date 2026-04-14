import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Flame, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderEntry {
  user_id: string;
  total_burned: number;
  burn_count: number;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const rankConfig = [
  { icon: Crown, color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-500 to-yellow-600', ring: 'ring-amber-400/50' },
  { icon: Medal, color: 'text-slate-300', bg: 'bg-gradient-to-br from-slate-400 to-slate-500', ring: 'ring-slate-300/50' },
  { icon: Medal, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-700 to-amber-800', ring: 'ring-amber-600/50' },
];

export function BurnLeaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc('get_burn_leaderboard', { p_limit: 10 });
      if (data) setEntries(data as LeaderEntry[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const formatAmount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(n < 1 ? 6 : 2);
  };

  const getInitials = (first: string | null, last: string | null) => {
    const f = first?.[0] || '';
    const l = last?.[0] || '';
    return (f + l).toUpperCase() || '??';
  };

  const getDisplayName = (entry: LeaderEntry) => {
    if (entry.first_name || entry.last_name) {
      return `${entry.first_name || ''} ${entry.last_name || ''}`.trim();
    }
    return `User ${entry.user_id.slice(0, 6)}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No burn contributors yet</p>
      </div>
    );
  }

  const maxBurned = entries[0]?.total_burned || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Top Burn Contributors
        </h4>
        <span className="text-xs text-muted-foreground">{entries.length} burners</span>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = entries[podiumIdx];
            if (!entry) return null;
            const rank = podiumIdx + 1;
            const config = rankConfig[podiumIdx];
            const RankIcon = config.icon;

            return (
              <div
                key={entry.user_id}
                className={cn(
                  'glass-card p-4 text-center relative overflow-hidden',
                  podiumIdx === 0 && 'row-start-1 scale-105 z-10'
                )}
              >
                <div className="absolute top-2 right-2">
                  <RankIcon className={cn('w-4 h-4', config.color)} />
                </div>
                <Avatar className={cn('w-12 h-12 mx-auto mb-2 ring-2', config.ring)}>
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className={cn('text-xs text-white font-bold', config.bg)}>
                    {getInitials(entry.first_name, entry.last_name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-semibold text-foreground truncate">{getDisplayName(entry)}</p>
                <p className="text-sm font-bold text-destructive mt-1">
                  🔥 {formatAmount(entry.total_burned)}
                </p>
                <p className="text-[10px] text-muted-foreground">{entry.burn_count} burns</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const barWidth = (entry.total_burned / maxBurned) * 100;
          
          return (
            <div
              key={entry.user_id}
              className="glass-card p-3 flex items-center gap-3 relative overflow-hidden group hover:bg-secondary/30 transition-colors"
            >
              {/* Background bar */}
              <div
                className="absolute inset-y-0 left-0 bg-destructive/5 transition-all"
                style={{ width: `${barWidth}%` }}
              />

              {/* Rank */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative z-10 text-xs font-bold',
                index < 3
                  ? cn(rankConfig[index].bg, 'text-white')
                  : 'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </div>

              {/* User */}
              <Avatar className="w-8 h-8 shrink-0 relative z-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(entry.first_name, entry.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-sm font-medium text-foreground truncate">{getDisplayName(entry)}</p>
                <p className="text-xs text-muted-foreground">{entry.burn_count} burn events</p>
              </div>

              <div className="text-right shrink-0 relative z-10">
                <p className="text-sm font-bold text-destructive flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {formatAmount(entry.total_burned)}
                </p>
                <p className="text-[10px] text-muted-foreground">NXA</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
