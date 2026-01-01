import { Shield, Lock, Eye, Fingerprint, Server, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted in transit and at rest using AES-256.',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Authentication',
    description: 'Face ID, Touch ID, and fingerprint login for maximum security.',
  },
  {
    icon: Shield,
    title: 'PCI DSS Compliant',
    description: 'Level 1 PCI DSS certified for secure card transactions.',
  },
  {
    icon: Eye,
    title: 'Fraud Detection',
    description: 'AI-powered monitoring detects and prevents suspicious activity.',
  },
  {
    icon: Server,
    title: 'Secure Infrastructure',
    description: 'SOC 2 Type II certified data centers with 24/7 monitoring.',
  },
  {
    icon: FileCheck,
    title: 'KYC/AML Compliant',
    description: 'Full regulatory compliance with global AML/CFT standards.',
  },
];

export function Security() {
  return (
    <section id="security" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-6">
              <Shield className="w-4 h-4 text-success" />
              <span>Bank-Grade Security</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Your Money,
              <br />
              <span className="text-success">Always Protected</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8">
              We use the same security standards as major banks. Your funds are insured and protected by multiple layers of security.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {securityFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl bg-secondary/50 animate-slide-up',
                    `delay-${(index + 1) * 100}`
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-slide-up delay-200">
            <div className="absolute inset-0 bg-gradient-to-r from-success/20 to-emerald-500/20 blur-3xl scale-110" />
            <div className="relative glass-card p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">$250,000</h3>
              <p className="text-muted-foreground mb-6">FDIC-equivalent insurance per account</p>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">Licensed & regulated</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">Cold storage for crypto</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">Real-time transaction alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
