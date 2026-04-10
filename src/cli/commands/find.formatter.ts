import { FindResult } from "./find";

export function formatFindText(results: FindResult[]): string {
  if (results.length === 0) return "No matches found.";

  const lines: string[] = [];
  let lastFile = "";

  for (const r of results) {
    if (r.file !== lastFile) {
      if (lastFile !== "") lines.push("");
      lines.push(`File: ${r.file}`);
      lines.push("-".repeat(40));
      lastFile = r.file;
    }
    lines.push(`  ${r.key}=${r.value}`);
  }

  return lines.join("\n");
}

export function formatFindJson(results: FindResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function formatFindSummary(results: FindResult[]): string {
  const fileCount = new Set(results.map((r) => r.file)).size;
  return `Found ${results.length} match(es) across ${fileCount} file(s).`;
}
