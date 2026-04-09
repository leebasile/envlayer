export type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'email';

export interface EnvVarDefinition {
  type: EnvVarType;
  required?: boolean;
  default?: string | number | boolean;
  description?: string;
  pattern?: string;
}

export interface EnvSchema {
  [key: string]: EnvVarDefinition;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidationWarning {
  key: string;
  message: string;
}
