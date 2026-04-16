import * as fs from "fs";
import * as path from "path";

export interface GroupByResult {
  groups: Record<string, Record<string, string>>;
  ungrouped: Record<string, string>;
  totalKeys: number;
}

export function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

export function groupEnvByPrefix(
  env: Record<string, string>,
  separator: string = "_"
): GroupByResult {
  const groups: Record<string, Record<string, string>> = {};
  const ungrouped: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    const sepIndex = key.indexOf(separator);
    if (sepIndex > 0) {
      const prefix = key.slice(0, sepIndex);
      if (!groups[prefix]) groups[prefix] = {};
      groups[prefix][key] = value;
    } else {
      ungrouped[key] = value;
    }
  }

  return { groups, ungrouped, totalKeys: Object.keys(env).length };
}

export function buildGroupByCommand(yargs: any): any {
  return yargs.command(
    "groupby <file>",
    "Group environment variables by key prefix",
    (y: any) =>
      y
        .positional("file", { type: "string", describe: "Path to .env file", demandOption: true })
        .option("separator", { alias: "s", type: "string", default: "_", describe: "Prefix separator" })
        .option("format", { alias: "f", type: "string", choices: ["text", "json"], default: "text" }),
    (argv: any) => {
      const filePath = path.resolve(argv.file);
      const env = parseEnvFile(filePath);
      const result = groupEnvByPrefix(env, argv.separator);

      if (argv.format === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Total keys: ${result.totalKeys}`);
        for (const [prefix, keys] of Object.entries(result.groups)) {
          console.log(`\n[${prefix}]`);
          for (const [k, v] of Object.entries(keys)) {
            console.log(`  ${k}=${v}`);
          }
        }
        if (Object.keys(result.ungrouped).length > 0) {
          console.log(`\n[ungrouped]`);
          for (const [k, v] of Object.entries(result.ungrouped)) {
            console.log(`  ${k}=${v}`);
          }
        }
      }
    }
  );
}
