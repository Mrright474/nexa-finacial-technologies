import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Wallet, CreditCard, ArrowLeftRight, ArrowDownUp, TrendingUp, Settings, LogOut, User, Shield, BookOpen, Moon, Globe, BarChart3, Receipt, Landmark, Bell, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { PackageType } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';

function useNxaPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);

  const fetchPrice = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('crypto-prices');
      const nxa = data?.prices?.NXA;
      if (nxa) {
        setPrice(nxa.usd);
        setChange24h(nxa.usd_24h_change || 0);
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

  return { price, change24h };
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPackageMenu, setShowPackageMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { packageType, setPackageType, userName } = useApp();
  const { unreadCount } = useNotifications();

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
              <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", packageColors[packageType])}>
                <span className="text-white font-bold text-sm">N</span>
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <span className="text-white text-sm font-semibold">
                    {userName?.[0]?.toUpperCase() || 'U'}
                  </span>
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
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
          </div>

          <div className="hidden md:flex items-center gap-3">
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
