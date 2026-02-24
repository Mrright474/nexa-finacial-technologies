import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, PackageType } from '@/hooks/useProfile';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo crypto assets (would come from API in production)
const demoCryptoAssets: CryptoAsset[] = [
  { symbol: 'NXA', name: 'NexaCoin', balance: 100.00, value: 850.00, change24h: 12.45, icon: 'N' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.0245, value: 1543.20, change24h: 2.34, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: 1.532, value: 2987.50, change24h: -1.23, icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', balance: 2500.00, value: 2500.00, change24h: 0.01, icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1200.00, value: 1200.00, change24h: 0.00, icon: '$' },
];

// Demo transactions for display
const demoTransactions: Transaction[] = [
  { id: '1', type: 'receive', amount: 500000, currency: 'UGX', status: 'completed', description: 'Payment from John K.', createdAt: new Date(Date.now() - 1000 * 60 * 30), recipientName: 'John Kamara' },
  { id: '2', type: 'send', amount: 150.00, currency: 'USD', status: 'completed', description: 'Transfer to Sarah M.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), recipientName: 'Sarah Mwangi' },
  { id: '3', type: 'payment', amount: 45.99, currency: 'USD', status: 'completed', description: 'Netflix Subscription', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

// Demo cards for display
const demoCards: Card[] = [
  { id: '1', type: 'virtual', network: 'visa', lastFour: '4829', expiryDate: '12/28', status: 'active', balance: 1500.00, spendLimit: 5000.00 },
  { id: '2', type: 'physical', network: 'mastercard', lastFour: '7291', expiryDate: '08/27', status: 'active', balance: 2340.00, spendLimit: 10000.00 },
];

// Demo wallets for display
const demoWallets: Wallet[] = [
  { id: '1', currency: 'UGX', balance: 12500000, type: 'fiat' },
  { id: '2', currency: 'USD', balance: 3420.50, type: 'fiat' },
  { id: '3', currency: 'EUR', balance: 1850.25, type: 'fiat' },
  { id: '4', currency: 'USDT', balance: 2500.00, type: 'stablecoin' },
  { id: '5', currency: 'BTC', balance: 0.0245, type: 'crypto' },
  { id: '6', currency: 'ETH', balance: 1.532, type: 'crypto' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile, updatePackage } = useProfile();
  
  const [packageType, setPackageTypeState] = useState<PackageType>('cultura');
  const [wallets] = useState<Wallet[]>(demoWallets);
  const [transactions] = useState<Transaction[]>(demoTransactions);
  const [cards] = useState<Card[]>(demoCards);
  const [cryptoAssets] = useState<CryptoAsset[]>(demoCryptoAssets);

  // Sync package type from profile
  useEffect(() => {
    if (profile?.package_type) {
      setPackageTypeState(profile.package_type);
    }
  }, [profile]);

  const setPackageType = async (type: PackageType) => {
    setPackageTypeState(type);
    if (user) {
      await updatePackage(type);
    }
  };

  const totalBalance = wallets.reduce((acc, wallet) => {
    if (wallet.currency === 'UGX') return acc + wallet.balance / 3700;
    if (wallet.currency === 'EUR') return acc + wallet.balance * 1.08;
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
