export interface FreezeEntry {
  key: string;
  value: string;
  frozen: boolean;
}

export interface FreezeResult {
  file: string;
  frozen: FreezeEntry[];
  unfrozen: FreezeEntry[];
  skipped: string[];
}

export interface FreezeOptions {
  keys?: string[];
  all?: boolean;
  unfreeze?: boolean;
}
