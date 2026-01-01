import { useApp } from '@/context/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CryptoWidget() {
  const { cryptoAssets } = useApp();

  return (
    <div className="glass-card p-6 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Crypto Portfolio</h3>
        <Link to="/crypto">
          <Button variant="ghost" size="sm">Trade</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {cryptoAssets.slice(0, 4).map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-bold">
                {asset.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">{asset.symbol}</p>
                <p className="text-xs text-muted-foreground">{asset.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">${asset.value.toLocaleString()}</p>
              <div className={cn(
                'flex items-center justify-end gap-1 text-xs',
                asset.change24h >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {asset.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{asset.change24h >= 0 ? '+' : ''}{asset.change24h}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
