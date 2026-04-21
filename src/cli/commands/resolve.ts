import fs from "fs";
import path from "path";
import { Command } from "commander";
import { ResolveReport, ResolveResult } from "./resolve.types";
import { formatResolveText, formatResolveJson, formatResolveSummary } from "./resolve.formatter";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    map.set(key, value);
  }
  return map;
}

export function resolveEnvValues(
  envMap: Map<string, string>,
  systemEnv: Record<string, string | undefined> = process.env
): ResolveResult[] {
  const results: ResolveResult[] = [];
  for (const [key, rawValue] of envMap.entries()) {
    const match = rawValue.match(/^\$\{?([A-Z_][A-Z0-9_]*)\}?$/);
    if (match) {
      const refKey = match[1];
      const resolved = systemEnv[refKey] ?? envMap.get(refKey);
      results.push({
        key,
        rawValue,
        resolvedValue: resolved ?? rawValue,
        source: resolved !== undefined ? refKey : "(unresolved)",
        wasResolved: resolved !== undefined,
      });
    } else {
      results.push({
        key,
        rawValue,
        resolvedValue: rawValue,
        source: "literal",
        wasResolved: false,
      });
    }
  }
  return results;
}

export function buildResolveCommand(): Command {
  const cmd = new Command("resolve");
  cmd
    .description("Resolve variable references in an env file against system environment or self")
    .argument("<file>", "Path to the .env file")
    .option("--format <fmt>", "Output format: text | json | summary", "text")
    .action((file: string, opts: { format: string }) => {
      const absPath = path.resolve(file);
      const envMap = parseEnvFile(absPath);
      const results = resolveEnvValues(envMap);
      const report: ResolveReport = {
        file: absPath,
        results,
        totalKeys: results.length,
        resolvedCount: results.filter((r) => r.wasResolved).length,
        unresolvedCount: results.filter((r) => !r.wasResolved && r.rawValue.startsWith("$")).length,
      };
      if (opts.format === "json") {
        console.log(formatResolveJson(report));
      } else if (opts.format === "summary") {
        console.log(formatResolveSummary(report));
      } else {
        console.log(formatResolveText(report));
      }
    });
  return cmd;
}
