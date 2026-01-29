export interface Token {
  address: string;
  chain: string;        // DeBank chain ID (eth, arb, op, etc.)
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  price: number | null;
  value: number | null;
  logoUrl?: string;
}

export interface ChainBalance {
  chainId: string;
  chainName: string;
  netWorth: number;
  tokens: Token[];
}

export interface AddressEntry {
  address: string;
  label?: string;
}
