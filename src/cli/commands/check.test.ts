import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkEnvFile } from './check';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-check-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('checkEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns valid result when all required keys are present', () => {
    const schema = writeFile(tmpDir, 'envlayer.schema.json', JSON.stringify({
      PORT: { type: 'number', required: true },
      NODE_ENV: { type: 'string', required: true },
    }));
    const envFile = writeFile(tmpDir, '.env.production', 'PORT=3000\nNODE_ENV=production\n');

    const result = checkEnvFile(envFile, schema);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.environment).toBe('production');
  });

  it('returns invalid result when required keys are missing', () => {
    const schema = writeFile(tmpDir, 'envlayer.schema.json', JSON.stringify({
      PORT: { type: 'number', required: true },
      DATABASE_URL: { type: 'string', required: true },
    }));
    const envFile = writeFile(tmpDir, '.env.staging', 'PORT=4000\n');

    const result = checkEnvFile(envFile, schema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('DATABASE_URL');
  });

  it('detects extra keys not in schema', () => {
    const schema = writeFile(tmpDir, 'envlayer.schema.json', JSON.stringify({
      PORT: { type: 'number', required: true },
    }));
    const envFile = writeFile(tmpDir, '.env', 'PORT=8080\nUNKNOWN_KEY=foo\n');

    const result = checkEnvFile(envFile, schema);
    expect(result.extra).toContain('UNKNOWN_KEY');
  });

  it('returns error when env file does not exist', () => {
    const schema = writeFile(tmpDir, 'envlayer.schema.json', JSON.stringify({
      PORT: { type: 'number', required: true },
    }));
    const missingFile = path.join(tmpDir, '.env.missing');

    const result = checkEnvFile(missingFile, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/File not found/);
  });
});
