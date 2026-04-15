import { describe, it, expect } from 'vitest';
import { formatReorderText, formatReorderJson, formatReorderSummary } from './reorder.formatter';
import { ReorderResult } from './reorder.types';

const sample: ReorderResult = {
  file: '/tmp/.env',
  originalOrder: ['FOO', 'BAR', 'BAZ'],
  newOrder: ['BAZ', 'FOO', 'BAR'],
  moved: 1,
};

describe('formatReorderText', () => {
  it('includes file path', () => {
    expect(formatReorderText(sample)).toContain('/tmp/.env');
  });

  it('lists new order', () => {
    const out = formatReorderText(sample);
    expect(out).toContain('BAZ');
    expect(out).toContain('FOO');
    expect(out).toContain('BAR');
  });

  it('shows moved count', () => {
    expect(formatReorderText(sample)).toContain('1');
  });
});

describe('formatReorderJson', () => {
  it('returns valid JSON', () => {
    const out = formatReorderJson(sample);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('includes moved and newOrder', () => {
    const parsed = JSON.parse(formatReorderJson(sample));
    expect(parsed.moved).toBe(1);
    expect(parsed.newOrder).toEqual(['BAZ', 'FOO', 'BAR']);
  });
});

describe('formatReorderSummary', () => {
  it('returns a brief summary string', () => {
    const out = formatReorderSummary(sample);
    expect(out).toContain('1');
    expect(out).toContain('/tmp/.env');
  });
});
