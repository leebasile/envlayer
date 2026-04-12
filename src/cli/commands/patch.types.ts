export interface PatchOperation {
  key: string;
  value: string;
  op: 'set' | 'delete' | 'rename';
  newKey?: string;
}

export interface PatchResult {
  applied: PatchOperation[];
  skipped: PatchOperation[];
  outputFile: string;
}

export interface PatchOptions {
  file: string;
  patchFile: string;
  output?: string;
  dryRun?: boolean;
  format?: 'text' | 'json';
}
