import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { encryptEnvFile, decryptEnvFile, encryptValue, decryptValue, parseEnvFile } from './encrypt';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-encrypt-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

const SAMPLE_ENV = `API_KEY=supersecret\nDB_PASS=hunter2\nSECRET_TOKEN=abc123\n`;
const KEY = 'my-test-key-32chars-padded-here!';

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile(SAMPLE_ENV);
    expect(map.get('API_KEY')).toBe('supersecret');
    expect(map.get('DB_PASS')).toBe('hunter2');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nFOO=bar\n');
    expect(map.size).toBe(1);
    expect(map.get('FOO')).toBe('bar');
  });
});

describe('encryptValue / decryptValue', () => {
  it('round-trips a value correctly', () => {
    const { encrypted, iv, tag } = encryptValue('mysecret', KEY, 'aes-256-gcm');
    const decrypted = decryptValue(encrypted, iv, tag, KEY, 'aes-256-gcm');
    expect(decrypted).toBe('mysecret');
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encryptValue('same', KEY, 'aes-256-gcm');
    const b = encryptValue('same', KEY, 'aes-256-gcm');
    expect(a.encrypted).not.toBe(b.encrypted);
  });
});

describe('encryptEnvFile', () => {
  it('creates an encrypted output file', () => {
    const dir = makeTmpDir();
    const inputFile = writeFile(dir, '.env', SAMPLE_ENV);
    const outputFile = path.join(dir, '.env.enc');
    const result = encryptEnvFile({ inputFile, outputFile, key: KEY });
    expect(result.entriesEncrypted).toBe(3);
    expect(fs.existsSync(outputFile)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    expect(parsed).toHaveProperty('API_KEY');
    expect(parsed.API_KEY).toHaveProperty('encryptedValue');
  });
});

describe('decryptEnvFile', () => {
  it('restores original values after encrypt -> decrypt', () => {
    const dir = makeTmpDir();
    const inputFile = writeFile(dir, '.env', SAMPLE_ENV);
    const encFile = path.join(dir, '.env.enc');
    const outFile = path.join(dir, '.env.decrypted');
    encryptEnvFile({ inputFile, outputFile: encFile, key: KEY });
    const result = decryptEnvFile({ inputFile: encFile, outputFile: outFile, key: KEY });
    expect(result.entriesDecrypted).toBe(3);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('API_KEY=supersecret');
    expect(content).toContain('DB_PASS=hunter2');
  });
});
