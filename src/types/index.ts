export type PackageType = 'steward' | 'amanah' | 'cultura';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  packageType: PackageType;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  type: 'fiat' | 'crypto' | 'stablecoin';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'exchange' | 'payment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: Date;
  recipientName?: string;
}

export interface Card {
  id: string;
  userId: string;
  type: 'virtual' | 'physical';
  network: 'visa' | 'mastercard';
  lastFour: string;
  expiryDate: string;
  status: 'active' | 'frozen' | 'cancelled';
  packageType: PackageType;
  balance: number;
  spendLimit: number;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  icon: string;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  term: number;
  status: 'pending' | 'approved' | 'active' | 'paid';
  monthlyPayment: number;
  remainingBalance: number;
}
