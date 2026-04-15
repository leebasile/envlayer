import fs from "fs";
import path from "path";
import { Command } from "commander";
import { ProtectResult, UnprotectResult, ProtectMode } from "./protect.types";

const PROTECT_COMMENT_PREFIX = "# envlayer:protect";

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

export function serializeEnvMap(map: Map<string, string>, protectedKeys: Set<string>): string {
  const lines: string[] = [];
  for (const [key, value] of map.entries()) {
    if (protectedKeys.has(key)) {
      lines.push(`${PROTECT_COMMENT_PREFIX}:${key}`);
    }
    lines.push(`${key}=${value}`);
  }
  return lines.join("\n") + "\n";
}

export function getProtectedKeys(content: string): Set<string> {
  const protected_ = new Set<string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${PROTECT_COMMENT_PREFIX}:`)) {
      const key = trimmed.slice(PROTECT_COMMENT_PREFIX.length + 1).trim();
      if (key) protected_.add(key);
    }
  }
  return protected_;
}

export function protectEnvFile(
  filePath: string,
  keys: string[],
  mode: ProtectMode = "read-only"
): ProtectResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = parseEnvFile(content);
  const alreadyProtected = getProtectedKeys(content);
  const newlyProtected: Array<{ key: string; value: string; mode: ProtectMode }> = [];
  const skipped: string[] = [];

  for (const key of keys) {
    if (alreadyProtected.has(key)) {
      skipped.push(key);
    } else if (map.has(key)) {
      alreadyProtected.add(key);
      newlyProtected.push({ key, value: map.get(key)!, mode });
    }
  }

  const output = serializeEnvMap(map, alreadyProtected);
  fs.writeFileSync(filePath, output, "utf-8");

  return {
    file: path.basename(filePath),
    protected: newlyProtected,
    alreadyProtected: skipped,
    total: alreadyProtected.size,
  };
}

export function unprotectEnvFile(filePath: string, keys: string[]): UnprotectResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = parseEnvFile(content);
  const protectedKeys = getProtectedKeys(content);
  const unprotected: string[] = [];
  const notFound: string[] = [];

  for (const key of keys) {
    if (protectedKeys.has(key)) {
      protectedKeys.delete(key);
      unprotected.push(key);
    } else {
      notFound.push(key);
    }
  }

  const output = serializeEnvMap(map, protectedKeys);
  fs.writeFileSync(filePath, output, "utf-8");

  return {
    file: path.basename(filePath),
    unprotected,
    notFound,
    total: protectedKeys.size,
  };
}

export function buildProtectCommand(): Command {
  const cmd = new Command("protect");
  cmd
    .description("Mark environment variable keys as protected in a .env file")
    .argument("<file>", ".env file path")
    .argument("<keys...>", "keys to protect")
    .option("--mode <mode>", "protection mode: read-only or immutable", "read-only")
    .option("--unprotect", "remove protection from the given keys")
    .option("--json", "output as JSON")
    .action((file, keys, opts) => {
      if (opts.unprotect) {
        const result = unprotectEnvFile(file, keys);
        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Unprotected ${result.unprotected.length} key(s) in ${result.file}`);
          if (result.notFound.length > 0) {
            console.log(`Not found or not protected: ${result.notFound.join(", ")}`);
          }
        }
      } else {
        const result = protectEnvFile(file, keys, opts.mode as ProtectMode);
        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Protected ${result.protected.length} key(s) in ${result.file}`);
          if (result.alreadyProtected.length > 0) {
            console.log(`Already protected: ${result.alreadyProtected.join(", ")}`);
          }
        }
      }
    });
  return cmd;
}
