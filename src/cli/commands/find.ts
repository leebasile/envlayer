import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

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

export interface FindResult {
  key: string;
  value: string;
  file: string;
}

export function findEnvKey(
  files: string[],
  pattern: string,
  valueSearch: boolean
): FindResult[] {
  const results: FindResult[] = [];
  const regex = new RegExp(pattern, "i");

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf-8");
    const entries = parseEnvFile(content);
    for (const [key, value] of entries) {
      const matches = valueSearch
        ? regex.test(key) || regex.test(value)
        : regex.test(key);
      if (matches) {
        results.push({ key, value, file: path.resolve(file) });
      }
    }
  }

  return results;
}

export function buildFindCommand(): Command {
  const cmd = new Command("find");
  cmd
    .description("Search for keys (or values) matching a pattern across env files")
    .argument("<pattern>", "regex pattern to search for")
    .argument("<files...>", "env files to search")
    .option("-v, --value", "also search in values", false)
    .option("--json", "output as JSON", false)
    .action((pattern: string, files: string[], opts) => {
      const results = findEnvKey(files, pattern, opts.value);

      if (results.length === 0) {
        console.log("No matches found.");
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      for (const r of results) {
        console.log(`${r.file}  ${r.key}=${r.value}`);
      }
    });

  return cmd;
}
