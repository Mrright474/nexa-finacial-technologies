import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        {/* Welcome Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your money today.
          </p>
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
