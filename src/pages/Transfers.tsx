import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, User, Smartphone, Building2, 
  Globe, QrCode, History, Star, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const transferMethods = [
  { id: 'p2p', label: 'NEXA User', icon: User, description: 'Send to any NEXA user' },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone, description: 'MTN, Airtel, etc.' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, description: 'To bank account' },
  { id: 'international', label: 'International', icon: Globe, description: 'Cross-border transfers' },
];

const recentRecipients = [
  { name: 'Sarah Mwangi', type: 'NEXA', identifier: '@sarah.m', favorite: true },
  { name: 'John Kamara', type: 'MTN', identifier: '+256 700 123 456', favorite: true },
  { name: 'Maria Santos', type: 'NEXA', identifier: '@maria.s', favorite: false },
  { name: 'Ahmed Hassan', type: 'Bank', identifier: '****4521', favorite: false },
];

export default function Transfers() {
  const [selectedMethod, setSelectedMethod] = useState('p2p');
  const [amount, setAmount] = useState('');

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
                  <Label>Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-12 text-3xl font-bold h-16"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Available: $3,420.50</p>
                </div>

                <div>
                  <Label>Recipient</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder={selectedMethod === 'p2p' ? 'Enter username or email' : 'Enter phone or account number'}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Note (Optional)</Label>
                  <Input placeholder="What's this for?" className="mt-1" />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button variant="gradient" size="lg" className="flex-1 gap-2">
                    Send Money <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <QrCode className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Recipients */}
          <div className="space-y-6 animate-slide-up delay-200">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent</h3>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {recentRecipients.map((recipient, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                        {recipient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground">{recipient.type} • {recipient.identifier}</p>
                      </div>
                    </div>
                    {recipient.favorite && (
                      <Star className="w-4 h-4 text-warning fill-warning" />
                    )}
                  </button>
                ))}
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
