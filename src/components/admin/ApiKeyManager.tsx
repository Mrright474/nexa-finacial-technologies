import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

interface ApiKeyData {
  id: string;
  key_prefix: string;
  label: string;
  user_id: string;
  is_active: boolean;
  permissions: string[];
  last_used_at: string | null;
  created_at: string;
}

export function ApiKeyManager() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyData | null>(null);

  const fetchKeys = async () => {
    const { data } = await supabase
      .from('web3_api_keys' as any)
      .select('id, key_prefix, label, user_id, is_active, permissions, last_used_at, created_at')
      .order('created_at', { ascending: false });
    if (data) setKeys(data as any as ApiKeyData[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const generateApiKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = 'nxa_';
    let key = prefix;
    for (let i = 0; i < 48; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const hashKey = async (key: string): Promise<string> => {
    const encoded = new TextEncoder().encode(key);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleCreate = async () => {
    if (!newKeyLabel.trim()) {
      toast.error('Please enter a label for the API key');
      return;
    }
    setCreating(true);

    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12) + '...';

    const { error } = await supabase.from('web3_api_keys' as any).insert({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label: newKeyLabel.trim(),
      user_id: user?.id,
      permissions: ['read', 'trade', 'burn', 'transfer'],
    } as any);

    if (error) {
      toast.error('Failed to create API key: ' + error.message);
    } else {
      setGeneratedKey(rawKey);
      setShowKey(true);
      setNewKeyLabel('');
      setShowCreateForm(false);
      fetchKeys();
      toast.success('API key created successfully');
    }
    setCreating(false);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const { error } = await supabase
      .from('web3_api_keys' as any)
      .update({ is_active: false } as any)
      .eq('id', revokeTarget.id);

    if (error) {
      toast.error('Failed to revoke key');
    } else {
      toast.success('API key revoked');
      fetchKeys();
    }
    setRevokeTarget(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('web3_api_keys' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete key');
    } else {
      toast.success('API key deleted');
      fetchKeys();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiBaseUrl = `https://${projectId}.supabase.co/functions/v1/nxa-web3-api`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Web3 API Keys
        </h4>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setGeneratedKey(null);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Key
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass-card p-4 border border-primary/20">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Key Label</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. My Web3 DApp, Production Server"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* Newly Generated Key Display */}
      {generatedKey && (
        <div className="glass-card p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Save your API key now!</p>
              <p className="text-xs text-muted-foreground">
                This key will only be shown once. Copy and store it securely.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 bg-secondary/50 px-3 py-2 rounded-lg text-xs font-mono text-foreground break-all select-all">
              {showKey ? generatedKey : '•'.repeat(48)}
            </code>
            <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedKey)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* API Base URL */}
      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground mb-1.5">API Base URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-secondary/50 px-3 py-2 rounded-lg text-xs font-mono text-foreground truncate">
            {apiBaseUrl}
          </code>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiBaseUrl)}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Keys List */}
      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-4">Loading keys...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No API keys yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className={cn(
                'glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3',
                !key.is_active && 'opacity-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{key.label}</p>
                  <Badge
                    variant={key.is_active ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {key.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <code className="font-mono">{key.key_prefix}</code>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {formatDate(key.created_at)}
                  </span>
                  {key.last_used_at && (
                    <span>Last used {formatDate(key.last_used_at)}</span>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {(key.permissions || []).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-[10px] capitalize">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {key.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-500 hover:text-amber-600 gap-1"
                    onClick={() => setRevokeTarget(key)}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Revoke
                  </Button>
                )}
                {!key.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive gap-1"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately disable the key{' '}
              <span className="font-semibold text-foreground">{revokeTarget?.label}</span>. Any
              Web3 applications using this key will lose access. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
