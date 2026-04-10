import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

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
    const unquoted = value.replace(/^["']|["']$/g, "");
    map.set(key, unquoted);
  }

  return map;
}

export function getEnvKey(
  filePath: string,
  key: string,
  options: { json?: boolean; fallback?: string }
): void {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const envMap = parseEnvFile(filePath);

  if (!envMap.has(key)) {
    if (options.fallback !== undefined) {
      const result = options.json
        ? JSON.stringify({ key, value: options.fallback, source: "fallback" })
        : options.fallback;
      console.log(result);
      return;
    }
    console.error(`Key "${key}" not found in ${filePath}`);
    process.exit(1);
  }

  const value = envMap.get(key) as string;

  if (options.json) {
    console.log(JSON.stringify({ key, value, source: path.basename(filePath) }));
  } else {
    console.log(value);
  }
}

export function buildGetCommand(): Command {
  const cmd = new Command("get");

  cmd
    .description("Get the value of a specific key from an env file")
    .argument("<file>", "Path to the .env file")
    .argument("<key>", "The key to retrieve")
    .option("--json", "Output result as JSON")
    .option("--fallback <value>", "Fallback value if key is not found")
    .action((file: string, key: string, options: { json?: boolean; fallback?: string }) => {
      getEnvKey(file, key, options);
    });

  return cmd;
}
