import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoanApplicationForm } from '@/components/lending/LoanApplicationForm';
import { ActiveLoans } from '@/components/lending/ActiveLoans';
import { LendingHero } from '@/components/lending/LendingHero';
import nexaCoinImg from '@/assets/nexa-coin.png';

export default function Lending() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [nxaBalance, setNxaBalance] = useState(0);
  const [nxaPrice, setNxaPrice] = useState(0);
  const [loans, setLoans] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [walletRes, loansRes, priceRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user.id).eq('currency', 'NXA').single(),
      supabase.from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.functions.invoke('crypto-prices'),
    ]);
    if (walletRes.data) setNxaBalance(Number(walletRes.data.balance));
    if (loansRes.data) setLoans(loansRes.data);
    if (priceRes.data?.prices?.NXA) setNxaPrice(priceRes.data.prices.NXA.usd);
    setLoadingData(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <LendingHero nexaCoinImg={nexaCoinImg} />
        
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <LoanApplicationForm
              userId={user.id}
              nxaBalance={nxaBalance}
              nxaPrice={nxaPrice}
              onSuccess={fetchData}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {/* Collateral Info */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Collateral Requirements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">2x Collateral</span>
                  <span className="text-foreground font-medium">5.0% APR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">3x Collateral</span>
                  <span className="text-success font-medium">3.5% APR</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Higher collateral = lower interest rate. Your NXA is locked until the loan is repaid.</p>
            </div>

            {/* NXA Balance Card */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={nexaCoinImg} alt="NXA" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-xs text-muted-foreground">Available NXA</p>
                  <p className="text-lg font-bold text-foreground">{nxaBalance.toLocaleString()} NXA</p>
                </div>
              </div>
              {nxaPrice > 0 && (
                <p className="text-xs text-muted-foreground">≈ ${(nxaBalance * nxaPrice).toFixed(2)} USD</p>
              )}
            </div>
          </div>
        </div>

        <ActiveLoans loans={loans} loading={loadingData} nxaPrice={nxaPrice} onRepaid={fetchData} />
      </main>
    </div>
  );
}
