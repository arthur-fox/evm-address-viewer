import type { Network } from 'alchemy-sdk';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  price: number | null;
  value: number | null;
  logoUrl?: string;
}

export interface AccountTokens {
  address: string;
  chainId: string;
  tokens: Token[];
  netWorth: number;
  isLoading: boolean;
  error: string | null;
}

export interface Chain {
  id: string;
  name: string;
  alchemyNetwork: Network;
  coingeckoPlatform: string;
  nativeSymbol: string;
  explorerUrl: string;
}

export interface AddressEntry {
  address: string;
  label?: string;
}
