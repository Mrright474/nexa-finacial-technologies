import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, PackageType } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

interface Wallet {
  id: string;
  currency: string;
  balance: number;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: Date;
  recipientName?: string | null;
}

interface Card {
  id: string;
  type: string;
  network: string;
  lastFour: string;
  expiryDate: string;
  status: string;
  balance: number;
  spendLimit: number;
}

interface CryptoAsset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  icon: string;
}

interface AppContextType {
  packageType: PackageType;
  setPackageType: (type: PackageType) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  cards: Card[];
  cryptoAssets: CryptoAsset[];
  totalBalance: number;
  userName: string;
  refreshData: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Static metadata (name/icon); prices come from the API
const cryptoNames: Record<string, { name: string; icon: string }> = {
  NXA: { name: 'NexaCoin', icon: 'N' },
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  USDT: { name: 'Tether', icon: '₮' },
  USDC: { name: 'USD Coin', icon: '$' },
  BNB: { name: 'BNB', icon: 'B' },
  SOL: { name: 'Solana', icon: 'S' },
  XRP: { name: 'XRP', icon: 'X' },
  ADA: { name: 'Cardano', icon: 'A' },
};

type LivePrices = Record<string, { usd: number; usd_24h_change: number }>;

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile, updatePackage } = useProfile();
  
  const [packageType, setPackageTypeState] = useState<PackageType>('cultura');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrices>({});
  const [loading, setLoading] = useState(false);

  // Sync package type from profile
  useEffect(() => {
    if (profile?.package_type) {
      setPackageTypeState(profile.package_type);
    }
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setTransactions([]);
      setCards([]);
      setCryptoAssets([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch wallets, transactions, cards, and live prices in parallel
      const [walletsRes, txRes, cardsRes, pricesRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).order('currency'),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('cards').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.functions.invoke('crypto-prices'),
      ]);

      // Store live prices
      const prices: LivePrices = pricesRes.data?.prices || {};
      setLivePrices(prices);

      // Map wallets
      const dbWallets = (walletsRes.data || []).map((w) => ({
        id: w.id,
        currency: w.currency,
        balance: Number(w.balance),
        type: w.wallet_type,
      }));
      setWallets(dbWallets);

      // Map transactions
      const dbTransactions = (txRes.data || []).map((t) => ({
        id: t.id,
        type: t.transaction_type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        description: t.description,
        createdAt: new Date(t.created_at),
        recipientName: t.recipient_name,
      }));
      setTransactions(dbTransactions);

      // Map cards
      const dbCards = (cardsRes.data || []).map((c) => ({
        id: c.id,
        type: c.card_type,
        network: c.network,
        lastFour: c.last_four,
        expiryDate: c.expiry_date,
        status: c.status,
        balance: Number(c.balance),
        spendLimit: Number(c.spend_limit),
      }));
      setCards(dbCards);

      // Build crypto assets from crypto/stablecoin wallets using live prices
      const cryptoWallets = dbWallets.filter(w => w.type === 'crypto' || w.type === 'stablecoin');
      const assets: CryptoAsset[] = cryptoWallets.map(w => {
        const meta = cryptoNames[w.currency];
        const priceData = prices[w.currency];
        return {
          symbol: w.currency,
          name: meta?.name || w.currency,
          balance: w.balance,
          value: w.balance * (priceData?.usd || 0),
          change24h: priceData?.usd_24h_change || 0,
          icon: meta?.icon || w.currency[0],
        };
      });
      setCryptoAssets(assets);
    } catch (err) {
      console.error('Error fetching app data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch data when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPackageType = async (type: PackageType) => {
    setPackageTypeState(type);
    if (user) {
      await updatePackage(type);
    }
  };

  const totalBalance = wallets.reduce((acc, wallet) => {
    if (wallet.currency === 'UGX') return acc + wallet.balance / 3700;
    if (wallet.currency === 'EUR') return acc + wallet.balance * 1.08;
    // Use crypto prices for crypto wallets
    const meta = cryptoMeta[wallet.currency];
    if (meta && wallet.type !== 'fiat') return acc + wallet.balance * meta.price;
    return acc + wallet.balance;
  }, 0);

  const userName = profile?.first_name || 'User';

  return (
    <AppContext.Provider
      value={{
        packageType,
        setPackageType,
        wallets,
        transactions,
        cards,
        cryptoAssets,
        totalBalance,
        userName,
        refreshData: fetchData,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
