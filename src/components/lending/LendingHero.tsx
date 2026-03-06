import { Landmark } from 'lucide-react';

export function LendingHero({ nexaCoinImg }: { nexaCoinImg: string }) {
  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lending & Credit</h1>
          <p className="text-muted-foreground">Borrow against your staked NXA instantly</p>
        </div>
      </div>
    </div>
  );
}
