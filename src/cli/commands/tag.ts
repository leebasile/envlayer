import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { TagEntry, TagResult } from './tag.types';

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export function getTagsFromComment(filePath: string, key: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') && line.includes(`@tag`) && lines[i + 1]?.includes(`${key}=`)) {
      const match = line.match(/@tag\[([^\]]+)\]/);
      if (match) return match[1].split(',').map(t => t.trim());
    }
  }
  return [];
}

export function tagEnvFile(filePath: string, tags: string[], mode: 'add' | 'remove' | 'filter'): TagResult {
  const map = parseEnvFile(filePath);
  const tagged: TagEntry[] = [];
  const untagged: TagEntry[] = [];

  for (const [key, value] of map.entries()) {
    const existingTags = getTagsFromComment(filePath, key);
    let finalTags: string[];

    if (mode === 'add') {
      finalTags = Array.from(new Set([...existingTags, ...tags]));
    } else if (mode === 'remove') {
      finalTags = existingTags.filter(t => !tags.includes(t));
    } else {
      finalTags = existingTags;
    }

    const entry: TagEntry = { key, value, tags: finalTags };
    if (finalTags.length > 0) {
      tagged.push(entry);
    } else {
      untagged.push(entry);
    }
  }

  return {
    file: path.basename(filePath),
    tagged,
    untagged,
    totalKeys: map.size,
  };
}

export function buildTagCommand(): Command {
  const cmd = new Command('tag');
  cmd
    .description('Add, remove, or filter env keys by inline tags')
    .argument('<file>', 'Path to .env file')
    .option('--tags <tags>', 'Comma-separated list of tags', '')
    .option('--mode <mode>', 'Operation mode: add | remove | filter', 'filter')
    .option('--format <format>', 'Output format: text | json', 'text')
    .action((file, opts) => {
      const tags = opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : [];
      const mode = opts.mode as 'add' | 'remove' | 'filter';
      const result = tagEnvFile(file, tags, mode);
      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`File: ${result.file}`);
        console.log(`Total keys: ${result.totalKeys}`);
        console.log(`Tagged: ${result.tagged.length}`);
        for (const e of result.tagged) {
          console.log(`  ${e.key} [${e.tags.join(', ')}]`);
        }
        console.log(`Untagged: ${result.untagged.length}`);
      }
    });
  return cmd;
}
