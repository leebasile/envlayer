import fs from "fs";
import path from "path";
import { CommandBuilder } from "yargs";
import { RenamePrefixResult } from "./rename-prefix.types";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function renamePrefixEnvKeys(
  filePath: string,
  oldPrefix: string,
  newPrefix: string,
  dryRun = false
): RenamePrefixResult {
  const map = parseEnvFile(filePath);
  const renamedKeys: Array<{ from: string; to: string }> = [];
  const skippedKeys: string[] = [];
  const updated = new Map<string, string>();

  for (const [key, value] of map.entries()) {
    if (key.startsWith(oldPrefix)) {
      const newKey = newPrefix + key.slice(oldPrefix.length);
      if (map.has(newKey)) {
        skippedKeys.push(key);
        updated.set(key, value);
      } else {
        renamedKeys.push({ from: key, to: newKey });
        updated.set(newKey, value);
      }
    } else {
      updated.set(key, value);
    }
  }

  if (!dryRun && renamedKeys.length > 0) {
    fs.writeFileSync(filePath, serializeEnvMap(updated), "utf-8");
  }

  return {
    file: path.resolve(filePath),
    oldPrefix,
    newPrefix,
    renamedKeys,
    skippedKeys,
    totalKeys: map.size,
  };
}

export function buildRenamePrefixCommand() {
  return {
    command: "rename-prefix <file> <oldPrefix> <newPrefix>",
    describe: "Rename all keys sharing a common prefix in an env file",
    builder: (yargs: CommandBuilder) =>
      (yargs as any)
        .positional("file", { type: "string", describe: "Path to .env file" })
        .positional("oldPrefix", { type: "string", describe: "Prefix to replace" })
        .positional("newPrefix", { type: "string", describe: "New prefix" })
        .option("dry-run", { type: "boolean", default: false, describe: "Preview changes without writing" })
        .option("format", { choices: ["text", "json"], default: "text" }),
    handler(argv: any) {
      const result = renamePrefixEnvKeys(argv.file, argv.oldPrefix, argv.newPrefix, argv.dryRun);
      const { formatRenamePrefixText, formatRenamePrefixJson } = require("./rename-prefix.formatter");
      if (argv.format === "json") {
        console.log(JSON.stringify(formatRenamePrefixJson(result), null, 2));
      } else {
        console.log(formatRenamePrefixText(result, argv.dryRun));
      }
    },
  };
}
