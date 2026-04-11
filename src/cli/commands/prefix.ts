import fs from "fs";
import path from "path";
import { Argv } from "yargs";
import { PrefixResult } from "./prefix.types";

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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function prefixEnvKeys(
  filePath: string,
  prefix: string,
  strip: boolean = false
): PrefixResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = parseEnvFile(content);
  const result = new Map<string, string>();
  const originalKeys: string[] = [];
  const renamedKeys: string[] = [];

  for (const [key, value] of map.entries()) {
    originalKeys.push(key);
    let newKey: string;
    if (strip) {
      newKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    } else {
      newKey = key.startsWith(prefix) ? key : `${prefix}${key}`;
    }
    renamedKeys.push(newKey);
    result.set(newKey, value);
  }

  return {
    file: filePath,
    prefix,
    keysRenamed: originalKeys.filter((k, i) => k !== renamedKeys[i]).length,
    originalKeys,
    renamedKeys,
  };
}

export function buildPrefixCommand(yargs: Argv): Argv {
  return yargs.command(
    "prefix <file> <prefix>",
    "Add or strip a prefix from all keys in an env file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Path to .env file" })
        .positional("prefix", { type: "string", demandOption: true, describe: "Prefix string" })
        .option("strip", { type: "boolean", default: false, describe: "Strip prefix instead of adding" })
        .option("dry-run", { type: "boolean", default: false, describe: "Preview changes without writing" })
        .option("output", { type: "string", describe: "Output file path (defaults to input file)" })
        .option("format", { choices: ["text", "json"] as const, default: "text" }),
    (argv) => {
      const prefixResult = prefixEnvKeys(argv.file as string, argv.prefix as string, argv.strip);
      if (!argv["dry-run"]) {
        const content = fs.readFileSync(argv.file as string, "utf-8");
        const map = parseEnvFile(content);
        const newMap = new Map<string, string>();
        prefixResult.renamedKeys.forEach((k, i) => newMap.set(k, map.get(prefixResult.originalKeys[i])!));
        const outPath = (argv.output as string) || (argv.file as string);
        fs.writeFileSync(outPath, serializeEnvMap(newMap));
      }
      if (argv.format === "json") {
        console.log(JSON.stringify(prefixResult, null, 2));
      } else {
        console.log(`Processed ${prefixResult.file}`);
        console.log(`Keys renamed: ${prefixResult.keysRenamed}`);
        if (argv["dry-run"]) console.log("(dry-run: no changes written)");
      }
    }
  );
}
