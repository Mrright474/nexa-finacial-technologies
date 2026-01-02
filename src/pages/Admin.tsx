import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, CreditCard, TrendingUp, AlertTriangle, 
  Search, Filter, Download, Settings, Shield,
  ArrowUpRight, ArrowDownLeft, Activity, FileCheck, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  package_type: string;
  kyc_status: string;
  created_at: string;
}

interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

const stats = [
  { label: 'Total Users', value: '0', change: '+0%', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Cards', value: '0', change: '+0%', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
  { label: 'Transaction Volume', value: '$0', change: '+0%', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  { label: 'Pending KYC', value: '0', change: '0', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
];

const packageColors: Record<string, string> = {
  steward: 'bg-steward/20 text-steward',
  amanah: 'bg-amanah/20 text-amanah',
  cultura: 'bg-cultura/20 text-cultura',
};

const statusColors: Record<string, string> = {
  verified: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  rejected: 'bg-destructive/20 text-destructive',
};

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [statsData, setStatsData] = useState(stats);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have admin permissions.",
      });
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesData) {
      setProfiles(profilesData as Profile[]);
      
      // Update stats
      const pendingKyc = profilesData.filter(p => p.kyc_status === 'pending').length;
      setStatsData([
        { ...stats[0], value: profilesData.length.toString() },
        { ...stats[1], value: '0' }, // Would come from cards table
        { ...stats[2], value: '$0' }, // Would come from transactions
        { ...stats[3], value: pendingKyc.toString() },
      ]);
    }

    // Fetch KYC documents
    const { data: kycData } = await supabase
      .from('kyc_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (kycData) {
      setKycDocuments(kycData as KycDocument[]);
    }

    setLoadingData(false);
  };

  const handleKycApprove = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: 'verified' })
      .eq('user_id', userId);

    if (!error) {
      toast({ title: "KYC Approved", description: "User has been verified." });
      fetchData();
    }
  };

  const handleKycReject = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: 'rejected' })
      .eq('user_id', userId);

    if (!error) {
      toast({ title: "KYC Rejected", description: "User verification rejected." });
      fetchData();
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
            <Button variant="gradient" className="gap-2" onClick={fetchData}>
              <Activity className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={stat.label}
              className={cn('glass-card p-6 animate-slide-up', `delay-${(index + 1) * 100}`)}
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
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
              <h3 className="text-lg font-semibold text-foreground">All Users</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9 w-40" />
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {profiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No users yet</p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                        {(profile.first_name?.[0] || profile.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.first_name} {profile.last_name || profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', packageColors[profile.package_type] || 'bg-secondary')}>
                        {profile.package_type}
                      </span>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[profile.kyc_status] || 'bg-secondary')}>
                        {profile.kyc_status}
                      </span>
                      {profile.kyc_status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleKycApprove(profile.user_id)}>
                            <Check className="w-4 h-4 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleKycReject(profile.user_id)}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KYC Documents */}
          <div className="glass-card p-6 animate-slide-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">KYC Documents</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <FileCheck className="w-4 h-4" /> Review
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {kycDocuments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No documents submitted yet</p>
              ) : (
                kycDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.document_type}</p>
                      </div>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[doc.status])}>
                      {doc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
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
              <p className="text-sm text-muted-foreground">Monitor platform security</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-success font-medium">System Status</p>
              <p className="text-2xl font-bold text-foreground mt-1">Operational</p>
              <p className="text-xs text-muted-foreground">All systems running</p>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning font-medium">Pending KYC</p>
              <p className="text-2xl font-bold text-foreground mt-1">{profiles.filter(p => p.kyc_status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">Total Users</p>
              <p className="text-2xl font-bold text-foreground mt-1">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
