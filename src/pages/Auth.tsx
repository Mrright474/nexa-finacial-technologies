import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft, Mail, Phone, Lock, User, BookOpen, Moon, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { PackageType } from '@/types';

const packages = [
  { id: 'steward', name: 'Steward', icon: BookOpen, gradient: 'from-steward to-orange-500', description: 'Faith-driven finance' },
  { id: 'amanah', name: 'Amanah', icon: Moon, gradient: 'from-amanah to-emerald-400', description: 'Sharia-compliant' },
  { id: 'cultura', name: 'Cultura', icon: Globe, gradient: 'from-cultura to-purple-500', description: 'Global citizen' },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setPackageType } = useApp();
  
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const initialPackage = searchParams.get('package') as PackageType | null;

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(initialPackage ? 2 : 1);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(initialPackage);

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setPackageType(pkg);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: navigate to dashboard
    if (selectedPackage) {
      setPackageType(selectedPackage);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/30 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-3xl font-bold text-foreground">NEXA</span>
          </Link>

          <h1 className="text-5xl font-bold text-foreground mb-6">
            {mode === 'signin' ? 'Welcome Back' : 'Join NEXA'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            {mode === 'signin'
              ? 'Sign in to access your wallet, cards, and financial tools.'
              : 'Create your account and choose the experience that fits your values.'}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-muted-foreground">Back</span>
          </Link>

          {mode === 'signup' && step === 1 ? (
            // Package Selection Step
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Package</h2>
              <p className="text-muted-foreground mb-8">
                Select the experience that aligns with your values. You can change anytime.
              </p>

              <div className="space-y-4 mb-8">
                {packages.map((pkg) => {
                  const Icon = pkg.icon;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handlePackageSelect(pkg.id as PackageType)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                        selectedPackage === pkg.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      )}
                    >
                      <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center', pkg.gradient)}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now →
              </button>
            </div>
          ) : (
            // Sign In / Sign Up Form
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {mode === 'signin'
                  ? 'Enter your credentials to continue'
                  : selectedPackage
                    ? `Setting up your ${packages.find(p => p.id === selectedPackage)?.name} account`
                    : 'Enter your details to get started'}
              </p>

              <div className="space-y-4">
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="firstName" placeholder="Alex" className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Nakamura" className="mt-1" />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10" />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="+256 700 123 456" className="pl-10" />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {mode === 'signin' && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>
                )}
              </div>

              <Button type="submit" variant="gradient" className="w-full mt-6" size="lg">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    if (mode === 'signin') setStep(1);
                  }}
                  className="text-primary hover:underline"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>

              {mode === 'signup' && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground"
                >
                  ← Change package
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
