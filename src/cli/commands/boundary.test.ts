import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkBoundary, parseEnvFile } from './boundary';
import { formatBoundaryText, formatBoundarySummary } from './boundary.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-boundary-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('checkBoundary', () => {
  it('returns no violations when all keys match allowed prefixes', () => {
    const map = new Map([['APP_FOO', '1'], ['APP_BAR', '2']]);
    const { violations } = checkBoundary(map, ['APP_'], []);
    expect(violations).toHaveLength(0);
  });

  it('flags keys that do not match any allowed prefix', () => {
    const map = new Map([['APP_FOO', '1'], ['DB_HOST', 'localhost']]);
    const { violations } = checkBoundary(map, ['APP_'], []);
    expect(violations).toContain('DB_HOST');
    expect(violations).not.toContain('APP_FOO');
  });

  it('flags keys matching forbidden prefixes', () => {
    const map = new Map([['SECRET_KEY', 'abc'], ['APP_NAME', 'myapp']]);
    const { violations, forbidden } = checkBoundary(map, [], ['SECRET_']);
    expect(violations).toContain('SECRET_KEY');
    expect(forbidden).toContain('SECRET_KEY');
  });

  it('allows all keys when no prefixes are specified', () => {
    const map = new Map([['FOO', '1'], ['BAR', '2']]);
    const { violations } = checkBoundary(map, [], []);
    expect(violations).toHaveLength(0);
  });
});

describe('parseEnvFile for boundary', () => {
  it('parses keys correctly', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'APP_HOST=localhost\nAPP_PORT=3000\n# comment\n');
    const map = parseEnvFile(file);
    expect(map.get('APP_HOST')).toBe('localhost');
    expect(map.get('APP_PORT')).toBe('3000');
    expect(map.size).toBe(2);
  });
});

describe('formatBoundaryText', () => {
  it('includes violation details', () => {
    const result = {
      file: '/tmp/.env',
      allowed: ['APP_FOO'],
      forbidden: ['SECRET_KEY'],
      violations: ['SECRET_KEY', 'DB_HOST'],
    };
    const text = formatBoundaryText(result);
    expect(text).toContain('[forbidden] SECRET_KEY');
    expect(text).toContain('[not-allowed] DB_HOST');
  });

  it('shows no violations message implicitly via zero count', () => {
    const result = { file: '/tmp/.env', allowed: ['A'], forbidden: [], violations: [] };
    const text = formatBoundaryText(result);
    expect(text).toContain('Violations   : 0');
  });
});

describe('formatBoundarySummary', () => {
  it('returns success message when no violations', () => {
    const result = { file: '/tmp/.env', allowed: [], forbidden: [], violations: [] };
    expect(formatBoundarySummary(result)).toContain('no violations');
  });

  it('returns failure message when violations exist', () => {
    const result = { file: '/tmp/.env', allowed: [], forbidden: [], violations: ['X'] };
    expect(formatBoundarySummary(result)).toContain('1 violation(s)');
  });
});
