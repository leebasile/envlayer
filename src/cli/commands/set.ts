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

export function setEnvKey(
  filePath: string,
  key: string,
  value: string
): { created: boolean } {
  let map = new Map<string, string>();
  let created = false;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    map = parseEnvFile(content);
  } else {
    created = true;
  }

  map.set(key, value);
  fs.writeFileSync(filePath, serializeEnvMap(map), "utf-8");
  return { created };
}

export function buildSetCommand(): Command {
  const cmd = new Command("set");
  cmd
    .description("Set or update a key-value pair in an env file")
    .argument("<key>", "Environment variable key")
    .argument("<value>", "Environment variable value")
    .option("-f, --file <path>", "Path to the env file", ".env")
    .action((key: string, value: string, options: { file: string }) => {
      const filePath = path.resolve(options.file);
      const { created } = setEnvKey(filePath, key, value);
      if (created) {
        console.log(`Created ${options.file} and set ${key}=${value}`);
      } else {
        console.log(`Updated ${key}=${value} in ${options.file}`);
      }
    });
  return cmd;
}
