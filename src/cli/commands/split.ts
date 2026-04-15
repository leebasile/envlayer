import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
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
    .join('\n') + '\n';
}

export function splitEnvFile(
  entries: Map<string, string>,
  prefixes: string[]
): Record<string, Map<string, string>> {
  const buckets: Record<string, Map<string, string>> = { _rest: new Map() };
  for (const prefix of prefixes) {
    buckets[prefix] = new Map();
  }
  for (const [key, value] of entries) {
    const matched = prefixes.find((p) => key.startsWith(p + '_') || key === p);
    if (matched) {
      buckets[matched].set(key, value);
    } else {
      buckets['_rest'].set(key, value);
    }
  }
  return buckets;
}

export function buildSplitCommand(): Command {
  return new Command('split')
    .description('Split an env file into multiple files by key prefix')
    .argument('<file>', 'Source .env file')
    .requiredOption('-p, --prefixes <prefixes>', 'Comma-separated list of key prefixes')
    .option('-o, --outdir <dir>', 'Output directory', '.')
    .option('--json', 'Output summary as JSON')
    .action((file: string, opts: { prefixes: string; outdir: string; json?: boolean }) => {
      const content = fs.readFileSync(file, 'utf-8');
      const entries = parseEnvFile(content);
      const prefixes = opts.prefixes.split(',').map((p) => p.trim()).filter(Boolean);
      const buckets = splitEnvFile(entries, prefixes);
      const written: string[] = [];
      for (const [prefix, map] of Object.entries(buckets)) {
        if (map.size === 0) continue;
        const outFile = path.join(opts.outdir, `.env.${prefix}`);
        fs.writeFileSync(outFile, serializeEnvMap(map), 'utf-8');
        written.push(outFile);
      }
      if (opts.json) {
        console.log(JSON.stringify({ written, total: written.length }, null, 2));
      } else {
        console.log(`Split into ${written.length} file(s):`);
        written.forEach((f) => console.log(`  ${f}`));
      }
    });
}
