export interface EncodeResult {
  keys: string[];
  count: number;
  format: string;
  action: 'encode' | 'decode';
}

export function formatEncodeText(result: EncodeResult): string {
  if (result.count === 0) {
    return `No values were ${result.action}d.`;
  }
  const lines = [
    `${result.action === 'encode' ? 'Encoded' : 'Decoded'} ${result.count} value(s) using ${result.format}:`,
    ...result.keys.map((k) => `  - ${k}`),
  ];
  return lines.join('\n');
}

export function formatEncodeJson(result: EncodeResult): string {
  return JSON.stringify(
    {
      action: result.action,
      format: result.format,
      count: result.count,
      keys: result.keys,
    },
    null,
    2
  );
}

export function formatEncodeSummary(result: EncodeResult): string {
  return `${result.action === 'encode' ? 'Encoded' : 'Decoded'} ${result.count} value(s) [${result.format}]`;
}
