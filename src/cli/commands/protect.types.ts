export type ProtectMode = "read-only" | "immutable";

export interface ProtectedKey {
  key: string;
  value: string;
  mode: ProtectMode;
}

export interface ProtectResult {
  file: string;
  protected: ProtectedKey[];
  alreadyProtected: string[];
  total: number;
}

export interface UnprotectResult {
  file: string;
  unprotected: string[];
  notFound: string[];
  total: number;
}
