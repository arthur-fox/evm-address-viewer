import type { Token } from '../types';
import { formatCurrency, formatTokenBalance } from '../utils/format';

interface TokenRowProps {
  token: Token;
}

export const TokenRow = ({ token }: TokenRowProps) => {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 hover:bg-gray-800/50 rounded transition-colors">
      <div className="flex items-center gap-2">
        {token.logoUrl ? (
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="w-6 h-6 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-100">{token.symbol}</p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-sm text-gray-300">
          {formatTokenBalance(token.balanceFormatted)}
        </span>
        <span className="text-sm text-gray-400 ml-2">
          {formatCurrency(token.value)}
        </span>
      </div>
    </div>
  );
};
