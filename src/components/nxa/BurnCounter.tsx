import { useEffect, useState, useRef } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function BurnCounter() {
  const [totalBurned, setTotalBurned] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const animRef = useRef<number>();

  const fetchBurned = async () => {
    const { data } = await supabase
      .from('nxa_burn_log')
      .select('amount');
    if (data) {
      const sum = data.reduce((acc, r) => acc + Number(r.amount), 0);
      setTotalBurned(sum);
    }
  };

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchBurned();

    const channel = supabase
      .channel('burn-counter')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nxa_burn_log' }, () => {
        fetchBurned();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Animate display value towards totalBurned
  useEffect(() => {
    const start = displayValue;
    const diff = totalBurned - start;
    if (Math.abs(diff) < 0.000001) { setDisplayValue(totalBurned); return; }

    const duration = 1500;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + diff * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalBurned]);

  const formatted = displayValue >= 1000
    ? displayValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : displayValue.toFixed(6);

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-radial from-destructive/10 via-transparent to-transparent animate-pulse" />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Fire icon with pulse ring */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center relative">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-destructive mb-1">
                Permanently Burned
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tabular-nums">
                {formatted} <span className="text-lg sm:text-xl text-muted-foreground font-medium">NXA</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tokens removed forever from the total supply through swap & trade fee burns
              </p>
            </div>

            {/* Decorative flame particles */}
            <div className="hidden lg:flex flex-col gap-2 opacity-40">
              {[1, 2, 3].map((i) => (
                <Flame
                  key={i}
                  className="w-5 h-5 text-destructive animate-bounce"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: `${1 + i * 0.3}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
