import { Button } from '@/components/ui/button';
import { Apple, Play, Globe, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Download() {
  return (
    <section id="download" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-primary/5" />
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="glass-card p-8 sm:p-12 lg:p-16 text-center">
          <div className="max-w-3xl mx-auto animate-slide-up">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Start Your Journey
              <br />
              <span className="gradient-text">Today</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10">
              Download NEXA on your preferred platform and experience the future of finance.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button variant="glass" size="xl" className="gap-3">
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-[10px] opacity-70">Download on the</p>
                  <p className="font-semibold">App Store</p>
                </div>
              </Button>

              <Button variant="glass" size="xl" className="gap-3">
                <Play className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-[10px] opacity-70">Get it on</p>
                  <p className="font-semibold">Google Play</p>
                </div>
              </Button>

              <Link to="/dashboard">
                <Button variant="gradient" size="xl" className="gap-3">
                  <Globe className="w-6 h-6" />
                  <div className="text-left">
                    <p className="text-[10px] opacity-70">Use on</p>
                    <p className="font-semibold">Web Browser</p>
                  </div>
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span>✓ No credit card required</span>
              <span>✓ Free to download</span>
              <span>✓ Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
