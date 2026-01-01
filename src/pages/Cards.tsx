import { Navbar } from '@/components/layout/Navbar';
import { useApp } from '@/context/AppContext';
import { NexaCard } from '@/components/cards/NexaCard';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Lock, Unlock, Eye, EyeOff, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Cards() {
  const { cards, packageType, user } = useApp();
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id);
  const [showDetails, setShowDetails] = useState(false);

  const currentCard = cards.find(c => c.id === selectedCard);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground">Cards</h1>
          <p className="text-muted-foreground mt-1">Manage your virtual and physical cards</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="space-y-6 animate-slide-up">
            {currentCard && (
              <div className="transform hover:scale-[1.02] transition-transform duration-300">
                <NexaCard
                  packageType={packageType}
                  type={currentCard.type}
                  lastFour={currentCard.lastFour}
                  balance={currentCard.balance}
                  expiryDate={currentCard.expiryDate}
                  holderName={`${user?.firstName} ${user?.lastName}`.toUpperCase()}
                />
              </div>
            )}

            {/* Card Selector */}
            <div className="flex gap-3">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card.id)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all',
                    selectedCard === card.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground capitalize">{card.type} Card</p>
                      <p className="text-xs text-muted-foreground">•••• {card.lastFour}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Card Details & Actions */}
          <div className="space-y-6 animate-slide-up delay-100">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Card Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Card Number</p>
                    <p className="font-mono text-foreground">
                      {showDetails ? '4829 5612 3847 ' + currentCard?.lastFour : '•••• •••• •••• ' + currentCard?.lastFour}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowDetails(!showDetails)}>
                    {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Expiry</p>
                    <p className="font-mono text-foreground">{currentCard?.expiryDate}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <p className="text-sm text-muted-foreground">CVV</p>
                    <p className="font-mono text-foreground">{showDetails ? '847' : '•••'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Spending Limit</p>
                      <p className="text-foreground font-semibold">${currentCard?.spendLimit.toLocaleString()}/month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Used</p>
                      <p className="text-foreground">${((currentCard?.spendLimit || 0) - (currentCard?.balance || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                      style={{ width: `${((currentCard?.spendLimit || 0) - (currentCard?.balance || 0)) / (currentCard?.spendLimit || 1) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2 justify-start">
                  {currentCard?.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {currentCard?.status === 'active' ? 'Freeze Card' : 'Unfreeze'}
                </Button>
                <Button variant="outline" className="gap-2 justify-start">
                  <Settings className="w-4 h-4" /> Settings
                </Button>
                <Button variant="outline" className="gap-2 justify-start col-span-2">
                  <CreditCard className="w-4 h-4" /> Request Physical Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
