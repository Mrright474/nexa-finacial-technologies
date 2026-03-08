import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import {
  Bell, ArrowUpRight, ArrowDownRight, Shield, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Trash2, BellOff, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const iconMap: Record<string, typeof Bell> = {
  bell: Bell,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  shield: Shield,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2,
};

function getTypeCategory(type: string): string {
  if (type.includes('loan') || type.includes('transaction')) return 'transaction';
  if (type.includes('price') || type.includes('health')) return 'price';
  if (type.includes('security')) return 'security';
  return 'transaction';
}

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markRead, markAllRead, deleteNotification, clearAll } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => getTypeCategory(n.type) === activeTab);

  const handleMarkAllRead = () => { markAllRead(); toast.success('All notifications marked as read'); };
  const handleDelete = (id: string) => { deleteNotification(id); toast.success('Notification removed'); };
  const handleClearAll = () => { clearAll(); toast.success('All notifications cleared'); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
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
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead} className="gap-1">
                <CheckCircle2 className="w-4 h-4" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up delay-100">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-secondary/50 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="transaction" className="gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Loans</TabsTrigger>
            <TabsTrigger value="price" className="gap-1"><TrendingUp className="w-3.5 h-3.5" /> Health</TabsTrigger>
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
                  const Icon = iconMap[n.icon] || Bell;
                  const timeAgo = getTimeAgo(n.created_at);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
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
                              <Clock className="w-3 h-3" /> {timeAgo}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
