import { EncryptResult, DecryptResult } from './encrypt.types';

export function formatEncryptText(result: EncryptResult): string {
  const lines: string[] = [
    `✔ Encryption complete`,
    `  File      : ${result.file}`,
    `  Entries   : ${result.entriesEncrypted}`,
    `  Algorithm : ${result.algorithm}`,
  ];
  return lines.join('\n');
}

export function formatDecryptText(result: DecryptResult): string {
  const lines: string[] = [
    `✔ Decryption complete`,
    `  File    : ${result.file}`,
    `  Entries : ${result.entriesDecrypted}`,
  ];
  return lines.join('\n');
}

export function formatEncryptJson(result: EncryptResult): string {
  return JSON.stringify(
    {
      status: 'encrypted',
      file: result.file,
      entriesEncrypted: result.entriesEncrypted,
      algorithm: result.algorithm,
    },
    null,
    2
  );
}

export function formatDecryptJson(result: DecryptResult): string {
  return JSON.stringify(
    {
      status: 'decrypted',
      file: result.file,
      entriesDecrypted: result.entriesDecrypted,
    },
    null,
    2
  );
}
