import * as fs from 'fs';
import * as path from 'path';
import { Argv, ArgumentsCamelCase } from 'yargs';

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

export function serializeEnvMap(
  original: string,
  comments: Map<string, string>
): string {
  const lines = original.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      result.push(line);
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      result.push(line);
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    if (comments.has(key)) {
      result.push(`# ${comments.get(key)}`);
    }
    result.push(line);
  }
  return result.join('\n');
}

export function addComment(
  filePath: string,
  key: string,
  comment: string
): void {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(abs, 'utf-8');
  const map = parseEnvFile(content);
  if (!map.has(key)) {
    throw new Error(`Key "${key}" not found in ${filePath}`);
  }
  const commentMap = new Map<string, string>([[key, comment]]);
  const updated = serializeEnvMap(content, commentMap);
  fs.writeFileSync(abs, updated, 'utf-8');
}

export function buildCommentCommand(yargs: Argv): Argv {
  return yargs.command(
    'comment <file> <key> <comment>',
    'Add an inline comment above a key in an env file',
    (y) =>
      y
        .positional('file', { type: 'string', demandOption: true, describe: 'Path to .env file' })
        .positional('key', { type: 'string', demandOption: true, describe: 'Key to annotate' })
        .positional('comment', { type: 'string', demandOption: true, describe: 'Comment text to add' }),
    (argv: ArgumentsCamelCase<{ file: string; key: string; comment: string }>) => {
      try {
        addComment(argv.file, argv.key, argv.comment);
        console.log(`Added comment for "${argv.key}" in ${argv.file}`);
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    }
  );
}
