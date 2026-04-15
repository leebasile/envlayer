import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

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
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export interface NormalizeResult {
  original: Map<string, string>;
  normalized: Map<string, string>;
  changes: Array<{ key: string; from: string; to: string }>;
}

export function normalizeEnvFile(
  filePath: string,
  options: { quoteValues?: boolean; trimValues?: boolean; removeEmpty?: boolean }
): NormalizeResult {
  const original = parseEnvFile(filePath);
  const normalized = new Map<string, string>();
  const changes: Array<{ key: string; from: string; to: string }> = [];

  for (const [key, value] of original.entries()) {
    let newValue = value;

    if (options.trimValues) {
      newValue = newValue.trim().replace(/^['"]|['"]$/g, "").trim();
    }

    if (options.removeEmpty && newValue === "") {
      changes.push({ key, from: value, to: "<removed>" });
      continue;
    }

    if (options.quoteValues && newValue.includes(" ") && !newValue.startsWith('"')) {
      newValue = `"${newValue}"`;
    }

    if (newValue !== value) {
      changes.push({ key, from: value, to: newValue });
    }

    normalized.set(key, newValue);
  }

  return { original, normalized, changes };
}

export function buildNormalizeCommand(): Command {
  const cmd = new Command("normalize");
  cmd
    .description("Normalize values in a .env file (trim, quote, remove empty)")
    .argument("<file>", "path to .env file")
    .option("--trim", "trim whitespace and surrounding quotes from values", false)
    .option("--quote", "wrap values containing spaces in double quotes", false)
    .option("--remove-empty", "remove keys with empty values", false)
    .option("--dry-run", "preview changes without writing", false)
    .option("--format <fmt>", "output format: text | json", "text")
    .action((file, opts) => {
      const resolved = path.resolve(file);
      const result = normalizeEnvFile(resolved, {
        trimValues: opts.trim,
        quoteValues: opts.quote,
        removeEmpty: opts.removeEmpty,
      });

      if (opts.format === "json") {
        console.log(JSON.stringify({ changes: result.changes, total: result.changes.length }, null, 2));
      } else {
        if (result.changes.length === 0) {
          console.log("No changes needed.");
        } else {
          for (const c of result.changes) {
            console.log(`  ${c.key}: ${c.from} → ${c.to}`);
          }
          console.log(`\n${result.changes.length} change(s) found.`);
        }
      }

      if (!opts.dryRun) {
        fs.writeFileSync(resolved, serializeEnvMap(result.normalized), "utf-8");
        if (opts.format !== "json") console.log(`Written to ${resolved}`);
      } else {
        if (opts.format !== "json") console.log("Dry run — no files written.");
      }
    });
  return cmd;
}
