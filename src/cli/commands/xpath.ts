import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    map.set(key, value);
  }
  return map;
}

export function xpathEnvKeys(
  env: Map<string, string>,
  expression: string
): Map<string, string> {
  // Supports simple glob-like expressions: prefix.*, *.suffix, exact
  const result = new Map<string, string>();
  const isGlob = expression.includes("*");
  if (!isGlob) {
    if (env.has(expression)) result.set(expression, env.get(expression)!);
    return result;
  }
  const [prefix, suffix] = expression.split("*");
  for (const [key, value] of env.entries()) {
    const matchesPrefix = prefix ? key.startsWith(prefix) : true;
    const matchesSuffix = suffix ? key.endsWith(suffix) : true;
    if (matchesPrefix && matchesSuffix) result.set(key, value);
  }
  return result;
}

export function buildXpathCommand(): Command {
  const cmd = new Command("xpath");
  cmd
    .description("Query env keys using glob-like expressions")
    .argument("<file>", "Path to .env file")
    .argument("<expression>", "Key expression (e.g. DB_*, *_URL, EXACT_KEY)")
    .option("--format <fmt>", "Output format: text | json", "text")
    .action((file: string, expression: string, opts: { format: string }) => {
      const resolved = path.resolve(file);
      if (!fs.existsSync(resolved)) {
        console.error(`File not found: ${resolved}`);
        process.exit(1);
      }
      const env = parseEnvFile(resolved);
      const matched = xpathEnvKeys(env, expression);
      if (opts.format === "json") {
        console.log(JSON.stringify(Object.fromEntries(matched), null, 2));
      } else {
        if (matched.size === 0) {
          console.log("No keys matched.");
        } else {
          for (const [key, value] of matched.entries()) {
            console.log(`${key}=${value}`);
          }
        }
      }
    });
  return cmd;
}
