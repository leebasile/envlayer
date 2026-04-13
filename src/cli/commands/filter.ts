import * as fs from "fs";
import * as path from "path";
import { Argv } from "yargs";

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
    .join("\n") + "\n";
}

export function filterEnvKeys(
  map: Map<string, string>,
  pattern: string,
  invert: boolean
): Map<string, string> {
  const regex = new RegExp(pattern);
  const result = new Map<string, string>();
  for (const [key, value] of map.entries()) {
    const matches = regex.test(key);
    if (invert ? !matches : matches) {
      result.set(key, value);
    }
  }
  return result;
}

export function buildFilterCommand(yargs: Argv): Argv {
  return yargs.command(
    "filter <file> <pattern>",
    "Filter env keys by a regex pattern",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Path to .env file" })
        .positional("pattern", { type: "string", demandOption: true, describe: "Regex pattern to match keys" })
        .option("invert", { type: "boolean", default: false, alias: "v", describe: "Exclude matching keys instead" })
        .option("output", { type: "string", alias: "o", describe: "Write result to file" })
        .option("format", { type: "string", choices: ["text", "json"], default: "text" }),
    (argv) => {
      const filePath = path.resolve(argv.file as string);
      const map = parseEnvFile(filePath);
      const filtered = filterEnvKeys(map, argv.pattern as string, argv.invert as boolean);

      if (argv.format === "json") {
        const obj = Object.fromEntries(filtered.entries());
        const out = JSON.stringify(obj, null, 2);
        if (argv.output) fs.writeFileSync(argv.output as string, out);
        else console.log(out);
      } else {
        const out = serializeEnvMap(filtered);
        if (argv.output) fs.writeFileSync(argv.output as string, out);
        else process.stdout.write(out);
      }
    }
  );
}
