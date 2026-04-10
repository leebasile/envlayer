import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { CommandModule } from 'yargs';
import { EncryptionAlgorithm, EncryptOptions, DecryptOptions, EncryptResult, DecryptResult } from './encrypt.types';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    map.set(key, value);
  }
  return map;
}

export function encryptValue(value: string, key: string, algorithm: EncryptionAlgorithm): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const keyBuf = crypto.scryptSync(key, 'envlayer-salt', algorithm === 'aes-256-gcm' ? 32 : 16);
  const cipher = crypto.createCipheriv(algorithm, keyBuf, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted: encrypted.toString('hex'), iv: iv.toString('hex'), tag: tag.toString('hex') };
}

export function decryptValue(encrypted: string, iv: string, tag: string, key: string, algorithm: EncryptionAlgorithm): string {
  const keyBuf = crypto.scryptSync(key, 'envlayer-salt', algorithm === 'aes-256-gcm' ? 32 : 16);
  const decipher = crypto.createDecipheriv(algorithm, keyBuf, Buffer.from(iv, 'hex')) as crypto.DecipherGCM;
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8');
}

export function encryptEnvFile(options: EncryptOptions): EncryptResult {
  const { inputFile, outputFile, key, algorithm = 'aes-256-gcm' } = options;
  const content = fs.readFileSync(inputFile, 'utf-8');
  const entries = parseEnvFile(content);
  const result: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    const { encrypted, iv, tag } = encryptValue(v, key, algorithm);
    result[k] = { encryptedValue: encrypted, iv, tag, algorithm };
  }
  const outPath = outputFile ?? inputFile.replace(/(\.env[^/]*)$/, '$1.enc');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  return { file: outPath, entriesEncrypted: entries.size, algorithm };
}

export function decryptEnvFile(options: DecryptOptions): DecryptResult {
  const { inputFile, outputFile, key } = options;
  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const lines: string[] = [];
  let count = 0;
  for (const [k, meta] of Object.entries(raw) as [string, any][]) {
    const value = decryptValue(meta.encryptedValue, meta.iv, meta.tag, key, meta.algorithm);
    lines.push(`${k}=${value}`);
    count++;
  }
  const outPath = outputFile ?? inputFile.replace(/\.enc$/, '');
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
  return { file: outPath, entriesDecrypted: count };
}

export function buildEncryptCommand(): CommandModule {
  return {
    command: 'encrypt <file>',
    describe: 'Encrypt values in an env file',
    builder: (yargs) =>
      yargs
        .positional('file', { type: 'string', demandOption: true })
        .option('output', { alias: 'o', type: 'string', description: 'Output file path' })
        .option('key', { alias: 'k', type: 'string', demandOption: true, description: 'Encryption key' })
        .option('algorithm', { alias: 'a', type: 'string', default: 'aes-256-gcm', choices: ['aes-256-gcm', 'aes-128-gcm'] }),
    handler: (argv) => {
      const result = encryptEnvFile({ inputFile: argv.file as string, outputFile: argv.output as string | undefined, key: argv.key as string, algorithm: argv.algorithm as EncryptionAlgorithm });
      console.log(`Encrypted ${result.entriesEncrypted} entries -> ${result.file} [${result.algorithm}]`);
    },
  };
}

export function buildDecryptCommand(): CommandModule {
  return {
    command: 'decrypt <file>',
    describe: 'Decrypt an encrypted env file',
    builder: (yargs) =>
      yargs
        .positional('file', { type: 'string', demandOption: true })
        .option('output', { alias: 'o', type: 'string', description: 'Output file path' })
        .option('key', { alias: 'k', type: 'string', demandOption: true, description: 'Decryption key' }),
    handler: (argv) => {
      const result = decryptEnvFile({ inputFile: argv.file as string, outputFile: argv.output as string | undefined, key: argv.key as string });
      console.log(`Decrypted ${result.entriesDecrypted} entries -> ${result.file}`);
    },
  };
}
