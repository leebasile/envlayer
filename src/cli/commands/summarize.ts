import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface EnvSummary {
  file: string;
  totalKeys: number;
  emptyValues: number;
  commentLines: number;
  uniqueValues: number;
  duplicateValues: number;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function countCommentLines(filePath: string): number {
  const content = fs.readFileSync(filePath, "utf-8");
  return content.split("\n").filter((l) => l.trim().startsWith("#")).length;
}

export function summarizeEnvFile(filePath: string): EnvSummary {
  const map = parseEnvFile(filePath);
  const commentLines = countCommentLines(filePath);
  const values = Array.from(map.values());
  const valueCounts = new Map<string, number>();
  for (const v of values) {
    valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
  }
  const emptyValues = values.filter((v) => v === "").length;
  const uniqueValues = Array.from(valueCounts.values()).filter((c) => c === 1).length;
  const duplicateValues = Array.from(valueCounts.values()).filter((c) => c > 1).length;

  return {
    file: path.resolve(filePath),
    totalKeys: map.size,
    emptyValues,
    commentLines,
    uniqueValues,
    duplicateValues,
  };
}

export function buildSummarizeCommand(): Command {
  const cmd = new Command("summarize");
  cmd
    .description("Display a summary of an .env file")
    .argument("<file>", "Path to the .env file")
    .option("--json", "Output as JSON")
    .action((file: string, options: { json?: boolean }) => {
      const summary = summarizeEnvFile(file);
      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log(`File:              ${summary.file}`);
        console.log(`Total keys:        ${summary.totalKeys}`);
        console.log(`Empty values:      ${summary.emptyValues}`);
        console.log(`Comment lines:     ${summary.commentLines}`);
        console.log(`Unique values:     ${summary.uniqueValues}`);
        console.log(`Duplicate values:  ${summary.duplicateValues}`);
      }
    });
  return cmd;
}
