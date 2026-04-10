export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-128-gcm';

export interface EncryptOptions {
  inputFile: string;
  outputFile?: string;
  key: string;
  algorithm?: EncryptionAlgorithm;
}

export interface DecryptOptions {
  inputFile: string;
  outputFile?: string;
  key: string;
  algorithm?: EncryptionAlgorithm;
}

export interface EncryptedEntry {
  key: string;
  encryptedValue: string;
  iv: string;
  tag: string;
  algorithm: EncryptionAlgorithm;
}

export interface EncryptResult {
  file: string;
  entriesEncrypted: number;
  algorithm: EncryptionAlgorithm;
}

export interface DecryptResult {
  file: string;
  entriesDecrypted: number;
}
