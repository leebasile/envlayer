import { Command } from 'commander';
import fs from 'fs';

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

export function shuffleEnvKeys(map: Map<string, string>): Map<string, string> {
  const entries = Array.from(map.entries());
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return new Map(entries);
}

export function buildShuffleCommand(): Command {
  const cmd = new Command('shuffle');
  cmd
    .description('Randomly shuffle the order of keys in an env file')
    .argument('<file>', 'Path to the .env file')
    .option('-o, --output <file>', 'Output file (defaults to overwriting input)')
    .option('--json', 'Output result as JSON')
    .action((file: string, options: { output?: string; json?: boolean }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const content = fs.readFileSync(file, 'utf-8');
      const map = parseEnvFile(content);
      const shuffled = shuffleEnvKeys(map);
      const outPath = options.output ?? file;
      fs.writeFileSync(outPath, serializeEnvMap(shuffled));
      if (options.json) {
        console.log(JSON.stringify({ file: outPath, keys: shuffled.size, status: 'shuffled' }));
      } else {
        console.log(`Shuffled ${shuffled.size} keys in ${outPath}`);
      }
    });
  return cmd;
}
