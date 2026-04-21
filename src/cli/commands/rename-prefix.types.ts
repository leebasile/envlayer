export interface RenamePrefixResult {
  file: string;
  oldPrefix: string;
  newPrefix: string;
  renamedKeys: Array<{ from: string; to: string }>;
  skippedKeys: string[];
  totalKeys: number;
}
