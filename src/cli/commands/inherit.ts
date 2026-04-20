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

export interface InheritResult {
  base: string;
  override: string;
  output: string;
  inherited: number;
  overridden: number;
  added: number;
}

export function inheritEnvFiles(
  basePath: string,
  overridePath: string,
  outputPath: string
): InheritResult {
  const baseMap = parseEnvFile(basePath);
  const overrideMap = parseEnvFile(overridePath);

  const merged = new Map<string, string>(baseMap);
  let overridden = 0;
  let added = 0;

  for (const [key, value] of overrideMap.entries()) {
    if (merged.has(key)) {
      overridden++;
    } else {
      added++;
    }
    merged.set(key, value);
  }

  const inherited = baseMap.size - overridden;
  const serialized = serializeEnvMap(merged);
  fs.writeFileSync(outputPath, serialized, "utf-8");

  return {
    base: basePath,
    override: overridePath,
    output: outputPath,
    inherited,
    overridden,
    added,
  };
}

export function buildInheritCommand(): Command {
  const cmd = new Command("inherit");
  cmd
    .description("Merge a base .env file with an override file, producing an inherited result")
    .argument("<base>", "Base .env file path")
    .argument("<override>", "Override .env file path")
    .argument("<output>", "Output .env file path")
    .option("--json", "Output result as JSON")
    .action((base: string, override: string, output: string, opts: { json?: boolean }) => {
      const result = inheritEnvFiles(
        path.resolve(base),
        path.resolve(override),
        path.resolve(output)
      );
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Inherited from: ${result.base}`);
        console.log(`Override file:  ${result.override}`);
        console.log(`Output written: ${result.output}`);
        console.log(`  Inherited (unchanged): ${result.inherited}`);
        console.log(`  Overridden:            ${result.overridden}`);
        console.log(`  Added (new keys):      ${result.added}`);
      }
    });
  return cmd;
}
