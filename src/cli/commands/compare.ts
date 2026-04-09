import fs from "fs";
import path from "path";
import { Command } from "commander";

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  diffValues: Array<{ key: string; valueA: string; valueB: string }>;
  matching: string[];
}

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

export function compareEnvFiles(fileA: string, fileB: string): CompareResult {
  const mapA = parseEnvFile(fileA);
  const mapB = parseEnvFile(fileB);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const diffValues: Array<{ key: string; valueA: string; valueB: string }> = [];
  const matching: string[] = [];

  for (const [key, valueA] of mapA) {
    if (!mapB.has(key)) {
      onlyInA.push(key);
    } else if (mapB.get(key) !== valueA) {
      diffValues.push({ key, valueA, valueB: mapB.get(key)! });
    } else {
      matching.push(key);
    }
  }

  for (const key of mapB.keys()) {
    if (!mapA.has(key)) {
      onlyInB.push(key);
    }
  }

  return { onlyInA, onlyInB, diffValues, matching };
}

export function buildCompareCommand(): Command {
  const cmd = new Command("compare");
  cmd
    .description("Compare two .env files and report differences")
    .argument("<fileA>", "First .env file")
    .argument("<fileB>", "Second .env file")
    .option("--show-matching", "Also show matching keys", false)
    .action((fileA: string, fileB: string, options: { showMatching: boolean }) => {
      const absA = path.resolve(fileA);
      const absB = path.resolve(fileB);

      if (!fs.existsSync(absA)) {
        console.error(`File not found: ${fileA}`);
        process.exit(1);
      }
      if (!fs.existsSync(absB)) {
        console.error(`File not found: ${fileB}`);
        process.exit(1);
      }

      const result = compareEnvFiles(absA, absB);

      if (result.onlyInA.length > 0) {
        console.log(`\nOnly in ${path.basename(fileA)}:`);
        result.onlyInA.forEach((k) => console.log(`  - ${k}`));
      }
      if (result.onlyInB.length > 0) {
        console.log(`\nOnly in ${path.basename(fileB)}:`);
        result.onlyInB.forEach((k) => console.log(`  + ${k}`));
      }
      if (result.diffValues.length > 0) {
        console.log(`\nDifferent values:`);
        result.diffValues.forEach(({ key, valueA, valueB }) => {
          console.log(`  ~ ${key}`);
          console.log(`      ${path.basename(fileA)}: ${valueA}`);
          console.log(`      ${path.basename(fileB)}: ${valueB}`);
        });
      }
      if (options.showMatching && result.matching.length > 0) {
        console.log(`\nMatching keys:`);
        result.matching.forEach((k) => console.log(`  = ${k}`));
      }

      const total = result.onlyInA.length + result.onlyInB.length + result.diffValues.length;
      if (total === 0) {
        console.log("Files are identical.");
      } else {
        console.log(`\nSummary: ${total} difference(s) found.`);
      }
    });

  return cmd;
}
