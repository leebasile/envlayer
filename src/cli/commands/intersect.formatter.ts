export interface IntersectResult {
  count: number;
  keys: string[];
  entries: Record<string, string>;
}

export function formatIntersectText(result: IntersectResult): string {
  if (result.count === 0) return 'No common keys found.';
  const lines = result.keys.map((k) => `  ${k}=${result.entries[k]}`);
  return [`Found ${result.count} common key(s):`, ...lines].join('\n');
}

export function formatIntersectJson(result: IntersectResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatIntersectSummary(result: IntersectResult): string {
  return `intersect: ${result.count} common key(s) across files`;
}
