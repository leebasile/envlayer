import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
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

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

export interface HashResult {
  file: string;
  algorithm: HashAlgorithm;
  entries: Array<{ key: string; hash: string }>;
  fileHash: string;
}

export function hashEnvFile(
  filePath: string,
  algorithm: HashAlgorithm = "sha256",
  keys?: string[]
): HashResult {
  const entries = parseEnvFile(filePath);
  const filtered = keys && keys.length > 0
    ? new Map([...entries].filter(([k]) => keys.includes(k)))
    : entries;

  const hashed = [...filtered.entries()].map(([key, value]) => ({
    key,
    hash: crypto.createHash(algorithm).update(value).digest("hex"),
  }));

  const content = fs.readFileSync(filePath, "utf-8");
  const fileHash = crypto.createHash(algorithm).update(content).digest("hex");

  return {
    file: path.resolve(filePath),
    algorithm,
    entries: hashed,
    fileHash,
  };
}

export function buildHashCommand(): Command {
  const cmd = new Command("hash");
  cmd
    .description("Hash env variable values for integrity checking or comparison")
    .argument("<file>", "Path to the .env file")
    .option("-a, --algorithm <algo>", "Hash algorithm: md5, sha1, sha256, sha512", "sha256")
    .option("-k, --keys <keys>", "Comma-separated list of keys to hash")
    .option("--json", "Output as JSON")
    .action((file: string, opts: { algorithm: string; keys?: string; json?: boolean }) => {
      const algorithm = (opts.algorithm as HashAlgorithm) || "sha256";
      const keys = opts.keys ? opts.keys.split(",").map((k) => k.trim()) : undefined;
      const result = hashEnvFile(file, algorithm, keys);

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`File: ${result.file}`);
        console.log(`Algorithm: ${result.algorithm}`);
        console.log(`File hash: ${result.fileHash}`);
        console.log("");
        for (const entry of result.entries) {
          console.log(`  ${entry.key}: ${entry.hash}`);
        }
      }
    });
  return cmd;
}
