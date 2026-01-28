import { useState, forwardRef, useImperativeHandle } from 'react';
import { useMultiChainTokens } from '../hooks/useMultiChainTokens';
import { formatCurrency } from '../utils/format';
import { TokenRow } from './TokenRow';

interface AccountCardProps {
  address: string;
  onRemove: () => void;
}

export interface AccountCardRef {
  refetchAll: () => Promise<void>;
}

export const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ address, onRemove }, ref) => {
    const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
    const { totalNetWorth, chainBreakdown, isLoading, isFetched, refetchAll } = useMultiChainTokens(address);

    // Expose refetchAll to parent via ref
    useImperativeHandle(ref, () => ({
      refetchAll: async () => {
        await refetchAll();
      },
    }));

    // Get chains with value > 0
    const chainsWithValue = chainBreakdown.filter((c) => c.netWorth > 0);

    // Get selected chain data (if a chain is selected)
    const selectedChain = selectedChainId
      ? chainBreakdown.find((c) => c.chainId === selectedChainId)
      : null;

    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {address.slice(2, 4).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-300 truncate">{address}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                      title="View on Etherscan"
                    >
                      <span>Etherscan</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                    <span className="text-gray-600">|</span>
                    <a
                      href={`https://debank.com/profile/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
                      title="View on DeBank"
                    >
                      <span>DeBank</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {!isFetched ? (
                    <span className="text-gray-500">Not loaded yet</span>
                  ) : (
                    <>
                      Total: <span className="text-green-400 font-medium">{formatCurrency(totalNetWorth)}</span>
                      {isLoading && <span className="ml-2 text-gray-500">(loading...)</span>}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => refetchAll()}
                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                title="Refresh all chains"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chain breakdown - only show chains with value */}
          {isFetched && chainsWithValue.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {chainsWithValue.map((chain) => (
                <button
                  key={chain.chainId}
                  onClick={() => setSelectedChainId(selectedChainId === chain.chainId ? null : chain.chainId)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedChainId === chain.chainId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {chain.chainName}: {formatCurrency(chain.netWorth)}
                </button>
              ))}
            </div>
          )}

          {isFetched && chainsWithValue.length === 0 && !isLoading && (
            <p className="text-xs text-gray-500">No tokens with value found on any chain</p>
          )}
        </div>

        {/* Token List - only show when a chain is selected */}
        {selectedChain && (
          <div className="p-1.5 border-t border-gray-700">
            {selectedChain.isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}

            {selectedChain.isError && (
              <div className="text-center py-4">
                <p className="text-red-400 text-sm">Failed to load tokens</p>
              </div>
            )}

            {!selectedChain.isLoading && !selectedChain.isError && selectedChain.tokens.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No valuable tokens found
              </div>
            )}

            {!selectedChain.isLoading && !selectedChain.isError && selectedChain.tokens.length > 0 && (
              <div>
                {selectedChain.tokens.map((token) => (
                  <TokenRow key={`${selectedChain.chainId}-${token.address}`} token={token} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

AccountCard.displayName = 'AccountCard';
