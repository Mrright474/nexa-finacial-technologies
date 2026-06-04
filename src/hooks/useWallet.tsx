import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  wallet_type: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  fee: number;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchWallets = async (): Promise<Wallet[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('currency');

    if (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }
    return data as Wallet[];
  };

  const fetchTransactions = async (limit = 20): Promise<Transaction[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data as Transaction[];
  };

  const deposit = async (currency: string, amount: number): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { error } = await supabase.rpc('wallet_credit' as any, {
        p_currency: currency,
        p_amount: amount,
        p_description: `Deposited ${currency} ${amount.toLocaleString()}`,
        p_tx_type: 'deposit',
      });
      if (error) throw error;

      toast({
        title: 'Deposit Successful',
        description: `${currency} ${amount.toLocaleString()} has been added to your wallet.`,
      });
      return true;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deposit Failed', description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (currency: string, amount: number): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { error } = await supabase.rpc('wallet_debit' as any, {
        p_currency: currency,
        p_amount: amount,
        p_description: `Withdrew ${currency} ${amount.toLocaleString()}`,
        p_tx_type: 'withdraw',
      });
      if (error) throw error;

      toast({
        title: 'Withdrawal Successful',
        description: `${currency} ${amount.toLocaleString()} has been withdrawn.`,
      });
      return true;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Withdrawal Failed', description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const transfer = async (
    recipientEmail: string,
    currency: string,
    amount: number,
    note?: string
  ): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { error } = await supabase.rpc('wallet_transfer' as any, {
        p_recipient_email: recipientEmail,
        p_currency: currency,
        p_amount: amount,
        p_note: note ?? null,
      });
      if (error) throw error;

      toast({
        title: 'Transfer Successful',
        description: `${currency} ${amount.toLocaleString()} sent to ${recipientEmail}`,
      });
      return true;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Transfer Failed', description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addCryptoWallet = async (currency: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          currency,
          balance: 0,
          wallet_type: 'crypto',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Wallet already exists');
        }
        throw error;
      }

      toast({
        title: 'Wallet Created',
        description: `${currency} wallet has been added.`,
      });
      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Wallet',
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchWallets,
    fetchTransactions,
    deposit,
    withdraw,
    transfer,
    addCryptoWallet,
  };
}
