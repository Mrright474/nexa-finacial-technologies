import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useWallet, Wallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowUpRight, ArrowDownLeft, Plus, TrendingUp, TrendingDown,
  Eye, EyeOff, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const currencyIcons: Record<string, string> = {
  UGX: '🇺🇬',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  USDT: '₮',
  BTC: '₿',
  ETH: 'Ξ',
  USDC: '$',
};

const cryptoOptions = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'XRP'];

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const { fetchWallets, deposit, withdraw, addCryptoWallet, loading: walletLoading } = useWallet();
  const navigate = useNavigate();
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [addWalletModal, setAddWalletModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadWallets();
    }
  }, [user]);

  const loadWallets = async () => {
    setLoadingWallets(true);
    const data = await fetchWallets();
    setWallets(data);
    setLoadingWallets(false);
  };

  const totalBalance = wallets.reduce((acc, wallet) => {
    if (wallet.currency === 'UGX') return acc + Number(wallet.balance) / 3700;
    if (wallet.currency === 'EUR') return acc + Number(wallet.balance) * 1.08;
    if (wallet.currency === 'BTC') return acc + Number(wallet.balance) * 63000;
    if (wallet.currency === 'ETH') return acc + Number(wallet.balance) * 1950;
    return acc + Number(wallet.balance);
  }, 0);

  const handleDeposit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const success = await deposit(selectedCurrency, amountNum);
    if (success) {
      setDepositModal(false);
      setAmount('');
      loadWallets();
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const success = await withdraw(selectedCurrency, amountNum);
    if (success) {
      setWithdrawModal(false);
      setAmount('');
      loadWallets();
    }
  };

  const handleAddWallet = async (currency: string) => {
    const success = await addCryptoWallet(currency);
    if (success) {
      setAddWalletModal(false);
      loadWallets();
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your currencies and balances</p>
        </div>

        {/* Total Balance Card */}
        <div className="glass-card p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <h2 className="text-5xl font-bold text-foreground">
                {showBalance ? `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
              </h2>
            </div>
            <div className="flex gap-3">
              <Button variant="gradient" className="gap-2" onClick={() => setDepositModal(true)}>
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setWithdrawModal(true)}>
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingWallets ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No wallets yet. Deposit funds to create your first wallet.
            </div>
          ) : (
            wallets.map((wallet, index) => (
              <div
                key={wallet.id}
                className={cn(
                  'glass-card p-6 hover:bg-white/10 transition-all cursor-pointer group animate-slide-up',
                  `delay-${(index + 1) * 100}`
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                      {currencyIcons[wallet.currency] || wallet.currency[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{wallet.currency}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wallet.wallet_type}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {showBalance ? (
                      <>
                        {wallet.currency === 'UGX' && 'UGX '}
                        {wallet.currency === 'USD' && '$'}
                        {wallet.currency === 'EUR' && '€'}
                        {Number(wallet.balance).toLocaleString(undefined, {
                          minimumFractionDigits: wallet.wallet_type === 'crypto' ? 4 : 2,
                          maximumFractionDigits: wallet.wallet_type === 'crypto' ? 8 : 2,
                        })}
                      </>
                    ) : '••••'}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Add Currency Card */}
          <div 
            onClick={() => setAddWalletModal(true)}
            className="glass-card p-6 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer animate-slide-up delay-500"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Add Currency</p>
          </div>
        </div>

        {/* Deposit Modal */}
        <Dialog open={depositModal} onOpenChange={setDepositModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit Funds</DialogTitle>
              <DialogDescription>Add funds to your wallet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Currency</Label>
                <select 
                  className="w-full mt-1 p-3 rounded-xl bg-secondary border border-border text-foreground"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="USDT">USDT - Tether</option>
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="ETH">ETH - Ethereum</option>
                </select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="mt-1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button 
                variant="gradient" 
                className="w-full" 
                onClick={handleDeposit}
                disabled={walletLoading}
              >
                {walletLoading ? 'Processing...' : 'Deposit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal */}
        <Dialog open={withdrawModal} onOpenChange={setWithdrawModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>Withdraw from your wallet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Currency</Label>
                <select 
                  className="w-full mt-1 p-3 rounded-xl bg-secondary border border-border text-foreground"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  {wallets.map(w => (
                    <option key={w.currency} value={w.currency}>
                      {w.currency} - Balance: {Number(w.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="mt-1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button 
                variant="gradient" 
                className="w-full" 
                onClick={handleWithdraw}
                disabled={walletLoading}
              >
                {walletLoading ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Wallet Modal */}
        <Dialog open={addWalletModal} onOpenChange={setAddWalletModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Crypto Wallet</DialogTitle>
              <DialogDescription>Choose a cryptocurrency to add</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {cryptoOptions.map(crypto => (
                <Button
                  key={crypto}
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleAddWallet(crypto)}
                  disabled={walletLoading || wallets.some(w => w.currency === crypto)}
                >
                  <span className="text-xl">{currencyIcons[crypto] || crypto[0]}</span>
                  <span>{crypto}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
