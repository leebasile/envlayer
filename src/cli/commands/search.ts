import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface SearchResult {
  file: string;
  key: string;
  value: string;
  lineNumber: number;
}

export function parseEnvFile(content: string): Map<string, { value: string; line: number }> {
  const map = new Map<string, { value: string; line: number }>();
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    map.set(key, { value, line: index + 1 });
  });
  return map;
}

export function searchEnvFiles(
  files: string[],
  pattern: string,
  searchKeys: boolean,
  searchValues: boolean
): SearchResult[] {
  const regex = new RegExp(pattern, "i");
  const results: SearchResult[] = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf-8");
    const entries = parseEnvFile(content);
    for (const [key, { value, line }] of entries) {
      const keyMatch = searchKeys && regex.test(key);
      const valueMatch = searchValues && regex.test(value);
      if (keyMatch || valueMatch) {
        results.push({ file: path.resolve(file), key, value, lineNumber: line });
      }
    }
  }

  return results;
}

export function buildSearchCommand(): Command {
  const cmd = new Command("search");
  cmd
    .description("Search for keys or values matching a pattern across env files")
    .argument("<pattern>", "Regex pattern to search for")
    .argument("[files...]", "Env files to search", [".env"])
    .option("--keys-only", "Search only in keys")
    .option("--values-only", "Search only in values")
    .option("--json", "Output as JSON")
    .action((pattern: string, files: string[], opts) => {
      const searchKeys = !opts.valuesOnly;
      const searchValues = !opts.keysOnly;
      const results = searchEnvFiles(files, pattern, searchKeys, searchValues);
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else if (results.length === 0) {
        console.log("No matches found.");
      } else {
        for (const r of results) {
          console.log(`${r.file}:${r.lineNumber}  ${r.key}=${r.value}`);
        }
        console.log(`\n${results.length} match(es) found.`);
      }
    });
  return cmd;
}
