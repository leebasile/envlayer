import type { Snapshot } from "./snapshot";

export function formatSnapshotText(snapshot: Snapshot): string {
  const lines: string[] = [
    `Snapshot — Environment: ${snapshot.environment}`,
    `Created At: ${snapshot.createdAt}`,
    `Keys: ${snapshot.entries.length}`,
    "",
  ];
  for (const { key, value } of snapshot.entries) {
    lines.push(`  ${key}=${value}`);
  }
  return lines.join("\n");
}

export function formatSnapshotJson(snapshot: Snapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function formatSnapshotSummary(snapshot: Snapshot): string {
  return `[${snapshot.environment}] ${snapshot.entries.length} keys captured at ${snapshot.createdAt}`;
}
