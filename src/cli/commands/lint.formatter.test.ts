import { formatLintText, formatLintJson, formatLintSummary } from './lint.formatter';
import { LintResult } from './lint.types';

const mockResult: LintResult = {
  file: '.env',
  violations: [
    { rule: 'no-empty-values', key: 'DB_HOST', message: 'Empty value for key "DB_HOST"', severity: 'warn' },
    { rule: 'no-duplicate-keys', key: 'API_KEY', message: 'Duplicate key "API_KEY"', severity: 'error' },
  ],
  errorCount: 1,
  warnCount: 1,
  passed: false,
};

describe('formatLintText', () => {
  it('includes file name', () => {
    expect(formatLintText(mockResult)).toContain('.env');
  });

  it('shows violations', () => {
    const out = formatLintText(mockResult);
    expect(out).toContain('no-empty-values');
    expect(out).toContain('no-duplicate-keys');
  });

  it('shows FAILED when errors exist', () => {
    expect(formatLintText(mockResult)).toContain('FAILED');
  });

  it('shows PASSED when no errors', () => {
    const passing: LintResult = { ...mockResult, violations: [], errorCount: 0, warnCount: 0, passed: true };
    expect(formatLintText(passing)).toContain('PASSED');
    expect(formatLintText(passing)).toContain('No issues found');
  });
});

describe('formatLintJson', () => {
  it('returns valid JSON', () => {
    const parsed = JSON.parse(formatLintJson(mockResult));
    expect(parsed.file).toBe('.env');
    expect(parsed.violations).toHaveLength(2);
    expect(parsed.passed).toBe(false);
  });
});

describe('formatLintSummary', () => {
  it('includes error and warning counts', () => {
    const summary = formatLintSummary(mockResult);
    expect(summary).toContain('1 error(s)');
    expect(summary).toContain('1 warning(s)');
  });
});
