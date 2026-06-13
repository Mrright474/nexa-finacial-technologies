import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Wallet, CreditCard, ArrowLeftRight, ArrowDownUp, TrendingUp, Settings, LogOut, User, Shield, BookOpen, Moon, Globe, BarChart3, Receipt, Landmark, Bell, Gift, Gem, ExternalLink } from 'lucide-react';
import { LEGACY_VERSE_URL, LEGACY_VERSE_LABEL, LEGACY_VERSE_ARIA } from '@/config/externalLinks';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { PackageType } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import nexaLogo from '@/assets/nexacoin-logo.png';

const MAX_SPARKLINE_POINTS = 20;

function useNxaPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const fetchPrice = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('crypto-prices');
      const nxa = data?.prices?.NXA;
      if (nxa) {
        setPrice((prev) => {
          if (prev !== null && prev !== nxa.usd) {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 1000);
          }
          return nxa.usd;
        });
        setChange24h(nxa.usd_24h_change || 0);
        setHistory((prev) => {
          const next = [...prev, nxa.usd];
          return next.length > MAX_SPARKLINE_POINTS ? next.slice(-MAX_SPARKLINE_POINTS) : next;
        });
      }
    } catch (e) {
      console.error('Failed to fetch NXA price', e);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, change24h, isPulsing, history };
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 40;
  const h = 16;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative group shrink-0">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline
          points={points}
          fill="none"
          stroke={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center px-2 py-1 rounded-md bg-popover border border-border shadow-lg whitespace-nowrap z-50">
        <span className="text-[10px] text-muted-foreground">
          L: <span className="text-foreground font-medium">${min.toFixed(4)}</span>{' '}
          H: <span className="text-foreground font-medium">${max.toFixed(4)}</span>
        </span>
      </div>
    </div>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPackageMenu, setShowPackageMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { packageType, setPackageType, userName } = useApp();
  const { unreadCount } = useNotifications();
  const { price: nxaPrice, change24h: nxaChange, isPulsing: nxaPulsing, history: nxaHistory } = useNxaPrice();

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/wallet') || location.pathname.startsWith('/cards') || location.pathname.startsWith('/crypto') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/transfers') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/trading') || location.pathname.startsWith('/bills') || location.pathname.startsWith('/savings') || location.pathname.startsWith('/rewards') || location.pathname.startsWith('/notifications') || location.pathname.startsWith('/swap') || location.pathname.startsWith('/lending');

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#packages', label: 'Packages' },
    { href: '/about-nxa', label: 'NXA Token', isRoute: true },
    { href: '#security', label: 'Security' },
    { href: '#download', label: 'Download' },
  ];

  const dashboardLinks = [
    { href: '/dashboard', label: 'Overview', icon: Wallet },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/cards', label: 'Cards', icon: CreditCard },
    { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { href: '/trading', label: 'Trading', icon: BarChart3 },
    { href: '/bills', label: 'Bills', icon: Receipt },
    { href: '/savings', label: 'Savings', icon: Landmark },
    { href: '/swap', label: 'Swap', icon: ArrowDownUp },
    { href: '/lending', label: 'Lending', icon: TrendingUp },
    { href: '/rewards', label: 'Rewards', icon: Gift },
  ];

  const packageOptions: { id: PackageType; name: string; icon: typeof BookOpen; gradient: string }[] = [
    { id: 'steward', name: 'Steward', icon: BookOpen, gradient: 'from-steward to-orange-500' },
    { id: 'amanah', name: 'Amanah', icon: Moon, gradient: 'from-amanah to-emerald-400' },
    { id: 'cultura', name: 'Cultura', icon: Globe, gradient: 'from-cultura to-purple-500' },
  ];

  const packageColors = {
    steward: 'from-steward to-orange-500',
    amanah: 'from-amanah to-emerald-400',
    cultura: 'from-cultura to-purple-500',
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePackageChange = async (pkg: PackageType) => {
    await setPackageType(pkg);
    setShowPackageMenu(false);
  };

  if (isDashboard && user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)] bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                <img src={nexaLogo} alt="NEXA" className="w-full h-full object-cover rounded-md" width={36} height={36} />
              </div>
              <span className="text-xl font-bold text-foreground">NEXA</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {dashboardLinks.map((link) => (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* NXA Price Ticker */}
              {nxaPrice !== null && (
                <Link to="/about-nxa" className={cn("hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border/50 hover:bg-secondary transition-all cursor-pointer", nxaPulsing && "ring-2 ring-primary/40 animate-pulse")}>
                  <span className="text-xs font-bold text-primary">NXA</span>
                  <Sparkline data={nxaHistory} positive={nxaChange >= 0} />
                  <span className="text-xs font-semibold text-foreground">${nxaPrice.toFixed(4)}</span>
                  <span className={cn("text-[10px] font-medium", nxaChange >= 0 ? "text-success" : "text-destructive")}>
                    {nxaChange >= 0 ? '▲' : '▼'} {Math.abs(nxaChange).toFixed(1)}%
                  </span>
                </Link>
              )}
              {/* Package Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowPackageMenu(!showPackageMenu)}
                  className={cn(
                    "flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "bg-gradient-to-r text-white",
                    packageColors[packageType]
                  )}
                >
                  {packageType.charAt(0).toUpperCase() + packageType.slice(1)}
                </button>
                
                {showPackageMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card p-2 animate-fade-in">
                    {packageOptions.map((pkg) => {
                      const Icon = pkg.icon;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => handlePackageChange(pkg.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                            packageType === pkg.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', pkg.gradient)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{pkg.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <a
                href={LEGACY_VERSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={LEGACY_VERSE_ARIA}
                className="hidden md:block"
              >
                <Button variant="ghost" size="sm" className="gap-2">
                  <Gem className="w-4 h-4" /> {LEGACY_VERSE_LABEL}
                </Button>
              </a>

              {isAdmin && (
                <Link to="/admin" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Shield className="w-4 h-4" /> Admin
                  </Button>
                </Link>
              )}

              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden sm:flex">
                <LogOut className="w-5 h-5" />
              </Button>
              
              <Link to="/profile" className="hidden sm:block">
                <div className="w-9 h-9 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <img src={nexaLogo} alt="NexaCoin" className="w-full h-full object-cover" width={36} height={36} />
                </div>
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 text-foreground"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dashboard nav */}
          {isOpen && (
            <div className="lg:hidden py-3 space-y-1 animate-fade-in border-t border-border/50">
              {dashboardLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <a
                href={LEGACY_VERSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={LEGACY_VERSE_ARIA}
                onClick={() => setIsOpen(false)}
              >
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Gem className="w-4 h-4" /> {LEGACY_VERSE_LABEL}
                </Button>
              </a>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <Shield className="w-4 h-4" /> Admin
                  </Button>
                </Link>
              )}
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" /> Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)] bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
              <img src={nexaLogo} alt="NEXA" className="w-full h-full object-cover rounded-md" width={36} height={36} />
            </div>
            <span className="text-xl font-bold text-foreground">NEXA</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              'isRoute' in link && link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              )
            )}
            <a
              href={LEGACY_VERSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={LEGACY_VERSE_ARIA}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-sm font-semibold"
            >
              <Gem className="w-4 h-4" /> {LEGACY_VERSE_LABEL}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {nxaPrice !== null && (
              <Link to="/about-nxa" className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border/50 hover:bg-secondary transition-all cursor-pointer", nxaPulsing && "ring-2 ring-primary/40 animate-pulse")}>
                <span className="text-xs font-bold text-primary">NXA</span>
                <Sparkline data={nxaHistory} positive={nxaChange >= 0} />
                <span className="text-xs font-semibold text-foreground">${nxaPrice.toFixed(4)}</span>
                <span className={cn("text-[10px] font-medium", nxaChange >= 0 ? "text-success" : "text-destructive")}>
                  {nxaChange >= 0 ? '▲' : '▼'} {Math.abs(nxaChange).toFixed(1)}%
                </span>
              </Link>
            )}
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map((link) =>
              'isRoute' in link && link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <Link to="/dashboard" className="block">
                    <Button variant="ghost" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="block">
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="block">
                    <Button variant="gradient" className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
