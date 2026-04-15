import fs from "fs";
import path from "path";
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

export interface LowercaseResult {
  renamed: Array<{ from: string; to: string }>;
  skipped: string[];
  output: string;
}

export function lowercaseEnvKeys(
  inputPath: string,
  outputPath: string
): LowercaseResult {
  const map = parseEnvFile(inputPath);
  const newMap = new Map<string, string>();
  const renamed: Array<{ from: string; to: string }> = [];
  const skipped: string[] = [];

  for (const [key, value] of map.entries()) {
    const lower = key.toLowerCase();
    if (lower === key) {
      skipped.push(key);
    } else {
      renamed.push({ from: key, to: lower });
    }
    newMap.set(lower, value);
  }

  const serialized = serializeEnvMap(newMap);
  fs.writeFileSync(outputPath, serialized, "utf-8");

  return { renamed, skipped, output: outputPath };
}

export function buildLowercaseCommand(yargs: Argv): Argv {
  return yargs.command(
    "lowercase <file>",
    "Convert all env variable keys to lowercase",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Input .env file" })
        .option("out", { type: "string", describe: "Output file path (defaults to input file)" })
        .option("json", { type: "boolean", default: false, describe: "Output result as JSON" }),
    (argv) => {
      const inputPath = path.resolve(argv.file as string);
      const outputPath = path.resolve((argv.out as string) ?? (argv.file as string));
      const result = lowercaseEnvKeys(inputPath, outputPath);
      if (argv.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.renamed.length === 0) {
          console.log("All keys are already lowercase.");
        } else {
          result.renamed.forEach(({ from, to }) => console.log(`  ${from} → ${to}`));
          console.log(`\nRenamed ${result.renamed.length} key(s). Written to ${result.output}`);
        }
      }
    }
  );
}
