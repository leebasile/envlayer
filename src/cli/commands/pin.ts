import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import * as crypto from "crypto";

export function parseEnvFile(content: string): Map<string, string> {
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

export interface PinResult {
  file: string;
  hash: string;
  keys: number;
  pinnedAt: string;
}

export function pinEnvFile(filePath: string): PinResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries = parseEnvFile(content);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const pinData: PinResult = {
    file: path.resolve(filePath),
    hash,
    keys: entries.size,
    pinnedAt: new Date().toISOString(),
  };
  return pinData;
}

export function savePinFile(pinPath: string, result: PinResult): void {
  fs.writeFileSync(pinPath, JSON.stringify(result, null, 2) + "\n", "utf-8");
}

export function verifyPinFile(filePath: string, pinPath: string): { valid: boolean; expected: string; actual: string } {
  const content = fs.readFileSync(filePath, "utf-8");
  const actual = crypto.createHash("sha256").update(content).digest("hex");
  const pinData: PinResult = JSON.parse(fs.readFileSync(pinPath, "utf-8"));
  return { valid: actual === pinData.hash, expected: pinData.hash, actual };
}

export function buildPinCommand(): Command {
  const cmd = new Command("pin");
  cmd
    .description("Pin an env file by saving its hash for later verification")
    .argument("<file>", "env file to pin")
    .option("-o, --output <path>", "output pin file path", "<file>.pin.json")
    .option("--verify", "verify file against existing pin", false)
    .option("--format <fmt>", "output format: text | json", "text")
    .action((file: string, opts: { output: string; verify: boolean; format: string }) => {
      const pinPath = opts.output === "<file>.pin.json" ? `${file}.pin.json` : opts.output;
      if (opts.verify) {
        const result = verifyPinFile(file, pinPath);
        if (opts.format === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          if (result.valid) {
            console.log(`✔ ${file} matches pinned hash`);
          } else {
            console.error(`✘ ${file} hash mismatch`);
            console.error(`  expected: ${result.expected}`);
            console.error(`  actual:   ${result.actual}`);
            process.exit(1);
          }
        }
      } else {
        const result = pinEnvFile(file);
        savePinFile(pinPath, result);
        if (opts.format === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Pinned ${file} → ${pinPath} (${result.keys} keys, sha256: ${result.hash.slice(0, 12)}...)`);
        }
      }
    });
  return cmd;
}
