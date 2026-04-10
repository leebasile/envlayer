import * as fs from "fs";
import * as path from "path";
import { Argv, ArgumentsCamelCase } from "yargs";

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

export function sortEnvFile(
  filePath: string,
  order: "asc" | "desc" = "asc"
): { sorted: string; keyCount: number } {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, "utf-8");
  const map = parseEnvFile(content);

  const sortedKeys = Array.from(map.keys()).sort((a, b) =>
    order === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );

  const sortedMap = new Map<string, string>();
  for (const key of sortedKeys) {
    sortedMap.set(key, map.get(key)!);
  }

  const sorted = serializeEnvMap(sortedMap);
  fs.writeFileSync(resolved, sorted, "utf-8");

  return { sorted, keyCount: sortedMap.size };
}

interface SortArgs {
  file: string;
  order: "asc" | "desc";
}

export function buildSortCommand(yargs: Argv): Argv {
  return yargs.command(
    "sort <file>",
    "Sort keys in an .env file alphabetically",
    (y) =>
      y
        .positional("file", {
          describe: "Path to the .env file",
          type: "string",
          demandOption: true,
        })
        .option("order", {
          alias: "o",
          describe: "Sort order",
          choices: ["asc", "desc"] as const,
          default: "asc" as const,
        }),
    (argv: ArgumentsCamelCase<SortArgs>) => {
      try {
        const { keyCount } = sortEnvFile(argv.file, argv.order);
        console.log(
          `Sorted ${keyCount} key(s) in ${argv.order}ending order in: ${argv.file}`
        );
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    }
  );
}
