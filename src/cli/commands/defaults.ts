import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface DefaultsEntry {
  key: string;
  value: string;
  comment?: string;
}

export function parseEnvFile(content: string): Map<string, string> {
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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function applyDefaults(
  existing: Map<string, string>,
  defaults: Map<string, string>
): { result: Map<string, string>; applied: string[] } {
  const result = new Map(existing);
  const applied: string[] = [];
  for (const [key, value] of defaults.entries()) {
    if (!result.has(key)) {
      result.set(key, value);
      applied.push(key);
    }
  }
  return { result, applied };
}

export function buildDefaultsCommand(): Command {
  const cmd = new Command("defaults");
  cmd
    .description("Apply default values from a defaults file to an env file")
    .argument("<file>", "Target .env file")
    .requiredOption("-d, --defaults <file>", "Defaults .env file")
    .option("--dry-run", "Preview changes without writing", false)
    .option("--format <fmt>", "Output format: text|json", "text")
    .action((file: string, opts: { defaults: string; dryRun: boolean; format: string }) => {
      const targetPath = path.resolve(file);
      const defaultsPath = path.resolve(opts.defaults);

      if (!fs.existsSync(targetPath)) {
        console.error(`Error: file not found: ${targetPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(defaultsPath)) {
        console.error(`Error: defaults file not found: ${defaultsPath}`);
        process.exit(1);
      }

      const existing = parseEnvFile(fs.readFileSync(targetPath, "utf8"));
      const defaults = parseEnvFile(fs.readFileSync(defaultsPath, "utf8"));
      const { result, applied } = applyDefaults(existing, defaults);

      if (opts.format === "json") {
        console.log(JSON.stringify({ applied, total: applied.length }, null, 2));
      } else {
        if (applied.length === 0) {
          console.log("No new defaults applied — all keys already present.");
        } else {
          console.log(`Applied ${applied.length} default(s): ${applied.join(", ")}`);
        }
      }

      if (!opts.dryRun) {
        fs.writeFileSync(targetPath, serializeEnvMap(result), "utf8");
      }
    });
  return cmd;
}
