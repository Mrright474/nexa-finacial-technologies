import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Wallet, CreditCard, ArrowLeftRight, TrendingUp, Settings, LogOut, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, packageType } = useApp();

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/wallet') || location.pathname.startsWith('/cards') || location.pathname.startsWith('/crypto') || location.pathname.startsWith('/admin');

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#packages', label: 'Packages' },
    { href: '#security', label: 'Security' },
    { href: '#download', label: 'Download' },
  ];

  const dashboardLinks = [
    { href: '/dashboard', label: 'Overview', icon: Wallet },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/cards', label: 'Cards', icon: CreditCard },
    { href: '/crypto', label: 'Crypto', icon: TrendingUp },
    { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  ];

  const packageColors = {
    steward: 'from-steward to-orange-500',
    amanah: 'from-amanah to-emerald-400',
    cultura: 'from-cultura to-purple-500',
  };

  if (isDashboard) {
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

            <div className="hidden md:flex items-center gap-1">
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

            <div className="flex items-center gap-3">
              <Link to="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.firstName[0]}{user?.lastName[0]}
                </span>
              </div>
            </div>
          </div>
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
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="gradient">Get Started</Button>
            </Link>
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
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-2">
              <Link to="/auth" className="block">
                <Button variant="ghost" className="w-full">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup" className="block">
                <Button variant="gradient" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
