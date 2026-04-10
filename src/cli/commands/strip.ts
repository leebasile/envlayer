import * as fs from "fs";
import * as path from "path";
import { Argv, ArgumentsCamelCase } from "yargs";

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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function stripEnvFile(
  filePath: string,
  keys: string[]
): { stripped: string[]; outputPath: string } {
  const absPath = path.resolve(filePath);
  const map = parseEnvFile(absPath);
  const stripped: string[] = [];

  for (const key of keys) {
    if (map.has(key)) {
      map.delete(key);
      stripped.push(key);
    }
  }

  const serialized = serializeEnvMap(map);
  fs.writeFileSync(absPath, serialized + "\n", "utf-8");

  return { stripped, outputPath: absPath };
}

interface StripArgs {
  file: string;
  keys: string[];
  json?: boolean;
}

export function buildStripCommand(yargs: Argv): Argv {
  return yargs.command(
    "strip <file> <keys..>",
    "Remove one or more keys from an env file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Path to the .env file" })
        .positional("keys", { type: "string", array: true, demandOption: true, describe: "Keys to remove" })
        .option("json", { type: "boolean", default: false, describe: "Output result as JSON" }),
    (argv: ArgumentsCamelCase<StripArgs>) => {
      const { stripped, outputPath } = stripEnvFile(argv.file, argv.keys);
      if (argv.json) {
        console.log(JSON.stringify({ outputPath, stripped }, null, 2));
      } else {
        if (stripped.length === 0) {
          console.log("No matching keys found to strip.");
        } else {
          console.log(`Stripped ${stripped.length} key(s) from ${outputPath}:`);
          stripped.forEach((k) => console.log(`  - ${k}`));
        }
      }
    }
  );
}
