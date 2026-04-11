import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { maskValue, maskEnvFile, parseEnvFile } from './mask';
import { formatMaskText, formatMaskSummary } from './mask.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-mask-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('maskValue', () => {
  it('masks entire value by default', () => {
    expect(maskValue('secret123')).toBe('*********');
  });

  it('reveals trailing characters', () => {
    expect(maskValue('secret123', '*', 3)).toBe('******123');
  });

  it('uses custom mask character', () => {
    expect(maskValue('abc', '#')).toBe('###');
  });

  it('returns empty string unchanged', () => {
    expect(maskValue('')).toBe('');
  });
});

describe('parseEnvFile', () => {
  it('parses key=value lines', () => {
    const map = parseEnvFile('A=1\nB=hello\n');
    expect(map.get('A')).toBe('1');
    expect(map.get('B')).toBe('hello');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nX=10\n');
    expect(map.size).toBe(1);
    expect(map.get('X')).toBe('10');
  });
});

describe('maskEnvFile', () => {
  const content = 'API_KEY=supersecret\nDB_HOST=localhost\nDB_PASS=hunter2\n';

  it('masks all keys when no filter given', () => {
    const report = maskEnvFile(content);
    expect(report.maskedCount).toBe(3);
    expect(report.results.every(r => r.wasChanged)).toBe(true);
  });

  it('masks only specified keys', () => {
    const report = maskEnvFile(content, { keys: ['API_KEY', 'DB_PASS'] });
    expect(report.maskedCount).toBe(2);
    const host = report.results.find(r => r.key === 'DB_HOST');
    expect(host?.wasChanged).toBe(false);
  });

  it('masks keys matching pattern', () => {
    const report = maskEnvFile(content, { pattern: 'PASS|KEY' });
    expect(report.maskedCount).toBe(2);
  });

  it('respects reveal option', () => {
    const report = maskEnvFile('TOKEN=abcdef', { keys: ['TOKEN'], reveal: 2 });
    expect(report.results[0].masked).toBe('****ef');
  });
});

describe('formatMaskText', () => {
  it('includes file path and counts', () => {
    const content = 'SECRET=abc\n';
    const report = maskEnvFile(content, { keys: ['SECRET'] });
    report.file = '/tmp/test.env';
    const text = formatMaskText(report);
    expect(text).toContain('/tmp/test.env');
    expect(text).toContain('1 masked');
    expect(text).toContain('[MASKED]');
  });
});

describe('formatMaskSummary', () => {
  it('returns no-mask message when nothing masked', () => {
    const report = maskEnvFile('A=1\n', { keys: ['NOPE'] });
    report.file = 'x.env';
    expect(formatMaskSummary(report)).toContain('No keys were masked');
  });

  it('lists masked keys', () => {
    const report = maskEnvFile('A=1\n', { keys: ['A'] });
    report.file = 'x.env';
    expect(formatMaskSummary(report)).toContain('A');
  });
});
