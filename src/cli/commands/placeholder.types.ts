export interface PlaceholderEntry {
  key: string;
  placeholder: string;
  line: number;
}

export interface PlaceholderResult {
  file: string;
  found: PlaceholderEntry[];
  replaced: number;
  skipped: number;
}

export type PlaceholderFormat = 'text' | 'json';
