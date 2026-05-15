import fs from "fs";
import path from "path";
import { Command } from "commander";
import { FreezeResult, FreezeOptions } from "./freeze.types";

const FREEZE_COMMENT = "# frozen";

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    map.set(trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim());
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>, frozenKeys: Set<string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => {
      const line = `${k}=${v}`;
      return frozenKeys.has(k) ? `${line} ${FREEZE_COMMENT}` : line;
    })
    .join("\n") + "\n";
}

export function getFrozenKeys(content: string): Set<string> {
  const frozen = new Set<string>();
  for (const line of content.split("\n")) {
    if (line.includes(FREEZE_COMMENT)) {
      const key = line.split("=")[0].trim();
      if (key) frozen.add(key);
    }
  }
  return frozen;
}

export function freezeEnvFile(
  filePath: string,
  opts: FreezeOptions
): FreezeResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = parseEnvFile(content);
  const existingFrozen = getFrozenKeys(content);
  const targetKeys = opts.keys ?? (opts.all ? Array.from(map.keys()) : []);
  const newFrozen = new Set(existingFrozen);
  const result: FreezeResult = { file: path.basename(filePath), frozen: [], unfrozen: [], skipped: [] };

  for (const key of targetKeys) {
    if (!map.has(key)) { result.skipped.push(key); continue; }
    if (opts.unfreeze) {
      newFrozen.delete(key);
      result.unfrozen.push({ key, value: map.get(key)!, frozen: false });
    } else {
      newFrozen.add(key);
      result.frozen.push({ key, value: map.get(key)!, frozen: true });
    }
  }

  fs.writeFileSync(filePath, serializeEnvMap(map, newFrozen), "utf-8");
  return result;
}

export function buildFreezeCommand(): Command {
  const cmd = new Command("freeze");
  cmd
    .description("Freeze or unfreeze specific keys in an env file")
    .argument("<file>", "env file path")
    .option("-k, --keys <keys>", "comma-separated keys to freeze")
    .option("-a, --all", "freeze all keys")
    .option("-u, --unfreeze", "unfreeze instead of freeze")
    .option("--json", "output as JSON")
    .action((file, options) => {
      const keys = options.keys ? options.keys.split(",").map((k: string) => k.trim()) : undefined;
      const result = freezeEnvFile(file, { keys, all: options.all, unfreeze: options.unfreeze });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const action = options.unfreeze ? "Unfrozen" : "Frozen";
        const changed = options.unfreeze ? result.unfrozen : result.frozen;
        changed.forEach(e => console.log(`${action}: ${e.key}`));
        if (result.skipped.length) console.log(`Skipped: ${result.skipped.join(", ")}`);
      }
    });
  return cmd;
}
