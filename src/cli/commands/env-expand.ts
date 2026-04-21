import * as fs from "fs";
import * as path from "path";

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

export function expandEnvValues(
  map: Map<string, string>,
  context?: Record<string, string>
): Map<string, string> {
  const resolved = new Map<string, string>();
  const env = context ?? (process.env as Record<string, string>);

  for (const [key, value] of map.entries()) {
    const expanded = value.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi, (_, braced, bare) => {
      const name = braced ?? bare;
      return resolved.get(name) ?? map.get(name) ?? env[name] ?? "";
    });
    resolved.set(key, expanded);
  }

  return resolved;
}

export function buildEnvExpandCommand(program: import("commander").Command): void {
  program
    .command("env-expand <file>")
    .description("Expand variable references (${VAR} or $VAR) in an env file")
    .option("-o, --output <file>", "Write expanded output to file instead of stdout")
    .option("--json", "Output as JSON")
    .option("--no-process-env", "Do not fall back to process.env for unresolved variables")
    .action((file: string, opts: { output?: string; json?: boolean; noProcessEnv?: boolean }) => {
      const map = parseEnvFile(path.resolve(file));
      const context = opts.noProcessEnv ? {} : undefined;
      const expanded = expandEnvValues(map, context);

      if (opts.json) {
        const obj = Object.fromEntries(expanded);
        const out = JSON.stringify(obj, null, 2);
        if (opts.output) fs.writeFileSync(path.resolve(opts.output), out, "utf-8");
        else process.stdout.write(out + "\n");
      } else {
        const out = serializeEnvMap(expanded);
        if (opts.output) fs.writeFileSync(path.resolve(opts.output), out, "utf-8");
        else process.stdout.write(out);
      }
    });
}
