import { describe, it, expect } from 'vitest';
import { maskValue, formatRotateText, formatRotateJson } from './rotate.formatter';
import { RotateReport } from './rotate.types';

const sampleReport: RotateReport = {
  outputFile: '/project/.env',
  rotated: [
    { key: 'SECRET', oldValue: 'oldsecretvalue', newValue: 'newsecretvalue' },
    { key: 'API_KEY', oldValue: 'oldapikey12345', newValue: 'newapikey12345' },
  ],
  skipped: ['MISSING_KEY'],
};

describe('maskValue', () => {
  it('shows first 4 chars and masks the rest', () => {
    expect(maskValue('abcdefghij')).toBe('abcd********');
  });

  it('masks short values entirely', () => {
    expect(maskValue('abc')).toBe('***');
  });
});

describe('formatRotateText', () => {
  it('includes rotated key names', () => {
    const output = formatRotateText(sampleReport);
    expect(output).toContain('SECRET');
    expect(output).toContain('API_KEY');
  });

  it('includes skipped keys', () => {
    const output = formatRotateText(sampleReport);
    expect(output).toContain('MISSING_KEY');
  });

  it('includes output file path', () => {
    const output = formatRotateText(sampleReport);
    expect(output).toContain('/project/.env');
  });

  it('handles empty report gracefully', () => {
    const empty: RotateReport = { rotated: [], skipped: [], outputFile: '/project/.env' };
    const output = formatRotateText(empty);
    expect(output).toContain('No keys processed');
  });
});

describe('formatRotateJson', () => {
  it('returns valid JSON', () => {
    const output = formatRotateJson(sampleReport);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('does not expose raw values', () => {
    const output = formatRotateJson(sampleReport);
    expect(output).not.toContain('oldsecretvalue');
    expect(output).not.toContain('newsecretvalue');
  });

  it('includes masked values and keys', () => {
    const parsed = JSON.parse(formatRotateJson(sampleReport));
    expect(parsed.rotated[0].key).toBe('SECRET');
    expect(parsed.rotated[0]).toHaveProperty('oldValueMasked');
    expect(parsed.rotated[0]).toHaveProperty('newValueMasked');
  });
});
