import { isValidEvmAddress } from './format';

export interface CsvParseResult {
  validAddresses: string[];
  invalidLines: { line: number; value: string; reason: string }[];
}

export const parseAddressCsv = (csvText: string): CsvParseResult => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const validAddresses: string[] = [];
  const invalidLines: { line: number; value: string; reason: string }[] = [];
  const seenAddresses = new Set<string>();

  lines.forEach((line, index) => {
    const address = line.trim();

    if (!isValidEvmAddress(address)) {
      invalidLines.push({
        line: index + 1,
        value: address.length > 20 ? `${address.slice(0, 20)}...` : address,
        reason: 'Invalid EVM address format',
      });
      return;
    }

    const lowerAddress = address.toLowerCase();
    if (seenAddresses.has(lowerAddress)) {
      invalidLines.push({
        line: index + 1,
        value: address.slice(0, 10) + '...',
        reason: 'Duplicate address in file',
      });
      return;
    }

    seenAddresses.add(lowerAddress);
    validAddresses.push(address);
  });

  return { validAddresses, invalidLines };
};
