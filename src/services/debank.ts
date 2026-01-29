const DEBANK_API_BASE = 'https://pro-openapi.debank.com';

// DeBank API response types
export interface DeBankToken {
  id: string;           // contract address
  chain: string;        // chain id (eth, bsc, arb, etc.)
  symbol: string;
  name: string;
  decimals: number;
  amount: number;       // formatted balance (already adjusted for decimals)
  price: number;        // USD price per token
  logo_url?: string;
  is_core?: boolean;    // whether it's a well-known token
  is_verified?: boolean;
}

export interface DeBankChainBalance {
  id: string;           // chain id
  name: string;
  logo_url: string;
  usd_value: number;
}

export interface DeBankTotalBalance {
  total_usd_value: number;
  chain_list: DeBankChainBalance[];
}

const getApiKey = (): string => {
  const key = import.meta.env.VITE_DEBANK_API_KEY;
  if (!key) {
    throw new Error('VITE_DEBANK_API_KEY is not set');
  }
  return key;
};

/**
 * Get total balance (net worth) for a wallet address
 * Returns total USD value and per-chain breakdown
 */
export async function getUserTotalBalance(address: string): Promise<DeBankTotalBalance> {
  const response = await fetch(
    `${DEBANK_API_BASE}/v1/user/total_balance?id=${address.toLowerCase()}`,
    {
      headers: {
        'AccessKey': getApiKey(),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`DeBank API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all tokens across all chains for a wallet address
 * Returns tokens with balances and USD prices included
 */
export async function getUserTokenList(address: string): Promise<DeBankToken[]> {
  const response = await fetch(
    `${DEBANK_API_BASE}/v1/user/all_token_list?id=${address.toLowerCase()}&is_all=true`,
    {
      headers: {
        'AccessKey': getApiKey(),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`DeBank API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Map DeBank chain IDs to display names
export const DEBANK_CHAIN_NAMES: Record<string, string> = {
  eth: 'Ethereum',
  bsc: 'BNB Chain',
  xdai: 'Gnosis',
  matic: 'Polygon',
  ftm: 'Fantom',
  okt: 'OKX Chain',
  avax: 'Avalanche',
  op: 'Optimism',
  arb: 'Arbitrum',
  celo: 'Celo',
  movr: 'Moonriver',
  cro: 'Cronos',
  boba: 'Boba',
  metis: 'Metis',
  btt: 'BitTorrent',
  aurora: 'Aurora',
  mobm: 'Moonbeam',
  sbch: 'SmartBCH',
  fuse: 'Fuse',
  hmy: 'Harmony',
  palm: 'Palm',
  astar: 'Astar',
  sdn: 'Shiden',
  klay: 'Klaytn',
  rsk: 'RSK',
  iotx: 'IoTeX',
  kcc: 'KCC',
  wan: 'Wanchain',
  sgb: 'Songbird',
  evmos: 'Evmos',
  dfk: 'DFK Chain',
  tlos: 'Telos',
  swm: 'Swimmer',
  nova: 'Arbitrum Nova',
  canto: 'Canto',
  doge: 'Dogechain',
  step: 'Step',
  kava: 'Kava',
  mada: 'Milkomeda',
  cfx: 'Conflux',
  brise: 'Bitgert',
  ckb: 'Godwoken',
  tomb: 'Tomb Chain',
  pze: 'Polygon zkEVM',
  era: 'zkSync Era',
  eos: 'EOS EVM',
  core: 'Core',
  wemix: 'WEMIX',
  etc: 'Ethereum Classic',
  pls: 'PulseChain',
  flr: 'Flare',
  fsn: 'Fusion',
  mtr: 'Meter',
  rose: 'Oasis',
  ron: 'Ronin',
  linea: 'Linea',
  base: 'Base',
  mantle: 'Mantle',
  scroll: 'Scroll',
  opbnb: 'opBNB',
  manta: 'Manta Pacific',
  blast: 'Blast',
  mode: 'Mode',
  merlin: 'Merlin',
  zkfair: 'ZKFair',
  btr: 'Bitlayer',
  bob: 'BOB',
  taiko: 'Taiko',
  sei: 'Sei',
  xlayer: 'X Layer',
  cyber: 'Cyber',
  zora: 'Zora',
};

// Get explorer URL for a chain
export const DEBANK_CHAIN_EXPLORERS: Record<string, string> = {
  eth: 'https://etherscan.io',
  bsc: 'https://bscscan.com',
  matic: 'https://polygonscan.com',
  arb: 'https://arbiscan.io',
  op: 'https://optimistic.etherscan.io',
  base: 'https://basescan.org',
  avax: 'https://snowtrace.io',
  ftm: 'https://ftmscan.com',
  linea: 'https://lineascan.build',
  era: 'https://era.zksync.network',
  scroll: 'https://scrollscan.com',
  blast: 'https://blastscan.io',
  mantle: 'https://mantlescan.xyz',
  celo: 'https://celoscan.io',
  xdai: 'https://gnosisscan.io',
  nova: 'https://nova.arbiscan.io',
  pze: 'https://zkevm.polygonscan.com',
};
