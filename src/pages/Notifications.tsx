import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Bell, ArrowUpRight, ArrowDownRight, Shield, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Trash2, BellOff, Filter, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'transaction' | 'price' | 'security';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: typeof ArrowUpRight;
  color: string;
}

const initialNotifications: Notification[] = [
  { id: '1', type: 'transaction', title: 'Payment Received', message: 'You received $500.00 from John Kamara', time: '2 min ago', read: false, icon: ArrowDownRight, color: 'from-green-500 to-emerald-500' },
  { id: '2', type: 'security', title: 'New Login Detected', message: 'New login from Chrome on macOS in Kampala, UG', time: '15 min ago', read: false, icon: Shield, color: 'from-blue-500 to-cyan-500' },
  { id: '3', type: 'price', title: 'BTC Price Alert', message: 'Bitcoin crossed $63,000 — up 2.34% today', time: '32 min ago', read: false, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
  { id: '4', type: 'transaction', title: 'Transfer Sent', message: 'You sent $150.00 to Sarah Mwangi', time: '2 hours ago', read: true, icon: ArrowUpRight, color: 'from-purple-500 to-pink-500' },
  { id: '5', type: 'security', title: 'Password Changed', message: 'Your password was successfully changed', time: '5 hours ago', read: true, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
  { id: '6', type: 'price', title: 'ETH Price Drop', message: 'Ethereum dropped below $1,900 — down 3.1%', time: '6 hours ago', read: true, icon: AlertTriangle, color: 'from-red-500 to-rose-500' },
  { id: '7', type: 'transaction', title: 'Bill Payment', message: 'UMEME electricity payment of UGX 50,000 confirmed', time: '1 day ago', read: true, icon: CheckCircle2, color: 'from-teal-500 to-cyan-500' },
  { id: '8', type: 'security', title: 'Two-Factor Enabled', message: '2FA has been enabled on your account', time: '2 days ago', read: true, icon: Shield, color: 'from-blue-500 to-indigo-500' },
  { id: '9', type: 'price', title: 'SOL Price Alert', message: 'Solana hit $150 — up 5.67% in 24h', time: '2 days ago', read: true, icon: TrendingUp, color: 'from-violet-500 to-purple-500' },
  { id: '10', type: 'transaction', title: 'Auto-Save Deposit', message: '$50.00 auto-saved to Emergency Fund', time: '3 days ago', read: true, icon: ArrowUpRight, color: 'from-cyan-500 to-blue-500' },
  { id: '11', type: 'security', title: 'Session Expired', message: 'Your session on Firefox was terminated', time: '4 days ago', read: true, icon: AlertTriangle, color: 'from-amber-500 to-yellow-500' },
  { id: '12', type: 'price', title: 'MATIC Staking Reward', message: 'You earned 11.25 MATIC from staking rewards', time: '5 days ago', read: true, icon: TrendingUp, color: 'from-purple-500 to-violet-500' },
];

export default function Notifications() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.type === activeTab);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification removed');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm bg-destructive text-destructive-foreground px-2.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Stay updated on transactions, prices & security</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllRead} className="gap-1">
                <CheckCircle2 className="w-4 h-4" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up delay-100">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-secondary/50 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="transaction" className="gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Transactions</TabsTrigger>
            <TabsTrigger value="price" className="gap-1"><TrendingUp className="w-3.5 h-3.5" /> Prices</TabsTrigger>
            <TabsTrigger value="security" className="gap-1"><Shield className="w-3.5 h-3.5" /> Security</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filtered.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        'glass-card p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-primary/30',
                        !n.read && 'border-l-4 border-l-primary bg-primary/5'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', n.color)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn('font-semibold text-sm', n.read ? 'text-muted-foreground' : 'text-foreground')}>
                            {n.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {n.time}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
