import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    map.set(key, value);
  }
  return map;
}

export interface EnvDiffResult {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: string[];
}

export function envDiff(base: Map<string, string>, target: Map<string, string>): EnvDiffResult {
  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};
  const unchanged: string[] = [];

  for (const [key, value] of target) {
    if (!base.has(key)) {
      added[key] = value;
    } else if (base.get(key) !== value) {
      changed[key] = { from: base.get(key)!, to: value };
    } else {
      unchanged.push(key);
    }
  }

  for (const [key, value] of base) {
    if (!target.has(key)) {
      removed[key] = value;
    }
  }

  return { added, removed, changed, unchanged };
}

export function buildEnvDiffCommand(): Command {
  const cmd = new Command("env-diff");
  cmd
    .description("Show a structured diff between two .env files")
    .argument("<base>", "Base .env file")
    .argument("<target>", "Target .env file")
    .option("--json", "Output as JSON")
    .option("--summary", "Show summary only")
    .action((baseFile: string, targetFile: string, opts: { json?: boolean; summary?: boolean }) => {
      const base = parseEnvFile(path.resolve(baseFile));
      const target = parseEnvFile(path.resolve(targetFile));
      const result = envDiff(base, target);

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (opts.summary) {
        const a = Object.keys(result.added).length;
        const r = Object.keys(result.removed).length;
        const c = Object.keys(result.changed).length;
        const u = result.unchanged.length;
        console.log(`Added: ${a}, Removed: ${r}, Changed: ${c}, Unchanged: ${u}`);
        return;
      }

      for (const [k, v] of Object.entries(result.added)) console.log(`+ ${k}=${v}`);
      for (const [k, v] of Object.entries(result.removed)) console.log(`- ${k}=${v}`);
      for (const [k, { from, to }] of Object.entries(result.changed)) console.log(`~ ${k}: ${from} -> ${to}`);
    });
  return cmd;
}
