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

export interface UniqueResult {
  file: string;
  uniqueKeys: string[];
}

export function findUniqueKeys(files: string[]): UniqueResult[] {
  const maps = files.map((f) => ({ file: f, map: parseEnvFile(f) }));

  return maps.map(({ file, map }) => {
    const otherKeys = new Set(
      maps
        .filter((m) => m.file !== file)
        .flatMap((m) => Array.from(m.map.keys()))
    );
    const uniqueKeys = Array.from(map.keys()).filter((k) => !otherKeys.has(k));
    return { file, uniqueKeys };
  });
}

interface UniqueArgs {
  files: string[];
  format: "text" | "json";
}

export function buildUniqueCommand(yargs: Argv): Argv {
  return yargs.command(
    "unique <files..>",
    "Show keys that exist in only one of the provided env files",
    (y) =>
      y
        .positional("files", {
          describe: "Two or more .env files to compare",
          type: "string",
          array: true,
        })
        .option("format", {
          alias: "f",
          choices: ["text", "json"] as const,
          default: "text" as const,
          describe: "Output format",
        }),
    (argv: ArgumentsCamelCase<UniqueArgs>) => {
      const files = argv.files.map((f) => path.resolve(f));
      if (files.length < 2) {
        console.error("Please provide at least two files to compare.");
        process.exit(1);
      }
      const results = findUniqueKeys(files);
      if (argv.format === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else {
        for (const { file, uniqueKeys } of results) {
          console.log(`\n${path.basename(file)} (${uniqueKeys.length} unique key(s)):`);
          if (uniqueKeys.length === 0) {
            console.log("  (none)");
          } else {
            uniqueKeys.forEach((k) => console.log(`  - ${k}`));
          }
        }
      }
    }
  );
}
