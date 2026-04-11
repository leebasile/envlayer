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

export function flattenEnvFiles(
  files: string[]
): { merged: Map<string, string>; overrides: Record<string, string[]> } {
  const merged = new Map<string, string>();
  const overrides: Record<string, string[]> = {};

  for (const file of files) {
    const entries = parseEnvFile(file);
    for (const [key, value] of entries) {
      if (merged.has(key)) {
        if (!overrides[key]) overrides[key] = [merged.get(key)!];
        overrides[key].push(value);
      }
      merged.set(key, value);
    }
  }

  return { merged, overrides };
}

export function buildFlattenCommand(): Command {
  const cmd = new Command("flatten");
  cmd
    .description("Merge multiple .env files into one, with last-file-wins precedence")
    .argument("<files...>", "Input .env files to flatten (in order)")
    .option("-o, --output <path>", "Output file path (default: stdout)")
    .option("--json", "Output result as JSON")
    .option("--warn-overrides", "Print warnings for overridden keys")
    .action((files: string[], opts) => {
      const { merged, overrides } = flattenEnvFiles(files);

      if (opts.warnOverrides) {
        for (const [key, values] of Object.entries(overrides)) {
          console.warn(`[warn] Key "${key}" was overridden (${values.length} conflict(s))`);
        }
      }

      if (opts.json) {
        const output = Object.fromEntries(merged);
        const json = JSON.stringify(output, null, 2);
        if (opts.output) {
          fs.writeFileSync(path.resolve(opts.output), json, "utf-8");
        } else {
          console.log(json);
        }
      } else {
        const serialized = serializeEnvMap(merged);
        if (opts.output) {
          fs.writeFileSync(path.resolve(opts.output), serialized, "utf-8");
        } else {
          process.stdout.write(serialized);
        }
      }
    });

  return cmd;
}
