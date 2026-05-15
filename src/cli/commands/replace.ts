import * as fs from "fs";
import * as path from "path";
import { Argv } from "yargs";

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

export interface ReplaceResult {
  replaced: string[];
  skipped: string[];
  total: number;
}

export function replaceEnvValues(
  map: Map<string, string>,
  search: string,
  replacement: string,
  options: { keys?: string[]; regex?: boolean; dryRun?: boolean }
): { updated: Map<string, string>; result: ReplaceResult } {
  const updated = new Map(map);
  const replaced: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of map.entries()) {
    if (options.keys && !options.keys.includes(key)) {
      skipped.push(key);
      continue;
    }
    const pattern = options.regex ? new RegExp(search, "g") : search;
    const newValue = options.regex
      ? value.replace(pattern as RegExp, replacement)
      : value.split(search).join(replacement);
    if (newValue !== value) {
      if (!options.dryRun) updated.set(key, newValue);
      replaced.push(key);
    } else {
      skipped.push(key);
    }
  }

  return { updated, result: { replaced, skipped, total: map.size } };
}

export function buildReplaceCommand(yargs: Argv): Argv {
  return yargs.command(
    "replace <file> <search> <replacement>",
    "Replace values in an env file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true })
        .positional("search", { type: "string", demandOption: true })
        .positional("replacement", { type: "string", demandOption: true })
        .option("keys", { type: "string", description: "Comma-separated keys to target" })
        .option("regex", { type: "boolean", default: false })
        .option("dry-run", { type: "boolean", default: false })
        .option("format", { choices: ["text", "json"] as const, default: "text" }),
    (argv) => {
      const filePath = path.resolve(argv.file as string);
      const map = parseEnvFile(filePath);
      const keys = argv.keys ? (argv.keys as string).split(",").map((k) => k.trim()) : undefined;
      const { updated, result } = replaceEnvValues(map, argv.search as string, argv.replacement as string, {
        keys,
        regex: argv.regex as boolean,
        dryRun: argv["dry-run"] as boolean,
      });
      if (!argv["dry-run"]) fs.writeFileSync(filePath, serializeEnvMap(updated));
      if (argv.format === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Replaced ${result.replaced.length} value(s) in ${filePath}`);
        if (result.replaced.length) console.log("  Keys:", result.replaced.join(", "));
        if (argv["dry-run"]) console.log("(dry-run: no changes written)");
      }
    }
  );
}
