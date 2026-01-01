import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, CreditCard, TrendingUp, AlertTriangle, 
  Search, Filter, Download, Settings, Shield,
  ArrowUpRight, ArrowDownLeft, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Total Users', value: '2,847,392', change: '+12.5%', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Cards', value: '1,234,567', change: '+8.2%', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
  { label: 'Transaction Volume', value: '$5.2B', change: '+24.1%', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  { label: 'Fraud Alerts', value: '23', change: '-15%', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
];

const recentUsers = [
  { id: 1, name: 'Sarah Mwangi', email: 'sarah@email.com', package: 'amanah', status: 'verified', joined: '2 hours ago' },
  { id: 2, name: 'John Kamara', email: 'john@email.com', package: 'steward', status: 'pending', joined: '5 hours ago' },
  { id: 3, name: 'Alex Chen', email: 'alex@email.com', package: 'cultura', status: 'verified', joined: '1 day ago' },
  { id: 4, name: 'Maria Santos', email: 'maria@email.com', package: 'cultura', status: 'verified', joined: '1 day ago' },
  { id: 5, name: 'Ahmed Hassan', email: 'ahmed@email.com', package: 'amanah', status: 'rejected', joined: '2 days ago' },
];

const recentTransactions = [
  { id: 'TX001', user: 'Sarah M.', type: 'deposit', amount: 5000, currency: 'USD', status: 'completed', time: '2 min ago' },
  { id: 'TX002', user: 'John K.', type: 'withdrawal', amount: 1200, currency: 'USD', status: 'pending', time: '15 min ago' },
  { id: 'TX003', user: 'Alex C.', type: 'exchange', amount: 0.5, currency: 'BTC', status: 'completed', time: '1 hour ago' },
  { id: 'TX004', user: 'Maria S.', type: 'transfer', amount: 3500000, currency: 'UGX', status: 'completed', time: '2 hours ago' },
];

const packageColors = {
  steward: 'bg-steward/20 text-steward',
  amanah: 'bg-amanah/20 text-amanah',
  cultura: 'bg-cultura/20 text-cultura',
};

const statusColors = {
  verified: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  rejected: 'bg-destructive/20 text-destructive',
  completed: 'bg-success/20 text-success',
};

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage your platform</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button variant="gradient" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn('glass-card p-6 animate-slide-up', `delay-${(index + 1) * 100}`)}
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  stat.change.startsWith('+') ? 'text-success' : 'text-destructive'
                )}>
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground mt-4">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users Table */}
          <div className="glass-card p-6 animate-slide-up delay-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Users</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9 w-40" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', packageColors[user.package as keyof typeof packageColors])}>
                      {user.package}
                    </span>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[user.status as keyof typeof statusColors])}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="w-full mt-4">View All Users</Button>
          </div>

          {/* Transactions Table */}
          <div className="glass-card p-6 animate-slide-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Activity className="w-4 h-4" /> Live
              </Button>
            </div>

            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      tx.type === 'deposit' || tx.type === 'transfer' ? 'bg-success/20' : 'bg-primary/20'
                    )}>
                      {tx.type === 'deposit' ? (
                        <ArrowDownLeft className="w-5 h-5 text-success" />
                      ) : tx.type === 'withdrawal' ? (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.user}</p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.type} • {tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {tx.currency === 'UGX' ? 'UGX ' : tx.currency === 'BTC' ? '₿' : '$'}
                      {tx.amount.toLocaleString()}
                    </p>
                    <span className={cn('text-xs font-medium capitalize', statusColors[tx.status as keyof typeof statusColors])}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="w-full mt-4">View All Transactions</Button>
          </div>
        </div>

        {/* Security Panel */}
        <div className="glass-card p-6 mt-8 animate-slide-up delay-400">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Security Center</h3>
              <p className="text-sm text-muted-foreground">Monitor fraud alerts and suspicious activity</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">High Risk Transactions</p>
              <p className="text-2xl font-bold text-foreground mt-1">7</p>
              <p className="text-xs text-muted-foreground">Requires review</p>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning font-medium">Pending KYC</p>
              <p className="text-2xl font-bold text-foreground mt-1">234</p>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </div>
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-success font-medium">System Health</p>
              <p className="text-2xl font-bold text-foreground mt-1">99.9%</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
