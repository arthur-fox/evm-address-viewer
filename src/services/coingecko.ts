const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (longer to reduce rate limiting)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTokenPrices = async (
  tokenAddresses: string[],
  platform: string
): Promise<Record<string, number>> => {
  if (tokenAddresses.length === 0) {
    return {};
  }

  const cacheKey = `${platform}:${tokenAddresses.sort().join(',')}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prices;
  }

  // CoinGecko free tier has rate limits, batch in chunks of 100
  const chunkSize = 100;
  const allPrices: Record<string, number> = {};

  for (let i = 0; i < tokenAddresses.length; i += chunkSize) {
    const chunk = tokenAddresses.slice(i, i + chunkSize);
    const addressList = chunk.join(',');

    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${addressList}&vs_currencies=usd`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 429) {
        // Rate limited, wait and retry
        await delay(10000);
        i -= chunkSize; // Retry this chunk
        continue;
      }

      if (!response.ok) {
        console.warn(`CoinGecko API error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      for (const [address, priceData] of Object.entries(data)) {
        const price = (priceData as { usd?: number })?.usd;
        if (price !== undefined) {
          allPrices[address.toLowerCase()] = price;
        }
      }

      // Respect rate limits between chunks
      if (i + chunkSize < tokenAddresses.length) {
        await delay(1500);
      }
    } catch (error) {
      console.warn('Failed to fetch prices from CoinGecko:', error);
    }
  }

  priceCache.set(cacheKey, {
    prices: allPrices,
    timestamp: Date.now(),
  });

  return allPrices;
};

// Cache for native token prices
const nativePriceCache = new Map<string, { price: number; timestamp: number }>();

export const getNativeTokenPrice = async (coinId: string): Promise<number | null> => {
  if (!coinId) return null;

  // Check cache first
  const cached = nativePriceCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`
    );

    if (response.status === 429) {
      // Rate limited - return cached value if available, otherwise null
      return cached?.price ?? null;
    }

    if (!response.ok) {
      return cached?.price ?? null;
    }

    const data = await response.json();
    const price = data[coinId]?.usd ?? null;

    if (price !== null) {
      nativePriceCache.set(coinId, { price, timestamp: Date.now() });
    }

    return price;
  } catch {
    return cached?.price ?? null;
  }
};

// Map chain IDs to CoinGecko native token IDs
export const NATIVE_TOKEN_IDS: Record<string, string> = {
  ethereum: 'ethereum',
  polygon: 'matic-network',
  arbitrum: 'ethereum',
  optimism: 'ethereum',
  base: 'ethereum',
  bsc: 'binancecoin',
  avalanche: 'avalanche-2',
  'arbitrum-nova': 'ethereum',
  linea: 'ethereum',
  zksync: 'ethereum',
  fantom: 'fantom',
  scroll: 'ethereum',
  gnosis: 'dai',
  blast: 'ethereum',
  mantle: 'mantle',
  celo: 'celo',
  'polygon-zkevm': 'ethereum',
};
