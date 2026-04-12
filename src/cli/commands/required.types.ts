export interface RequiredKeyResult {
  key: string;
  present: boolean;
  value?: string;
}

export interface RequiredReport {
  file: string;
  keys: RequiredKeyResult[];
  missing: string[];
  present: string[];
  total: number;
  allPresent: boolean;
}
