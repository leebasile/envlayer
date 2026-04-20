import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, detectType, typecheckEnvFile } from './typecheck';
import { buildTypecheckReport, formatTypecheckText, formatTypecheckSummary } from './typecheck.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-typecheck-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('detectType', () => {
  it('detects number', () => expect(detectType('42')).toBe('number'));
  it('detects float', () => expect(detectType('3.14')).toBe('number'));
  it('detects boolean', () => expect(detectType('true')).toBe('boolean'));
  it('detects boolean false', () => expect(detectType('false')).toBe('boolean'));
  it('detects url', () => expect(detectType('https://example.com')).toBe('url'));
  it('detects email', () => expect(detectType('user@example.com')).toBe('email'));
  it('detects json object', () => expect(detectType('{"a":1}')).toBe('json'));
  it('falls back to string', () => expect(detectType('hello world')).toBe('string'));
});

describe('typecheckEnvFile', () => {
  it('returns valid for matching types', () => {
    const entries = new Map([['PORT', '3000'], ['DEBUG', 'true']]);
    const schema = { PORT: 'number', DEBUG: 'boolean' };
    const results = typecheckEnvFile(entries, schema);
    expect(results.every(r => r.valid)).toBe(true);
  });

  it('returns invalid for mismatched types', () => {
    const entries = new Map([['PORT', 'not-a-number']]);
    const schema = { PORT: 'number' };
    const results = typecheckEnvFile(entries, schema);
    expect(results[0].valid).toBe(false);
    expect(results[0].actualType).toBe('string');
  });

  it('marks missing keys as invalid', () => {
    const entries = new Map<string, string>();
    const schema = { API_KEY: 'string' };
    const results = typecheckEnvFile(entries, schema);
    expect(results[0].valid).toBe(false);
    expect(results[0].actualType).toBe('missing');
  });
});

describe('typecheck formatter', () => {
  const results = [
    { key: 'PORT', value: '3000', expectedType: 'number', actualType: 'number', valid: true },
    { key: 'NAME', value: 'bad', expectedType: 'number', actualType: 'string', valid: false },
  ];

  it('builds report correctly', () => {
    const report = buildTypecheckReport(results);
    expect(report.total).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
  });

  it('formats text output', () => {
    const report = buildTypecheckReport(results);
    const text = formatTypecheckText(report);
    expect(text).toContain('✓ PORT');
    expect(text).toContain('✗ NAME');
    expect(text).toContain('Passed: 1');
  });

  it('formats summary with failures', () => {
    const report = buildTypecheckReport(results);
    expect(formatTypecheckSummary(report)).toContain('1 of 2');
  });

  it('formats summary with all passing', () => {
    const report = buildTypecheckReport([results[0]]);
    expect(formatTypecheckSummary(report)).toContain('All 1');
  });
});
