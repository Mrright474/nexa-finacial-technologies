import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Bell, Camera, Eye, EyeOff, Loader2, Lock, User, Shield, Smartphone, Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [transactionNotifications, setTransactionNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [enrolling2FA, setEnrolling2FA] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load notification preferences and 2FA status
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user || notificationsInitialized) return;
      
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setEmailAlerts(data.email_alerts);
        setTransactionNotifications(data.transaction_notifications);
        setSecurityAlerts(data.security_alerts);
        setMarketingEmails(data.marketing_emails);
      }
      setNotificationsInitialized(true);
    };
    
    const check2FAStatus = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp && data.totp.length > 0) {
        const verifiedFactor = data.totp.find(f => f.status === 'verified');
        setTwoFactorEnabled(!!verifiedFactor);
      }
    };
    
    loadNotificationPreferences();
    check2FAStatus();
  }, [user, notificationsInitialized]);

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setSavingNotifications(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_alerts: emailAlerts,
          transaction_notifications: transactionNotifications,
          security_alerts: securityAlerts,
          marketing_emails: marketingEmails,
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast({
        title: "Preferences saved!",
        description: "Your notification settings have been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error.message,
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  // 2FA Functions
  const handleEnroll2FA = async () => {
    setEnrolling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });
      
      if (error) throw error;
      
      if (data) {
        setTotpSecret(data.totp.secret);
        setTotpQrCode(data.totp.qr_code);
        setShowTwoFactorSetup(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to setup 2FA",
        description: error.message,
      });
    } finally {
      setEnrolling2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    setVerifying2FA(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find(f => (f.status as string) === 'unverified');
      
      if (!totpFactor) throw new Error('No pending 2FA factor found');

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verificationCode
      });
      
      if (verifyError) throw verifyError;

      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setVerificationCode('');
      setTotpSecret('');
      setTotpQrCode('');
      
      toast({
        title: "2FA enabled!",
        description: "Two-factor authentication is now active on your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factors?.totp?.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: verifiedFactor.id
        });
        
        if (error) throw error;
      }

      setTwoFactorEnabled(false);
      toast({
        title: "2FA disabled",
        description: "Two-factor authentication has been removed from your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to disable 2FA",
        description: error.message,
      });
    } finally {
      setDisabling2FA(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initialize form with profile data once loaded
  if (profile && !initialized) {
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setPhone(profile.phone || '');
    setInitialized(true);
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting parameter
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: avatarUrl });

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been changed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    });

    if (!error) {
      toast({
        title: "Profile updated!",
        description: "Your personal information has been saved.",
      });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been changed successfully.",
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: error.message,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const initials = `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}` || 'U';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a photo to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {initials || <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a new photo. Recommended size: 200x200 pixels.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword || !newPassword || !confirmPassword}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                    <Smartphone className={`h-5 w-5 ${twoFactorEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled ? 'Enabled and protecting your account' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  twoFactorEnabled 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {twoFactorEnabled ? 'Active' : 'Inactive'}
                </div>
              </div>

              {twoFactorEnabled ? (
                <Button
                  onClick={handleDisable2FA}
                  disabled={disabling2FA}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  {disabling2FA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    'Disable 2FA'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll2FA}
                  disabled={enrolling2FA}
                  className="w-full sm:w-auto"
                >
                  {enrolling2FA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Enable 2FA'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 2FA Setup Dialog */}
          <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Setup Two-Factor Authentication
                </DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {totpQrCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={totpQrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Manual entry code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={totpSecret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <Button
                  onClick={handleVerify2FA}
                  disabled={verifying2FA || verificationCode.length !== 6}
                  className="w-full"
                >
                  {verifying2FA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify and Enable'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailAlerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important account alerts via email
                  </p>
                </div>
                <Switch
                  id="emailAlerts"
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="transactionNotifications">Transaction Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about deposits, withdrawals, and transfers
                  </p>
                </div>
                <Switch
                  id="transactionNotifications"
                  checked={transactionNotifications}
                  onCheckedChange={setTransactionNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="securityAlerts">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about login attempts and security changes
                  </p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={securityAlerts}
                  onCheckedChange={setSecurityAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news, updates, and promotional offers
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="w-full sm:w-auto"
              >
                {savingNotifications ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account status and package details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium capitalize">{profile?.package_type || 'Cultura'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">KYC Status</span>
                <span className={`font-medium capitalize ${
                  profile?.kyc_status === 'verified' ? 'text-green-500' :
                  profile?.kyc_status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {profile?.kyc_status || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
