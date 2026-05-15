export interface EnvCopyResult {
  source: string;
  destination: string;
  keysCopied: string[];
  keysSkipped: string[];
  overwritten: string[];
}

export interface EnvCopyOptions {
  overwrite: boolean;
  keys?: string[];
  dryRun: boolean;
}
