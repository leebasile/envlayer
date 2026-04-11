import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key) map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function extractEnvKeys(
  map: Map<string, string>,
  keys: string[]
): { extracted: Map<string, string>; missing: string[] } {
  const extracted = new Map<string, string>();
  const missing: string[] = [];
  for (const key of keys) {
    if (map.has(key)) {
      extracted.set(key, map.get(key)!);
    } else {
      missing.push(key);
    }
  }
  return { extracted, missing };
}

export function buildExtractCommand(): Command {
  const cmd = new Command("extract");
  cmd
    .description("Extract specific keys from an env file into a new file")
    .argument("<input>", "Source .env file")
    .argument("<output>", "Destination .env file")
    .requiredOption("-k, --keys <keys>", "Comma-separated list of keys to extract")
    .option("--ignore-missing", "Do not error on missing keys", false)
    .action((input: string, output: string, opts: { keys: string; ignoreMissing: boolean }) => {
      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        console.error(`Error: File not found: ${inputPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(inputPath, "utf-8");
      const map = parseEnvFile(content);
      const keys = opts.keys.split(",").map((k) => k.trim()).filter(Boolean);
      const { extracted, missing } = extractEnvKeys(map, keys);
      if (missing.length > 0 && !opts.ignoreMissing) {
        console.error(`Error: Missing keys: ${missing.join(", ")}`);
        process.exit(1);
      }
      if (missing.length > 0) {
        console.warn(`Warning: Missing keys skipped: ${missing.join(", ")}`);
      }
      const outputPath = path.resolve(output);
      fs.writeFileSync(outputPath, serializeEnvMap(extracted), "utf-8");
      console.log(`Extracted ${extracted.size} key(s) to ${outputPath}`);
    });
  return cmd;
}
