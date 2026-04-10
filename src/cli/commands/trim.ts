import * as fs from "fs";
import * as path from "path";
import { Argv, ArgumentsCamelCase } from "yargs";

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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export interface TrimResult {
  file: string;
  removed: string[];
  kept: number;
}

export function trimEnvFile(
  filePath: string,
  referenceFile: string,
  dryRun: boolean
): TrimResult {
  const source = parseEnvFile(filePath);
  const reference = parseEnvFile(referenceFile);
  const removed: string[] = [];
  const kept = new Map<string, string>();

  for (const [key, value] of source.entries()) {
    if (reference.has(key)) {
      kept.set(key, value);
    } else {
      removed.push(key);
    }
  }

  if (!dryRun && removed.length > 0) {
    fs.writeFileSync(filePath, serializeEnvMap(kept), "utf-8");
  }

  return { file: path.resolve(filePath), removed, kept: kept.size };
}

export function buildTrimCommand(yargs: Argv): Argv {
  return yargs.command(
    "trim <file> <reference>",
    "Remove keys from a .env file that are not present in a reference file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Target .env file to trim" })
        .positional("reference", { type: "string", demandOption: true, describe: "Reference .env file" })
        .option("dry-run", { type: "boolean", default: false, describe: "Preview changes without writing" })
        .option("json", { type: "boolean", default: false, describe: "Output as JSON" }),
    (argv: ArgumentsCamelCase<{ file: string; reference: string; dryRun: boolean; json: boolean }>) => {
      const result = trimEnvFile(argv.file, argv.reference, argv.dryRun);
      if (argv.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.removed.length === 0) {
          console.log(`No keys to trim in ${argv.file}`);
        } else {
          const action = argv.dryRun ? "Would remove" : "Removed";
          console.log(`${action} ${result.removed.length} key(s) from ${argv.file}:`);
          result.removed.forEach((k) => console.log(`  - ${k}`));
          console.log(`Kept: ${result.kept} key(s)`);
        }
      }
    }
  );
}
