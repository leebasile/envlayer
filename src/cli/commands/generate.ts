import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface GenerateOptions {
  output: string;
  keys: string[];
  overwrite: boolean;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(filePath)) return map;
  const content = fs.readFileSync(filePath, "utf-8");
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

export function generateEnvFile(
  keys: string[],
  outputPath: string,
  overwrite: boolean
): { written: string[]; skipped: string[] } {
  const existing = parseEnvFile(outputPath);
  const written: string[] = [];
  const skipped: string[] = [];

  for (const key of keys) {
    if (!overwrite && existing.has(key)) {
      skipped.push(key);
    } else {
      existing.set(key, "");
      written.push(key);
    }
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, serializeEnvMap(existing), "utf-8");

  return { written, skipped };
}

export function buildGenerateCommand(): Command {
  const cmd = new Command("generate");
  cmd
    .description("Generate a .env file with specified keys set to empty values")
    .argument("<keys...>", "Keys to generate in the env file")
    .option("-o, --output <path>", "Output .env file path", ".env")
    .option("--overwrite", "Overwrite existing keys", false)
    .action((keys: string[], opts: { output: string; overwrite: boolean }) => {
      const { written, skipped } = generateEnvFile(keys, opts.output, opts.overwrite);
      if (written.length > 0) {
        console.log(`Generated ${written.length} key(s) in ${opts.output}: ${written.join(", ")}`);
      }
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} existing key(s): ${skipped.join(", ")}`);
      }
    });
  return cmd;
}
