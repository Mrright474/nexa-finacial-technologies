import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PackageType, User, Wallet, Transaction, Card, CryptoAsset } from '@/types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  packageType: PackageType;
  setPackageType: (type: PackageType) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  cards: Card[];
  cryptoAssets: CryptoAsset[];
  totalBalance: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo data
const demoUser: User = {
  id: '1',
  email: 'demo@nexa.app',
  phone: '+256700123456',
  firstName: 'Alex',
  lastName: 'Nakamura',
  packageType: 'cultura',
  kycStatus: 'verified',
  createdAt: new Date(),
};

const demoWallets: Wallet[] = [
  { id: '1', userId: '1', currency: 'UGX', balance: 12500000, type: 'fiat' },
  { id: '2', userId: '1', currency: 'USD', balance: 3420.50, type: 'fiat' },
  { id: '3', userId: '1', currency: 'EUR', balance: 1850.25, type: 'fiat' },
  { id: '4', userId: '1', currency: 'USDT', balance: 2500.00, type: 'stablecoin' },
  { id: '5', userId: '1', currency: 'BTC', balance: 0.0245, type: 'crypto' },
  { id: '6', userId: '1', currency: 'ETH', balance: 1.532, type: 'crypto' },
];

const demoTransactions: Transaction[] = [
  { id: '1', userId: '1', type: 'receive', amount: 500000, currency: 'UGX', status: 'completed', description: 'Payment from John K.', createdAt: new Date(Date.now() - 1000 * 60 * 30), recipientName: 'John Kamara' },
  { id: '2', userId: '1', type: 'send', amount: 150.00, currency: 'USD', status: 'completed', description: 'Transfer to Sarah M.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), recipientName: 'Sarah Mwangi' },
  { id: '3', userId: '1', type: 'payment', amount: 45.99, currency: 'USD', status: 'completed', description: 'Netflix Subscription', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: '4', userId: '1', type: 'exchange', amount: 0.005, currency: 'BTC', status: 'completed', description: 'Bought Bitcoin', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  { id: '5', userId: '1', type: 'deposit', amount: 1000000, currency: 'UGX', status: 'completed', description: 'MTN Mobile Money', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
];

const demoCards: Card[] = [
  { id: '1', userId: '1', type: 'virtual', network: 'visa', lastFour: '4829', expiryDate: '12/28', status: 'active', packageType: 'cultura', balance: 1500.00, spendLimit: 5000.00 },
  { id: '2', userId: '1', type: 'physical', network: 'mastercard', lastFour: '7291', expiryDate: '08/27', status: 'active', packageType: 'cultura', balance: 2340.00, spendLimit: 10000.00 },
];

const demoCryptoAssets: CryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.0245, value: 1543.20, change24h: 2.34, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: 1.532, value: 2987.50, change24h: -1.23, icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', balance: 2500.00, value: 2500.00, change24h: 0.01, icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1200.00, value: 1200.00, change24h: 0.00, icon: '$' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(demoUser);
  const [packageType, setPackageType] = useState<PackageType>('cultura');
  const [wallets] = useState<Wallet[]>(demoWallets);
  const [transactions] = useState<Transaction[]>(demoTransactions);
  const [cards] = useState<Card[]>(demoCards);
  const [cryptoAssets] = useState<CryptoAsset[]>(demoCryptoAssets);

  const totalBalance = wallets.reduce((acc, wallet) => {
    if (wallet.currency === 'UGX') return acc + wallet.balance / 3700;
    if (wallet.currency === 'EUR') return acc + wallet.balance * 1.08;
    return acc + wallet.balance;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        packageType,
        setPackageType,
        wallets,
        transactions,
        cards,
        cryptoAssets,
        totalBalance,
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
