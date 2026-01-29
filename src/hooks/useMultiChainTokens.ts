import { useQuery } from '@tanstack/react-query';
import { getUserTotalBalance, getUserTokenList, DEBANK_CHAIN_NAMES } from '../services/debank';
import type { DeBankToken } from '../services/debank';
import type { Token, ChainBalance } from '../types';

const MIN_VALUE_THRESHOLD = 0.01;

// Convert DeBank token to our Token interface
const mapDeBankToken = (token: DeBankToken): Token => ({
  address: token.id,
  chain: token.chain,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  balance: token.amount.toString(),
  balanceFormatted: token.amount,
  price: token.price,
  value: token.amount * token.price,
  logoUrl: token.logo_url,
});

// Group tokens by chain and calculate per-chain net worth
const groupTokensByChain = (tokens: Token[]): ChainBalance[] => {
  const chainMap = new Map<string, Token[]>();

  for (const token of tokens) {
    if (!chainMap.has(token.chain)) {
      chainMap.set(token.chain, []);
    }
    chainMap.get(token.chain)!.push(token);
  }

  const chainBalances: ChainBalance[] = [];

  for (const [chainId, chainTokens] of chainMap) {
    // Sort tokens by value descending
    chainTokens.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const netWorth = chainTokens.reduce((sum, t) => sum + (t.value ?? 0), 0);

    chainBalances.push({
      chainId,
      chainName: DEBANK_CHAIN_NAMES[chainId] || chainId,
      netWorth,
      tokens: chainTokens,
    });
  }

  // Sort chains by net worth descending
  chainBalances.sort((a, b) => b.netWorth - a.netWorth);

  return chainBalances;
};

export interface MultiChainResult {
  totalNetWorth: number;
  chainBreakdown: ChainBalance[];
  isLoading: boolean;
  isFetched: boolean;
  isError: boolean;
  error: Error | null;
  refetchAll: () => Promise<void>;
}

export const useMultiChainTokens = (address: string): MultiChainResult => {
  const query = useQuery({
    queryKey: ['accountTokens', address],
    queryFn: async () => {
      const [totalBalance, tokenList] = await Promise.all([
        getUserTotalBalance(address),
        getUserTokenList(address),
      ]);

      // Filter and map tokens
      const tokens = tokenList
        .map(mapDeBankToken)
        .filter((t) => t.value !== null && t.value >= MIN_VALUE_THRESHOLD);

      // Group by chain
      const chainBreakdown = groupTokensByChain(tokens);

      return {
        totalNetWorth: totalBalance.total_usd_value,
        chainBreakdown,
      };
    },
    staleTime: 60 * 1000,
    retry: 2,
    // Disabled by default - only fetch when explicitly triggered
    enabled: false,
  });

  const refetchAll = async () => {
    await query.refetch();
  };

  return {
    totalNetWorth: query.data?.totalNetWorth ?? 0,
    chainBreakdown: query.data?.chainBreakdown ?? [],
    isLoading: query.isLoading || query.isFetching,
    isFetched: query.isFetched,
    isError: query.isError,
    error: query.error,
    refetchAll,
  };
};
