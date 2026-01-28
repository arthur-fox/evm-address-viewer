import { Alchemy, Network, TokenBalanceType } from 'alchemy-sdk';
import type { Chain } from '../types';

const alchemyInstances = new Map<Network, Alchemy>();

const getAlchemyInstance = (network: Network): Alchemy => {
  if (!alchemyInstances.has(network)) {
    const alchemy = new Alchemy({
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || 'demo',
      network,
    });
    alchemyInstances.set(network, alchemy);
  }
  return alchemyInstances.get(network)!;
};

export interface TokenBalanceResult {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  logoUrl?: string;
}

export const getTokenBalances = async (
  walletAddress: string,
  chain: Chain
): Promise<TokenBalanceResult[]> => {
  const alchemy = getAlchemyInstance(chain.alchemyNetwork);

  const balances = await alchemy.core.getTokenBalances(walletAddress, {
    type: TokenBalanceType.ERC20,
  });

  const nonZeroBalances = balances.tokenBalances.filter(
    (token) => token.tokenBalance && BigInt(token.tokenBalance) > 0n
  );

  const tokenResults: TokenBalanceResult[] = [];

  // Fetch metadata for each token with non-zero balance
  const metadataPromises = nonZeroBalances.map(async (token) => {
    try {
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);

      if (!metadata.symbol || !metadata.decimals) {
        return null;
      }

      const rawBalance = BigInt(token.tokenBalance || '0');
      const divisor = BigInt(10 ** metadata.decimals);
      const balanceFormatted =
        Number(rawBalance) / Number(divisor);

      return {
        address: token.contractAddress,
        symbol: metadata.symbol,
        name: metadata.name || metadata.symbol,
        decimals: metadata.decimals,
        balance: token.tokenBalance || '0',
        balanceFormatted,
        logoUrl: metadata.logo ?? undefined,
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(metadataPromises);

  for (const result of results) {
    if (result) {
      tokenResults.push(result);
    }
  }

  return tokenResults;
};

export const getNativeBalance = async (
  walletAddress: string,
  chain: Chain
): Promise<number> => {
  const alchemy = getAlchemyInstance(chain.alchemyNetwork);
  const balance = await alchemy.core.getBalance(walletAddress);
  return Number(balance) / 1e18;
};
