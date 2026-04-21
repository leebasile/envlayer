export interface IncludeResult {
  included: string[];
  missing: string[];
  dryRun: boolean;
}

export function formatIncludeText(result: IncludeResult): string {
  const lines: string[] = [];

  if (result.dryRun) {
    lines.push("[dry-run] No changes written.");
  }

  if (result.included.length > 0) {
    lines.push(`Included keys (${result.included.length}):`);
    for (const key of result.included) {
      lines.push(`  + ${key}`);
    }
  } else {
    lines.push("No keys were included.");
  }

  if (result.missing.length > 0) {
    lines.push(`Missing in source (${result.missing.length}):`);
    for (const key of result.missing) {
      lines.push(`  ! ${key}`);
    }
  }

  return lines.join("\n");
}

export function formatIncludeJson(result: IncludeResult): string {
  return JSON.stringify(
    {
      included: result.included,
      missing: result.missing,
      dryRun: result.dryRun,
    },
    null,
    2
  );
}

export function formatIncludeSummary(result: IncludeResult): string {
  const parts: string[] = [];
  if (result.included.length > 0) parts.push(`${result.included.length} included`);
  if (result.missing.length > 0) parts.push(`${result.missing.length} missing`);
  if (result.dryRun) parts.push("dry-run");
  return parts.length > 0 ? parts.join(", ") : "nothing to report";
}
