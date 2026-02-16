import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Smartphone, Zap, Wifi, Tv, Droplets, GraduationCap, 
  Heart, ShieldCheck, CheckCircle2, ArrowRight, Star
} from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'airtime', label: 'Airtime', icon: Smartphone, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'data', label: 'Data Bundles', icon: Wifi, gradient: 'from-purple-500 to-pink-500' },
  { id: 'electricity', label: 'Electricity', icon: Zap, gradient: 'from-amber-500 to-yellow-500' },
  { id: 'water', label: 'Water', icon: Droplets, gradient: 'from-teal-500 to-cyan-500' },
  { id: 'tv', label: 'TV & Cable', icon: Tv, gradient: 'from-red-500 to-rose-500' },
  { id: 'education', label: 'Education', icon: GraduationCap, gradient: 'from-green-500 to-emerald-500' },
  { id: 'health', label: 'Health Insurance', icon: Heart, gradient: 'from-pink-500 to-rose-500' },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck, gradient: 'from-slate-500 to-zinc-500' },
];

const providers: Record<string, { id: string; name: string; logo: string }[]> = {
  airtime: [
    { id: 'mtn', name: 'MTN Uganda', logo: '🟡' },
    { id: 'airtel', name: 'Airtel Uganda', logo: '🔴' },
    { id: 'glo', name: 'Glo Mobile', logo: '🟢' },
    { id: 'safaricom', name: 'Safaricom', logo: '🟢' },
  ],
  data: [
    { id: 'mtn-data', name: 'MTN Data', logo: '🟡' },
    { id: 'airtel-data', name: 'Airtel Data', logo: '🔴' },
    { id: 'safaricom-data', name: 'Safaricom Data', logo: '🟢' },
  ],
  electricity: [
    { id: 'umeme', name: 'UMEME Yaka', logo: '⚡' },
    { id: 'wenreco', name: 'WENRECO', logo: '💡' },
  ],
  water: [{ id: 'nwsc', name: 'NWSC', logo: '💧' }],
  tv: [
    { id: 'dstv', name: 'DStv', logo: '📺' },
    { id: 'gotv', name: 'GOtv', logo: '📡' },
    { id: 'startimes', name: 'StarTimes', logo: '⭐' },
  ],
  education: [{ id: 'school', name: 'School Fees', logo: '🎓' }],
  health: [{ id: 'nhif', name: 'Health Insurance', logo: '🏥' }],
  insurance: [{ id: 'insurance', name: 'General Insurance', logo: '🛡️' }],
};

const dataBundles = [
  { id: '1', name: 'Daily 100MB', amount: 500, validity: '24hrs' },
  { id: '2', name: 'Weekly 1GB', amount: 3000, validity: '7 days' },
  { id: '3', name: 'Monthly 5GB', amount: 15000, validity: '30 days' },
  { id: '4', name: 'Monthly 10GB', amount: 25000, validity: '30 days' },
  { id: '5', name: 'Monthly 25GB', amount: 50000, validity: '30 days' },
  { id: '6', name: 'Unlimited Monthly', amount: 100000, validity: '30 days' },
];

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function BillPayments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('airtime');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);
    toast.success('Payment successful!');
    setTimeout(() => setSuccess(false), 3000);
  };

  const currentProviders = providers[selectedCategory] || [];
  const needsPhone = ['airtime', 'data'].includes(selectedCategory);
  const needsMeter = ['electricity', 'water'].includes(selectedCategory);

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
          <h1 className="text-3xl font-bold text-foreground">Bill Payments</h1>
          <p className="text-muted-foreground mt-1">Pay bills, buy airtime & data bundles instantly</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4">Select Service</h3>
              <div className="grid grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedProvider('');
                      setAmount('');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                      selectedCategory === cat.id
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                      cat.gradient
                    )}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Selection */}
            <div className="glass-card p-6 animate-slide-up delay-100">
              <h3 className="text-lg font-semibold text-foreground mb-4">Select Provider</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentProviders.map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => setSelectedProvider(prov.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      selectedProvider === prov.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl">{prov.logo}</span>
                    <span className="font-medium text-foreground text-sm">{prov.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {selectedProvider && (
              <div className="glass-card p-6 animate-slide-up delay-200">
                <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>
                <div className="space-y-4">
                  {needsPhone && (
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+256 7XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {needsMeter && (
                    <div>
                      <Label>Meter / Account Number</Label>
                      <Input
                        placeholder="Enter your meter number"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {selectedCategory === 'data' ? (
                    <div>
                      <Label>Select Bundle</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {dataBundles.map((bundle) => (
                          <button
                            key={bundle.id}
                            onClick={() => setAmount(String(bundle.amount))}
                            className={cn(
                              'p-4 rounded-xl border-2 text-left transition-all',
                              amount === String(bundle.amount)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <p className="font-semibold text-foreground">{bundle.name}</p>
                            <p className="text-sm text-muted-foreground">{bundle.validity}</p>
                            <p className="text-primary font-bold mt-1">
                              UGX {bundle.amount.toLocaleString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Amount (UGX)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 text-2xl font-bold h-14"
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quickAmounts.map((qa) => (
                          <button
                            key={qa}
                            onClick={() => setAmount(String(qa))}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                              amount === String(qa)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            )}
                          >
                            {qa.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full gap-2 mt-4"
                    onClick={handlePayment}
                    disabled={processing || !amount}
                  >
                    {processing ? (
                      'Processing...'
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Payment Successful
                      </>
                    ) : (
                      <>
                        Pay UGX {Number(amount || 0).toLocaleString()} <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up delay-200">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <Star className="w-5 h-5 inline mr-2 text-warning" />
                Favorites
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'MTN Airtime - 0770XXX', amount: 'UGX 5,000' },
                  { name: 'UMEME Yaka - 14203XXXX', amount: 'UGX 50,000' },
                  { name: 'DStv - 102XXXX', amount: 'UGX 79,000' },
                ].map((fav, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{fav.name}</p>
                      <p className="text-xs text-muted-foreground">{fav.amount}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Payments</h3>
              <div className="space-y-3">
                {[
                  { service: 'MTN Airtime', amount: 'UGX 10,000', time: '2 hours ago', status: 'completed' },
                  { service: 'UMEME Yaka', amount: 'UGX 100,000', time: 'Yesterday', status: 'completed' },
                  { service: 'Airtel Data 5GB', amount: 'UGX 15,000', time: '3 days ago', status: 'completed' },
                ].map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{payment.service}</p>
                      <p className="text-xs text-muted-foreground">{payment.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{payment.amount}</p>
                      <p className="text-xs text-success">✓ {payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
