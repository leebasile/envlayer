import { formatEncryptText, formatDecryptText, formatEncryptJson, formatDecryptJson } from './encrypt.formatter';
import { EncryptResult, DecryptResult } from './encrypt.types';

const encryptResult: EncryptResult = {
  file: '.env.enc',
  entriesEncrypted: 3,
  algorithm: 'aes-256-gcm',
};

const decryptResult: DecryptResult = {
  file: '.env',
  entriesDecrypted: 3,
};

describe('formatEncryptText', () => {
  it('includes file, entries and algorithm', () => {
    const text = formatEncryptText(encryptResult);
    expect(text).toContain('.env.enc');
    expect(text).toContain('3');
    expect(text).toContain('aes-256-gcm');
    expect(text).toContain('✔');
  });
});

describe('formatDecryptText', () => {
  it('includes file and entries', () => {
    const text = formatDecryptText(decryptResult);
    expect(text).toContain('.env');
    expect(text).toContain('3');
    expect(text).toContain('✔');
  });
});

describe('formatEncryptJson', () => {
  it('returns valid JSON with expected fields', () => {
    const json = JSON.parse(formatEncryptJson(encryptResult));
    expect(json.status).toBe('encrypted');
    expect(json.file).toBe('.env.enc');
    expect(json.entriesEncrypted).toBe(3);
    expect(json.algorithm).toBe('aes-256-gcm');
  });
});

describe('formatDecryptJson', () => {
  it('returns valid JSON with expected fields', () => {
    const json = JSON.parse(formatDecryptJson(decryptResult));
    expect(json.status).toBe('decrypted');
    expect(json.file).toBe('.env');
    expect(json.entriesDecrypted).toBe(3);
  });
});
