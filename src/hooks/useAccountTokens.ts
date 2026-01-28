import { useQuery } from '@tanstack/react-query';
import { getTokenBalances, getNativeBalance } from '../services/alchemy';
import { getTokenPrices, getNativeTokenPrice, NATIVE_TOKEN_IDS } from '../services/coingecko';
import type { Chain, Token } from '../types';

const MIN_VALUE_THRESHOLD = 0.01; // Filter tokens worth less than $0.01

export const useAccountTokens = (address: string, chain: Chain) => {
  return useQuery({
    queryKey: ['accountTokens', address, chain.id],
    queryFn: async (): Promise<{ tokens: Token[]; netWorth: number }> => {
      // Fetch token balances and native balance in parallel
      const [tokenBalances, nativeBalance] = await Promise.all([
        getTokenBalances(address, chain),
        getNativeBalance(address, chain),
      ]);

      // Get all token addresses for price lookup
      const tokenAddresses = tokenBalances.map((t) => t.address.toLowerCase());

      // Fetch prices
      const [tokenPrices, nativePrice] = await Promise.all([
        tokenAddresses.length > 0
          ? getTokenPrices(tokenAddresses, chain.coingeckoPlatform)
          : ({} as Record<string, number>),
        getNativeTokenPrice(NATIVE_TOKEN_IDS[chain.id]),
      ]);

      // Build tokens array with prices
      const tokens: Token[] = [];

      // Add native token if balance > 0
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

      // Add ERC20 tokens with prices
      for (const tokenBalance of tokenBalances) {
        const price = tokenPrices[tokenBalance.address.toLowerCase()] ?? null;
        const value = price !== null ? tokenBalance.balanceFormatted * price : null;

        // Only include tokens with price data and value above threshold
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

      // Sort by value descending
      tokens.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      // Calculate net worth
      const netWorth = tokens.reduce((sum, token) => sum + (token.value ?? 0), 0);

      return { tokens, netWorth };
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!address && address.length === 42,
  });
};
