import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, parsePatchFile, applyPatch, serializeEnvMap } from './patch';
import { formatPatchText, formatPatchSummary } from './patch.formatter';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-patch-'));
}

function writeFile(dir: string, name: string, content: string) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parsePatchFile', () => {
  it('parses set operations', () => {
    const ops = parsePatchFile('set FOO bar\nset BAZ qux');
    expect(ops).toHaveLength(2);
    expect(ops[0]).toEqual({ op: 'set', key: 'FOO', value: 'bar' });
  });

  it('parses delete operations', () => {
    const ops = parsePatchFile('delete FOO');
    expect(ops[0]).toMatchObject({ op: 'delete', key: 'FOO' });
  });

  it('parses rename operations', () => {
    const ops = parsePatchFile('rename OLD NEW');
    expect(ops[0]).toEqual({ op: 'rename', key: 'OLD', value: '', newKey: 'NEW' });
  });

  it('ignores comments and blank lines', () => {
    const ops = parsePatchFile('# comment\n\nset A 1');
    expect(ops).toHaveLength(1);
  });
});

describe('applyPatch', () => {
  it('applies set operation', () => {
    const map = parseEnvFile('A=1\n');
    const result = applyPatch(map, [{ op: 'set', key: 'B', value: '2' }]);
    expect(map.get('B')).toBe('2');
    expect(result.applied).toHaveLength(1);
  });

  it('applies delete operation', () => {
    const map = parseEnvFile('A=1\n');
    applyPatch(map, [{ op: 'delete', key: 'A', value: '' }]);
    expect(map.has('A')).toBe(false);
  });

  it('skips delete for missing key', () => {
    const map = parseEnvFile('A=1\n');
    const result = applyPatch(map, [{ op: 'delete', key: 'Z', value: '' }]);
    expect(result.skipped).toHaveLength(1);
  });

  it('applies rename operation', () => {
    const map = parseEnvFile('OLD=hello\n');
    applyPatch(map, [{ op: 'rename', key: 'OLD', value: '', newKey: 'NEW' }]);
    expect(map.has('OLD')).toBe(false);
    expect(map.get('NEW')).toBe('hello');
  });
});

describe('formatPatchText', () => {
  it('includes applied and skipped counts', () => {
    const result = { applied: [{ op: 'set' as const, key: 'A', value: '1' }], skipped: [], outputFile: '.env' };
    const text = formatPatchText(result);
    expect(text).toContain('Applied (1)');
    expect(text).toContain('Skipped (0)');
  });

  it('mentions dry-run when flag is set', () => {
    const result = { applied: [], skipped: [], outputFile: '.env' };
    expect(formatPatchText(result, true)).toContain('dry-run');
  });
});

describe('formatPatchSummary', () => {
  it('returns concise summary string', () => {
    const result = { applied: [{ op: 'set' as const, key: 'X', value: '1' }], skipped: [], outputFile: '.env.prod' };
    expect(formatPatchSummary(result)).toContain('1 applied');
    expect(formatPatchSummary(result)).toContain('.env.prod');
  });
});
