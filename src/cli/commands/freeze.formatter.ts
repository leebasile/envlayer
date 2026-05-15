import { FreezeResult } from "./freeze.types";

export function formatFreezeText(result: FreezeResult, unfreeze = false): string {
  const lines: string[] = [];
  const action = unfreeze ? "Unfrozen" : "Frozen";
  const changed = unfreeze ? result.unfrozen : result.frozen;
  lines.push(`File: ${result.file}`);
  if (changed.length) {
    lines.push(`${action} keys (${changed.length}):`);
    changed.forEach(e => lines.push(`  ${e.key}`));
  } else {
    lines.push(`No keys ${action.toLowerCase()}.`);
  }
  if (result.skipped.length) {
    lines.push(`Skipped (not found): ${result.skipped.join(", ")}`);
  }
  return lines.join("\n");
}

export function formatFreezeJson(result: FreezeResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatFreezeSummary(result: FreezeResult, unfreeze = false): string {
  const changed = unfreeze ? result.unfrozen.length : result.frozen.length;
  const action = unfreeze ? "unfrozen" : "frozen";
  return `${changed} key(s) ${action} in ${result.file}` +
    (result.skipped.length ? `, ${result.skipped.length} skipped` : "") + ".";
}
