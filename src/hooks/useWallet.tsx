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
      // Get current wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .single();

      if (walletError) {
        // Create wallet if it doesn't exist
        const { error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            currency,
            balance: amount,
            wallet_type: ['BTC', 'ETH', 'USDT', 'USDC'].includes(currency) ? 'crypto' : 'fiat'
          });

        if (createError) throw createError;
      } else {
        // Update existing wallet
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + amount })
          .eq('id', wallet.id);

        if (updateError) throw updateError;
      }

      // Record transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'deposit',
          amount,
          currency,
          status: 'completed',
          description: `Deposited ${currency} ${amount.toLocaleString()}`
        });

      if (txError) throw txError;

      toast({
        title: "Deposit Successful",
        description: `${currency} ${amount.toLocaleString()} has been added to your wallet.`
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error.message
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (currency: string, amount: number): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      // Get current wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .single();

      if (walletError || !wallet) {
        throw new Error('Wallet not found');
      }

      if (Number(wallet.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) - amount })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'withdraw',
          amount,
          currency,
          status: 'completed',
          description: `Withdrew ${currency} ${amount.toLocaleString()}`
        });

      if (txError) throw txError;

      toast({
        title: "Withdrawal Successful",
        description: `${currency} ${amount.toLocaleString()} has been withdrawn.`
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message
      });
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
      // Find recipient by email
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('email', recipientEmail)
        .single();

      if (recipientError || !recipientProfile) {
        throw new Error('Recipient not found');
      }

      if (recipientProfile.user_id === user.id) {
        throw new Error('Cannot transfer to yourself');
      }

      // Get sender wallet
      const { data: senderWallet, error: senderWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .single();

      if (senderWalletError || !senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Get or create recipient wallet
      let recipientWallet;
      const { data: existingRecipientWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', recipientProfile.user_id)
        .eq('currency', currency)
        .single();

      if (!existingRecipientWallet) {
        // Create wallet for recipient
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: recipientProfile.user_id,
            currency,
            balance: 0,
            wallet_type: ['BTC', 'ETH', 'USDT', 'USDC'].includes(currency) ? 'crypto' : 'fiat'
          })
          .select()
          .single();

        if (createError) throw createError;
        recipientWallet = newWallet;
      } else {
        recipientWallet = existingRecipientWallet;
      }

      // Deduct from sender
      const { error: deductError } = await supabase
        .from('wallets')
        .update({ balance: Number(senderWallet.balance) - amount })
        .eq('id', senderWallet.id);

      if (deductError) throw deductError;

      // Add to recipient
      const { error: addError } = await supabase
        .from('wallets')
        .update({ balance: Number(recipientWallet.balance) + amount })
        .eq('id', recipientWallet.id);

      if (addError) throw addError;

      const recipientName = `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() || recipientEmail;

      // Record sender transaction
      const { error: senderTxError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'send',
          amount,
          currency,
          status: 'completed',
          description: note || `Transfer to ${recipientName}`,
          recipient_id: recipientProfile.user_id,
          recipient_name: recipientName
        });

      if (senderTxError) throw senderTxError;

      // Record recipient transaction
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email
        : 'Unknown';

      const { error: recipientTxError } = await supabase
        .from('transactions')
        .insert({
          user_id: recipientProfile.user_id,
          transaction_type: 'receive',
          amount,
          currency,
          status: 'completed',
          description: note || `Received from ${senderName}`,
          recipient_id: user.id,
          recipient_name: senderName
        });

      if (recipientTxError) throw recipientTxError;

      toast({
        title: "Transfer Successful",
        description: `${currency} ${amount.toLocaleString()} sent to ${recipientName}`
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message
      });
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
          wallet_type: 'crypto'
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Wallet already exists');
        }
        throw error;
      }

      toast({
        title: "Wallet Created",
        description: `${currency} wallet has been added.`
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Create Wallet",
        description: error.message
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
    addCryptoWallet
  };
}
