export interface TagEntry {
  key: string;
  value: string;
  tags: string[];
}

export interface TagResult {
  file: string;
  tagged: TagEntry[];
  untagged: TagEntry[];
  totalKeys: number;
}

export interface TagOptions {
  tags: string[];
  mode: 'add' | 'remove' | 'filter';
  output?: string;
  format?: 'text' | 'json';
}
