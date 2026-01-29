import { useState, useRef, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressInput } from './components/AddressInput';
import { AccountCard } from './components/AccountCard';
import type { AccountCardRef } from './components/AccountCard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [sortByValue, setSortByValue] = useState(false);
  const cardRefs = useRef<Map<string, AccountCardRef>>(new Map());
  const netWorthCache = useRef<Map<string, number>>(new Map());

  const handleAddAddress = (address: string) => {
    setAddresses((prev) => [...prev, address]);
  };

  const handleAddAddresses = (newAddresses: string[]) => {
    setAddresses((prev) => [...prev, ...newAddresses]);
  };

  const handleRemoveAddress = (address: string) => {
    setAddresses((prev) => prev.filter((a) => a.toLowerCase() !== address.toLowerCase()));
    cardRefs.current.delete(address.toLowerCase());
    netWorthCache.current.delete(address.toLowerCase());
  };

  const setCardRef = useCallback((address: string, ref: AccountCardRef | null) => {
    if (ref) {
      cardRefs.current.set(address.toLowerCase(), ref);
    } else {
      cardRefs.current.delete(address.toLowerCase());
    }
  }, []);

  // Update net worth cache when data is fetched
  const updateNetWorth = useCallback((address: string, netWorth: number) => {
    netWorthCache.current.set(address.toLowerCase(), netWorth);
  }, []);

  // Get sorted addresses (by net worth descending, unfetched = $0)
  const getDisplayAddresses = () => {
    if (!sortByValue) return addresses;

    return [...addresses].sort((a, b) => {
      const aValue = netWorthCache.current.get(a.toLowerCase()) ?? 0;
      const bValue = netWorthCache.current.get(b.toLowerCase()) ?? 0;
      return bValue - aValue;
    });
  };

  const handleLoadAll = async () => {
    setIsLoadingAll(true);
    try {
      // Trigger refetch on all cards
      const refetchPromises: Promise<void>[] = [];
      cardRefs.current.forEach((ref) => {
        refetchPromises.push(ref.refetchAll());
      });
      await Promise.all(refetchPromises);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const displayAddresses = getDisplayAddresses();

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">EVM Address Viewer</h1>
          <p className="text-gray-400">
            View ERC20 token holdings and their USD values across multiple chains
          </p>
        </div>

        {/* Address Input */}
        <div className="mb-8">
          <AddressInput onAddAddress={handleAddAddress} onAddAddresses={handleAddAddresses} existingAddresses={addresses} />
        </div>

        {/* Account Cards */}
        {addresses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-500 text-lg">No addresses added yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Enter an EVM address above to view token holdings
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm">{addresses.length} address{addresses.length !== 1 ? 'es' : ''}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortByValue(!sortByValue)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    sortByValue
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {sortByValue ? 'Sorted by Value' : 'Sort by Value'}
                </button>
                <button
                  onClick={handleLoadAll}
                  disabled={isLoadingAll}
                  className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    isLoadingAll
                      ? 'bg-blue-800 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoadingAll && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isLoadingAll ? 'Loading...' : 'Load All'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {displayAddresses.map((address) => (
                <AccountCard
                  key={address}
                  address={address}
                  onRemove={() => handleRemoveAddress(address)}
                  onNetWorthUpdate={updateNetWorth}
                  ref={(ref) => setCardRef(address, ref)}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Powered by DeBank</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
