import fs from "fs";
import path from "path";
import { Command } from "commander";
import { SchemaEntry } from "./schema.types";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    map.set(key, value);
  }
  return map;
}

export function analyzeSchema(envMap: Map<string, string>): SchemaEntry[] {
  const entries: SchemaEntry[] = [];
  for (const [key, value] of envMap.entries()) {
    let detectedType: SchemaEntry["type"] = "string";
    if (value === "true" || value === "false") detectedType = "boolean";
    else if (!isNaN(Number(value)) && value !== "") detectedType = "number";

    entries.push({
      key,
      type: detectedType,
      required: true,
      example: value.length > 0 ? value : undefined,
    });
  }
  return entries;
}

export function buildSchemaCommand(): Command {
  const cmd = new Command("schema");
  cmd
    .description("Analyze an env file and output an inferred schema")
    .argument("<file>", "Path to the .env file")
    .option("-o, --output <format>", "Output format: text | json", "text")
    .action((file: string, options: { output: string }) => {
      const resolved = path.resolve(file);
      if (!fs.existsSync(resolved)) {
        console.error(`File not found: ${resolved}`);
        process.exit(1);
      }
      const envMap = parseEnvFile(resolved);
      const schema = analyzeSchema(envMap);

      if (options.output === "json") {
        console.log(JSON.stringify(schema, null, 2));
      } else {
        if (schema.length === 0) {
          console.log("No entries found.");
          return;
        }
        console.log(`Schema for ${path.basename(resolved)}:\n`);
        for (const entry of schema) {
          const example = entry.example ? `  (e.g. ${entry.example})` : "";
          console.log(`  ${entry.key}: ${entry.type}${example}`);
        }
      }
    });
  return cmd;
}
