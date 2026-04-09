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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function deleteEnvKey(
  filePath: string,
  key: string
): { found: boolean } {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, "utf-8");
  const map = parseEnvFile(content);
  if (!map.has(key)) {
    return { found: false };
  }
  map.delete(key);
  fs.writeFileSync(resolved, serializeEnvMap(map), "utf-8");
  return { found: true };
}

export function buildDeleteCommand(): Command {
  const cmd = new Command("delete");
  cmd
    .description("Delete a key from an env file")
    .argument("<key>", "The key to delete")
    .option("-f, --file <path>", "Path to the env file", ".env")
    .action((key: string, options: { file: string }) => {
      try {
        const result = deleteEnvKey(options.file, key);
        if (result.found) {
          console.log(`Deleted key "${key}" from ${options.file}`);
        } else {
          console.warn(`Key "${key}" not found in ${options.file}`);
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
  return cmd;
}
