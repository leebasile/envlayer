import fs from 'fs';
import path from 'path';
import { CommandModule } from 'yargs';
import { LintResult, LintViolation, LintOptions } from './lint.types';
import { formatLintText, formatLintJson } from './lint.formatter';

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

export function lintEnvFile(filePath: string, options: LintOptions = {}): LintResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: LintViolation[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    if (options.noDuplicateKeys !== false && seen.has(key)) {
      violations.push({ rule: 'no-duplicate-keys', key, message: `Duplicate key "${key}"`, severity: 'error' });
    }
    seen.add(key);

    if (options.noEmptyValues !== false && value === '') {
      violations.push({ rule: 'no-empty-values', key, message: `Empty value for key "${key}"`, severity: 'warn' });
    }

    if (options.noQuotedValues !== false && (value.startsWith('"') || value.startsWith("'"))) {
      violations.push({ rule: 'no-quoted-values', key, message: `Quoted value for key "${key}"`, severity: 'warn' });
    }

    if (options.noUppercaseKeys !== false && key !== key.toUpperCase()) {
      violations.push({ rule: 'no-lowercase-keys', key, message: `Key "${key}" should be uppercase`, severity: 'warn' });
    }

    if (options.noTrailingSpaces !== false && line !== line.trimEnd()) {
      violations.push({ rule: 'no-trailing-spaces', key, message: `Trailing whitespace on key "${key}"`, severity: 'info' });
    }
  }

  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warnCount = violations.filter(v => v.severity === 'warn').length;

  return { file: filePath, violations, errorCount, warnCount, passed: errorCount === 0 };
}

export function buildLintCommand(): CommandModule {
  return {
    command: 'lint <file>',
    describe: 'Lint an .env file for common issues',
    builder: (yargs) =>
      yargs
        .positional('file', { type: 'string', demandOption: true, describe: 'Path to .env file' })
        .option('format', { choices: ['text', 'json'] as const, default: 'text' })
        .option('strict', { type: 'boolean', default: false, describe: 'Exit with error on warnings' }),
    handler: (argv) => {
      const filePath = path.resolve(argv.file as string);
      const result = lintEnvFile(filePath);
      if (argv.format === 'json') {
        console.log(formatLintJson(result));
      } else {
        console.log(formatLintText(result));
      }
      const hasIssues = argv.strict ? !result.passed || result.warnCount > 0 : !result.passed;
      if (hasIssues) process.exit(1);
    },
  };
}
