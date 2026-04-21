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

export function swapEnvKeys(
  map: Map<string, string>,
  keyA: string,
  keyB: string
): { map: Map<string, string>; swapped: boolean } {
  if (!map.has(keyA) || !map.has(keyB)) {
    return { map, swapped: false };
  }

  const entries = Array.from(map.entries());
  const result = new Map<string, string>();

  for (const [k, v] of entries) {
    if (k === keyA) {
      result.set(keyA, map.get(keyB)!);
    } else if (k === keyB) {
      result.set(keyB, map.get(keyA)!);
    } else {
      result.set(k, v);
    }
  }

  return { map: result, swapped: true };
}

export function buildSwapCommand(yargs: Argv): Argv {
  return yargs.command(
    "swap <file> <keyA> <keyB>",
    "Swap the values of two keys in an env file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Path to the .env file" })
        .positional("keyA", { type: "string", demandOption: true, describe: "First key" })
        .positional("keyB", { type: "string", demandOption: true, describe: "Second key" })
        .option("json", { type: "boolean", default: false, describe: "Output as JSON" }),
    (argv) => {
      const filePath = path.resolve(argv.file as string);
      const keyA = argv.keyA as string;
      const keyB = argv.keyB as string;

      const map = parseEnvFile(filePath);
      const { map: updated, swapped } = swapEnvKeys(map, keyA, keyB);

      if (!swapped) {
        const missing = [keyA, keyB].filter((k) => !map.has(k));
        if (argv.json) {
          console.log(JSON.stringify({ swapped: false, missing }));
        } else {
          console.error(`Error: key(s) not found: ${missing.join(", ")}`);
        }
        process.exit(1);
      }

      fs.writeFileSync(filePath, serializeEnvMap(updated), "utf-8");

      if (argv.json) {
        console.log(JSON.stringify({ swapped: true, keyA, keyB, file: filePath }));
      } else {
        console.log(`Swapped values of "${keyA}" and "${keyB}" in ${filePath}`);
      }
    }
  );
}
