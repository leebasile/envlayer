export interface UnusedKey {
  key: string;
  value: string;
  file: string;
}

export interface UnusedResult {
  file: string;
  totalKeys: number;
  unusedKeys: UnusedKey[];
  referencedIn: string[];
}

export interface UnusedReport {
  results: UnusedResult[];
  totalUnused: number;
  scannedFiles: string[];
  sourceFiles: string[];
}
