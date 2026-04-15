export interface ReorderResult {
  file: string;
  originalOrder: string[];
  newOrder: string[];
  moved: number;
}

export interface ReorderOptions {
  keys: string[];
  position: 'top' | 'bottom';
  output?: string;
  format?: 'text' | 'json';
}
