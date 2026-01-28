import { useState, useRef } from 'react';
import { isValidEvmAddress } from '../utils/format';
import { parseAddressCsv } from '../utils/csvParser';

interface AddressInputProps {
  onAddAddress: (address: string) => void;
  onAddAddresses: (addresses: string[]) => void;
  existingAddresses: string[];
}

export const AddressInput = ({ onAddAddress, onAddAddresses, existingAddresses }: AddressInputProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImportResult(null);

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      setError('Please enter an address');
      return;
    }

    if (!isValidEvmAddress(trimmedInput)) {
      setError('Invalid EVM address format');
      return;
    }

    if (existingAddresses.some((addr) => addr.toLowerCase() === trimmedInput.toLowerCase())) {
      setError('Address already added');
      return;
    }

    onAddAddress(trimmedInput);
    setInput('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const { validAddresses, invalidLines } = parseAddressCsv(text);

      // Filter out addresses that already exist
      const newAddresses = validAddresses.filter(
        (addr) => !existingAddresses.some((existing) => existing.toLowerCase() === addr.toLowerCase())
      );

      const duplicateCount = validAddresses.length - newAddresses.length;

      if (newAddresses.length > 0) {
        onAddAddresses(newAddresses);
      }

      // Build result message
      const parts: string[] = [];
      if (newAddresses.length > 0) {
        parts.push(`Added ${newAddresses.length} address${newAddresses.length > 1 ? 'es' : ''}`);
      }
      if (duplicateCount > 0) {
        parts.push(`${duplicateCount} already existed`);
      }
      if (invalidLines.length > 0) {
        parts.push(`${invalidLines.length} invalid`);
      }

      if (parts.length > 0) {
        setImportResult(parts.join(', '));
      } else {
        setError('No valid addresses found in file');
      }
    } catch {
      setError('Failed to read file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter EVM address (0x...)"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Add
          </button>
          <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900">
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </form>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      {importResult && <p className="mt-2 text-green-400 text-sm">{importResult}</p>}
    </div>
  );
};
