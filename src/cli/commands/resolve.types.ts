export interface ResolveResult {
  key: string;
  rawValue: string;
  resolvedValue: string;
  source: string;
  wasResolved: boolean;
}

export interface ResolveReport {
  file: string;
  results: ResolveResult[];
  totalKeys: number;
  resolvedCount: number;
  unresolvedCount: number;
}
