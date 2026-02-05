import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, CreditCard, TrendingUp, AlertTriangle, 
  Search, Download, Shield, Wallet, ArrowLeftRight,
  Activity, FileCheck, X, Check, Eye, UserCog, Ban, CheckCircle,
  Monitor, Smartphone, MapPin, Clock, AlertCircle, LogOut, Trash2,
  ScrollText, UserX, Key, Settings, Radio, Lock, Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface WalletData {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  wallet_type: string;
}

interface TransactionData {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: string;
  description: string | null;
  recipient_name: string | null;
  created_at: string;
}

interface CardData {
  id: string;
  user_id: string;
  card_type: string;
  last_four: string;
  status: string;
  balance: number;
  spend_limit: number;
  network: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface LoginActivityData {
  id: string;
  user_id: string;
  device_info: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  is_new_device: boolean;
  created_at: string;
}

interface UserSessionData {
  id: string;
  user_id: string;
  session_id: string;
  device_info: string | null;
  ip_address: string | null;
  last_active_at: string;
  is_current: boolean;
}

interface AuditLogData {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_session_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

interface LockedAccountData {
  id: string;
  email: string;
  locked_until: string;
  reason: string | null;
  failed_attempts: number;
  created_at: string;
  updated_at: string;
}

interface BlockedIpData {
  id: string;
  ip_address: string;
  blocked_until: string;
  failed_attempts: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

const stats = [
  { label: 'Total Users', value: '0', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Cards', value: '0', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
  { label: 'Transaction Volume', value: '$0', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  { label: 'Pending KYC', value: '0', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
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
  active: 'bg-success/20 text-success',
  completed: 'bg-success/20 text-success',
  frozen: 'bg-destructive/20 text-destructive',
  blocked: 'bg-destructive/20 text-destructive',
};

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivityData[]>([]);
  const [userSessions, setUserSessions] = useState<UserSessionData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccountData[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpData[]>([]);
  const [statsData, setStatsData] = useState(stats);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [securitySearchTerm, setSecuritySearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [terminatingUser, setTerminatingUser] = useState<string | null>(null);
  const [unlockingAccount, setUnlockingAccount] = useState<string | null>(null);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'terminate_session' | 'force_signout' | null;
    sessionId?: string;
    userId?: string;
    userName?: string;
  }>({ open: false, type: null });

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

  // Real-time subscription for security monitoring
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-security-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_activity',
        },
        (payload) => {
          console.log('New login activity detected:', payload);
          // Add new login activity to the top of the list
          setLoginActivity((prev) => [payload.new as LoginActivityData, ...prev].slice(0, 100));
          toast({
            title: "New Login Detected",
            description: `User logged in from ${(payload.new as LoginActivityData).ip_address || 'unknown location'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        (payload) => {
          console.log('Session change detected:', payload);
          if (payload.eventType === 'INSERT') {
            setUserSessions((prev) => [payload.new as UserSessionData, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setUserSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setUserSessions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as UserSessionData) : s))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch all data in parallel
    const [profilesRes, kycRes, walletsRes, transactionsRes, cardsRes, rolesRes, loginActivityRes, sessionsRes, auditLogsRes, lockedAccountsRes, blockedIpsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('kyc_documents').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('login_activity').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_sessions').select('*').order('last_active_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('account_lockouts').select('*').order('locked_until', { ascending: false }),
      supabase.from('ip_blocklist').select('*').order('blocked_until', { ascending: false }),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (kycRes.data) setKycDocuments(kycRes.data as KycDocument[]);
    if (walletsRes.data) setWallets(walletsRes.data as WalletData[]);
    if (transactionsRes.data) setTransactions(transactionsRes.data as TransactionData[]);
    if (cardsRes.data) setCards(cardsRes.data as CardData[]);
    if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
    if (loginActivityRes.data) setLoginActivity(loginActivityRes.data as LoginActivityData[]);
    if (sessionsRes.data) setUserSessions(sessionsRes.data as UserSessionData[]);
    if (auditLogsRes.data) setAuditLogs(auditLogsRes.data as AuditLogData[]);
    if (lockedAccountsRes.data) setLockedAccounts(lockedAccountsRes.data as LockedAccountData[]);
    if (blockedIpsRes.data) setBlockedIps(blockedIpsRes.data as BlockedIpData[]);

    // Calculate stats
    const profilesData = profilesRes.data || [];
    const cardsData = cardsRes.data || [];
    const transactionsData = transactionsRes.data || [];
    
    const pendingKyc = profilesData.filter(p => p.kyc_status === 'pending').length;
    const activeCards = cardsData.filter(c => c.status === 'active').length;
    const totalVolume = transactionsData.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    setStatsData([
      { ...stats[0], value: profilesData.length.toString() },
      { ...stats[1], value: activeCards.toString() },
      { ...stats[2], value: `$${totalVolume.toLocaleString()}` },
      { ...stats[3], value: pendingKyc.toString() },
    ]);

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

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (!error) {
        toast({ title: "Admin Removed", description: "User is no longer an admin." });
        fetchData();
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (!error) {
        toast({ title: "Admin Added", description: "User is now an admin." });
        fetchData();
      }
    }
  };

  const handleCardStatusChange = async (cardId: string, newStatus: string) => {
    const { error } = await supabase
      .from('cards')
      .update({ status: newStatus })
      .eq('id', cardId);

    if (!error) {
      toast({ title: "Card Updated", description: `Card status changed to ${newStatus}.` });
      fetchData();
    }
  };

  const handleDocumentStatusChange = async (docId: string, newStatus: 'verified' | 'rejected', userId: string) => {
    const { error } = await supabase
      .from('kyc_documents')
      .update({ status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq('id', docId);

    if (!error) {
      toast({ title: "Document Updated", description: `Document ${newStatus}.` });
      // Also update profile KYC status if approving
      if (newStatus === 'verified') {
        await supabase.from('profiles').update({ kyc_status: 'verified' }).eq('user_id', userId);
      }
      fetchData();
    }
  };

  const openTerminateSessionDialog = (sessionId: string) => {
    setConfirmDialog({
      open: true,
      type: 'terminate_session',
      sessionId,
    });
  };

  const openForceSignOutDialog = (userId: string, userName: string) => {
    setConfirmDialog({
      open: true,
      type: 'force_signout',
      userId,
      userName,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, type: null });
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSession(sessionId);
    closeConfirmDialog();
    try {
      const response = await supabase.functions.invoke('terminate-session', {
        body: { action: 'terminate_session', sessionId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({ title: "Session Terminated", description: "The session has been terminated successfully." });
      fetchData();
    } catch (error: any) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: error.message || "Failed to terminate session" 
      });
    } finally {
      setTerminatingSession(null);
    }
  };

  const handleForceSignOut = async (userId: string, userName: string) => {
    setTerminatingUser(userId);
    closeConfirmDialog();
    try {
      const response = await supabase.functions.invoke('terminate-session', {
        body: { action: 'force_signout', userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({ title: "User Signed Out", description: `${userName} has been signed out from all devices.` });
      fetchData();
    } catch (error: any) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: error.message || "Failed to sign out user" 
      });
    } finally {
      setTerminatingUser(null);
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'terminate_session' && confirmDialog.sessionId) {
      handleTerminateSession(confirmDialog.sessionId);
    } else if (confirmDialog.type === 'force_signout' && confirmDialog.userId && confirmDialog.userName) {
      handleForceSignOut(confirmDialog.userId, confirmDialog.userName);
    }
  };

  const handleUnlockAccount = async (email: string) => {
    setUnlockingAccount(email);
    try {
      const { data, error } = await supabase.functions.invoke('check-account-lockout', {
        body: { email },
      });
      
      if (error) throw error;

      // Also delete from the lockouts table directly
      const { error: deleteError } = await supabase
        .from('account_lockouts')
        .delete()
        .eq('email', email);

      if (deleteError) throw deleteError;

      toast({ 
        title: "Account Unlocked", 
        description: `${email} has been unlocked and can now sign in.` 
      });
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: error.message || "Failed to unlock account" 
      });
    } finally {
      setUnlockingAccount(null);
    }
  };

  const getActiveLockedAccounts = () => {
    const now = new Date();
    return lockedAccounts.filter(account => new Date(account.locked_until) > now);
  };

  const getActiveBlockedIps = () => {
    const now = new Date();
    return blockedIps.filter(ip => new Date(ip.blocked_until) > now);
  };

  const getRemainingLockTime = (lockedUntil: string) => {
    const remaining = new Date(lockedUntil).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    const minutes = Math.ceil(remaining / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleUnblockIp = async (ipAddress: string) => {
    setUnblockingIp(ipAddress);
    try {
      const { error } = await supabase.functions.invoke('check-account-lockout?action=unblock-ip', {
        body: { ipAddress },
      });
      
      if (error) throw error;

      toast({ 
        title: "IP Unblocked", 
        description: `${ipAddress} has been unblocked and can now access the platform.` 
      });
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: error.message || "Failed to unblock IP" 
      });
    } finally {
      setUnblockingIp(null);
    }
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile ? `${profile.first_name || ''} ${profile.last_name || profile.email}`.trim() : 'Unknown';
  };

  const isUserAdmin = (userId: string) => {
    return userRoles.some(r => r.user_id === userId && r.role === 'admin');
  };

  const getUserWallets = (userId: string) => wallets.filter(w => w.user_id === userId);
  const getUserTransactions = (userId: string) => transactions.filter(t => t.user_id === userId);
  const getUserCards = (userId: string) => cards.filter(c => c.user_id === userId);

  const filteredProfiles = profiles.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
            <p className="text-muted-foreground mt-1">
              Roles: <span className="font-medium text-primary">admin</span>, <span className="font-medium">user</span>
            </p>
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

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-2">
              <Wallet className="w-4 h-4" /> Wallets
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowLeftRight className="w-4 h-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <CreditCard className="w-4 h-4" /> Cards
            </TabsTrigger>
            <TabsTrigger value="kyc" className="gap-2">
              <FileCheck className="w-4 h-4" /> KYC
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ScrollText className="w-4 h-4" /> Audit
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">All Users ({profiles.length})</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 w-64" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Package</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">KYC Status</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                              {(profile.first_name?.[0] || profile.email[0]).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {profile.first_name} {profile.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', packageColors[profile.package_type] || 'bg-secondary')}>
                            {profile.package_type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[profile.kyc_status] || 'bg-secondary')}>
                            {profile.kyc_status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', isUserAdmin(profile.user_id) ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}>
                            {isUserAdmin(profile.user_id) ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1"
                              onClick={() => { setSelectedUser(profile); setUserDetailOpen(true); }}
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isUserAdmin(profile.user_id) ? "destructive" : "default"}
                              className="gap-1"
                              onClick={() => handleToggleAdmin(profile.user_id, isUserAdmin(profile.user_id))}
                            >
                              <UserCog className="w-3 h-3" /> 
                              {isUserAdmin(profile.user_id) ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                            {profile.kyc_status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleKycApprove(profile.user_id)}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleKycReject(profile.user_id)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">All Wallets ({wallets.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Currency</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => (
                      <tr key={wallet.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-3 font-medium">{getUserName(wallet.user_id)}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            {wallet.currency}
                          </span>
                        </td>
                        <td className="p-3 capitalize">{wallet.wallet_type}</td>
                        <td className="p-3 text-right font-mono font-medium">
                          {wallet.currency === 'UGX' ? 'UGX ' : wallet.currency === 'EUR' ? '€' : '$'}
                          {Number(wallet.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">All Transactions ({transactions.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No transactions yet
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3 font-medium">{getUserName(tx.user_id)}</td>
                          <td className="p-3 capitalize">{tx.transaction_type}</td>
                          <td className="p-3 text-muted-foreground">{tx.description || tx.recipient_name || '-'}</td>
                          <td className="p-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[tx.status] || 'bg-secondary')}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">
                            {tx.currency === 'UGX' ? 'UGX ' : tx.currency === 'EUR' ? '€' : '$'}
                            {Number(tx.amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">All Cards ({cards.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Card</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Balance</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No cards issued yet
                        </td>
                      </tr>
                    ) : (
                      cards.map((card) => (
                        <tr key={card.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3 font-medium">{getUserName(card.user_id)}</td>
                          <td className="p-3">
                            <span className="font-mono">•••• {card.last_four}</span>
                            <span className="text-xs text-muted-foreground ml-2 uppercase">{card.network}</span>
                          </td>
                          <td className="p-3 capitalize">{card.card_type}</td>
                          <td className="p-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[card.status] || 'bg-secondary')}>
                              {card.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">
                            ${Number(card.balance).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {card.status === 'active' ? (
                                <Button size="sm" variant="outline" onClick={() => handleCardStatusChange(card.id, 'frozen')}>
                                  <Ban className="w-3 h-3 mr-1" /> Freeze
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleCardStatusChange(card.id, 'active')}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Activate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">KYC Documents ({kycDocuments.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Document</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No KYC documents submitted yet
                        </td>
                      </tr>
                    ) : (
                      kycDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3 font-medium">{getUserName(doc.user_id)}</td>
                          <td className="p-3">{doc.file_name}</td>
                          <td className="p-3 capitalize">{doc.document_type}</td>
                          <td className="p-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[doc.status] || 'bg-secondary')}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {doc.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleDocumentStatusChange(doc.id, 'verified', doc.user_id)}>
                                  <Check className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDocumentStatusChange(doc.id, 'rejected', doc.user_id)}>
                                  <X className="w-3 h-3 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-success font-medium">System Status</p>
              <p className="text-2xl font-bold text-foreground mt-1">Operational</p>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning font-medium">Pending KYC</p>
              <p className="text-2xl font-bold text-foreground mt-1">{profiles.filter(p => p.kyc_status === 'pending').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">Total Users</p>
              <p className="text-2xl font-bold text-foreground mt-1">{profiles.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-500 font-medium">Admin Users</p>
              <p className="text-2xl font-bold text-foreground mt-1">{userRoles.filter(r => r.role === 'admin').length}</p>
            </div>
          </div>
        </div>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Security Stats */}
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Logins</p>
                    <p className="text-2xl font-bold">{loginActivity.length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Devices</p>
                    <p className="text-2xl font-bold">{loginActivity.filter(a => a.is_new_device).length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Monitor className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">{userSessions.length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold">{new Set(loginActivity.map(a => a.user_id)).size}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <Lock className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Locked Accounts</p>
                    <p className="text-2xl font-bold">{getActiveLockedAccounts().length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Ban className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked IPs</p>
                    <p className="text-2xl font-bold">{getActiveBlockedIps().length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Accounts Section */}
            {getActiveLockedAccounts().length > 0 && (
              <div className="glass-card p-6 border-l-4 border-l-destructive">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/20">
                      <Lock className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Locked Accounts</h3>
                      <p className="text-sm text-muted-foreground">Accounts temporarily locked due to failed login attempts</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reason</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Failed Attempts</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Locked Until</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Time Remaining</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveLockedAccounts().map((account) => (
                        <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-destructive" />
                              </div>
                              <span className="font-medium text-foreground">{account.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">{account.reason || 'Multiple failed login attempts'}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                              {account.failed_attempts} attempts
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(account.locked_until).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                              {getRemainingLockTime(account.locked_until)}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-success text-success hover:bg-success hover:text-success-foreground"
                              disabled={unlockingAccount === account.email}
                              onClick={() => handleUnlockAccount(account.email)}
                            >
                              <Unlock className="w-3 h-3" />
                              {unlockingAccount === account.email ? 'Unlocking...' : 'Unlock'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Blocked IPs Section */}
            {getActiveBlockedIps().length > 0 && (
              <div className="glass-card p-6 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Ban className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Blocked IP Addresses</h3>
                      <p className="text-sm text-muted-foreground">IP addresses blocked due to suspicious activity or repeated attacks</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">IP Address</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reason</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Failed Attempts</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Blocked Until</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Time Remaining</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveBlockedIps().map((blockedIp) => (
                        <tr key={blockedIp.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Ban className="w-4 h-4 text-orange-500" />
                              </div>
                              <span className="font-mono font-medium text-foreground">{blockedIp.ip_address}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">{blockedIp.reason || 'Excessive failed login attempts'}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-500">
                              {blockedIp.failed_attempts} attempts
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(blockedIp.blocked_until).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                              {getRemainingLockTime(blockedIp.blocked_until)}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-success text-success hover:bg-success hover:text-success-foreground"
                              disabled={unblockingIp === blockedIp.ip_address}
                              onClick={() => handleUnblockIp(blockedIp.ip_address)}
                            >
                              <Unlock className="w-3 h-3" />
                              {unblockingIp === blockedIp.ip_address ? 'Unblocking...' : 'Unblock'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Login Activity Table */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Recent Login Activity</h3>
                    <p className="text-sm text-muted-foreground">Monitor user logins and detect suspicious activity</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                    <Radio className="w-3 h-3 text-success animate-pulse" />
                    <span className="text-xs font-medium text-success">Live</span>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by email..." 
                    className="pl-9 w-64" 
                    value={securitySearchTerm}
                    onChange={(e) => setSecuritySearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Device</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginActivity
                      .filter(activity => {
                        if (!securitySearchTerm) return true;
                        const userName = getUserName(activity.user_id).toLowerCase();
                        return userName.includes(securitySearchTerm.toLowerCase());
                      })
                      .slice(0, 50)
                      .map((activity) => (
                        <tr key={activity.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                {getUserName(activity.user_id)[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{getUserName(activity.user_id)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {activity.os?.toLowerCase().includes('android') || activity.os?.toLowerCase().includes('ios') ? (
                                <Smartphone className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Monitor className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{activity.browser || 'Unknown'} on {activity.os || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {activity.ip_address || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            {activity.is_new_device ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
                                New Device
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                                Known Device
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {loginActivity.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No login activity recorded yet</p>
                )}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">View and manage active user sessions across the platform</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                  <Radio className="w-3 h-3 text-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Live</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Device Info</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Active</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.slice(0, 50).map((session) => (
                      <tr key={session.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                              {getUserName(session.user_id)[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{getUserName(session.user_id)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground truncate max-w-xs block">
                            {session.device_info?.slice(0, 50) || 'Unknown'}...
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">{session.ip_address || 'Unknown'}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(session.last_active_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="gap-1"
                              disabled={terminatingSession === session.id}
                              onClick={() => openTerminateSessionDialog(session.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                              {terminatingSession === session.id ? 'Terminating...' : 'Terminate'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              disabled={terminatingUser === session.user_id}
                              onClick={() => openForceSignOutDialog(session.user_id, getUserName(session.user_id))}
                            >
                              <LogOut className="w-3 h-3" />
                              {terminatingUser === session.user_id ? 'Signing Out...' : 'Sign Out All'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {userSessions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No active sessions</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <div className="space-y-6">
            {/* Audit Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <ScrollText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Actions</p>
                    <p className="text-2xl font-bold">{auditLogs.length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <UserX className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Force Sign-outs</p>
                    <p className="text-2xl font-bold">{auditLogs.filter(a => a.action_type === 'force_signout').length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Trash2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions Terminated</p>
                    <p className="text-2xl font-bold">{auditLogs.filter(a => a.action_type.includes('terminate')).length}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Admins</p>
                    <p className="text-2xl font-bold">{new Set(auditLogs.map(a => a.admin_user_id)).size}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Admin Activity Log</h3>
                  <p className="text-sm text-muted-foreground">Complete record of all administrative actions</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search actions..." 
                    className="pl-9 w-64" 
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Admin</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Action</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Target User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Details</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs
                      .filter(log => {
                        if (!auditSearchTerm) return true;
                        const adminName = getUserName(log.admin_user_id).toLowerCase();
                        const targetName = log.target_user_id ? getUserName(log.target_user_id).toLowerCase() : '';
                        const actionType = log.action_type.toLowerCase();
                        const search = auditSearchTerm.toLowerCase();
                        return adminName.includes(search) || targetName.includes(search) || actionType.includes(search);
                      })
                      .slice(0, 100)
                      .map((log) => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                                {getUserName(log.admin_user_id)[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{getUserName(log.admin_user_id)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              log.action_type === 'force_signout' && 'bg-destructive/20 text-destructive',
                              log.action_type === 'terminate_session' && 'bg-amber-500/20 text-amber-500',
                              log.action_type === 'terminate_all_sessions' && 'bg-orange-500/20 text-orange-500',
                              !['force_signout', 'terminate_session', 'terminate_all_sessions'].includes(log.action_type) && 'bg-primary/20 text-primary'
                            )}>
                              {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="p-3">
                            {log.target_user_id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {getUserName(log.target_user_id)[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm">{getUserName(log.target_user_id)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {log.details ? (
                              <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded">
                                {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ').slice(0, 50)}
                                {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ').length > 50 && '...'}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {log.ip_address || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {auditLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No admin actions recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* User Detail Dialog */}
        <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Package</p>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', packageColors[selectedUser.package_type])}>
                      {selectedUser.package_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">KYC Status</p>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', statusColors[selectedUser.kyc_status])}>
                      {selectedUser.kyc_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Wallets</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {getUserWallets(selectedUser.user_id).map(wallet => (
                      <div key={wallet.id} className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground">{wallet.currency}</p>
                        <p className="font-mono font-medium">
                          {wallet.currency === 'UGX' ? 'UGX ' : wallet.currency === 'EUR' ? '€' : '$'}
                          {Number(wallet.balance).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recent Transactions</h4>
                  {getUserTransactions(selectedUser.user_id).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No transactions</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getUserTransactions(selectedUser.user_id).slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex justify-between p-2 rounded bg-secondary/30">
                          <span className="capitalize">{tx.transaction_type}</span>
                          <span className="font-mono">{tx.currency} {Number(tx.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Cards</h4>
                  {getUserCards(selectedUser.user_id).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No cards</p>
                  ) : (
                    <div className="space-y-2">
                      {getUserCards(selectedUser.user_id).map(card => (
                        <div key={card.id} className="flex justify-between p-2 rounded bg-secondary/30">
                          <span>•••• {card.last_four}</span>
                          <span className={cn('px-2 py-1 rounded-full text-xs', statusColors[card.status])}>
                            {card.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.type === 'terminate_session' 
                  ? 'Terminate Session?' 
                  : 'Force Sign Out User?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.type === 'terminate_session' 
                  ? 'This will immediately end this session. The user will need to log in again to continue using this device.'
                  : `This will sign out ${confirmDialog.userName || 'this user'} from all devices and invalidate all their active sessions. They will need to log in again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmAction}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {confirmDialog.type === 'terminate_session' ? 'Terminate Session' : 'Force Sign Out'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}