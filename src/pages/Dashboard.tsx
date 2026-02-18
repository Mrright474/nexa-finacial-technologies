import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { WalletOverview } from '@/components/dashboard/WalletOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { CardPreview } from '@/components/dashboard/CardPreview';
import { CryptoWidget } from '@/components/dashboard/CryptoWidget';
import { PackageContent } from '@/components/dashboard/PackageContent';
import { KycUpload } from '@/components/kyc/KycUpload';
import { Bell, ArrowDownRight, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import cryptoBg from '@/assets/crypto-bg.jpg';

const recentNotifications = [
  { id: '1', title: 'Payment Received', message: '$500.00 from John K.', time: '2m', icon: ArrowDownRight, color: 'from-green-500 to-emerald-500' },
  { id: '2', title: 'New Login', message: 'Chrome on macOS', time: '15m', icon: Shield, color: 'from-blue-500 to-cyan-500' },
  { id: '3', title: 'BTC Alert', message: 'Crossed $63,000', time: '32m', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { userName } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Header with background */}
        <div className="mb-8 animate-slide-up relative overflow-hidden rounded-2xl glass-card p-6">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
            <img src={cryptoBg} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy" />
          </div>
          <div className="relative">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your money today.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <WalletOverview />
            <QuickActions />
            <RecentTransactions />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini Notifications */}
            <div className="glass-card p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Notifications
                </h3>
                <Link to="/notifications" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentNotifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', n.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <CardPreview />
            <KycUpload />
            <CryptoWidget />
            <PackageContent />
          </div>
        </div>
      </main>
    </div>
  );
}
