export const formatCurrency = (value: number | null): string => {
  if (value === null) return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatTokenBalance = (balance: number, decimals: number = 4): string => {
  if (balance === 0) return '0';

  if (balance < 0.0001) {
    return '<0.0001';
  }

  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toFixed(2)}M`;
  }

  if (balance >= 1_000) {
    return `${(balance / 1_000).toFixed(2)}K`;
  }

  return balance.toFixed(decimals);
};

export const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidEvmAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
