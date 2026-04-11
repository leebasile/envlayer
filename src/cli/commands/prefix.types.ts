export interface PrefixResult {
  file: string;
  prefix: string;
  keysRenamed: number;
  originalKeys: string[];
  renamedKeys: string[];
}

export interface PrefixOptions {
  file: string;
  prefix: string;
  strip?: boolean;
  dryRun?: boolean;
  output?: string;
  format?: "text" | "json";
}
