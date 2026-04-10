export interface LintRule {
  name: string;
  description: string;
  severity: 'error' | 'warn' | 'info';
}

export interface LintViolation {
  rule: string;
  key: string;
  message: string;
  severity: 'error' | 'warn' | 'info';
}

export interface LintResult {
  file: string;
  violations: LintViolation[];
  errorCount: number;
  warnCount: number;
  passed: boolean;
}

export interface LintOptions {
  noEmptyValues?: boolean;
  noQuotedValues?: boolean;
  noTrailingSpaces?: boolean;
  noUppercaseKeys?: boolean;
  noDuplicateKeys?: boolean;
}
