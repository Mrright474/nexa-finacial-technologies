import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Shield, Zap, Globe, X, Gem } from 'lucide-react';
import { LEGACY_VERSE_URL, LEGACY_VERSE_LABEL, LEGACY_VERSE_ARIA } from '@/config/externalLinks';
import { Link } from 'react-router-dom';
import { NexaCard } from '@/components/cards/NexaCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import demoVideo from '@/assets/demo-video.mp4';
import heroImage from '@/assets/hero-fintech.jpg';
import nexaLogo from '@/assets/nexacoin-logo.png';

export function Hero() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-[120px]" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Bank-grade security • PCI DSS Compliant</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">One App.</span>
              <br />
              <span className="gradient-text">Infinite</span>
              <br />
              <span className="text-foreground">Possibilities.</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg">
              Send money, trade crypto, manage cards, and access credit – all tailored to your values. Choose your package: Steward, Amanah, or Cultura.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="gradient" size="xl" className="gap-2">
                  Start Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="glass"
                size="xl"
                className="gap-2"
                onClick={() => setShowDemo(true)}
              >
                <Play className="w-5 h-5" /> Watch Demo
              </Button>
              <a
                href={LEGACY_VERSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={LEGACY_VERSE_ARIA}
              >
                <Button variant="outline" size="xl" className="gap-2">
                  <Gem className="w-5 h-5" /> {LEGACY_VERSE_LABEL}
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Instant Transfers</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">200+ Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Fully Insured</span>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-up delay-200">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-3xl scale-110" />
            {/* NexaCoin Logo */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 w-24 h-24 animate-pulse drop-shadow-[0_0_30px_hsl(var(--primary)/0.7)]">
              <img src={nexaLogo} alt="NexaCoin" className="w-full h-full object-contain" width={96} height={96} />
            </div>
            <div className="relative space-y-6 pt-8">
              {/* Floating Cards */}
              <div className="transform hover:scale-105 transition-transform duration-500">
                <NexaCard packageType="cultura" type="virtual" lastFour="4829" />
              </div>
              <div className="absolute top-28 -right-4 transform rotate-6 hover:rotate-0 transition-transform duration-500 opacity-80 scale-90">
                <NexaCard packageType="steward" type="virtual" lastFour="7291" />
              </div>
              <div className="absolute top-48 -left-8 transform -rotate-6 hover:rotate-0 transition-transform duration-500 opacity-60 scale-75">
                <NexaCard packageType="amanah" type="virtual" lastFour="3156" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-border overflow-hidden">
          <button
            onClick={() => setShowDemo(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <video
            src={demoVideo}
            controls
            autoPlay
            className="w-full aspect-video"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
