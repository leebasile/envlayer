import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface EnvStats {
  totalKeys: number;
  emptyValues: number;
  commentLines: number;
  blankLines: number;
  uniqueValues: number;
  duplicateValues: number;
  longestKey: string;
  longestValue: string;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) map.set(key, value);
  }
  return map;
}

export function computeEnvStats(filePath: string): EnvStats {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const entries = parseEnvFile(filePath);

  let commentLines = 0;
  let blankLines = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) blankLines++;
    else if (trimmed.startsWith("#")) commentLines++;
  }

  const values = Array.from(entries.values());
  const valueCounts = new Map<string, number>();
  for (const v of values) {
    valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
  }

  const emptyValues = values.filter((v) => v === "").length;
  const uniqueValues = Array.from(valueCounts.values()).filter((c) => c === 1).length;
  const duplicateValues = Array.from(valueCounts.values()).filter((c) => c > 1).length;

  const keys = Array.from(entries.keys());
  const longestKey = keys.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const longestValue = values.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return {
    totalKeys: entries.size,
    emptyValues,
    commentLines,
    blankLines,
    uniqueValues,
    duplicateValues,
    longestKey,
    longestValue,
  };
}

export function buildStatsCommand(): Command {
  const cmd = new Command("stats");
  cmd
    .description("Display statistics about an env file")
    .argument("<file>", "Path to the .env file")
    .option("--json", "Output as JSON")
    .action((file: string, options: { json?: boolean }) => {
      const resolved = path.resolve(file);
      if (!fs.existsSync(resolved)) {
        console.error(`File not found: ${resolved}`);
        process.exit(1);
      }
      const stats = computeEnvStats(resolved);
      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(`File: ${resolved}`);
        console.log(`Total keys:        ${stats.totalKeys}`);
        console.log(`Empty values:      ${stats.emptyValues}`);
        console.log(`Comment lines:     ${stats.commentLines}`);
        console.log(`Blank lines:       ${stats.blankLines}`);
        console.log(`Unique values:     ${stats.uniqueValues}`);
        console.log(`Duplicate values:  ${stats.duplicateValues}`);
        console.log(`Longest key:       ${stats.longestKey}`);
        console.log(`Longest value len: ${stats.longestValue.length}`);
      }
    });
  return cmd;
}
