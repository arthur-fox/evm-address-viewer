import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AddressInput } from './components/AddressInput';
import { AccountCard } from './components/AccountCard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const handleAddAddress = (address: string) => {
    setAddresses((prev) => [...prev, address]);
  };

  const handleAddAddresses = (newAddresses: string[]) => {
    setAddresses((prev) => [...prev, ...newAddresses]);
  };

  const handleRemoveAddress = (address: string) => {
    setAddresses((prev) => prev.filter((a) => a.toLowerCase() !== address.toLowerCase()));
  };

  const handleLoadAll = () => {
    queryClient.refetchQueries({ queryKey: ['accountTokens'] });
  };

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
              <button
                onClick={handleLoadAll}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Load All
              </button>
            </div>
            <div className="space-y-3">
              {addresses.map((address) => (
                <AccountCard
                  key={address}
                  address={address}
                  onRemove={() => handleRemoveAddress(address)}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Powered by Alchemy & CoinGecko</p>
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
