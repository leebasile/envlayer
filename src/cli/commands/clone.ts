import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
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
    .join('\n') + '\n';
}

export interface CloneResult {
  source: string;
  destination: string;
  keysCloned: number;
  overwritten: boolean;
}

export function cloneEnvFile(
  sourcePath: string,
  destPath: string,
  overwrite: boolean
): CloneResult {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const destExists = fs.existsSync(destPath);
  if (destExists && !overwrite) {
    throw new Error(
      `Destination file already exists: ${destPath}. Use --overwrite to replace it.`
    );
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const envMap = parseEnvFile(content);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, serializeEnvMap(envMap), 'utf-8');

  return {
    source: sourcePath,
    destination: destPath,
    keysCloned: envMap.size,
    overwritten: destExists && overwrite,
  };
}

export function buildCloneCommand(): Command {
  const cmd = new Command('clone');

  cmd
    .description('Clone an env file to a new location')
    .argument('<source>', 'Source .env file path')
    .argument('<destination>', 'Destination .env file path')
    .option('--overwrite', 'Overwrite destination if it exists', false)
    .option('--json', 'Output result as JSON', false)
    .action((source: string, destination: string, options: { overwrite: boolean; json: boolean }) => {
      try {
        const result = cloneEnvFile(source, destination, options.overwrite);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          const action = result.overwritten ? 'Overwrote' : 'Created';
          console.log(`${action} ${result.destination} (${result.keysCloned} keys cloned from ${result.source})`);
        }
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
