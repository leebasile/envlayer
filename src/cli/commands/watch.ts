import fs from "fs";
import path from "path";
import { Command } from "commander";
import { parseEnvFile } from "./diff";

/**
 * Watches one or more .env files for changes and reports diffs on each update.
 */

type WatchOptions = {
  format: "text" | "json";
  debounce: number;
  clear: boolean;
};

/** Snapshot of a parsed env file keyed by variable name */
type EnvSnapshot = Map<string, string>;

/** Capture the current state of an env file */
function snapshotFile(filePath: string): EnvSnapshot {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return new Map(Object.entries(parseEnvFile(raw)));
  } catch {
    return new Map();
  }
}

/** Compute the diff between two snapshots */
function diffSnapshots(
  before: EnvSnapshot,
  after: EnvSnapshot
): { added: string[]; removed: string[]; changed: Array<{ key: string; from: string; to: string }> } {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ key: string; from: string; to: string }> = [];

  for (const [key, value] of after) {
    if (!before.has(key)) {
      added.push(key);
    } else if (before.get(key) !== value) {
      changed.push({ key, from: before.get(key)!, to: value });
    }
  }

  for (const key of before.keys()) {
    if (!after.has(key)) {
      removed.push(key);
    }
  }

  return { added, removed, changed };
}

/** Format a diff event as human-readable text */
function formatWatchText(
  filePath: string,
  diff: ReturnType<typeof diffSnapshots>
): string {
  const lines: string[] = [
    `[${new Date().toISOString()}] ${path.basename(filePath)} changed:`,
  ];
  for (const key of diff.added) lines.push(`  + ${key}`);
  for (const key of diff.removed) lines.push(`  - ${key}`);
  for (const { key, from, to } of diff.changed) lines.push(`  ~ ${key}: "${from}" → "${to}"`);
  if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
    lines.push("  (no meaningful changes)");
  }
  return lines.join("\n");
}

/** Format a diff event as JSON */
function formatWatchJson(
  filePath: string,
  diff: ReturnType<typeof diffSnapshots>
): string {
  return JSON.stringify(
    { timestamp: new Date().toISOString(), file: filePath, ...diff },
    null,
    2
  );
}

/** Watch a single file, emitting diffs on change */
function watchFile(filePath: string, opts: WatchOptions): void {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    return;
  }

  let snapshot = snapshotFile(resolved);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  console.log(`Watching ${resolved} for changes… (Ctrl+C to stop)`);

  fs.watch(resolved, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const next = snapshotFile(resolved);
      const diff = diffSnapshots(snapshot, next);
      snapshot = next;

      if (opts.clear) process.stdout.write("\x1Bc");

      const output =
        opts.format === "json"
          ? formatWatchJson(resolved, diff)
          : formatWatchText(resolved, diff);

      console.log(output);
    }, opts.debounce);
  });
}

/** Build the `watch` CLI sub-command */
export function buildWatchCommand(): Command {
  return new Command("watch")
    .description("Watch .env file(s) for changes and print a live diff")
    .argument("<files...>", "One or more .env files to watch")
    .option("-f, --format <format>", "Output format: text or json", "text")
    .option("-d, --debounce <ms>", "Debounce delay in milliseconds", "200")
    .option("--clear", "Clear the terminal before each diff output", false)
    .action((files: string[], options: { format: string; debounce: string; clear: boolean }) => {
      const opts: WatchOptions = {
        format: options.format === "json" ? "json" : "text",
        debounce: Math.max(0, parseInt(options.debounce, 10) || 200),
        clear: options.clear,
      };

      for (const file of files) {
        watchFile(file, opts);
      }
    });
}
