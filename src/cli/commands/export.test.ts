import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportEnvFile } from './export';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-export-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('exportEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exports to JSON format', () => {
    const file = writeFile(tmpDir, '.env', 'APP_NAME=myapp\nPORT=3000\n');
    const result = exportEnvFile(file, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ APP_NAME: 'myapp', PORT: '3000' });
  });

  it('exports to dotenv format', () => {
    const file = writeFile(tmpDir, '.env', 'APP_NAME=myapp\nPORT=3000\n');
    const result = exportEnvFile(file, 'dotenv');
    expect(result).toContain('APP_NAME=myapp');
    expect(result).toContain('PORT=3000');
  });

  it('exports to yaml format', () => {
    const file = writeFile(tmpDir, '.env', 'APP_NAME=myapp\nPORT=3000\n');
    const result = exportEnvFile(file, 'yaml');
    expect(result).toContain('APP_NAME: myapp');
    expect(result).toContain('PORT: 3000');
  });

  it('wraps yaml values containing colons in quotes', () => {
    const file = writeFile(tmpDir, '.env', 'DB_URL=postgres://localhost:5432/db\n');
    const result = exportEnvFile(file, 'yaml');
    expect(result).toContain('DB_URL: "postgres://localhost:5432/db"');
  });

  it('returns empty JSON object for empty file', () => {
    const file = writeFile(tmpDir, '.env', '');
    const result = exportEnvFile(file, 'json');
    expect(JSON.parse(result)).toEqual({});
  });

  it('ignores comment lines', () => {
    const file = writeFile(tmpDir, '.env', '# comment\nKEY=value\n');
    const result = exportEnvFile(file, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ KEY: 'value' });
    expect(Object.keys(parsed)).not.toContain('# comment');
  });
});
