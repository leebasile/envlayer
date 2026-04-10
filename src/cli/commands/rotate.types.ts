export interface RotateOptions {
  input: string;
  output?: string;
  keys: string[];
  generator?: 'uuid' | 'hex' | 'base64';
  length?: number;
  dryRun?: boolean;
}

export interface RotateResult {
  key: string;
  oldValue: string;
  newValue: string;
}

export interface RotateReport {
  rotated: RotateResult[];
  skipped: string[];
  outputFile: string;
}
