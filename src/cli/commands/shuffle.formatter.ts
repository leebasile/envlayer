export interface ShuffleResult {
  file: string;
  keys: number;
  status: 'shuffled';
}

export function formatShuffleText(result: ShuffleResult): string {
  return `Shuffled ${result.keys} keys in ${result.file}`;
}

export function formatShuffleJson(result: ShuffleResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatShuffleSummary(result: ShuffleResult): string {
  return `[shuffle] ${result.file}: ${result.keys} keys reordered randomly`;
}
