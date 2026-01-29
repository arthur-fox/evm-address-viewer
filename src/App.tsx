import { useState, useRef, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AddressInput } from './components/AddressInput';
import { AccountCard } from './components/AccountCard';
import type { AccountCardRef } from './components/AccountCard';
import type { ExportData } from './types';

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
  const [loadAllCooldown, setLoadAllCooldown] = useState<number | null>(null);
  const [cooldownDisplay, setCooldownDisplay] = useState<string>('');
  const cardRefs = useRef<Map<string, AccountCardRef>>(new Map());
  const netWorthCache = useRef<Map<string, number>>(new Map());
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update cooldown display every second
  useEffect(() => {
    if (loadAllCooldown === null) {
      setCooldownDisplay('');
      return;
    }

    const updateDisplay = () => {
      const remaining = loadAllCooldown - Date.now();
      if (remaining <= 0) {
        setLoadAllCooldown(null);
        setCooldownDisplay('');
      } else {
        const minutes = Math.ceil(remaining / 60000);
        setCooldownDisplay(`Wait ${minutes}m`);
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [loadAllCooldown]);

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

  // Count unloaded addresses
  const getUnloadedAddresses = () => {
    return addresses.filter(
      (addr) => !queryClient.getQueryData(['accountTokens', addr])
    );
  };

  const handleLoadAll = async () => {
    const unloadedAddresses = getUnloadedAddresses();

    // If all addresses are already loaded
    if (unloadedAddresses.length === 0) {
      alert('All addresses are already loaded!');
      return;
    }

    // Estimate: ~$0.01 per address (2 API calls per address)
    const estimatedCost = (unloadedAddresses.length * 0.01).toFixed(2);

    const confirmed = window.confirm(
      `Load ${unloadedAddresses.length} addresses?\n\nEstimated API cost: ~$${estimatedCost}\n\nAlready loaded addresses will be skipped.`
    );

    if (!confirmed) return;

    setIsLoadingAll(true);
    try {
      // Only refetch cards for unloaded addresses
      const refetchPromises: Promise<void>[] = [];
      unloadedAddresses.forEach((addr) => {
        const ref = cardRefs.current.get(addr.toLowerCase());
        if (ref) {
          refetchPromises.push(ref.refetchAll());
        }
      });
      await Promise.all(refetchPromises);

      // Start 5-minute cooldown
      setLoadAllCooldown(Date.now() + 5 * 60 * 1000);
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Export data to JSON file
  const handleExport = () => {
    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      addresses,
      cache: {},
    };

    // Get cached data for each address from React Query
    addresses.forEach((address) => {
      const data = queryClient.getQueryData(['accountTokens', address]) as ExportData['cache'][string] | undefined;
      if (data) {
        exportData.cache[address.toLowerCase()] = data;
      }
    });

    // Download as JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evm-addresses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;

        if (!data.version || !data.addresses || !data.cache) {
          alert('Invalid export file format');
          return;
        }

        // Restore addresses
        setAddresses(data.addresses);

        // Restore React Query cache for each address
        Object.entries(data.cache).forEach(([address, cacheData]) => {
          queryClient.setQueryData(['accountTokens', address], cacheData);
        });

        // Update netWorthCache for sorting
        Object.entries(data.cache).forEach(([address, cacheData]) => {
          netWorthCache.current.set(address.toLowerCase(), cacheData.totalNetWorth);
        });

        alert(`Imported ${data.addresses.length} addresses (exported ${new Date(data.exportedAt).toLocaleDateString()})`);
      } catch {
        alert('Failed to parse export file');
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    event.target.value = '';
  };

  const displayAddresses = getDisplayAddresses();
  const unloadedCount = getUnloadedAddresses().length;
  const isLoadAllDisabled = isLoadingAll || loadAllCooldown !== null;

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
              Enter an EVM address above or import data to view token holdings
            </p>
            <label className="inline-block mt-4 px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <span className="text-gray-400 text-sm">
                {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
                {unloadedCount > 0 && unloadedCount < addresses.length && (
                  <span className="text-gray-500"> ({unloadedCount} not loaded)</span>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
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
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Export
                </button>
                <label className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  Import
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleLoadAll}
                  disabled={isLoadAllDisabled}
                  className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    isLoadAllDisabled
                      ? 'bg-blue-800 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoadingAll && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isLoadingAll ? 'Loading...' : cooldownDisplay || `Load All${unloadedCount > 0 ? ` (${unloadedCount})` : ''}`}
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
