import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PriceAlert {
  id: string;
  symbol: string;
  target_price: number;
  condition: string;
  triggered: boolean;
  created_at: string;
}

const SUPPORTED_SYMBOLS = ['NXA', 'BTC', 'ETH', 'SOL', 'USDT', 'USDC'];

export function PriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('BTC');
  const [condition, setCondition] = useState('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setAlerts(data as PriceAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async () => {
    if (!user || !targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      toast.error('Enter a valid target price');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('price_alerts').insert({
      user_id: user.id,
      symbol,
      target_price: Number(targetPrice),
      condition,
    });
    if (error) {
      toast.error('Failed to create alert');
    } else {
      toast.success(`Alert set: ${symbol} ${condition} $${targetPrice}`);
      setTargetPrice('');
      setShowForm(false);
      fetchAlerts();
    }
    setSubmitting(false);
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('price_alerts').delete().eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert removed');
  };

  if (!user) return null;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Price Alerts
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="w-4 h-4" /> New Alert
        </Button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_SYMBOLS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Goes above</SelectItem>
                <SelectItem value="below">Goes below</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Target price"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              min="0"
              step="any"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={createAlert} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          No price alerts yet. Create one to get notified when prices hit your targets.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl transition-colors',
                alert.triggered ? 'bg-muted/30 opacity-60' : 'hover:bg-secondary/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  alert.triggered
                    ? 'bg-muted text-muted-foreground'
                    : alert.condition === 'above'
                      ? 'bg-success/20 text-success'
                      : 'bg-destructive/20 text-destructive'
                )}>
                  {alert.triggered ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : alert.condition === 'above' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.symbol} {alert.condition === 'above' ? '≥' : '≤'} ${Number(alert.target_price).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.triggered ? 'Triggered' : 'Active'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
