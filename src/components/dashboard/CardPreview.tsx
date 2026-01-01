import { useApp } from '@/context/AppContext';
import { NexaCard } from '@/components/cards/NexaCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CardPreview() {
  const { cards, packageType, user } = useApp();
  const primaryCard = cards[0];

  return (
    <div className="glass-card p-6 animate-slide-up delay-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Your Card</h3>
        <Link to="/cards">
          <Button variant="ghost" size="sm">Manage</Button>
        </Link>
      </div>

      {primaryCard ? (
        <div className="transform hover:scale-[1.02] transition-transform duration-300">
          <NexaCard
            packageType={packageType}
            type={primaryCard.type}
            lastFour={primaryCard.lastFour}
            balance={primaryCard.balance}
            holderName={`${user?.firstName} ${user?.lastName}`.toUpperCase()}
          />
        </div>
      ) : (
        <div className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
          <Button variant="outline" size="sm">Add Card</Button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Available Balance</span>
        <span className="font-semibold text-foreground">${primaryCard?.balance.toLocaleString()}</span>
      </div>
    </div>
  );
}
