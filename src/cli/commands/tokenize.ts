import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface TokenizeEntry {
  key: string;
  value: string;
  token: string;
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
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function generateToken(key: string, prefix: string): string {
  return `${prefix}${key.toUpperCase()}_TOKEN`;
}

export function tokenizeEnvFile(
  filePath: string,
  prefix: string,
  keys: string[]
): { entries: TokenizeEntry[]; tokenMap: Map<string, string> } {
  const env = parseEnvFile(filePath);
  const entries: TokenizeEntry[] = [];
  const tokenMap = new Map<string, string>();

  for (const [key, value] of env.entries()) {
    if (keys.length === 0 || keys.includes(key)) {
      const token = generateToken(key, prefix);
      entries.push({ key, value, token });
      tokenMap.set(key, token);
    }
  }

  return { entries, tokenMap };
}

export function buildTokenizeCommand(): Command {
  const cmd = new Command("tokenize");
  cmd
    .description("Replace env values with token placeholders")
    .argument("<file>", "Path to .env file")
    .option("-k, --keys <keys>", "Comma-separated keys to tokenize (default: all)", "")
    .option("-p, --prefix <prefix>", "Token prefix", "TOKEN_")
    .option("--write", "Write tokenized file in-place", false)
    .option("--json", "Output as JSON", false)
    .action((file: string, opts) => {
      const absPath = path.resolve(file);
      const keys = opts.keys ? opts.keys.split(",").map((k: string) => k.trim()).filter(Boolean) : [];
      const { entries, tokenMap } = tokenizeEnvFile(absPath, opts.prefix, keys);

      if (opts.write) {
        const env = parseEnvFile(absPath);
        for (const { key, token } of entries) {
          env.set(key, token);
        }
        fs.writeFileSync(absPath, serializeEnvMap(env), "utf-8");
        console.log(`Tokenized ${entries.length} key(s) in ${file}`);
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify({ file, entries }, null, 2));
        return;
      }

      if (entries.length === 0) {
        console.log("No keys matched for tokenization.");
        return;
      }

      console.log(`Tokenized keys in ${file}:`);
      for (const { key, token } of entries) {
        console.log(`  ${key} => ${token}`);
      }
    });

  return cmd;
}
