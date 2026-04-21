import fs from "fs";
import path from "path";
import { Command } from "commander";
import { UnusedKey, UnusedResult, UnusedReport } from "./unused.types";

export function parseEnvFile(content: string): Map<string, string> {
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

export function findUnusedKeys(
  envFile: string,
  sourceFiles: string[]
): UnusedResult {
  const content = fs.readFileSync(envFile, "utf-8");
  const envMap = parseEnvFile(content);

  const sourceContents = sourceFiles
    .filter((f) => fs.existsSync(f))
    .map((f) => ({ file: f, content: fs.readFileSync(f, "utf-8") }));

  const unusedKeys: UnusedKey[] = [];
  const referencedIn = new Set<string>();

  for (const [key, value] of envMap.entries()) {
    const isUsed = sourceContents.some(({ file, content: src }) => {
      const referenced =
        src.includes(`process.env.${key}`) ||
        src.includes(`process.env['${key}']`) ||
        src.includes(`process.env["${key}"]`) ||
        src.includes(`import.meta.env.${key}`) ||
        new RegExp(`\\b${key}\\b`).test(src);
      if (referenced) referencedIn.add(file);
      return referenced;
    });

    if (!isUsed) {
      unusedKeys.push({ key, value, file: envFile });
    }
  }

  return {
    file: envFile,
    totalKeys: envMap.size,
    unusedKeys,
    referencedIn: Array.from(referencedIn),
  };
}

export function buildUnusedCommand(): Command {
  const cmd = new Command("unused");
  cmd
    .description("Find env keys not referenced in source files")
    .argument("<envfile>", "Path to the .env file")
    .option("-s, --sources <globs...>", "Source files or globs to scan", [])
    .option("-f, --format <format>", "Output format: text | json", "text")
    .action((envfile: string, options: { sources: string[]; format: string }) => {
      const sources: string[] = options.sources;
      if (sources.length === 0) {
        console.error("Error: at least one source file must be provided via --sources");
        process.exit(1);
      }
      const result = findUnusedKeys(path.resolve(envfile), sources.map((s) => path.resolve(s)));
      const report: UnusedReport = {
        results: [result],
        totalUnused: result.unusedKeys.length,
        scannedFiles: sources,
        sourceFiles: result.referencedIn,
      };
      if (options.format === "json") {
        console.log(JSON.stringify(report, null, 2));
      } else {
        if (result.unusedKeys.length === 0) {
          console.log(`✔ No unused keys found in ${envfile}`);
        } else {
          console.log(`Found ${result.unusedKeys.length} unused key(s) in ${envfile}:`);
          for (const k of result.unusedKeys) {
            console.log(`  - ${k.key}`);
          }
        }
      }
    });
  return cmd;
}
