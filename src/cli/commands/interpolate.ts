import * as fs from "fs";
import * as path from "path";
import { Argv, ArgumentsCamelCase } from "yargs";

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
    map.set(key, value);
  }
  return map;
}

export function interpolateValues(env: Map<string, string>): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env.entries()) {
    result.set(key, resolveValue(value, env));
  }
  return result;
}

function resolveValue(value: string, env: Map<string, string>, depth = 0): string {
  if (depth > 10) return value; // prevent infinite recursion
  return value.replace(/\$\{([^}]+)\}/g, (_, ref) => {
    const resolved = env.get(ref.trim());
    if (resolved === undefined) return `\${${ref}}`;
    return resolveValue(resolved, env, depth + 1);
  });
}

export function serializeEnvMap(env: Map<string, string>): string {
  return Array.from(env.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function buildInterpolateCommand(yargs: Argv): Argv {
  return yargs.command(
    "interpolate <file>",
    "Resolve variable references (${VAR}) within an env file",
    (y) =>
      y
        .positional("file", { type: "string", demandOption: true, describe: "Path to .env file" })
        .option("output", { type: "string", alias: "o", describe: "Output file (defaults to stdout)" })
        .option("in-place", { type: "boolean", alias: "i", default: false, describe: "Overwrite the input file" }),
    (argv: ArgumentsCamelCase<{ file: string; output?: string; inPlace: boolean }>) => {
      const filePath = path.resolve(argv.file);
      const env = parseEnvFile(filePath);
      const interpolated = interpolateValues(env);
      const serialized = serializeEnvMap(interpolated);

      if (argv.inPlace) {
        fs.writeFileSync(filePath, serialized, "utf-8");
        console.log(`Interpolated values written back to ${filePath}`);
      } else if (argv.output) {
        const outPath = path.resolve(argv.output);
        fs.writeFileSync(outPath, serialized, "utf-8");
        console.log(`Interpolated values written to ${outPath}`);
      } else {
        process.stdout.write(serialized);
      }
    }
  );
}
