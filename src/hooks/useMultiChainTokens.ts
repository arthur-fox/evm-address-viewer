import { useQueries } from '@tanstack/react-query';
import { getTokenBalances, getNativeBalance } from '../services/alchemy';
import { getTokenPrices, getNativeTokenPrice, NATIVE_TOKEN_IDS, preloadNativeTokenPrices } from '../services/coingecko';
import { SUPPORTED_CHAINS } from '../utils/chains';
import type { Chain, Token } from '../types';

const MIN_VALUE_THRESHOLD = 0.01;

const fetchChainTokens = async (
  address: string,
  chain: Chain
): Promise<{ tokens: Token[]; netWorth: number }> => {
  const [tokenBalances, nativeBalance] = await Promise.all([
    getTokenBalances(address, chain),
    getNativeBalance(address, chain),
  ]);

  const tokenAddresses = tokenBalances.map((t) => t.address.toLowerCase());

  const [tokenPrices, nativePrice] = await Promise.all([
    tokenAddresses.length > 0
      ? getTokenPrices(tokenAddresses, chain.coingeckoPlatform)
      : ({} as Record<string, number>),
    getNativeTokenPrice(NATIVE_TOKEN_IDS[chain.id]),
  ]);

  const tokens: Token[] = [];

  if (nativeBalance > 0 && nativePrice) {
    const nativeValue = nativeBalance * nativePrice;
    if (nativeValue >= MIN_VALUE_THRESHOLD) {
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        symbol: chain.nativeSymbol,
        name: chain.nativeSymbol,
        decimals: 18,
        balance: (nativeBalance * 1e18).toString(),
        balanceFormatted: nativeBalance,
        price: nativePrice,
        value: nativeValue,
      });
    }
  }

  for (const tokenBalance of tokenBalances) {
    const price = tokenPrices[tokenBalance.address.toLowerCase()] ?? null;
    const value = price !== null ? tokenBalance.balanceFormatted * price : null;

    if (value !== null && value >= MIN_VALUE_THRESHOLD) {
      tokens.push({
        address: tokenBalance.address,
        symbol: tokenBalance.symbol,
        name: tokenBalance.name,
        decimals: tokenBalance.decimals,
        balance: tokenBalance.balance,
        balanceFormatted: tokenBalance.balanceFormatted,
        price,
        value,
        logoUrl: tokenBalance.logoUrl,
      });
    }
  }

  tokens.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const netWorth = tokens.reduce((sum, token) => sum + (token.value ?? 0), 0);

  return { tokens, netWorth };
};

export interface ChainNetWorth {
  chainId: string;
  chainName: string;
  netWorth: number;
  tokens: Token[];
  isLoading: boolean;
  isError: boolean;
}

export interface MultiChainResult {
  totalNetWorth: number;
  chainBreakdown: ChainNetWorth[];
  isLoading: boolean;
  isFetched: boolean;
  refetchAll: () => void;
}

export const useMultiChainTokens = (address: string): MultiChainResult => {
  const queries = useQueries({
    queries: SUPPORTED_CHAINS.map((chain) => ({
      queryKey: ['accountTokens', address, chain.id],
      queryFn: () => fetchChainTokens(address, chain),
      staleTime: 60 * 1000,
      retry: 2,
      // DISABLED by default - only fetch when explicitly triggered via refetch()
      enabled: false,
    })),
  });

  const chainBreakdown: ChainNetWorth[] = SUPPORTED_CHAINS.map((chain, index) => {
    const query = queries[index];
    return {
      chainId: chain.id,
      chainName: chain.name,
      netWorth: query.data?.netWorth ?? 0,
      tokens: query.data?.tokens ?? [],
      isLoading: query.isLoading,
      isError: query.isError,
    };
  });

  const totalNetWorth = chainBreakdown.reduce((sum, chain) => sum + chain.netWorth, 0);
  const isLoading = queries.some((q) => q.isLoading || q.isFetching);
  const isFetched = queries.some((q) => q.isFetched);

  const refetchAll = async () => {
    // Preload native prices first, then fetch all chains
    await preloadNativeTokenPrices();
    queries.forEach((q) => q.refetch());
  };

  return {
    totalNetWorth,
    chainBreakdown,
    isLoading,
    isFetched,
    refetchAll,
  };
};
