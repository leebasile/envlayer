export interface MaskOptions {
  pattern?: string;
  keys?: string[];
  char?: string;
  reveal?: number;
}

export interface MaskResult {
  key: string;
  original: string;
  masked: string;
  wasChanged: boolean;
}

export interface MaskReport {
  file: string;
  results: MaskResult[];
  totalKeys: number;
  maskedCount: number;
}
