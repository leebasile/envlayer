import fs from "fs";
import path from "path";
import { Command } from "commander";
import { RequiredKeyResult, RequiredReport } from "./required.types";

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

export function checkRequiredKeys(
  filePath: string,
  keys: string[]
): RequiredReport {
  const env = parseEnvFile(filePath);
  const results: RequiredKeyResult[] = keys.map((key) => ({
    key,
    present: env.has(key),
    value: env.get(key),
  }));
  const missing = results.filter((r) => !r.present).map((r) => r.key);
  const present = results.filter((r) => r.present).map((r) => r.key);
  return {
    file: path.resolve(filePath),
    keys: results,
    missing,
    present,
    total: keys.length,
    allPresent: missing.length === 0,
  };
}

export function buildRequiredCommand(): Command {
  const cmd = new Command("required");
  cmd
    .description("Check that required keys exist in an env file")
    .argument("<file>", "Path to the .env file")
    .requiredOption("-k, --keys <keys>", "Comma-separated list of required keys")
    .option("--json", "Output as JSON")
    .action((file: string, opts: { keys: string; json?: boolean }) => {
      const keys = opts.keys.split(",").map((k) => k.trim()).filter(Boolean);
      const report = checkRequiredKeys(file, keys);
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`File: ${report.file}`);
        for (const r of report.keys) {
          const status = r.present ? "✔" : "✘";
          console.log(`  ${status} ${r.key}`);
        }
        if (!report.allPresent) {
          console.error(`\nMissing keys: ${report.missing.join(", ")}`);
          process.exit(1);
        } else {
          console.log("\nAll required keys are present.");
        }
      }
    });
  return cmd;
}
