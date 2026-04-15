import { SearchResult } from "./search";

export function formatSearchText(results: SearchResult[]): string {
  if (results.length === 0) return "No matches found.";
  const lines = results.map(
    (r) => `${r.file}:${r.lineNumber}  ${r.key}=${r.value}`
  );
  lines.push(`\n${results.length} match(es) found.`);
  return lines.join("\n");
}

export function formatSearchJson(results: SearchResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function formatSearchSummary(results: SearchResult[]): string {
  if (results.length === 0) return "No matches found.";
  const fileSet = new Set(results.map((r) => r.file));
  return `Found ${results.length} match(es) across ${fileSet.size} file(s).`;
}
