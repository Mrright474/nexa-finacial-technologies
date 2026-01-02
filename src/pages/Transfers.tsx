import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useWallet, Wallet, Transaction } from '@/hooks/useWallet';
import { 
  ArrowRight, User, Smartphone, Building2, 
  Globe, QrCode, History, Star, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const transferMethods = [
  { id: 'p2p', label: 'NEXA User', icon: User, description: 'Send to any NEXA user' },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone, description: 'MTN, Airtel, etc.' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, description: 'To bank account' },
  { id: 'international', label: 'International', icon: Globe, description: 'Cross-border transfers' },
];

export default function Transfers() {
  const { user, loading: authLoading } = useAuth();
  const { fetchWallets, fetchTransactions, transfer, loading: walletLoading } = useWallet();
  const navigate = useNavigate();
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('p2p');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    const [walletsData, txData] = await Promise.all([
      fetchWallets(),
      fetchTransactions()
    ]);
    setWallets(walletsData);
    setTransactions(txData);
    if (walletsData.length > 0) {
      setSelectedCurrency(walletsData[0].currency);
    }
    setLoadingData(false);
  };

  const handleTransfer = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !recipient) return;

    const success = await transfer(recipient, selectedCurrency, amountNum, note);
    if (success) {
      setAmount('');
      setRecipient('');
      setNote('');
      loadData();
    }
  };

  const selectedWallet = wallets.find(w => w.currency === selectedCurrency);

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
          <h1 className="text-3xl font-bold text-foreground">Send Money</h1>
          <p className="text-muted-foreground mt-1">Transfer funds instantly to anyone, anywhere</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Method Selection */}
            <div className="glass-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4">Select Transfer Method</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {transferMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      selectedMethod === method.id ? 'bg-primary' : 'bg-secondary'
                    )}>
                      <method.icon className={cn(
                        'w-6 h-6',
                        selectedMethod === method.id ? 'text-primary-foreground' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount & Recipient */}
            <div className="glass-card p-6 animate-slide-up delay-100">
              <h3 className="text-lg font-semibold text-foreground mb-4">Transfer Details</h3>
              
              <div className="space-y-4">
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
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : ''}
                    </span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-12 text-3xl font-bold h-16"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available: {selectedWallet ? Number(selectedWallet.balance).toLocaleString() : '0'} {selectedCurrency}
                  </p>
                </div>

                <div>
                  <Label>Recipient Email</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter recipient's email"
                      className="pl-10"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Note (Optional)</Label>
                  <Input 
                    placeholder="What's this for?" 
                    className="mt-1"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={handleTransfer}
                    disabled={walletLoading || !amount || !recipient}
                  >
                    {walletLoading ? 'Processing...' : 'Send Money'} <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-6 animate-slide-up delay-200">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent</h3>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.transaction_type === 'receive' || tx.transaction_type === 'deposit' 
                            ? 'bg-success/20' 
                            : 'bg-primary/20'
                        )}>
                          <span className="text-lg">
                            {tx.transaction_type === 'receive' || tx.transaction_type === 'deposit' ? '↓' : '↑'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {tx.recipient_name || tx.description || tx.transaction_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <p className={cn(
                        "font-semibold",
                        tx.transaction_type === 'receive' || tx.transaction_type === 'deposit'
                          ? 'text-success' 
                          : 'text-foreground'
                      )}>
                        {tx.transaction_type === 'receive' || tx.transaction_type === 'deposit' ? '+' : '-'}
                        {tx.currency === 'USD' ? '$' : ''}{Number(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transfer Fees */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Transfer Fees</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NEXA to NEXA</span>
                  <span className="text-success font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile Money</span>
                  <span className="text-foreground">1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Transfer</span>
                  <span className="text-foreground">$2.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">International</span>
                  <span className="text-foreground">From $5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
