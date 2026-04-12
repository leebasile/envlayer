import fs from 'fs';
import path from 'path';
import { CommandBuilder } from 'yargs';
import { PatchOperation, PatchResult, PatchOptions } from './patch.types';

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

export function parsePatchFile(content: string): PatchOperation[] {
  const ops: PatchOperation[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    const op = parts[0] as PatchOperation['op'];
    if (op === 'set' && parts.length >= 3) {
      ops.push({ op: 'set', key: parts[1], value: parts.slice(2).join(' ') });
    } else if (op === 'delete' && parts.length >= 2) {
      ops.push({ op: 'delete', key: parts[1], value: '' });
    } else if (op === 'rename' && parts.length >= 3) {
      ops.push({ op: 'rename', key: parts[1], value: '', newKey: parts[2] });
    }
  }
  return ops;
}

export function applyPatch(envMap: Map<string, string>, ops: PatchOperation[]): PatchResult {
  const applied: PatchOperation[] = [];
  const skipped: PatchOperation[] = [];

  for (const op of ops) {
    if (op.op === 'set') {
      envMap.set(op.key, op.value);
      applied.push(op);
    } else if (op.op === 'delete') {
      if (envMap.has(op.key)) {
        envMap.delete(op.key);
        applied.push(op);
      } else {
        skipped.push(op);
      }
    } else if (op.op === 'rename') {
      if (envMap.has(op.key) && op.newKey) {
        const val = envMap.get(op.key)!;
        envMap.delete(op.key);
        envMap.set(op.newKey, val);
        applied.push(op);
      } else {
        skipped.push(op);
      }
    }
  }

  return { applied, skipped, outputFile: '' };
}

export function buildPatchCommand() {
  return {
    command: 'patch <file> <patchFile>',
    describe: 'Apply a patch file of operations to an env file',
    builder: (yargs: any) =>
      yargs
        .positional('file', { type: 'string', describe: 'Target .env file' })
        .positional('patchFile', { type: 'string', describe: 'Patch operations file' })
        .option('output', { type: 'string', alias: 'o', describe: 'Output file (default: overwrite input)' })
        .option('dry-run', { type: 'boolean', default: false, describe: 'Preview changes without writing' })
        .option('format', { choices: ['text', 'json'], default: 'text', describe: 'Output format' }),
    handler: (argv: any) => {
      const opts: PatchOptions = {
        file: argv.file,
        patchFile: argv.patchFile,
        output: argv.output,
        dryRun: argv.dryRun,
        format: argv.format,
      };

      const envContent = fs.readFileSync(path.resolve(opts.file), 'utf-8');
      const patchContent = fs.readFileSync(path.resolve(opts.patchFile), 'utf-8');
      const envMap = parseEnvFile(envContent);
      const ops = parsePatchFile(patchContent);
      const result = applyPatch(envMap, ops);
      const outFile = opts.output ?? opts.file;
      result.outputFile = outFile;

      if (!opts.dryRun) {
        fs.writeFileSync(path.resolve(outFile), serializeEnvMap(envMap), 'utf-8');
      }

      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Applied ${result.applied.length} operation(s), skipped ${result.skipped.length}.`);
        if (opts.dryRun) console.log('Dry run — no files written.');
        else console.log(`Written to ${outFile}`);
      }
    },
  };
}
